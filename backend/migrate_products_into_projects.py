"""One-time migration: fold the duplicate `products` collection back into `projects`.

Every project is now the single buyable entity. For each existing product we:
  - copy its `collections` onto the matching project (matched by slug)
  - seed a full price_matrix (5 metal tiers x 6 carats) using the product price so the
    project is immediately buyable; the admin can refine exact prices afterwards.
Then we drop the now-unused `products` collection.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from variant_options import METAL_TIERS, CARAT_WEIGHTS  # noqa: E402


def seed_matrix(base_price: float):
    base = round(float(base_price or 0), 2)
    if base <= 0:
        return {}
    return {m["id"]: {c: base for c in CARAT_WEIGHTS} for m in METAL_TIERS}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    print(f"Found {len(products)} products to fold into projects")

    for prod in products:
        slug = prod.get("slug")
        if not slug:
            continue
        proj = await db.projects.find_one({"slug": slug})
        cols = prod.get("collections") or []
        price = prod.get("price") or proj.get("price") if proj else prod.get("price")
        if not proj:
            print(f"  ! no project for product slug={slug} (skipping)")
            continue
        # don't clobber a matrix the admin already built
        matrix = proj.get("price_matrix") or seed_matrix(price)
        update = {
            "collections": cols,
            "price_matrix": matrix,
        }
        if not proj.get("price"):
            update["price"] = round(float(price or 0), 2) or None
        await db.projects.update_one({"slug": slug}, {"$set": update})
        print(f"  ✓ {slug}: collections={cols} from_price={min([min(r.values()) for r in matrix.values()]) if matrix else 0}")

    dropped = await db.products.count_documents({})
    await db.products.drop()
    print(f"Dropped products collection ({dropped} docs)")

    print("\nVerification:")
    async for p in db.projects.find({}, {"_id": 0, "slug": 1, "collections": 1, "price_matrix": 1}):
        pm = p.get("price_matrix") or {}
        n = sum(len(r) for r in pm.values())
        print(f"  {p.get('slug')}: collections={p.get('collections')} matrix_cells={n}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
