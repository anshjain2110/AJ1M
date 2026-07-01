import os, json, asyncio
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient

with open("/tmp/promote_backup.json") as f:
    bk = json.load(f)
PROJECT_ID = bk["project_id"]
orig = bk["orig"]

async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    await db.projects.update_one(
        {"project_id": PROJECT_ID},
        {"$set": {
            "product_type": orig.get("product_type"),
            "collections": orig.get("collections") or [],
            "price_matrix": orig.get("price_matrix") or {},
        }},
    )
    p = await db.projects.find_one({"project_id": PROJECT_ID}, {"_id": 0, "product_type": 1, "collections": 1, "price_matrix": 1})
    print("REVERTED", PROJECT_ID, "->", p.get("product_type"), "collections=", p.get("collections"), "matrix_empty=", not bool(p.get("price_matrix")))

asyncio.run(main())
