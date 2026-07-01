import os, json, asyncio
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient

PROJECT_ID = "ff84cee3-76f6-4ba5-bbf3-3d2cfec9c47d"  # 2-carat-oval-hidden-halo-engagement-ring
CARATS = ["1", "1.5", "2", "2.5", "3", "4"]
TIERS = ["silver", "10k", "14k", "18k", "platinum"]
TIER_MULT = {"silver": 0.6, "10k": 0.85, "14k": 1.0, "18k": 1.2, "platinum": 1.5}

def price(tier, carat):
    return round(1800 * TIER_MULT[tier] * float(carat), 2)

matrix = {t: {c: price(t, c) for c in CARATS} for t in TIERS}

async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    proj = await db.projects.find_one({"project_id": PROJECT_ID}, {"_id": 0})
    assert proj, "project not found"
    orig = {
        "product_type": proj.get("product_type"),
        "collections": proj.get("collections"),
        "price_matrix": proj.get("price_matrix"),
    }
    with open("/tmp/promote_backup.json", "w") as f:
        json.dump({"project_id": PROJECT_ID, "orig": orig}, f)
    await db.projects.update_one(
        {"project_id": PROJECT_ID},
        {"$set": {"product_type": "engagement_ring", "collections": ["engagement-rings"], "price_matrix": matrix}},
    )
    print("PROMOTED", PROJECT_ID, "-> engagement_ring buyable; backup at /tmp/promote_backup.json")

asyncio.run(main())
