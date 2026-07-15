"""Seed data for Shippzu food delivery module.

Runs on startup if collections are empty. Uses real Unsplash/Pexels image URLs
from the design guidelines.
"""
import uuid
from typing import List

from .models import now_iso

CATEGORIES = [
    {"name": "Pizza", "icon_url": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxwaXp6YXxlbnwwfHx8fDE3ODQwOTA4Nzh8MA&ixlib=rb-4.1.0&q=85&w=400", "order": 1},
    {"name": "Burger", "icon_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxidXJnZXJ8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=400", "order": 2},
    {"name": "Biryani", "icon_url": "https://images.pexels.com/photos/9738983/pexels-photo-9738983.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=400", "order": 3},
    {"name": "Chinese", "icon_url": "https://images.pexels.com/photos/21482824/pexels-photo-21482824.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=400", "order": 4},
    {"name": "Desserts", "icon_url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxkZXNzZXJ0fGVufDB8fHx8MTc4NDA5MDg3OHww&ixlib=rb-4.1.0&q=85&w=400", "order": 5},
    {"name": "Healthy", "icon_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxoZWFsdGh5JTIwZm9vZCUyMHNhbGFkfGVufDB8fHx8MTc4NDA5MDg3OXww&ixlib=rb-4.1.0&q=85&w=400", "order": 6},
    {"name": "Indian", "icon_url": "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=400", "order": 7},
    {"name": "South Indian", "icon_url": "https://images.unsplash.com/photo-1644289450169-bc58aa16bacb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxzb3V0aCUyMGluZGlhbiUyMGRvc2F8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=400", "order": 8},
    {"name": "Beverages", "icon_url": "https://images.unsplash.com/photo-1625865019845-7b2c89b8a8a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxiZXZlcmFnZSUyMGRyaW5rfGVufDB8fHx8MTc4NDA5MDg3OXww&ixlib=rb-4.1.0&q=85&w=400", "order": 9},
    {"name": "Sushi", "icon_url": "https://images.pexels.com/photos/11470545/pexels-photo-11470545.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=400", "order": 10},
]

REST_COVERS = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxyZXN0YXVyYW50JTIwaW50ZXJpb3J8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1777880652279-35cd5492514e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxyZXN0YXVyYW50JTIwZmFjYWRlJTIwZXh0ZXJpb3J8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1600663791817-d74f5196ba29?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZm9vZCUyMGRpc2h8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1621494268492-d01b98eba7e4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwZm9vZCUyMGRpc2h8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1783240819607-59efc3834326?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxyZXN0YXVyYW50JTIwZmFjYWRlJTIwZXh0ZXJpb3J8ZW58MHx8fHwxNzg0MDkwODc4fDA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxwaXp6YXxlbnwwfHx8fDE3ODQwOTA4Nzh8MA&ixlib=rb-4.1.0&q=85&w=800",
    "https://images.pexels.com/photos/9738983/pexels-photo-9738983.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
    "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
    "https://images.pexels.com/photos/11470545/pexels-photo-11470545.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
]

FOOD_IMAGES = {
    "Pizza": [
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Burger": [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Biryani": [
        "https://images.pexels.com/photos/9738983/pexels-photo-9738983.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=600",
        "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=600",
    ],
    "Chinese": [
        "https://images.pexels.com/photos/21482824/pexels-photo-21482824.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=600",
        "https://images.unsplash.com/photo-1552611052-33e04de081de?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Desserts": [
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Healthy": [
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Indian": [
        "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=600",
        "https://images.unsplash.com/photo-1600663791817-d74f5196ba29?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "South Indian": [
        "https://images.unsplash.com/photo-1644289450169-bc58aa16bacb?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Beverages": [
        "https://images.unsplash.com/photo-1625865019845-7b2c89b8a8a9?crop=entropy&cs=srgb&fm=jpg&w=600&q=85",
    ],
    "Sushi": [
        "https://images.pexels.com/photos/11470545/pexels-photo-11470545.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=600",
    ],
}

RESTAURANT_TEMPLATES = [
    ("Slice Republic", "Wood-fired artisan pizzas", ["Pizza", "Italian"], ["Pizza"], False, 4.6, 25, 35, 29, 499, True, True, False),
    ("Burger Barn", "Classic burgers & shakes", ["Burger", "American"], ["Burger"], False, 4.3, 20, 30, 25, 399, True, False, True),
    ("Biryani House", "Slow-cooked dum biryanis", ["Biryani", "Indian"], ["Biryani", "Indian"], False, 4.7, 30, 40, 39, 599, True, True, True),
    ("Dragon Wok", "Authentic Chinese wok", ["Chinese", "Asian"], ["Chinese"], False, 4.2, 25, 35, 35, 449, True, False, False),
    ("Sweet Symphony", "Handcrafted desserts", ["Desserts", "Bakery"], ["Desserts"], True, 4.8, 15, 25, 19, 299, False, True, True),
    ("Green Bowl", "Fresh salads & smoothies", ["Healthy", "Salads"], ["Healthy"], True, 4.5, 20, 30, 25, 349, True, False, True),
    ("Spice Route", "Rich North Indian curries", ["Indian", "Curries"], ["Indian"], False, 4.4, 30, 40, 35, 549, True, True, False),
    ("Dosa Palace", "Crispy dosas & idlis", ["South Indian"], ["South Indian"], True, 4.6, 20, 30, 25, 299, True, False, True),
    ("Sip Station", "Coffee, teas & juices", ["Beverages", "Cafe"], ["Beverages"], True, 4.3, 10, 20, 15, 199, False, False, True),
    ("Tokyo Sushi", "Premium sushi rolls", ["Sushi", "Japanese"], ["Sushi"], False, 4.9, 35, 45, 59, 899, True, True, False),
    ("Cheesy Bites", "Loaded stuffed crust", ["Pizza"], ["Pizza"], False, 4.1, 25, 35, 29, 399, False, False, True),
    ("Flame Grill", "Chargrilled patties", ["Burger", "Grill"], ["Burger"], False, 4.4, 20, 30, 25, 449, False, True, False),
]

FOOD_TEMPLATES = {
    "Pizza": [
        ("Margherita Classic", "Tomato, mozzarella, basil", 249, True, True),
        ("Farmhouse Special", "Bell peppers, onion, mushroom", 349, True, False),
        ("Pepperoni Feast", "Loaded with pepperoni", 449, False, True),
        ("Barbecue Chicken", "BBQ sauce & grilled chicken", 499, False, False),
    ],
    "Burger": [
        ("Classic Cheese Burger", "Beef patty, cheese, lettuce", 199, False, True),
        ("Veggie Deluxe", "Grilled veggies & aioli", 179, True, False),
        ("Chicken Zinger", "Crispy chicken burger", 249, False, True),
    ],
    "Biryani": [
        ("Hyderabadi Chicken Biryani", "Aromatic long-grain rice with chicken", 329, False, True),
        ("Veg Dum Biryani", "Fragrant biryani with fresh veggies", 249, True, False),
        ("Mutton Biryani", "Slow-cooked with premium mutton", 429, False, True),
    ],
    "Chinese": [
        ("Veg Hakka Noodles", "Wok-tossed noodles", 189, True, True),
        ("Chilli Paneer", "Spicy Indo-Chinese paneer", 219, True, False),
        ("Sweet & Sour Chicken", "Tangy chicken with sauce", 289, False, True),
    ],
    "Desserts": [
        ("Belgian Chocolate Lava", "Molten chocolate cake", 199, True, True),
        ("Tiramisu", "Classic Italian dessert", 249, True, False),
        ("New York Cheesecake", "Rich baked cheesecake", 279, True, True),
    ],
    "Healthy": [
        ("Grilled Chicken Bowl", "Quinoa, veggies, chicken", 319, False, True),
        ("Buddha Bowl", "Chickpeas, avocado, greens", 289, True, True),
    ],
    "Indian": [
        ("Paneer Butter Masala", "Rich tomato gravy with paneer", 279, True, True),
        ("Butter Chicken", "Creamy tomato chicken curry", 329, False, True),
        ("Dal Makhani", "Slow-cooked black lentils", 219, True, False),
    ],
    "South Indian": [
        ("Masala Dosa", "Crispy dosa with potato filling", 149, True, True),
        ("Idli Sambhar", "Steamed idlis with sambhar", 129, True, False),
    ],
    "Beverages": [
        ("Cold Brew Coffee", "Smooth cold-brewed coffee", 149, True, True),
        ("Fresh Mango Smoothie", "Blended alphonso mango", 179, True, False),
    ],
    "Sushi": [
        ("California Roll (8pc)", "Crab, avocado, cucumber", 449, False, True),
        ("Salmon Nigiri (6pc)", "Fresh salmon on rice", 549, False, True),
        ("Veg Tempura Roll", "Crispy tempura vegetables", 379, True, False),
    ],
}

COUPONS = [
    {"code": "WELCOME50", "title": "Flat ₹50 OFF", "description": "On your first order above ₹199", "discount_type": "flat", "discount_value": 50, "min_order": 199, "max_discount": 50},
    {"code": "SHIPPZU100", "title": "₹100 OFF", "description": "On orders above ₹499", "discount_type": "flat", "discount_value": 100, "min_order": 499, "max_discount": 100},
    {"code": "SAVE20", "title": "20% OFF", "description": "Up to ₹150 discount on orders above ₹299", "discount_type": "percent", "discount_value": 20, "min_order": 299, "max_discount": 150},
    {"code": "FEAST30", "title": "30% OFF", "description": "Up to ₹200 on orders above ₹599", "discount_type": "percent", "discount_value": 30, "min_order": 599, "max_discount": 200},
]


async def seed_if_empty(db):
    if await db.categories.count_documents({}) > 0:
        return

    # categories
    cat_docs = []
    for c in CATEGORIES:
        cat_docs.append({"id": str(uuid.uuid4()), **c})
    await db.categories.insert_many(cat_docs)
    cat_by_name = {c["name"]: c["id"] for c in cat_docs}

    # restaurants
    rest_docs: List[dict] = []
    food_docs: List[dict] = []
    for idx, (name, tagline, cuisines, cat_names, is_veg, rating, dmin, dmax, delfee, cf2, featured, trending, popular) in enumerate(RESTAURANT_TEMPLATES):
        rid = str(uuid.uuid4())
        cover = REST_COVERS[idx % len(REST_COVERS)]
        rest_docs.append({
            "id": rid,
            "name": name,
            "tagline": tagline,
            "cover_image": cover,
            "logo": cover,
            "rating": rating,
            "total_ratings": 500 + idx * 137,
            "delivery_time_min": dmin,
            "delivery_time_max": dmax,
            "delivery_fee": delfee,
            "cost_for_two": cf2,
            "cuisines": cuisines,
            "category_ids": [cat_by_name[c] for c in cat_names if c in cat_by_name],
            "is_veg": is_veg,
            "is_open": True,
            "is_featured": featured,
            "is_trending": trending,
            "is_popular": popular,
            "distance_km": round(0.5 + idx * 0.4, 1),
            "address": f"{100+idx} Main Street, Downtown",
            "lat": 12.9716 + idx * 0.005,
            "lng": 77.5946 + idx * 0.005,
            "offers": ["50% OFF up to ₹100", "Free delivery"] if idx % 2 == 0 else ["₹150 OFF above ₹499"],
        })
        # foods per category linked to this restaurant
        for cn in cat_names:
            for fi, (fname, fdesc, fprice, fveg, best) in enumerate(FOOD_TEMPLATES.get(cn, [])):
                imgs = FOOD_IMAGES.get(cn, [cover])
                food_docs.append({
                    "id": str(uuid.uuid4()),
                    "restaurant_id": rid,
                    "name": fname,
                    "description": fdesc,
                    "image": imgs[fi % len(imgs)],
                    "price": float(fprice),
                    "veg": fveg,
                    "is_bestseller": best,
                    "is_recommended": fi < 2,
                    "menu_category": "Recommended" if fi < 2 else cn,
                    "rating": round(4.0 + (fi * 0.15), 1),
                    "variants": [
                        {"id": str(uuid.uuid4()), "name": "Regular", "price": float(fprice)},
                        {"id": str(uuid.uuid4()), "name": "Large", "price": float(fprice) + 80.0},
                    ] if cn in ("Pizza", "Biryani") else [],
                    "addons": [
                        {"id": str(uuid.uuid4()), "name": "Extra Cheese", "price": 40.0},
                        {"id": str(uuid.uuid4()), "name": "Extra Toppings", "price": 60.0},
                    ] if cn in ("Pizza", "Burger") else [],
                })

    if rest_docs:
        await db.restaurants.insert_many(rest_docs)
    if food_docs:
        await db.foods.insert_many(food_docs)

    # coupons
    coup_docs = [{"id": str(uuid.uuid4()), "is_active": True, **c} for c in COUPONS]
    await db.coupons.insert_many(coup_docs)

    # indexes
    await db.restaurants.create_index("name")
    await db.foods.create_index([("restaurant_id", 1)])
    await db.orders.create_index([("user_id", 1), ("created_at", -1)])
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
