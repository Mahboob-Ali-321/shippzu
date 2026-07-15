"""Shared MongoDB connection for all Shippzu modules."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_client: AsyncIOMotorClient | None = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _client[os.environ.get("DB_NAME", "shippzu_db")]
    return _db


def close_db():
    global _client
    if _client is not None:
        _client.close()
