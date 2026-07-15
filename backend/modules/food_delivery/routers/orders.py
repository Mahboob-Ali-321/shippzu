"""Order + payment endpoints."""
import os
import uuid
import random
import hmac
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ...shared.database import get_db
from ...shared.auth.deps import get_current_user
from ..models import new_id, now_iso, CartItem

router = APIRouter(prefix="/food/orders", tags=["orders"])

# Payment fee constants
PLATFORM_FEE = 8.0
PACKAGING_FEE = 15.0
TAX_RATE = 0.05  # 5% GST


class CartItemIn(BaseModel):
    food_id: str
    quantity: int = Field(..., ge=1, le=20)
    variant_id: Optional[str] = None
    addon_ids: List[str] = []
    special_instructions: Optional[str] = None


class PriceQuoteIn(BaseModel):
    restaurant_id: str
    items: List[CartItemIn]
    coupon_code: Optional[str] = None


class PlaceOrderIn(BaseModel):
    restaurant_id: str
    items: List[CartItemIn]
    address_id: str
    coupon_code: Optional[str] = None
    payment_method: Literal["cod", "razorpay", "upi", "card"] = "cod"
    special_instructions: Optional[str] = None


async def _compute_price(db, data: PriceQuoteIn):
    rest = await db.restaurants.find_one({"id": data.restaurant_id}, {"_id": 0})
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    subtotal = 0.0
    resolved_items: List[dict] = []
    for it in data.items:
        food = await db.foods.find_one({"id": it.food_id}, {"_id": 0})
        if not food:
            raise HTTPException(status_code=404, detail=f"Food {it.food_id} not found")
        base_price = food["price"]
        if it.variant_id:
            v = next((v for v in food.get("variants", []) if v["id"] == it.variant_id), None)
            if v:
                base_price = v["price"]
        addon_total = 0.0
        for aid in it.addon_ids:
            a = next((a for a in food.get("addons", []) if a["id"] == aid), None)
            if a:
                addon_total += a["price"]
        unit_price = base_price + addon_total
        line_total = unit_price * it.quantity
        subtotal += line_total
        resolved_items.append({
            "food_id": it.food_id,
            "quantity": it.quantity,
            "variant_id": it.variant_id,
            "addon_ids": it.addon_ids,
            "special_instructions": it.special_instructions,
            "name": food["name"],
            "image": food["image"],
            "unit_price": round(unit_price, 2),
        })

    delivery_fee = rest["delivery_fee"]
    platform_fee = PLATFORM_FEE
    packaging_fee = PACKAGING_FEE
    taxes = round((subtotal + delivery_fee) * TAX_RATE, 2)
    discount = 0.0
    coupon = None
    if data.coupon_code:
        coupon = await db.coupons.find_one({"code": data.coupon_code.upper(), "is_active": True}, {"_id": 0})
        if coupon and subtotal >= coupon.get("min_order", 0):
            if coupon["discount_type"] == "flat":
                discount = min(coupon["discount_value"], subtotal)
            else:
                discount = subtotal * (coupon["discount_value"] / 100.0)
                if coupon.get("max_discount"):
                    discount = min(discount, coupon["max_discount"])
            discount = round(discount, 2)
    grand_total = round(subtotal + delivery_fee + platform_fee + packaging_fee + taxes - discount, 2)
    return {
        "restaurant": rest,
        "items": resolved_items,
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "platform_fee": platform_fee,
        "packaging_fee": packaging_fee,
        "taxes": taxes,
        "discount": discount,
        "coupon": coupon,
        "grand_total": grand_total,
    }


@router.post("/quote")
async def quote(data: PriceQuoteIn, user: dict = Depends(get_current_user)):
    db = get_db()
    return await _compute_price(db, data)


async def _create_razorpay_order(amount_rupees: float, receipt: str) -> dict:
    """Try to create real Razorpay order. Falls back to stub if keys are placeholders."""
    key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if "placeholder" in key_id or "placeholder" in key_secret or not key_id:
        # Return a stub order — clearly marked
        return {
            "id": f"order_stub_{uuid.uuid4().hex[:16]}",
            "amount": int(amount_rupees * 100),
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "stub": True,
        }
    try:
        import razorpay
        client = razorpay.Client(auth=(key_id, key_secret))
        return client.order.create(
            {
                "amount": int(amount_rupees * 100),
                "currency": "INR",
                "receipt": receipt,
                "payment_capture": 1,
            }
        )
    except Exception as e:
        return {
            "id": f"order_stub_{uuid.uuid4().hex[:16]}",
            "amount": int(amount_rupees * 100),
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "stub": True,
            "error": str(e),
        }


