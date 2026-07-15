"""Shared authentication router — used across all Shippzu modules."""
import uuid
from datetime import datetime, timezone
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field

from ..database import get_db
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

Role = Literal["customer", "owner", "partner", "admin"]


class RegisterIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    phone: Optional[str] = None
    role: Role = "customer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


async def _issue_tokens(user: dict) -> TokenPair:
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"], user["email"], user["role"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return TokenPair(access_token=access, refresh_token=refresh, user=safe_user)


@router.post("/register", response_model=TokenPair)
async def register(data: RegisterIn):
    db = get_db()
    # Only customer and owner can self-register; partner and admin must be seeded/promoted
    safe_role: Role = data.role if data.role in ("customer", "owner") else "customer"
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email.lower(),
        "phone": data.phone,
        "role": safe_role,
        "password_hash": hash_password(data.password),
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    await db.users.insert_one(user)
    return await _issue_tokens(user)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginIn):
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    return await _issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshIn):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    db = get_db()
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return await _issue_tokens(user)


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.put("/me")
async def update_me(data: UpdateProfileIn, user: dict = Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})


@router.post("/change-password")
async def change_password(data: ChangePasswordIn, user: dict = Depends(get_current_user)):
    db = get_db()
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(data.old_password, full.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Old password incorrect")
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"ok": True}


class ForgotPasswordIn(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordIn):
    # In production: send email with reset link. For Phase 1 demo: return a dev reset token.
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        # Don't reveal
        return {"ok": True, "message": "If the email exists, a reset link has been sent."}
    return {
        "ok": True,
        "message": "Reset token generated (DEV MODE — normally emailed).",
        "dev_reset_token": create_access_token(user["id"], user["email"], user["role"]),
    }


class ResetPasswordIn(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=6)


@router.post("/reset-password")
async def reset_password(data: ResetPasswordIn):
    payload = decode_token(data.reset_token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    db = get_db()
    await db.users.update_one(
        {"id": payload["sub"]},
        {"$set": {"password_hash": hash_password(data.new_password)}},
    )
    return {"ok": True}


# --- Google Social Login stub (Emergent-managed) ---
class GoogleAuthIn(BaseModel):
    id_token: Optional[str] = None
    email: EmailStr
    name: str
    google_id: str
    avatar_url: Optional[str] = None


@router.post("/google", response_model=TokenPair)
async def google_login(data: GoogleAuthIn):
    """Emergent-managed Google login: creates or fetches user from Google claim payload."""
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email.lower(),
            "phone": None,
            "role": "customer",
            "password_hash": None,
            "google_id": data.google_id,
            "avatar_url": data.avatar_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"google_id": data.google_id, "avatar_url": data.avatar_url or user.get("avatar_url")}},
        )
    return await _issue_tokens(user)


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    # Stateless JWT — clients discard tokens. Refresh tokens could be blacklisted here if needed.
    return {"ok": True}
