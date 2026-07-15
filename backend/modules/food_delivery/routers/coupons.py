"""Coupon endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ...shared.database import get_db
from ...shared.auth.deps import get_current_user

router = APIRouter(prefix="/food/coupons", tags=["coupons"])


class ApplyCouponIn(BaseModel):
    code: str
    subtotal: float


@router.get("")
async def list_coupons(user: dict = Depends(get_current_user)):
    db = get_db()
    return await db.coupons.find({"is_active": True}, {"_id": 0}).to_list(50)


@router.post("/apply")
async def apply_coupon(data: ApplyCouponIn, user: dict = Depends(get_current_user)):
    db = get_db()
    coupon = await db.coupons.find_one({"code": data.code.upper(), "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if data.subtotal < coupon.get("min_order", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order value is ₹{coupon['min_order']:.0f}")
    if coupon["discount_type"] == "flat":
        discount = min(coupon["discount_value"], data.subtotal)
    else:
        discount = data.subtotal * (coupon["discount_value"] / 100.0)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    return {"coupon": coupon, "discount": round(discount, 2)}
