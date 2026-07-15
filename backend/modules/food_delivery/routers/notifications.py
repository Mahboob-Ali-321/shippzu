"""Notifications + favourites endpoints."""
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...shared.database import get_db
from ...shared.auth.deps import get_current_user
from ..models import new_id, now_iso

router = APIRouter(prefix="/food", tags=["notifications-favourites"])


# ---------------- Notifications ----------------
@router.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    db = get_db()
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)


@router.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_one({"id": notification_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


@router.post("/notifications/mark-all-read")
async def mark_all_read(user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------- Push token registration ----------------
class PushTokenIn(BaseModel):
    token: str
    platform: Literal["ios", "android", "web"] = "android"


@router.post("/push/register")
async def register_push_token(data: PushTokenIn, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.push_tokens.update_one(
        {"user_id": user["id"], "token": data.token},
        {"$set": {"user_id": user["id"], "token": data.token, "platform": data.platform, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


# ---------------- Favourites ----------------
class FavouriteIn(BaseModel):
    kind: Literal["restaurant", "food"]
    target_id: str


@router.get("/favourites")
async def list_favourites(user: dict = Depends(get_current_user)):
    db = get_db()
    favs = await db.favourites.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    rest_ids = [f["target_id"] for f in favs if f["kind"] == "restaurant"]
    food_ids = [f["target_id"] for f in favs if f["kind"] == "food"]
    restaurants = await db.restaurants.find({"id": {"$in": rest_ids}}, {"_id": 0}).to_list(100) if rest_ids else []
    foods = await db.foods.find({"id": {"$in": food_ids}}, {"_id": 0}).to_list(100) if food_ids else []
    return {"restaurants": restaurants, "foods": foods}


@router.post("/favourites/toggle")
async def toggle_favourite(data: FavouriteIn, user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.favourites.find_one(
        {"user_id": user["id"], "kind": data.kind, "target_id": data.target_id}, {"_id": 0}
    )
    if existing:
        await db.favourites.delete_one({"id": existing["id"]})
        return {"ok": True, "favourited": False}
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "kind": data.kind,
        "target_id": data.target_id,
        "created_at": now_iso(),
    }
    await db.favourites.insert_one(doc)
    return {"ok": True, "favourited": True}


# ---------------- Reviews ----------------
class ReviewIn(BaseModel):
    restaurant_id: str
    rating: int
    comment: str


@router.get("/reviews/{restaurant_id}")
async def list_reviews(restaurant_id: str):
    db = get_db()
    return await db.reviews.find({"restaurant_id": restaurant_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)


@router.post("/reviews")
async def add_review(data: ReviewIn, user: dict = Depends(get_current_user)):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    db = get_db()
    doc = {
        "id": new_id(),
        "restaurant_id": data.restaurant_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Anonymous"),
        "rating": data.rating,
        "comment": data.comment,
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc
