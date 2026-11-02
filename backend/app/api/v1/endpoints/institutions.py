from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.institution import Institution
from app.models.user import User, UserRoleEnum
from app.schemas.institution import InstitutionOut, InstitutionUpdate
from app.api.deps import get_current_user, require_role
from app.services.audit import record_audit_event

router = APIRouter()


@router.get("/me", response_model=InstitutionOut)
def get_my_institution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve profile of current user's affiliated institution."""
    if not current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user is not linked to any institution profile."
        )

    institution = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution record not found.")

    return institution


@router.patch("/me", response_model=InstitutionOut)
def update_my_institution(
    update_data: InstitutionUpdate,
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Update profile fields for the user's institution."""
    institution = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found.")

    for field, val in update_data.model_dump(exclude_unset=True).items():
        setattr(institution, field, val)

    record_audit_event(
        db=db,
        action="INSTITUTION_PROFILE_UPDATED",
        entity_type="Institution",
        entity_id=institution.id,
        actor=current_user,
        notes="Institution details modified."
    )
    db.commit()
    db.refresh(institution)
    return institution


@router.get("/", response_model=List[InstitutionOut])
def list_institutions(
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.APPROVING_AUTHORITY.value])),
    db: Session = Depends(get_db)
):
    """List all registered institutions (Admin / Approving Authority only)."""
    return db.query(Institution).all()