@router.post("")
async def place_order(data: PlaceOrderIn, user: dict = Depends(get_current_user)):
    db = get_db()
    priced = await _compute_price(
        db, PriceQuoteIn(restaurant_id=data.restaurant_id, items=data.items, coupon_code=data.coupon_code)
    )
    address = await db.addresses.find_one({"id": data.address_id, "user_id": user["id"]}, {"_id": 0})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    rest = priced["restaurant"]
    order_id = new_id()
    order_number = f"SHZ{datetime.now().strftime('%y%m%d')}{random.randint(1000, 9999)}"

    razorpay_order = None
    if data.payment_method == "razorpay":
        razorpay_order = await _create_razorpay_order(priced["grand_total"], order_number)

    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "user_id": user["id"],
        "restaurant_id": rest["id"],
        "restaurant_name": rest["name"],
        "restaurant_image": rest["cover_image"],
        "items": priced["items"],
        "address": address,
        "subtotal": priced["subtotal"],
        "delivery_fee": priced["delivery_fee"],
        "platform_fee": priced["platform_fee"],
        "packaging_fee": priced["packaging_fee"],
        "taxes": priced["taxes"],
        "discount": priced["discount"],
        "coupon_code": data.coupon_code,
        "grand_total": priced["grand_total"],
        "payment_method": data.payment_method,
        "payment_status": "pending" if data.payment_method != "cod" else "pending",
        "razorpay_order_id": razorpay_order["id"] if razorpay_order else None,
        "razorpay_payment_id": None,
        "status": "placed",
        "status_history": [{"status": "placed", "at": now_iso()}],
        "eta_minutes": rest["delivery_time_max"],
        "special_instructions": data.special_instructions,
        "created_at": now_iso(),
        "delivered_at": None,
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)

    # notification
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "title": "Order placed successfully!",
        "body": f"Your order #{order_number} from {rest['name']} has been placed.",
        "icon": "check-circle",
        "read": False,
        "order_id": order_id,
        "created_at": now_iso(),
    })
    return {"order": order_doc, "razorpay_order": razorpay_order}


class VerifyPaymentIn(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify-payment")
async def verify_payment(data: VerifyPaymentIn, user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"id": data.order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    verified = False
    if "placeholder" not in key_secret and order.get("razorpay_order_id") and not order["razorpay_order_id"].startswith("order_stub_"):
        payload = f"{order['razorpay_order_id']}|{data.razorpay_payment_id}".encode("utf-8")
        expected = hmac.new(key_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        verified = hmac.compare_digest(expected, data.razorpay_signature)
    else:
        # Stub mode — always accept for demo
        verified = True

    if not verified:
        raise HTTPException(status_code=400, detail="Signature verification failed")
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"payment_status": "paid", "razorpay_payment_id": data.razorpay_payment_id}},
    )
    return {"ok": True, "verified": True}


@router.get("")
async def list_my_orders(user: dict = Depends(get_current_user), limit: int = 50):
    db = get_db()
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return orders


@router.get("/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/advance")
async def advance_order_status(order_id: str, user: dict = Depends(get_current_user)):
    """DEV helper — advances order to the next status. In prod, this is triggered
    by restaurant / delivery partner apps."""
    db = get_db()
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    flow = ["placed", "accepted", "preparing", "picked_up", "on_the_way", "delivered"]
    idx = flow.index(order["status"]) if order["status"] in flow else 0
    if idx >= len(flow) - 1:
        return order
    next_status = flow[idx + 1]
    update: dict = {"status": next_status}
    history = order.get("status_history", [])
    history.append({"status": next_status, "at": now_iso()})
    update["status_history"] = history
    if next_status == "delivered":
        update["delivered_at"] = now_iso()
    await db.orders.update_one({"id": order_id}, {"$set": update})

    # push notification stub — store in DB
    labels = {
        "accepted": "Restaurant accepted your order",
        "preparing": "Your food is being prepared",
        "picked_up": "Order picked up by delivery partner",
        "on_the_way": "Your order is on the way",
        "delivered": "Order delivered — Enjoy your meal!",
    }
    if next_status in labels:
        await db.notifications.insert_one({
            "id": new_id(),
            "user_id": user["id"],
            "title": labels[next_status],
            "body": f"Order #{order['order_number']} · {order['restaurant_name']}",
            "icon": "package",
            "read": False,
            "order_id": order_id,
            "created_at": now_iso(),
        })
    order.update(update)
    return order


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] in ("delivered", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel {order['status']} order")
    if order["status"] not in ("placed", "accepted"):
        raise HTTPException(status_code=400, detail="Order can only be cancelled before preparation")
    history = order.get("status_history", [])
    history.append({"status": "cancelled", "at": now_iso()})
    await db.orders.update_one(
        {"id": order_id}, {"$set": {"status": "cancelled", "status_history": history}}
    )
    return {"ok": True}
