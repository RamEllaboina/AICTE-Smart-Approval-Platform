import os
import uuid
import hashlib
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


class DocumentStorageService:
    def __init__(self, base_dir: str = settings.STORAGE_LOCAL_DIR):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def validate_file(self, file: UploadFile) -> str:
        """Validate filename extension against allowed list."""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File name is missing."
            )

        # Sanitize filename extension
        _, ext = os.path.splitext(file.filename)
        clean_ext = ext.lstrip(".").lower()

        if clean_ext not in settings.allowed_extensions_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{clean_ext}' is not permitted. Allowed extensions: {settings.ALLOWED_EXTENSIONS}"
            )

        return clean_ext

    async def save_file(self, file: UploadFile, subfolder: str = "applications") -> Tuple[str, str, int]:
        """
        Saves uploaded file securely using server-generated key and computes SHA-256 hash.
        Returns (storage_key, sha256_checksum, file_size_bytes).
        """
        clean_ext = self.validate_file(file)

        # Generate unique non-predictable storage key
        random_key = f"{uuid.uuid4().hex}.{clean_ext}"
        relative_key = os.path.join(subfolder, random_key)
        
        # Prevent path traversal
        normalized_target = os.path.abspath(os.path.join(self.base_dir, relative_key))
        if not normalized_target.startswith(self.base_dir):
            raise HTTPException(status_code=400, detail="Invalid storage path traversal attempted.")

        os.makedirs(os.path.dirname(normalized_target), exist_ok=True)

        sha256 = hashlib.sha256()
        total_size = 0

        # Read and write in chunks to handle memory safely
        with open(normalized_target, "wb") as destination:
            while chunk := await file.read(64 * 1024):  # 64 KB chunks
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    destination.close()
                    if os.path.exists(normalized_target):
                        os.remove(normalized_target)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Uploaded file exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.1f} MB."
                    )
                sha256.update(chunk)
                destination.write(chunk)

        checksum = sha256.hexdigest()
        return relative_key, checksum, total_size

    def get_absolute_path(self, storage_key: str) -> str:
        """Resolve a storage key to safe absolute path, preventing path traversal."""
        # Sanitize storage_key
        clean_key = os.path.normpath(storage_key).lstrip(os.path.sep)
        abs_path = os.path.abspath(os.path.join(self.base_dir, clean_key))
        if not abs_path.startswith(self.base_dir) or not os.path.exists(abs_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requested file was not found.")
        return abs_path


storage_service = DocumentStorageService()
