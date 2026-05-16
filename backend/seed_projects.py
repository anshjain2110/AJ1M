"""Seed 3 sample past-projects so the new Projects pages render with realistic data.
Run from /app/backend:  python3 seed_projects.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

SAMPLES = [
    {
        "slug": "4-41-carat-radiant-hidden-halo-engagement-ring",
        "title": "4.41 Carat Radiant Hidden Halo Engagement Ring",
        "subtitle": "Custom designed for a proposal in Winter Park, FL",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_794xN.6823344673_akr1.jpg",
        "gallery": [
            {"url": "https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_794xN.6823344673_akr1.jpg", "caption": "Final piece, white-light studio", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/c58bdd/6557149529/il_794xN.6557149529_j2mm.jpg", "caption": "Hand shot, natural light", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_794xN.6625116803_8utf.jpg", "caption": "3D render", "type": "render"},
        ],
        "specs": {
            "carat": "4.41 ct",
            "shape": "Radiant",
            "setting_style": "Hidden Halo",
            "metal": "14K White Gold",
            "color": "F",
            "clarity": "VS1",
            "certification": "IGI",
            "cert_number": "LG687583822",
            "cert_link": "/igi-certificate.pdf",
        },
        "journey": [
            {"label": "Brief", "description": "Customer wanted a bold radiant with a hidden surprise of pavé from the side profile.", "image_url": ""},
            {"label": "3D Render", "description": "Approved on the second revision — gallery rail balanced for a low profile.", "image_url": "https://i.etsystatic.com/56104482/r/il/acc787/6625116803/il_794xN.6625116803_8utf.jpg"},
            {"label": "Stone Selection", "description": "Hand-picked a 4.41ct IGI-certified radiant (F/VS1) with exceptional fire.", "image_url": ""},
            {"label": "Setting", "description": "Hidden halo set with 0.18ctw of round pavé under the center stone.", "image_url": ""},
            {"label": "Final Polish", "description": "Three rounds of polishing and rhodium dip before final QC.", "image_url": "https://i.etsystatic.com/56104482/r/il/e5be99/6823344673/il_794xN.6823344673_akr1.jpg"},
        ],
        "customer_story": {
            "name": "Eesa",
            "location": "Winter Park, FL",
            "date": "Jun 20, 2025",
            "quote": "Absolutely blown away. The ring is stunning, sparkles like crazy, beautifully made, and exactly as described. It even comes in a sleek box with a light at the top.",
        },
        "tags": ["engagement_ring", "radiant", "hidden_halo", "4ct", "lab_grown", "white_gold", "igi_certified"],
        "description": "A bold 4.41ct radiant lab-grown diamond set in a hidden halo of round pavé — designed and delivered in under three weeks for an engagement in Winter Park, Florida. The customer wanted a stone that looked unmistakably large from above with a hidden surprise of brilliance from the side.",
        "meta_title": "4.41ct Radiant Hidden Halo Engagement Ring — Custom Built by The Local Jewel",
        "meta_description": "See the full design journey of a 4.41ct IGI-certified radiant lab diamond hidden halo engagement ring custom-built by The Local Jewel.",
        "published": True,
        "featured": True,
        "position": 1,
    },
    {
        "slug": "3-40-carat-oval-side-stone-engagement-ring",
        "title": "3.40 Carat Oval Side Stone Engagement Ring",
        "subtitle": "Lab-grown oval with tapered baguette side stones",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/9c1489/6665834265/il_794xN.6665834265_ee2y.jpg",
        "gallery": [
            {"url": "https://i.etsystatic.com/56104482/r/il/9c1489/6665834265/il_794xN.6665834265_ee2y.jpg", "caption": "Final, top-down", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/55d3fa/6640478330/il_794xN.6640478330_jzty.jpg", "caption": "Final, profile", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/2e9925/7063688688/il_794xN.7063688688_9xro.jpg", "caption": "3D render", "type": "render"},
        ],
        "specs": {
            "carat": "3.40 ct",
            "shape": "Oval",
            "setting_style": "Side Stones",
            "metal": "14K Yellow Gold",
            "color": "E",
            "clarity": "VS2",
            "certification": "IGI",
            "cert_number": "LG612998011",
            "cert_link": "",
        },
        "journey": [
            {"label": "Brief", "description": "Long, elegant oval — classic look with a vintage nod via tapered baguettes."},
            {"label": "3D Render", "description": "Baguette angle adjusted twice to perfectly hug the oval's curvature."},
            {"label": "Stone Selection", "description": "Selected a 3.40ct oval E/VS2 with a length-to-width ratio of 1.55."},
            {"label": "Setting", "description": "Three-prong tips with hidden security points under the baguettes."},
            {"label": "Final Polish", "description": "Yellow gold hand-burnished for a soft satin contrast to the bright stones."},
        ],
        "customer_story": {
            "name": "Pam",
            "location": "Tampa, FL",
            "date": "Nov 26, 2025",
            "quote": "This ring is absolutely beautiful! High quality, brilliant shine and sparkles. The owner communicates exceptionally, letting me know where in the process everything is.",
        },
        "tags": ["engagement_ring", "oval", "side_stones", "3ct", "lab_grown", "yellow_gold", "igi_certified"],
        "description": "A 3.40ct lab-grown oval flanked by tapered baguette side stones in 14K yellow gold — vintage architecture meets modern lab-grown center. The baguette geometry was re-rendered twice to perfectly mirror the oval's 1.55 length-to-width ratio.",
        "meta_title": "3.40ct Oval Side Stone Engagement Ring — Custom Lab Diamond | The Local Jewel",
        "meta_description": "A 3.40ct lab-grown oval engagement ring with tapered baguette side stones in 14K yellow gold. See the full custom design journey.",
        "published": True,
        "featured": True,
        "position": 2,
    },
    {
        "slug": "5-carat-oval-solitaire-engagement-ring",
        "title": "5 Carat Oval Solitaire Engagement Ring",
        "subtitle": "Statement solitaire with a knife-edge band",
        "hero_image_url": "https://i.etsystatic.com/56104482/r/il/2e9925/7063688688/il_794xN.7063688688_9xro.jpg",
        "gallery": [
            {"url": "https://i.etsystatic.com/56104482/r/il/2e9925/7063688688/il_794xN.7063688688_9xro.jpg", "caption": "Final", "type": "final"},
            {"url": "https://i.etsystatic.com/56104482/r/il/9c1489/6665834265/il_794xN.6665834265_ee2y.jpg", "caption": "Hand shot", "type": "final"},
        ],
        "specs": {
            "carat": "5.02 ct",
            "shape": "Oval",
            "setting_style": "Solitaire",
            "metal": "Platinum",
            "color": "D",
            "clarity": "VVS2",
            "certification": "IGI",
            "cert_number": "LG712044820",
            "cert_link": "",
        },
        "journey": [
            {"label": "Brief", "description": "Statement solitaire — maximum stone visibility, minimal metal."},
            {"label": "3D Render", "description": "Knife-edge band rendered at 1.7mm at finger-width for a delicate look."},
            {"label": "Stone Selection", "description": "Found a rare 5.02ct D/VVS2 oval with an ideal 1.40 ratio."},
            {"label": "Setting", "description": "Four-prong platinum claw setting with security beads."},
            {"label": "Final Polish", "description": "High-polish platinum, rhodium-free for true white tone."},
        ],
        "customer_story": {
            "name": "Russell",
            "location": "Orlando, FL",
            "date": "Jan 19, 2026",
            "quote": "Very beautiful craftsmanship. Ring met more than our expectations.",
        },
        "tags": ["engagement_ring", "oval", "solitaire", "5ct", "lab_grown", "platinum", "igi_certified"],
        "description": "A statement 5.02ct D/VVS2 oval lab-grown diamond set as a four-prong platinum solitaire on a delicate 1.7mm knife-edge band. The brief was simple: maximum stone, minimum metal — and a setting that disappears so the diamond is the entire story.",
        "meta_title": "5 Carat Oval Solitaire Engagement Ring — Lab-Grown D/VVS2 | The Local Jewel",
        "meta_description": "A custom 5.02ct D/VVS2 lab-grown oval solitaire engagement ring on a knife-edge platinum band, built by The Local Jewel.",
        "published": True,
        "featured": True,
        "position": 3,
    },
]


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to {DB_NAME}")
    inserted = 0
    skipped = 0
    for s in SAMPLES:
        existing = await db.projects.find_one({"slug": s["slug"]})
        if existing:
            print(f"  skip (exists): {s['slug']}")
            skipped += 1
            continue
        now = datetime.now(timezone.utc)
        doc = dict(s)
        doc["project_id"] = f"proj_{uuid.uuid4().hex[:12]}"
        doc["created_at"] = now
        doc["updated_at"] = now
        await db.projects.insert_one(doc)
        print(f"  inserted: {s['slug']}")
        inserted += 1
    print(f"Done. inserted={inserted}, skipped={skipped}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
