from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User, UserRoleEnum
from app.models.application import Application
from app.core.exceptions import UnauthorizedException, ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Extract and validate current authenticated user from Bearer JWT."""
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload missing subject.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException("Authenticated user record no longer exists.")

    if not user.is_active:
        raise ForbiddenException("User account is disabled.")

    return user


def require_role(allowed_roles: List[str]):
    """Enforces that the authenticated user possesses one of the allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.name for r in current_user.roles]
        # Check intersection
        if not any(role in allowed_roles for role in user_roles):
            raise ForbiddenException(
                f"Access denied. Requires one of the following roles: {', '.join(allowed_roles)}."
            )
        return current_user
    return role_checker


def check_application_access(application: Application, current_user: User) -> None:
    """
    Independent resource-level authorization check.
    Prevents Insecure Direct Object References (IDOR) and cross-institution leakage.
    """
    user_role = current_user.primary_role

    if user_role == UserRoleEnum.SYSTEM_ADMIN.value or user_role == UserRoleEnum.APPROVING_AUTHORITY.value:
        return

    if user_role == UserRoleEnum.INSTITUTION_ADMIN.value:
        user_inst_id = current_user.institution_id
        if not user_inst_id or str(application.institution_id) != str(user_inst_id):
            raise ForbiddenException("Access forbidden. You do not have permission to view or modify another institution's application.")
        return

    if user_role == UserRoleEnum.REVIEWER.value:
        # Check if reviewer is actively assigned or was assigned
        is_assigned = any(str(a.reviewer_id) == str(current_user.id) for a in application.assignments)
        if not is_assigned:
            raise ForbiddenException("Access forbidden. You are not assigned to review this application.")
        return

    raise ForbiddenException("You do not have permission to access this resource.")
