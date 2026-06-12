"""Backfill product_type on existing projects.

Buyable projects (in a collection with a price matrix) -> engagement_ring.
Everything else (custom lead-gen showcase pieces) -> custom_project.
Idempotent: only touches docs missing product_type.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from variant_options import is_buyable, sanitize_price_matrix  # noqa: E402

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    buyable_n = custom_n = 0
    # 1) Backfill product_type where missing/null
    async for p in db.projects.find({"$or": [{"product_type": {"$in": [None, ""]}}, {"product_type": {"$exists": False}}]}):
        pt = "engagement_ring" if is_buyable(p) else "custom_project"
        await db.projects.update_one({"_id": p["_id"]}, {"$set": {"product_type": pt}})
        if pt == "engagement_ring":
            buyable_n += 1
        else:
            custom_n += 1

    # 2) Sanitize every matrix against its (now-resolved) product type. This DROPS
    #    only legacy carat cells that aren't valid for the type (e.g. "3.5" on an
    #    engagement ring) and keeps every other price. It never clears a whole matrix.
    sanitized = 0
    async for p in db.projects.find({"price_matrix": {"$nin": [None, {}]}}):
        pt = p.get("product_type") or ("engagement_ring" if is_buyable(p) else "custom_project")
        clean = sanitize_price_matrix(pt, p.get("price_matrix") or {})
        if clean != (p.get("price_matrix") or {}):
            await db.projects.update_one({"_id": p["_id"]}, {"$set": {"price_matrix": clean}})
            sanitized += 1

    print(f"Backfilled product_type -> engagement_ring: {buyable_n}, custom_project: {custom_n}")
    print(f"Sanitized matrices: {sanitized}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
