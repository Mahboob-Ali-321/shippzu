"""Address book endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ...shared.database import get_db
from ...shared.auth.deps import get_current_user
from ..models import new_id

router = APIRouter(prefix="/food/addresses", tags=["addresses"])


class AddressIn(BaseModel):
    label: str = "Home"
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    lat: float = 0.0
    lng: float = 0.0
    is_default: bool = False


@router.get("")
async def list_addresses(user: dict = Depends(get_current_user)):
    db = get_db()
    return await db.addresses.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)


@router.post("")
async def create_address(data: AddressIn, user: dict = Depends(get_current_user)):
    db = get_db()
    addr = {"id": new_id(), "user_id": user["id"], **data.model_dump()}
    if addr["is_default"]:
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.insert_one(addr)
    addr.pop("_id", None)
    return addr


@router.put("/{address_id}")
async def update_address(address_id: str, data: AddressIn, user: dict = Depends(get_current_user)):
    db = get_db()
    if data.is_default:
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    result = await db.addresses.update_one(
        {"id": address_id, "user_id": user["id"]},
        {"$set": data.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return await db.addresses.find_one({"id": address_id}, {"_id": 0})


@router.delete("/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.addresses.delete_one({"id": address_id, "user_id": user["id"]})
    return {"ok": True}
