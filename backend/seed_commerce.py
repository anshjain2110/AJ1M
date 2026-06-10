"""Seed sample collections + products for The Local Jewel storefront.
Idempotent: upserts by slug. Run: python seed_commerce.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
db = client[os.environ.get("DB_NAME", "thelocaljewel")]

NOW = datetime.now(timezone.utc)

IMG = {
    "round": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "oval": "https://images.pexels.com/photos/32988751/pexels-photo-32988751.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900",
    "lifestyle": "https://images.unsplash.com/photo-1529519195486-16945f0fb37f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "hero": "https://images.pexels.com/photos/14806356/pexels-photo-14806356.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
}

COLLECTIONS = [
    {"slug": "engagement-rings", "title": "Engagement Rings", "subtitle": "Made for forever moments", "image_url": IMG["lifestyle"], "hero_image_url": IMG["hero"], "featured": True, "position": 0,
     "description": "Hand-crafted lab-grown diamond engagement rings, designed in-house and made to order.", "meta_title": "Lab Grown Diamond Engagement Rings | The Local Jewel", "meta_description": "Shop hand-crafted lab grown diamond engagement rings — solitaire, halo, three stone and more."},
    {"slug": "round-engagement-rings", "title": "Round Engagement Rings", "subtitle": "Timeless brilliance", "image_url": IMG["round"], "featured": True, "position": 1, "description": "Classic round brilliant cut engagement rings."},
    {"slug": "oval-engagement-rings", "title": "Oval Engagement Rings", "subtitle": "Elongated elegance", "image_url": IMG["oval"], "featured": True, "position": 2, "description": "Flattering oval cut engagement rings."},
    {"slug": "emerald-engagement-rings", "title": "Emerald Engagement Rings", "subtitle": "Art-deco lines", "image_url": IMG["round"], "position": 3, "description": "Sophisticated emerald cut engagement rings."},
    {"slug": "pear-engagement-rings", "title": "Pear Engagement Rings", "subtitle": "Modern romance", "image_url": IMG["oval"], "position": 4, "description": "Distinctive pear shaped engagement rings."},
    {"slug": "solitaire-rings", "title": "Solitaire Rings", "subtitle": "Let the stone shine", "image_url": IMG["round"], "featured": True, "position": 5, "description": "Minimal solitaire settings."},
    {"slug": "hidden-halo-rings", "title": "Hidden Halo Rings", "subtitle": "A secret sparkle", "image_url": IMG["oval"], "featured": True, "position": 6, "description": "Hidden halo settings for extra brilliance."},
    {"slug": "three-stone-rings", "title": "Three Stone Rings", "subtitle": "Past, present, future", "image_url": IMG["round"], "position": 7, "description": "Symbolic three stone designs."},
    {"slug": "vintage-rings", "title": "Vintage Rings", "subtitle": "Old-world charm", "image_url": IMG["oval"], "position": 8, "description": "Vintage inspired engagement rings."},
    {"slug": "wedding-bands", "title": "Wedding Bands", "subtitle": "Seal the promise", "image_url": IMG["round"], "featured": True, "position": 9, "description": "Matching and stackable wedding bands."},
    {"slug": "eternity-bands", "title": "Eternity Bands", "subtitle": "Forever, all the way around", "image_url": IMG["oval"], "position": 10, "description": "Full and half eternity diamond bands."},
]

PRODUCTS = [
    {"slug": "oval-hidden-halo-engagement-ring", "title": "Oval Hidden Halo Engagement Ring", "subtitle": "1.5ct Lab Grown Diamond", "price": 1450.0, "compare_at_price": 2070.0, "badge": "Best Seller", "rating": 4.9, "review_count": 44, "featured": True, "collections": ["engagement-rings", "oval-engagement-rings", "hidden-halo-rings"], "image": IMG["oval"], "metals": ["14K White Gold", "14K Yellow Gold", "Platinum"], "carats": ["1.0ct", "1.5ct", "2.0ct"]},
    {"slug": "round-solitaire-engagement-ring", "title": "Round Solitaire Engagement Ring", "subtitle": "Classic six-prong", "price": 980.0, "compare_at_price": 1400.0, "badge": "Best Seller", "rating": 4.8, "review_count": 31, "featured": True, "collections": ["engagement-rings", "round-engagement-rings", "solitaire-rings"], "image": IMG["round"], "metals": ["14K White Gold", "14K Yellow Gold", "14K Rose Gold"], "carats": ["0.75ct", "1.0ct", "1.5ct"]},
    {"slug": "three-stone-oval-engagement-ring", "title": "Three Stone Oval Engagement Ring", "subtitle": "With kite side stones", "price": 1690.0, "compare_at_price": 2250.0, "badge": "New", "rating": 5.0, "review_count": 12, "featured": True, "collections": ["engagement-rings", "oval-engagement-rings", "three-stone-rings"], "image": IMG["oval"], "metals": ["14K White Gold", "Platinum"], "carats": ["1.5ct", "2.0ct", "2.5ct"]},
    {"slug": "emerald-cut-solitaire-ring", "title": "Emerald Cut Solitaire Ring", "subtitle": "Art-deco minimalism", "price": 1230.0, "compare_at_price": 1760.0, "badge": "", "rating": 4.7, "review_count": 19, "featured": True, "collections": ["engagement-rings", "emerald-engagement-rings", "solitaire-rings"], "image": IMG["round"], "metals": ["14K Yellow Gold", "Platinum"], "carats": ["1.0ct", "1.5ct", "2.0ct"]},
    {"slug": "pear-vintage-engagement-ring", "title": "Pear Vintage Engagement Ring", "subtitle": "Milgrain detailing", "price": 1120.0, "compare_at_price": 1600.0, "badge": "", "rating": 4.9, "review_count": 8, "collections": ["engagement-rings", "pear-engagement-rings", "vintage-rings"], "image": IMG["oval"], "metals": ["14K Rose Gold", "14K Yellow Gold"], "carats": ["1.0ct", "1.5ct"]},
    {"slug": "round-hidden-halo-ring", "title": "Round Hidden Halo Ring", "subtitle": "Pavé band", "price": 1340.0, "compare_at_price": 1910.0, "badge": "Best Seller", "rating": 4.8, "review_count": 27, "featured": True, "collections": ["engagement-rings", "round-engagement-rings", "hidden-halo-rings"], "image": IMG["round"], "metals": ["14K White Gold", "Platinum"], "carats": ["1.0ct", "1.5ct", "2.0ct"]},
    {"slug": "oval-three-stone-vintage-ring", "title": "Oval Three Stone Vintage Ring", "subtitle": "Knife-edge band", "price": 1580.0, "compare_at_price": 2260.0, "badge": "", "rating": 4.9, "review_count": 15, "collections": ["engagement-rings", "oval-engagement-rings", "three-stone-rings", "vintage-rings"], "image": IMG["oval"], "metals": ["14K White Gold", "14K Yellow Gold"], "carats": ["1.5ct", "2.0ct"]},
    {"slug": "diamond-eternity-wedding-band", "title": "Diamond Eternity Wedding Band", "subtitle": "Round full eternity", "price": 620.0, "compare_at_price": 890.0, "badge": "Best Seller", "rating": 4.9, "review_count": 52, "featured": True, "collections": ["wedding-bands", "eternity-bands"], "image": IMG["round"], "metals": ["14K White Gold", "14K Yellow Gold", "Platinum"], "sizes": ["5", "6", "7", "8"]},
    {"slug": "marquise-half-eternity-band", "title": "Marquise Half Eternity Band", "subtitle": "Alternating cuts", "price": 480.0, "compare_at_price": 690.0, "badge": "New", "rating": 4.7, "review_count": 18, "collections": ["wedding-bands", "eternity-bands"], "image": IMG["oval"], "metals": ["14K White Gold", "14K Rose Gold"], "sizes": ["5", "6", "7"]},
    {"slug": "classic-comfort-fit-band", "title": "Classic Comfort-Fit Band", "subtitle": "Polished gold", "price": 390.0, "compare_at_price": 560.0, "badge": "", "rating": 4.8, "review_count": 22, "collections": ["wedding-bands"], "image": IMG["round"], "metals": ["14K Yellow Gold", "14K White Gold", "Platinum"], "sizes": ["6", "7", "8", "9", "10"]},
]


async def main():
    for c in COLLECTIONS:
        doc = {
            "slug": c["slug"], "title": c["title"], "subtitle": c.get("subtitle", ""),
            "description": c.get("description", ""), "image_url": c.get("image_url", ""),
            "hero_image_url": c.get("hero_image_url", c.get("image_url", "")),
            "published": True, "featured": c.get("featured", False), "position": c.get("position", 0),
            "meta_title": c.get("meta_title", ""), "meta_description": c.get("meta_description", ""),
            "updated_at": NOW,
        }
        existing = await db.collections.find_one({"slug": c["slug"]})
        if existing:
            await db.collections.update_one({"slug": c["slug"]}, {"$set": doc})
        else:
            doc["collection_id"] = f"col_{uuid.uuid4().hex[:12]}"
            doc["created_at"] = NOW
            await db.collections.insert_one(doc)

    for p in PRODUCTS:
        doc = {
            "slug": p["slug"], "title": p["title"], "subtitle": p.get("subtitle", ""),
            "description_html": f"<p>{p['title']} — a hand-crafted lab grown diamond piece, designed in-house and made to order. IGI certified center stone, conflict-free, with a lifetime warranty.</p>",
            "price": p["price"], "compare_at_price": p.get("compare_at_price"), "currency": "USD",
            "hero_image_url": p["image"],
            "images": [{"url": p["image"], "alt": p["title"]}, {"url": IMG["lifestyle"], "alt": "On hand"}],
            "metals": p.get("metals", []), "carats": p.get("carats", []), "sizes": p.get("sizes", []),
            "specs": {"certification": "IGI", "clarity": "VS", "color": "EF"},
            "collections": p.get("collections", []), "tags": [], "badge": p.get("badge", ""),
            "rating": p.get("rating"), "review_count": p.get("review_count", 0),
            "in_stock": True, "published": True, "featured": p.get("featured", False),
            "position": 0, "meta_title": "", "meta_description": "", "source_project_id": None,
            "updated_at": NOW,
        }
        existing = await db.products.find_one({"slug": p["slug"]})
        if existing:
            await db.products.update_one({"slug": p["slug"]}, {"$set": doc})
        else:
            doc["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
            doc["created_at"] = NOW
            await db.products.insert_one(doc)

    cols = await db.collections.count_documents({})
    prods = await db.products.count_documents({})
    print(f"Seeded. collections={cols} products={prods}")


if __name__ == "__main__":
    asyncio.run(main())
