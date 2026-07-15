# Shippzu — Product Requirements Document

## Product
**Shippzu — Everything You Need**  
Module 1 of a super-app (Food Delivery). Future modules: Grocery, Pharmacy, Parcel Delivery, Marketplace, Flowers, Water, Meat, Laundry, Pet Supplies, Pickup & Drop.

## Brand
- Primary: `#FF5A1F` · Background: `#FFFFFF` · Text: `#1A1A1A`
- Tagline: "Everything You Need"

## Tech Stack
- **Backend:** FastAPI + MongoDB (Motor async) + JWT (access + refresh)
- **Frontend:** Expo SDK 54 + React Native 0.81 + Expo Router 6 + TypeScript
- **Runs in:** Expo Go (Phase 1) — EAS Build ready for APK/AAB (Phase 2)

## Architecture — Modular Super-App
```
/app/backend/
  server.py                        # main entry
  modules/
    shared/
      database.py, auth/          # DB + auth reusable across all modules
    food_delivery/                 # module 1
      models.py, seed.py, routers/
```

Adding a future module (e.g., grocery) = create `modules/grocery/` + register its router in `server.py`. No frontend rebuild needed — modules registry in `src/modules/registry.ts` toggles them on.

## Roles (backend-ready)
- **customer** (Phase 1 UI shipped)
- **owner** (Restaurant Owner — API only)
- **partner** (Delivery Partner — API only)
- **admin** (Super Admin — API only)

## Phase 1 Features Shipped

### Customer App
- Splash + onboarding (3 slides) + persistent onboarded flag
- Auth: email/password with JWT + refresh, Google login (Emergent-stubbed), forgot password (dev token flow)
- Home: sticky header, search bar, 10 super-app module tiles (Food live, 9 coming soon), 10 categories, 4 coupons, featured/trending/popular/nearby restaurants
- Search with filters: veg-only, rating, fastest, low-cost + category chips (horizontal scroll)
- Restaurant details with parallax hero, menu categories, food items with veg/non-veg badges, bestseller tag, variant + addon customizer bottom sheet
- Cart: quantity controls, coupon apply, full bill breakdown (subtotal + delivery + platform + packaging + taxes − discount), sticky checkout CTA
- Checkout: saved addresses, payment methods (COD + Razorpay), place order → auto-verify signature (stub mode)
- Order Success animation → live order tracking (6-step timeline with polling every 10s, dev "advance status" button)
- Orders history with reorder
- Favourites (restaurants + foods, tab-switch)
- Notifications with unread badge + mark-as-read
- Addresses management (add, list, delete, default flag)
- Profile + Edit Profile + Change Password
- Settings + Dark/Light mode toggle (persisted)
- Coming-soon screen for future modules

### Backend (all `/api/*`)
- `/api/auth/*` — register, login, refresh, me, update-me, change-password, forgot-password, reset-password, google, logout
- `/api/food/home` — aggregated feed
- `/api/food/restaurants` — list/detail with filters and sort
- `/api/food/foods` — list/detail
- `/api/food/categories` — 10 seeded
- `/api/food/addresses` — CRUD
- `/api/food/coupons` — list, apply (validates min_order)
- `/api/food/orders` — quote, place, list, detail, cancel, verify-payment, advance (dev)
- `/api/food/notifications` — list, mark-read, mark-all-read
- `/api/food/favourites` — list, toggle
- `/api/food/reviews` — list, add
- `/api/food/push/register` — Expo push token registration

### Data (seeded on first boot)
- 10 categories · 12 restaurants · ~30 food items · 4 coupons
- Real Unsplash/Pexels image URLs

## Integrations
- **JWT Auth** — production-ready with bcrypt(12), 60min access + 30day refresh, role-based `RoleChecker` dependency
- **Emergent Google Auth** — stubbed endpoint accepts Google claims (`/api/auth/google`)
- **Razorpay** — placeholder keys → auto-fallback to stub orders + signature bypass in demo; real keys enable live payments + HMAC signature verification
- **Cloudinary** — SDK installed, endpoints ready (signature generator to be added on demand)
- **Google Maps** — placeholder key (integrate `react-native-maps` after prebuild for real devices)
- **FCM / Emergent Push** — endpoint `/api/food/push/register` ready; activates on APK/AAB build

## Environment Variables
Backend `.env`:
- `MONGO_URL`, `DB_NAME`
- `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `EMERGENT_PUSH_KEY` (protected — filled on deploy)

Frontend `.env` (Expo — DO NOT MODIFY): `EXPO_PUBLIC_BACKEND_URL`, `EXPO_PACKAGER_*`.

## Commands
```bash
# Backend
sudo supervisorctl restart backend

# Frontend
sudo supervisorctl restart expo

# EAS Build (post-deploy)
eas build --platform android --profile production          # AAB (Play Store)
eas build --platform android --profile preview             # APK
```

## Next Recommended Steps (Phase 2)
1. Native builds via Emergent Publish → activate real Razorpay, Google Maps, FCM
2. Restaurant Owner panel (React Native or web)
3. Delivery Partner app
4. Grocery module (reuse `modules/shared/` + copy `food_delivery/` template)
5. Social features (share order, refer & earn)
6. Voice search (expo-speech-recognition on native build)
7. Multi-language support
