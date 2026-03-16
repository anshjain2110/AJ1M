"""
Cloud Object Storage utility for The Local Jewel.
Uses Emergent Object Storage API (S3-compatible) for persistent file storage.
Files survive server restarts and redeployments.
"""
import os
import uuid
import logging
import requests

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "thelocaljewel"

# Module-level storage key — initialized once, reused globally
_storage_key = None


MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain",
    "svg": "image/svg+xml", "bmp": "image/bmp", "tiff": "image/tiff",
}


def init_storage():
    """Initialize storage session. Call ONCE at startup. Returns reusable storage_key."""
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not set in environment")
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": EMERGENT_KEY},
        timeout=30,
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    logger.info("Cloud storage initialized successfully")
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to cloud storage. Returns {"path": "...", "size": 123, "etag": "..."}"""
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    """Download file from cloud storage. Returns (content_bytes, content_type)."""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def upload_file(data: bytes, original_filename: str, content_type: str = None, subfolder: str = "uploads") -> dict:
    """
    High-level upload helper.
    Returns dict with: storage_path, original_name, content_type, size
    """
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    if not content_type:
        content_type = MIME_TYPES.get(ext, "application/octet-stream")

    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    storage_path = f"{APP_NAME}/{subfolder}/{unique_filename}"

    result = put_object(storage_path, data, content_type)

    return {
        "storage_path": result["path"],
        "original_name": original_filename,
        "filename": unique_filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
    }


def download_file(storage_path: str) -> tuple:
    """
    High-level download helper.
    Returns (content_bytes, content_type).
    """
    return get_object(storage_path)
