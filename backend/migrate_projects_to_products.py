"""One-time migration: clear demo storefront data, create the 'Engagement Rings'
top-level collection, and convert the 3 real published projects into buyable products.
Idempotent. Run: python migrate_projects_to_products.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
NOW = datetime.now(timezone.utc)

# project_id -> price the owner confirmed
PRICES = {
    "proj_9658eeceff80": 2850.0,   # 4.41 Carat Radiant Hidden Halo
    "proj_215b85ef9058": 1500.0,   # 3.40 Carat Oval Side Stone
    "proj_5c8e8a36ac26": 1800.0,   # 5 Carat Oval Solitaire
}

# Fallback metal from tags when specs.metal is blank
TAG_METAL = {
    "white_gold": "14K White Gold", "yellow_gold": "14K Yellow Gold",
    "rose_gold": "14K Rose Gold", "platinum": "Platinum",
}

CLEAN_MENU = {
    "_type": "main_menu",
    "items": [
        {
            "id": "engagement", "label": "Engagement Rings", "href": "/collections/engagement-rings",
            "type": "mega",
            "columns": [{
                "heading": "Shop", "links": [
                    {"label": "All Engagement Rings", "href": "/collections/engagement-rings", "hover_image_url": ""},
                ],
            }],
            "featured_image_url": "", "featured_label": "Shop all Engagement Rings", "featured_href": "/collections/engagement-rings",
        },
        {"id": "collections", "label": "Collections", "href": "/collections", "type": "link", "columns": []},
        {"id": "custom", "label": "Custom Design", "href": "/", "type": "link", "columns": []},
        {"id": "projects", "label": "Past Projects", "href": "/projects", "type": "link", "columns": []},
        {"id": "journal", "label": "Journal", "href": "/blog", "type": "link", "columns": []},
        {"id": "contact", "label": "Contact", "href": "/contact", "type": "link", "columns": []},
    ],
    "updated_at": NOW,
}


def derive_metal(proj):
    specs = proj.get("specs") or {}
    if specs.get("metal"):
        return specs["metal"]
    for t in (proj.get("tags") or []):
        if t in TAG_METAL:
            return TAG_METAL[t]
    return ""


def derive_carat(proj):
    specs = proj.get("specs") or {}
    if specs.get("carat"):
        return specs["carat"]
    # pull leading number from title e.g. "4.41 Carat ..." -> "4.41 ct"
    title = proj.get("title", "")
    head = title.split(" ")[0]
    try:
        float(head)
        return f"{head} ct"
    except ValueError:
        return ""


async def main():
    # 1. Clean demo data
    pd = await db.products.delete_many({})
    cd = await db.collections.delete_many({})
    print(f"Removed demo data: products={pd.deleted_count} collections={cd.deleted_count}")

    # 2. Engagement Rings top-level collection
    eng = {
        "collection_id": f"col_{uuid.uuid4().hex[:12]}",
        "slug": "engagement-rings", "title": "Engagement Rings",
        "subtitle": "Hand-crafted, made to order", "parent_slug": "",
        "description": "One-of-a-kind lab-grown diamond engagement rings, designed in-house and crafted to order.",
        "image_url": "", "hero_image_url": "",
        "published": True, "featured": True, "position": 0,
        "meta_title": "Lab Grown Diamond Engagement Rings | The Local Jewel",
        "meta_description": "Shop hand-crafted, made-to-order lab grown diamond engagement rings from The Local Jewel.",
        "created_at": NOW, "updated_at": NOW,
    }
    await db.collections.insert_one(eng)

    # 3. Convert the 3 projects -> buyable products
    created = 0
    first_hero = ""
    async for proj in db.projects.find({"published": True}, {"_id": 0}):
        pid = proj.get("project_id")
        price = PRICES.get(pid, proj.get("price"))
        if not price:
            print(f"  skip (no price): {proj.get('title')}")
            continue
        gallery = proj.get("gallery") or []
        images = [{"url": g.get("url", ""), "alt": g.get("caption", "")} for g in gallery if g.get("url")]
        hero = proj.get("hero_image_url") or (images[0]["url"] if images else "")
        if not first_hero:
            first_hero = hero
        specs = proj.get("specs") or {}
        clean_specs = {k: v for k, v in {
            "Carat": specs.get("carat"), "Shape": specs.get("shape"),
            "Metal": specs.get("metal"), "Color": specs.get("color"),
            "Clarity": specs.get("clarity"), "Certification": specs.get("certification"),
            "Certificate #": specs.get("cert_number"),
        }.items() if v}
        metal = derive_metal(proj)
        carat = derive_carat(proj)
        doc = {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "slug": proj.get("slug"),
            "title": proj.get("title", "Custom Piece"),
            "subtitle": proj.get("subtitle", ""),
            "description_html": f"<p>{proj.get('description', '')}</p>",
            "price": float(price), "compare_at_price": None,
            "currency": proj.get("price_currency", "USD"),
            "hero_image_url": hero, "images": images,
            "metals": [metal] if metal else [], "carats": [carat] if carat else [], "sizes": [],
            "specs": clean_specs,
            "collections": ["engagement-rings"],
            "tags": proj.get("tags") or [], "badge": "",
            "rating": None, "review_count": 0,
            "in_stock": True, "published": True, "featured": True, "position": 0,
            "meta_title": proj.get("meta_title", ""), "meta_description": proj.get("meta_description", ""),
            "source_project_id": pid,
            "created_at": NOW, "updated_at": NOW,
        }
        await db.products.insert_one(doc)
        created += 1
        print(f"  + product: {doc['title']} (${doc['price']}) metal={metal} carat={carat}")

    # give the collection a hero image from the first product
    if first_hero:
        await db.collections.update_one({"slug": "engagement-rings"}, {"$set": {"image_url": first_hero, "hero_image_url": first_hero}})

    # 4. Clean menu (no dead links)
    await db.menu_config.update_one({"_type": "main_menu"}, {"$set": CLEAN_MENU}, upsert=True)

    print(f"Done. products created={created}, collection=engagement-rings, menu reset.")


if __name__ == "__main__":
    asyncio.run(main())
