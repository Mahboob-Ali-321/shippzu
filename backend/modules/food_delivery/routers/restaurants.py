"""Restaurant, food, and category endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends

from ..models import Restaurant, FoodItem, Category
from ...shared.database import get_db
from ...shared.auth.deps import get_current_user

router = APIRouter(prefix="/food", tags=["food-delivery"])


# ---------------- Categories ----------------
@router.get("/categories")
async def list_categories():
    db = get_db()
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return cats


# ---------------- Restaurants ----------------
def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@router.get("/restaurants")
async def list_restaurants(
    q: Optional[str] = None,
    category_id: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    popular: Optional[bool] = None,
    is_veg: Optional[bool] = None,
    sort: Optional[str] = Query(None, description="rating|delivery_time|cost"),
    limit: int = 50,
):
    db = get_db()
    filter_: dict = {}
    if q:
        filter_["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"cuisines": {"$regex": q, "$options": "i"}},
            {"tagline": {"$regex": q, "$options": "i"}},
        ]
    if category_id:
        filter_["category_ids"] = category_id
    if featured is not None:
        filter_["is_featured"] = featured
    if trending is not None:
        filter_["is_trending"] = trending
    if popular is not None:
        filter_["is_popular"] = popular
    if is_veg is not None:
        filter_["is_veg"] = is_veg

    cursor = db.restaurants.find(filter_, {"_id": 0}).limit(limit)
    if sort == "rating":
        cursor = cursor.sort("rating", -1)
    elif sort == "delivery_time":
        cursor = cursor.sort("delivery_time_min", 1)
    elif sort == "cost":
        cursor = cursor.sort("cost_for_two", 1)
    return await cursor.to_list(limit)


@router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    db = get_db()
    rest = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    foods = await db.foods.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(500)
    # group by menu_category
    menu_categories: dict[str, list] = {}
    for f in foods:
        menu_categories.setdefault(f["menu_category"], []).append(f)
    return {
        "restaurant": rest,
        "menu": [{"category": k, "items": v} for k, v in menu_categories.items()],
    }


# ---------------- Foods ----------------
@router.get("/foods")
async def list_foods(
    q: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    veg: Optional[bool] = None,
    bestseller: Optional[bool] = None,
    limit: int = 50,
):
    db = get_db()
    filter_: dict = {}
    if q:
        filter_["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if restaurant_id:
        filter_["restaurant_id"] = restaurant_id
    if veg is not None:
        filter_["veg"] = veg
    if bestseller is not None:
        filter_["is_bestseller"] = bestseller
    return await db.foods.find(filter_, {"_id": 0}).limit(limit).to_list(limit)


@router.get("/foods/{food_id}")
async def get_food(food_id: str):
    db = get_db()
    food = await db.foods.find_one({"id": food_id}, {"_id": 0})
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


# ---------------- Home aggregated feed ----------------
@router.get("/home")
async def home_feed(user: dict = Depends(get_current_user)):
    db = get_db()
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    featured = await db.restaurants.find({"is_featured": True}, {"_id": 0}).limit(10).to_list(10)
    trending = await db.restaurants.find({"is_trending": True}, {"_id": 0}).limit(10).to_list(10)
    popular = await db.restaurants.find({"is_popular": True}, {"_id": 0}).limit(10).to_list(10)
    nearby = await db.restaurants.find({}, {"_id": 0}).sort("distance_km", 1).limit(10).to_list(10)
    coupons = await db.coupons.find({"is_active": True}, {"_id": 0}).limit(10).to_list(10)
    return {
        "categories": categories,
        "featured": featured,
        "trending": trending,
        "popular": popular,
        "nearby": nearby,
        "coupons": coupons,
    }
