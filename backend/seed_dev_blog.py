"""Dev-only seed: a couple of published blog posts so /blog and /blog/[slug]
SSR + BlogPosting schema can be verified. Idempotent (upsert by slug)."""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

cfg = dotenv_values("/app/backend/.env")
db = AsyncIOMotorClient(cfg["MONGO_URL"].strip('"'))[cfg.get("DB_NAME", "thelocaljewel").strip('"')]
now = datetime.now(timezone.utc)

POSTS = [
    {
        "slug": "lab-grown-vs-natural-diamonds-2025",
        "title": "Lab-Grown vs Natural Diamonds: An Honest 2025 Guide",
        "subtitle": "What actually changes when you choose lab-grown — and what doesn't.",
        "excerpt": "Lab-grown diamonds are chemically identical to mined ones and cost a fraction. Here's how to choose with confidence.",
        "content_html": "<h2>The short version</h2><p>Lab-grown diamonds are real diamonds — identical carbon structure, identical sparkle — at roughly a third of the price of mined stones. That difference is why most of our clients can move up a full carat for the same budget.</p><p>We only sell IGI- or GIA-certified stones, so you always know exactly what you're getting.</p>",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_794xN.6625116803_8utf.jpg",
        "category": "Buying Guides",
        "author_name": "Ansh",
        "featured": True,
        "meta_title": "Lab-Grown vs Natural Diamonds: Honest 2025 Guide | The Local Jewel",
        "meta_description": "Lab-grown diamonds are chemically identical to mined ones at ~1/3 the price. A working jeweler's honest 2025 guide to choosing.",
        "published": True,
        "published_at": now - timedelta(days=5),
    },
    {
        "slug": "how-to-choose-an-engagement-ring-setting",
        "title": "How to Choose an Engagement Ring Setting",
        "subtitle": "Solitaire, hidden halo, three-stone — what each setting really says.",
        "excerpt": "A quick, jeweler-written tour of the most popular settings and who each one suits.",
        "content_html": "<h2>Start with her hand, not Pinterest</h2><p>The best setting is the one that fits her lifestyle. Active hands love low-profile solitaires; lovers of sparkle gravitate to hidden halos.</p><ul><li><strong>Solitaire</strong> — timeless, shows the stone.</li><li><strong>Hidden halo</strong> — extra sparkle from below.</li><li><strong>Three-stone</strong> — past, present, future.</li></ul>",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_794xN.6557149529_j2mm.jpg",
        "category": "Design",
        "author_name": "Nayan",
        "featured": False,
        "meta_title": "How to Choose an Engagement Ring Setting | The Local Jewel",
        "meta_description": "Solitaire, hidden halo, or three-stone? A working jeweler explains how to pick the right engagement ring setting.",
        "published": True,
        "published_at": now - timedelta(days=2),
    },
]


async def main():
    for p in POSTS:
        p = {**p, "updated_at": now}
        existing = await db.blog_posts.find_one({"slug": p["slug"]})
        if existing:
            await db.blog_posts.update_one({"slug": p["slug"]}, {"$set": p})
            print("updated blog:", p["slug"])
        else:
            p["post_id"] = str(uuid.uuid4())
            p["created_at"] = now
            await db.blog_posts.insert_one(p)
            print("inserted blog:", p["slug"])
    print("done")


if __name__ == "__main__":
    asyncio.run(main())
