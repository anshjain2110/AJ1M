"""
Cloudflare R2 Object Storage for The Local Jewel.
Uses boto3 (S3-compatible) to store files persistently in Cloudflare R2.
Files are stored in YOUR bucket — you own the data.
"""
import os
import uuid
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

# R2 configuration from environment
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "")
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

APP_PREFIX = "thelocaljewel"

# Module-level S3 client — initialized once
_s3_client = None

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain",
    "svg": "image/svg+xml", "bmp": "image/bmp", "tiff": "image/tiff",
}


def get_s3_client():
    """Get or create the S3 client for R2."""
    global _s3_client
    if _s3_client:
        return _s3_client

    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        raise RuntimeError("Cloudflare R2 credentials not fully configured in environment")

    _s3_client = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        region_name="auto",
    )
    logger.info(f"Cloudflare R2 client initialized (bucket: {R2_BUCKET_NAME})")
    return _s3_client


def init_storage():
    """Initialize R2 connection. Call at startup to verify credentials."""
    client = get_s3_client()
    # Verify bucket access with a simple head_bucket call
    try:
        client.head_bucket(Bucket=R2_BUCKET_NAME)
        logger.info(f"R2 bucket '{R2_BUCKET_NAME}' verified and accessible")
    except Exception as e:
        logger.error(f"R2 bucket verification failed: {e}")
        raise
    return True


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to R2. Returns metadata dict."""
    client = get_s3_client()
    response = client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=path,
        Body=data,
        ContentType=content_type,
    )
    return {
        "path": path,
        "size": len(data),
        "etag": response.get("ETag", ""),
    }


def get_object(path: str) -> tuple:
    """Download file from R2. Returns (content_bytes, content_type)."""
    client = get_s3_client()
    response = client.get_object(
        Bucket=R2_BUCKET_NAME,
        Key=path,
    )
    content_type = response.get("ContentType", "application/octet-stream")
    data = response["Body"].read()
    return data, content_type


def delete_object(path: str) -> bool:
    """Delete file from R2. Returns True on success."""
    client = get_s3_client()
    try:
        client.delete_object(Bucket=R2_BUCKET_NAME, Key=path)
        return True
    except Exception as e:
        logger.error(f"R2 delete failed for {path}: {e}")
        return False


def upload_file(data: bytes, original_filename: str, content_type: str = None, subfolder: str = "uploads") -> dict:
    """
    High-level upload helper.
    Returns dict with: storage_path, original_name, content_type, size, filename
    """
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    if not content_type:
        content_type = MIME_TYPES.get(ext, "application/octet-stream")

    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    storage_path = f"{APP_PREFIX}/{subfolder}/{unique_filename}"

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
