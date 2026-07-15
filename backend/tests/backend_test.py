"""Shippzu Backend API tests — Food Delivery Module 1.

Covers: health, auth (register/login/refresh/me/google/change/forgot/reset),
food/home, categories, restaurants, foods, coupons apply, addresses CRUD,
orders (quote, cod, razorpay stub, verify-payment, list, advance, cancel),
notifications, favourites, reviews, and role protection.
"""
import os
import time
import uuid
import pytest
import requests

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://shippzu-staging.preview.emergentagent.com"
BASE = BASE.rstrip("/")
API = f"{BASE}/api"

TIMEOUT = 30

# Shared mutable state across tests
STATE: dict = {}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def unique_email():
    # Use a unique email each run to guarantee fresh registration
    return f"test.customer+{uuid.uuid4().hex[:8]}@shippzu.com"


def _auth_headers():
    tok = STATE.get("access_token")
    return {"Authorization": f"Bearer {tok}"} if tok else {}


# ---------------- health ----------------
def test_health(session):
    r = session.get(f"{API}/health", timeout=TIMEOUT)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# ---------------- auth ----------------
def test_register(session, unique_email):
    payload = {
        "name": "Test Customer",
        "email": unique_email,
        "password": "TestPass123!",
        "phone": "9876543210",
        "role": "customer",
    }
    r = session.post(f"{API}/auth/register", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and "refresh_token" in data
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["role"] == "customer"
    STATE["access_token"] = data["access_token"]
    STATE["refresh_token"] = data["refresh_token"]
    STATE["user"] = data["user"]
    STATE["email"] = unique_email
    STATE["password"] = "TestPass123!"


def test_register_duplicate_email(session):
    payload = {
        "name": "Dup",
        "email": STATE["email"],
        "password": "TestPass123!",
        "phone": "9999999999",
        "role": "customer",
    }
    r = session.post(f"{API}/auth/register", json=payload, timeout=TIMEOUT)
    assert r.status_code == 400


def test_login(session):
    r = session.post(f"{API}/auth/login", json={"email": STATE["email"], "password": STATE["password"]}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user"]["email"] == STATE["email"].lower()
    STATE["access_token"] = d["access_token"]
    STATE["refresh_token"] = d["refresh_token"]


def test_login_wrong_password(session):
    r = session.post(f"{API}/auth/login", json={"email": STATE["email"], "password": "WrongPassX!"}, timeout=TIMEOUT)
    assert r.status_code == 401


def test_refresh(session):
    r = session.post(f"{API}/auth/refresh", json={"refresh_token": STATE["refresh_token"]}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["access_token"]
    STATE["access_token"] = d["access_token"]
    STATE["refresh_token"] = d["refresh_token"]


def test_me(session):
    r = session.get(f"{API}/auth/me", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["email"] == STATE["email"].lower()


def test_me_unauthenticated(session):
    r = requests.get(f"{API}/auth/me", timeout=TIMEOUT)
    assert r.status_code in (401, 403)


def test_google_login(session):
    payload = {
        "email": f"google+{uuid.uuid4().hex[:6]}@shippzu.com",
        "name": "Google User",
        "google_id": f"g_{uuid.uuid4().hex[:12]}",
        "avatar_url": "https://example.com/a.png",
    }
    r = session.post(f"{API}/auth/google", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user"]["email"] == payload["email"].lower()
    assert d["access_token"]


def test_change_password_wrong_old(session):
    r = session.post(
        f"{API}/auth/change-password",
        headers=_auth_headers(),
        json={"old_password": "WrongOld!", "new_password": "NewPass123!"},
        timeout=TIMEOUT,
    )
    assert r.status_code == 400


def test_change_password_success(session):
    new_pass = "NewPass123!"
    r = session.post(
        f"{API}/auth/change-password",
        headers=_auth_headers(),
        json={"old_password": STATE["password"], "new_password": new_pass},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200
    # Revert so remaining tests keep original password
    r2 = session.post(
        f"{API}/auth/change-password",
        headers=_auth_headers(),
        json={"old_password": new_pass, "new_password": STATE["password"]},
        timeout=TIMEOUT,
    )
    assert r2.status_code == 200


def test_forgot_and_reset_password(session):
    r = session.post(f"{API}/auth/forgot-password", json={"email": STATE["email"]}, timeout=TIMEOUT)
    assert r.status_code == 200
    data = r.json()
    token = data.get("dev_reset_token")
    assert token, f"dev_reset_token missing: {data}"
    r2 = session.post(
        f"{API}/auth/reset-password",
        json={"reset_token": token, "new_password": STATE["password"]},  # keep same
        timeout=TIMEOUT,
    )
    assert r2.status_code == 200


# ---------------- food / home ----------------
def test_home_feed(session):
    r = session.get(f"{API}/food/home", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ("categories", "featured", "trending", "popular", "nearby", "coupons"):
        assert key in d
    assert len(d["categories"]) >= 1


def test_categories(session):
    r = session.get(f"{API}/food/categories", timeout=TIMEOUT)
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list)
    assert len(cats) >= 10, f"expected >=10 categories, got {len(cats)}"


def test_restaurants_list(session):
    r = session.get(f"{API}/food/restaurants", timeout=TIMEOUT)
    assert r.status_code == 200
    lst = r.json()
    assert isinstance(lst, list) and len(lst) >= 10
    STATE["restaurant_id"] = lst[0]["id"]


def test_restaurants_filters(session):
    # featured
    r = session.get(f"{API}/food/restaurants?featured=true&sort=rating", timeout=TIMEOUT)
    assert r.status_code == 200
    lst = r.json()
    for x in lst:
        assert x.get("is_featured") is True
    # sort by delivery_time
    r2 = session.get(f"{API}/food/restaurants?sort=delivery_time&limit=5", timeout=TIMEOUT)
    assert r2.status_code == 200
    items = r2.json()
    if len(items) > 1:
        assert items[0]["delivery_time_min"] <= items[-1]["delivery_time_min"]
    # search
    r3 = session.get(f"{API}/food/restaurants?q=pizza", timeout=TIMEOUT)
    assert r3.status_code == 200


def test_restaurant_detail(session):
    rid = STATE["restaurant_id"]
    r = session.get(f"{API}/food/restaurants/{rid}", timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["restaurant"]["id"] == rid
    assert "menu" in d
    # capture some food ids from this restaurant
    for group in d["menu"]:
        if group["items"]:
            STATE["food_id"] = group["items"][0]["id"]
            STATE["food_price"] = group["items"][0]["price"]
            break
    assert "food_id" in STATE, "No foods found under first restaurant"


def test_foods_list_filter(session):
    rid = STATE["restaurant_id"]
    r = session.get(f"{API}/food/foods?restaurant_id={rid}", timeout=TIMEOUT)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    for x in items:
        assert x["restaurant_id"] == rid
    r2 = session.get(f"{API}/food/foods?veg=true&limit=5", timeout=TIMEOUT)
    assert r2.status_code == 200
    for x in r2.json():
        assert x["veg"] is True


# ---------------- coupons ----------------
def test_coupons_list(session):
    r = session.get(f"{API}/food/coupons", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    coupons = r.json()
    codes = {c["code"] for c in coupons}
    assert {"WELCOME50", "SHIPPZU100", "SAVE20", "FEAST30"}.issubset(codes), f"missing: {codes}"


@pytest.mark.parametrize(
    "code,subtotal,expected_status",
    [
        ("WELCOME50", 250.0, 200),  # min 199
        ("WELCOME50", 100.0, 400),  # below min
        ("SHIPPZU100", 600.0, 200),
        ("SAVE20", 400.0, 200),
        ("FEAST30", 700.0, 200),
        ("INVALIDXX", 500.0, 404),
    ],
)
def test_coupon_apply(session, code, subtotal, expected_status):
    r = session.post(
        f"{API}/food/coupons/apply",
        headers=_auth_headers(),
        json={"code": code, "subtotal": subtotal},
        timeout=TIMEOUT,
    )
    assert r.status_code == expected_status, r.text
    if expected_status == 200:
        d = r.json()
        assert d["discount"] > 0


# ---------------- addresses ----------------
def test_address_create(session):
    payload = {
        "label": "Home",
        "line1": "TEST_221B Baker Street",
        "city": "Bengaluru",
        "state": "KA",
        "pincode": "560001",
        "lat": 12.97,
        "lng": 77.59,
        "is_default": True,
    }
    r = session.post(f"{API}/food/addresses", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["line1"] == payload["line1"]
    STATE["address_id"] = d["id"]


def test_address_list_verifies(session):
    r = session.get(f"{API}/food/addresses", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    addrs = r.json()
    ids = [a["id"] for a in addrs]
    assert STATE["address_id"] in ids


def test_address_default_exclusivity(session):
    # Create a second default address; first one should lose default flag
    payload = {
        "label": "Work",
        "line1": "TEST_MG Road",
        "city": "Bengaluru",
        "state": "KA",
        "pincode": "560002",
        "is_default": True,
    }
    r = session.post(f"{API}/food/addresses", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200
    new_id = r.json()["id"]
    r2 = session.get(f"{API}/food/addresses", headers=_auth_headers(), timeout=TIMEOUT)
    addrs = r2.json()
    defaults = [a for a in addrs if a["is_default"]]
    assert len(defaults) == 1 and defaults[0]["id"] == new_id
    STATE["address_id_2"] = new_id


def test_address_update(session):
    aid = STATE["address_id"]
    payload = {
        "label": "Home Updated",
        "line1": "TEST_221B Baker Street Updated",
        "city": "Bengaluru",
        "state": "KA",
        "pincode": "560001",
        "is_default": False,
    }
    r = session.put(f"{API}/food/addresses/{aid}", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["label"] == "Home Updated"


def test_address_delete(session):
    aid = STATE.get("address_id_2")
    r = session.delete(f"{API}/food/addresses/{aid}", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    # verify not in list
    r2 = session.get(f"{API}/food/addresses", headers=_auth_headers(), timeout=TIMEOUT)
    ids = [a["id"] for a in r2.json()]
    assert aid not in ids


# ---------------- orders ----------------
def _cart_items(qty=2):
    return [{"food_id": STATE["food_id"], "quantity": qty, "addon_ids": []}]


def test_order_quote_math(session):
    payload = {"restaurant_id": STATE["restaurant_id"], "items": _cart_items(2)}
    r = session.post(f"{API}/food/orders/quote", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    # sanity: grand_total == subtotal + delivery + platform + packaging + taxes - discount
    computed = round(
        d["subtotal"] + d["delivery_fee"] + d["platform_fee"] + d["packaging_fee"] + d["taxes"] - d["discount"], 2
    )
    assert abs(computed - d["grand_total"]) < 0.02, d


def test_order_quote_with_coupon(session):
    # bump quantity to meet coupon min
    payload = {
        "restaurant_id": STATE["restaurant_id"],
        "items": _cart_items(6),
        "coupon_code": "WELCOME50",
    }
    r = session.post(f"{API}/food/orders/quote", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    if d["subtotal"] >= 199:
        assert d["discount"] > 0


def test_place_order_cod(session):
    payload = {
        "restaurant_id": STATE["restaurant_id"],
        "items": _cart_items(2),
        "address_id": STATE["address_id"],
        "payment_method": "cod",
    }
    r = session.post(f"{API}/food/orders", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["order"]["payment_method"] == "cod"
    assert d["order"]["status"] == "placed"
    STATE["cod_order_id"] = d["order"]["id"]
    STATE["cod_order_number"] = d["order"]["order_number"]


def test_place_order_razorpay_stub(session):
    payload = {
        "restaurant_id": STATE["restaurant_id"],
        "items": _cart_items(3),
        "address_id": STATE["address_id"],
        "payment_method": "razorpay",
    }
    r = session.post(f"{API}/food/orders", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["razorpay_order"] is not None
    assert d["razorpay_order"]["id"].startswith("order_stub_")
    STATE["rzp_order_id"] = d["order"]["id"]


def test_verify_payment_stub(session):
    payload = {
        "order_id": STATE["rzp_order_id"],
        "razorpay_payment_id": "pay_stub_xyz",
        "razorpay_signature": "sig_stub",
    }
    r = session.post(f"{API}/food/orders/verify-payment", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["verified"] is True
    # confirm order marked paid
    r2 = session.get(f"{API}/food/orders/{STATE['rzp_order_id']}", headers=_auth_headers(), timeout=TIMEOUT)
    assert r2.json()["payment_status"] == "paid"


def test_list_orders_sorted_desc(session):
    r = session.get(f"{API}/food/orders", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    orders = r.json()
    assert len(orders) >= 2
    dates = [o["created_at"] for o in orders]
    assert dates == sorted(dates, reverse=True)


def test_advance_order_status_flow(session):
    oid = STATE["cod_order_id"]
    expected = ["accepted", "preparing", "picked_up", "on_the_way", "delivered"]
    for status in expected:
        r = session.post(f"{API}/food/orders/{oid}/advance", headers=_auth_headers(), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == status
    # Try to advance beyond delivered — should stay delivered
    r_final = session.post(f"{API}/food/orders/{oid}/advance", headers=_auth_headers(), timeout=TIMEOUT)
    assert r_final.json()["status"] == "delivered"


def test_cancel_after_delivered_fails(session):
    oid = STATE["cod_order_id"]
    r = session.post(f"{API}/food/orders/{oid}/cancel", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 400


def test_cancel_placed_order(session):
    # place a fresh order then cancel
    payload = {
        "restaurant_id": STATE["restaurant_id"],
        "items": _cart_items(1),
        "address_id": STATE["address_id"],
        "payment_method": "cod",
    }
    r = session.post(f"{API}/food/orders", headers=_auth_headers(), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200
    oid = r.json()["order"]["id"]
    r2 = session.post(f"{API}/food/orders/{oid}/cancel", headers=_auth_headers(), timeout=TIMEOUT)
    assert r2.status_code == 200


# ---------------- notifications ----------------
def test_notifications(session):
    r = session.get(f"{API}/food/notifications", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    notifs = r.json()
    assert isinstance(notifs, list) and len(notifs) >= 1
    STATE["notif_id"] = notifs[0]["id"]


def test_mark_read(session):
    r = session.post(f"{API}/food/notifications/{STATE['notif_id']}/read", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200


def test_mark_all_read(session):
    r = session.post(f"{API}/food/notifications/mark-all-read", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    r2 = session.get(f"{API}/food/notifications", headers=_auth_headers(), timeout=TIMEOUT)
    notifs = r2.json()
    assert all(n["read"] for n in notifs)


# ---------------- favourites ----------------
def test_favourites_toggle_restaurant(session):
    r = session.post(
        f"{API}/food/favourites/toggle",
        headers=_auth_headers(),
        json={"kind": "restaurant", "target_id": STATE["restaurant_id"]},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200
    assert r.json()["favourited"] is True


def test_favourites_toggle_food(session):
    r = session.post(
        f"{API}/food/favourites/toggle",
        headers=_auth_headers(),
        json={"kind": "food", "target_id": STATE["food_id"]},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200
    assert r.json()["favourited"] is True


def test_favourites_list_hydrated(session):
    r = session.get(f"{API}/food/favourites", headers=_auth_headers(), timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    assert any(x["id"] == STATE["restaurant_id"] for x in d["restaurants"])
    assert any(x["id"] == STATE["food_id"] for x in d["foods"])


# ---------------- reviews ----------------
def test_review_add(session):
    r = session.post(
        f"{API}/food/reviews",
        headers=_auth_headers(),
        json={"restaurant_id": STATE["restaurant_id"], "rating": 5, "comment": "TEST_Great food!"},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200
    assert r.json()["rating"] == 5


def test_review_invalid_rating(session):
    r = session.post(
        f"{API}/food/reviews",
        headers=_auth_headers(),
        json={"restaurant_id": STATE["restaurant_id"], "rating": 7, "comment": "bad"},
        timeout=TIMEOUT,
    )
    # Pydantic-level or business-level validation; both are acceptable
    assert r.status_code in (400, 422)


def test_review_list(session):
    r = session.get(f"{API}/food/reviews/{STATE['restaurant_id']}", timeout=TIMEOUT)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------------- protected endpoints ----------------
@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/food/home"),
        ("GET", "/food/orders"),
        ("GET", "/food/addresses"),
        ("GET", "/food/notifications"),
        ("GET", "/food/favourites"),
        ("POST", "/food/coupons/apply"),
    ],
)
def test_protected_endpoints_unauth(session, method, path):
    r = requests.request(method, f"{API}{path}", json={}, timeout=TIMEOUT)
    assert r.status_code in (401, 403), f"{method} {path} -> {r.status_code}"
