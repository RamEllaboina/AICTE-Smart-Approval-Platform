from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "error_code": error_code,
                "message": message,
                "details": details or {}
            }
        )


class EntityNotFoundException(AppException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="ENTITY_NOT_FOUND",
            message=f"{entity_name} with identifier '{entity_id}' was not found.",
            details={"entity_name": entity_name, "entity_id": entity_id}
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid authentication credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=message
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN_ACCESS",
            message=message
        )


class WorkflowTransitionException(AppException):
    def __init__(self, current_state: str, attempted_state: str, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_WORKFLOW_TRANSITION",
            message=f"Cannot transition application from state '{current_state}' to '{attempted_state}': {reason}",
            details={"current_state": current_state, "attempted_state": attempted_state, "reason": reason}
        )


class ComplianceValidationException(AppException):
    def __init__(self, message: str, findings: Optional[list] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="COMPLIANCE_VALIDATION_FAILED",
            message=message,
            details={"findings": findings or []}
        )
