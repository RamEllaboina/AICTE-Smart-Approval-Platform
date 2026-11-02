from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserSessionInfo
)
from app.api.deps import get_current_user
from app.core.config import settings
from app.services.audit import record_audit_event

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password via Argon2id."""
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated."
        )

    primary_role = user.primary_role
    roles = [r.name for r in user.roles]
    inst_id = user.institution_id
    inst_name = user.institution_memberships[0].institution.name if user.institution_memberships and user.institution_memberships[0].institution else None

    access_token = create_access_token(
        subject=user.id,
        role=primary_role,
        institution_id=inst_id
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=primary_role,
        institution_id=inst_id
    )

    # Log successful authentication in audit trail
    record_audit_event(
        db=db,
        action="USER_LOGIN_SUCCESS",
        entity_type="User",
        entity_id=user.id,
        actor=user,
        notes=f"User {user.email} authenticated successfully with role {primary_role}."
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserSessionInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=primary_role,
            roles=roles,
            institution_id=inst_id,
            institution_name=inst_name
        )
    )


@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh an expired access token using a valid refresh token."""
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found or inactive."
        )

    new_access_token = create_access_token(
        subject=user.id,
        role=user.primary_role,
        institution_id=user.institution_id
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES
    }


@router.get("/me", response_model=UserSessionInfo)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve details of currently authenticated user session."""
    roles = [r.name for r in current_user.roles]
    inst_id = current_user.institution_id
    inst_name = current_user.institution_memberships[0].institution.name if current_user.institution_memberships and current_user.institution_memberships[0].institution else None

    return UserSessionInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.primary_role,
        roles=roles,
        institution_id=inst_id,
        institution_name=inst_name
    )
