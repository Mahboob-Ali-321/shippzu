"""Food delivery module data models (Pydantic)."""
from typing import Optional, List, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Category(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    icon_url: str
    order: int = 0


class Restaurant(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    tagline: str
    cover_image: str
    logo: str
    rating: float
    total_ratings: int
    delivery_time_min: int
    delivery_time_max: int
    delivery_fee: float
    cost_for_two: float
    cuisines: List[str]
    category_ids: List[str] = []
    is_veg: bool = False
    is_open: bool = True
    is_featured: bool = False
    is_trending: bool = False
    is_popular: bool = False
    distance_km: float = 1.5
    address: str = ""
    lat: float = 0.0
    lng: float = 0.0
    offers: List[str] = []


class Addon(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    price: float


class Variant(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    price: float  # actual price for this variant


class FoodItem(BaseModel):
    id: str = Field(default_factory=new_id)
    restaurant_id: str
    name: str
    description: str
    image: str
    price: float
    veg: bool
    is_bestseller: bool = False
    is_recommended: bool = False
    menu_category: str = "Recommended"
    rating: Optional[float] = None
    variants: List[Variant] = []
    addons: List[Addon] = []


class Address(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    label: str  # Home, Work, Other
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    lat: float = 0.0
    lng: float = 0.0
    is_default: bool = False


class Coupon(BaseModel):
    id: str = Field(default_factory=new_id)
    code: str
    title: str
    description: str
    discount_type: Literal["flat", "percent"] = "flat"
    discount_value: float = 0.0
    min_order: float = 0.0
    max_discount: float = 0.0
    is_active: bool = True


class CartItem(BaseModel):
    food_id: str
    quantity: int
    variant_id: Optional[str] = None
    addon_ids: List[str] = []
    special_instructions: Optional[str] = None
    # snapshot fields for stable price
    name: str
    image: str
    unit_price: float


class Order(BaseModel):
    id: str = Field(default_factory=new_id)
    order_number: str  # short human ID
    user_id: str
    restaurant_id: str
    restaurant_name: str
    restaurant_image: str
    items: List[CartItem]
    address: dict
    subtotal: float
    delivery_fee: float
    platform_fee: float
    packaging_fee: float
    taxes: float
    discount: float
    coupon_code: Optional[str] = None
    grand_total: float
    payment_method: Literal["cod", "razorpay", "upi", "card"] = "cod"
    payment_status: Literal["pending", "paid", "failed"] = "pending"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: Literal["placed", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled"] = "placed"
    status_history: List[dict] = []
    eta_minutes: int = 30
    special_instructions: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    delivered_at: Optional[str] = None


class Review(BaseModel):
    id: str = Field(default_factory=new_id)
    restaurant_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str = Field(default_factory=now_iso)


class Notification(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    title: str
    body: str
    icon: str = "bell"
    read: bool = False
    order_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class Favourite(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    kind: Literal["restaurant", "food"]
    target_id: str
    created_at: str = Field(default_factory=now_iso)
