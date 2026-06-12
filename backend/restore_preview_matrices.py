"""One-off (PREVIEW ONLY): rebuild graduated price matrices for the 3 seeded
engagement rings whose matrices were emptied. Lowest cell (silver @ 1ct) equals
the original from-price. Safe to re-run."""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "thelocaljewel")

METAL_MULT = {"silver": 1.0, "10k": 1.15, "14k": 1.3, "18k": 1.55, "platinum": 1.8}
CARAT_MULT = {"1": 1.0, "1.5": 1.35, "2": 1.8, "2.5": 2.4, "3": 3.1, "4": 4.5}
SLUGS = [
    "3-40-carat-oval-side-stone-engagement-ring",
    "5-carat-oval-solitaire-engagement-ring",
    "4-41-carat-radiant-hidden-halo-engagement-ring",
]


def build(base):
    pm = {}
    for tier, mm in METAL_MULT.items():
        row = {}
        for carat, cm in CARAT_MULT.items():
            row[carat] = int(round(base * mm * cm / 10.0) * 10)
        pm[tier] = row
    return pm


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    for slug in SLUGS:
        p = await db.projects.find_one({"slug": slug})
        if not p:
            print(f"  missing: {slug}")
            continue
        base = float(p.get("price") or p.get("from_price") or 1500)
        pm = build(base)
        await db.projects.update_one({"_id": p["_id"]}, {"$set": {"price_matrix": pm, "product_type": "engagement_ring"}})
        print(f"  restored {slug}: from={min(pm['silver'].values())}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
