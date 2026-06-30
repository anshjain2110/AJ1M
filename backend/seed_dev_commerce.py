"""Dev-only seed: creates published collections + buyable products with a real
price_matrix so the Next SSR build can be verified end-to-end (PDP Product /
Offer / ProductGroup variants, collection grids, sitemap). Idempotent (upsert
by slug). Run from /app/backend:  python3 seed_dev_commerce.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

cfg = dotenv_values("/app/backend/.env")
MONGO_URL = cfg["MONGO_URL"].strip('"')
DB_NAME = cfg.get("DB_NAME", "thelocaljewel").strip('"')

now = datetime.now(timezone.utc)

COLLECTIONS = [
    {
        "slug": "engagement-rings",
        "title": "Engagement Rings",
        "subtitle": "Hidden halos, solitaires & three-stone designs",
        "description": "Hand-crafted lab-grown diamond engagement rings, IGI-certified and made to order in Winter Park, Florida.",
        "meta_title": "Lab-Grown Diamond Engagement Rings | The Local Jewel",
        "meta_description": "Shop custom lab-grown diamond engagement rings — hidden halo, solitaire and three-stone styles. IGI certified, free insured shipping.",
        "image_url": "https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_794xN.6823344673_akr1.jpg",
        "featured": True,
        "position": 1,
        "parent_slug": "",
        "published": True,
    },
    {
        "slug": "wedding-bands",
        "title": "Wedding Bands",
        "subtitle": "Classic & eternity bands",
        "description": "Lab-grown diamond and precious-metal wedding bands, hand-finished to order.",
        "meta_title": "Wedding Bands | The Local Jewel",
        "meta_description": "Shop hand-crafted wedding bands and eternity bands in 14K/18K gold and platinum.",
        "image_url": "https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_794xN.6557149529_j2mm.jpg",
        "featured": True,
        "position": 2,
        "parent_slug": "",
        "published": True,
    },
]

PM_RING = {
    "14k": {"1": 1800, "1.5": 2100, "2": 2600, "2.5": 3000, "3": 3400, "4": 4800},
    "18k": {"1": 2100, "1.5": 2450, "2": 2950, "2.5": 3400, "3": 3900, "4": 5400},
    "platinum": {"1": 2600, "2": 3500, "3": 4600, "4": 6200},
}

PRODUCTS = [
    {
        "slug": "2-carat-oval-hidden-halo-engagement-ring",
        "title": "2 Carat Oval Hidden Halo Engagement Ring",
        "subtitle": "An elongated oval with a delicate hidden halo of pavé.",
        "description": "A 2-carat lab-grown oval diamond set in a hidden-halo solitaire. Hand-crafted to order with an IGI certificate, free engraving and complimentary ring sizing. Free insured worldwide shipping.",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_794xN.6625116803_8utf.jpg",
        "gallery": [
            {"url": "https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_794xN.6625116803_8utf.jpg", "caption": "Final piece", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_794xN.6823344673_akr1.jpg", "caption": "Hand shot", "type": "final"},
        ],
        "specs": {"shape": "Oval", "carat": "2", "color": "F", "clarity": "VS1", "cut": "Excellent", "setting_style": "Hidden Halo", "certification": "IGI", "cert_number": "LG552419330"},
        "product_type": "engagement_ring",
        "collections": ["engagement-rings"],
        "price_matrix": PM_RING,
        "tags": ["igi_certified", "oval"],
        "featured": True,
        "position": 1,
        "meta_title": "2 Carat Oval Hidden Halo Engagement Ring | The Local Jewel",
        "meta_description": "2ct lab-grown oval diamond hidden-halo engagement ring, IGI certified. Hand-crafted to order with free insured shipping from Winter Park, FL.",
    },
    {
        "slug": "3-carat-radiant-solitaire-engagement-ring",
        "title": "3 Carat Radiant Solitaire Engagement Ring",
        "subtitle": "A bold radiant cut on a slim solitaire band.",
        "description": "A 3-carat lab-grown radiant diamond solitaire, hand-set on a delicate band. IGI certified, made to order, free insured worldwide shipping.",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_794xN.6557149529_j2mm.jpg",
        "gallery": [
            {"url": "https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_794xN.6557149529_j2mm.jpg", "caption": "Final piece", "type": "final"},
        ],
        "specs": {"shape": "Radiant", "carat": "3", "color": "E", "clarity": "VVS2", "cut": "Excellent", "setting_style": "Solitaire", "certification": "IGI", "cert_number": "LG778120945"},
        "product_type": "engagement_ring",
        "collections": ["engagement-rings"],
        "price_matrix": PM_RING,
        "tags": ["igi_certified", "radiant"],
        "featured": True,
        "position": 2,
        "meta_title": "3 Carat Radiant Solitaire Engagement Ring | The Local Jewel",
        "meta_description": "3ct lab-grown radiant solitaire engagement ring, IGI certified. Hand-crafted to order, free insured shipping.",
    },
]


async def main():
    c = AsyncIOMotorClient(MONGO_URL)
    db = c[DB_NAME]
    for col in COLLECTIONS:
        col = {**col}
        existing = await db.collections.find_one({"slug": col["slug"]})
        col["updated_at"] = now
        if existing:
            await db.collections.update_one({"slug": col["slug"]}, {"$set": col})
            print("updated collection:", col["slug"])
        else:
            col["collection_id"] = str(uuid.uuid4())
            col["created_at"] = now
            await db.collections.insert_one(col)
            print("inserted collection:", col["slug"])
    for p in PRODUCTS:
        p = {**p, "published": True, "price_currency": "USD", "updated_at": now}
        existing = await db.projects.find_one({"slug": p["slug"]})
        if existing:
            await db.projects.update_one({"slug": p["slug"]}, {"$set": p})
            print("updated product:", p["slug"])
        else:
            p["project_id"] = str(uuid.uuid4())
            p["created_at"] = now
            await db.projects.insert_one(p)
            print("inserted product:", p["slug"])
    print("done")


if __name__ == "__main__":
    asyncio.run(main())
