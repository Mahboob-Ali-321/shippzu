"""Shippzu Super-App backend.

Modular architecture — each module (food_delivery, grocery, pharmacy, etc.)
mounts its own routers under a common /api prefix.
"""
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from modules.shared.database import get_db, close_db
from modules.shared.auth.router import router as auth_router
from modules.food_delivery.routers.restaurants import router as fd_restaurants
from modules.food_delivery.routers.orders import router as fd_orders
from modules.food_delivery.routers.addresses import router as fd_addresses
from modules.food_delivery.routers.coupons import router as fd_coupons
from modules.food_delivery.routers.notifications import router as fd_notifications
from modules.food_delivery.seed import seed_if_empty


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("shippzu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_db()
    await seed_if_empty(db)
    logger.info("Shippzu backend ready — food delivery module loaded")
    yield
    close_db()


app = FastAPI(title="Shippzu API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes under /api
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {
        "app": "Shippzu",
        "tagline": "Everything You Need",
        "version": "1.0.0",
        "modules": ["food_delivery"],
        "planned_modules": [
            "grocery", "pharmacy", "parcel", "marketplace", "flowers",
            "water", "meat", "laundry", "pet_supplies", "pickup_drop",
        ],
    }


@api_router.get("/health")
async def health():
    try:
        db = get_db()
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# Mount shared auth
api_router.include_router(auth_router)

# Mount food delivery module routers
api_router.include_router(fd_restaurants)
api_router.include_router(fd_orders)
api_router.include_router(fd_addresses)
api_router.include_router(fd_coupons)
api_router.include_router(fd_notifications)

app.include_router(api_router)
