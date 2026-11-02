from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application, ApplicationStatusEnum
from app.models.document import ApplicationDocument, DocumentVersion, DocumentCategoryEnum
from app.models.user import User, UserRoleEnum
from app.schemas.application import DocumentSimpleOut
from app.api.deps import get_current_user, check_application_access
from app.services.documents.storage import storage_service
from app.services.audit import record_audit_event
from app.services.compliance.engine import ComplianceEngine

router = APIRouter()


@router.post("/{application_id}/upload", response_model=DocumentSimpleOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    application_id: str,
    category: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely upload supporting institutional document with SHA-256 integrity validation."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    # Validate state allows document addition
    if application.status not in [ApplicationStatusEnum.DRAFT.value, ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value]:
        # Reviewers/admins can still attach verification docs if authorized
        if current_user.primary_role not in [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.REVIEWER.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload documents when application is in '{application.status}' state."
            )

    # Save to disk
    storage_key, checksum, file_size = await storage_service.save_file(file, subfolder=f"app_{application_id}")

    doc = ApplicationDocument(
        application_id=application.id,
        category=category,
        title=title,
        file_name=file.filename or "document.pdf",
        file_key=storage_key,
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        sha256_checksum=checksum,
        is_verified=False,
        uploader_id=current_user.id
    )
    db.add(doc)
    db.flush()

    # Create initial version
    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        file_key=storage_key,
        sha256_checksum=checksum,
        file_size_bytes=file_size,
        uploaded_by_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(version)

    record_audit_event(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity_type="Document",
        entity_id=doc.id,
        actor=current_user,
        notes=f"Uploaded {doc.title} ({doc.category}, {file_size} bytes, SHA-256: {checksum[:8]}...)."
    )

    # Re-evaluate compliance now that new document is attached
    engine = ComplianceEngine(db)
    engine.evaluate_application(application, current_user)

    db.commit()
    db.refresh(doc)

    return DocumentSimpleOut(
        id=doc.id,
        category=doc.category,
        title=doc.title,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        sha256_checksum=doc.sha256_checksum,
        is_verified=doc.is_verified,
        created_at=doc.created_at
    )


@router.get("/{application_id}", response_model=List[DocumentSimpleOut])
def list_documents(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents attached to an application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    return [
        DocumentSimpleOut(
            id=d.id,
            category=d.category,
            title=d.title,
            file_name=d.file_name,
            file_size_bytes=d.file_size_bytes,
            mime_type=d.mime_type,
            sha256_checksum=d.sha256_checksum,
            is_verified=d.is_verified,
            created_at=d.created_at
        )
        for d in application.documents
    ]


@router.get("/download/{document_id}")
def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Private authorized document download endpoint.
    Verifies user has permission to view the parent application before serving file.
    """
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document record not found.")

    check_application_access(doc.application, current_user)

    abs_path = storage_service.get_absolute_path(doc.file_key)

    record_audit_event(
        db=db,
        action="DOCUMENT_ACCESSED_DOWNLOAD",
        entity_type="Document",
        entity_id=doc.id,
        actor=current_user,
        notes=f"User downloaded file '{doc.file_name}'."
    )
    db.commit()

    return FileResponse(
        path=abs_path,
        media_type=doc.mime_type,
        filename=doc.file_name
    )
