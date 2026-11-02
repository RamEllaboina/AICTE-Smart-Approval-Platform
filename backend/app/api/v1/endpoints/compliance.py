from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.compliance import ComplianceRule, ComplianceEvaluation
from app.models.user import User
from app.schemas.compliance import (
    ComplianceEvaluationOut,
    ComplianceFindingOut,
    ComplianceRuleOut
)
from app.api.deps import get_current_user, check_application_access
from app.services.compliance.engine import ComplianceEngine

router = APIRouter()


@router.post("/{application_id}/evaluate", response_model=ComplianceEvaluationOut)
def run_compliance_evaluation(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes explainable deterministic compliance evaluation against active statutory rules.
    Updates application readiness score.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    engine = ComplianceEngine(db)
    evaluation = engine.evaluate_application(application, current_user)
    db.commit()
    db.refresh(evaluation)

    return ComplianceEvaluationOut(
        id=evaluation.id,
        application_id=evaluation.application_id,
        overall_status=evaluation.overall_status,
        readiness_score=evaluation.readiness_score,
        total_rules=evaluation.total_rules,
        passed_rules=evaluation.passed_rules,
        failed_rules=evaluation.failed_rules,
        evaluation_date=evaluation.evaluation_date,
        findings=[
            ComplianceFindingOut(
                id=f.id,
                rule_code=f.rule_code,
                status=f.status,
                message=f.message,
                affected_field=f.affected_field,
                remediation_action=f.remediation_action,
                calculated_value=f.calculated_value,
                expected_value=f.expected_value
            )
            for f in evaluation.findings
        ]
    )


@router.get("/{application_id}", response_model=ComplianceEvaluationOut)
def get_latest_compliance_evaluation(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the most recent compliance evaluation findings for an application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    evaluation = (
        db.query(ComplianceEvaluation)
        .filter(ComplianceEvaluation.application_id == application_id)
        .order_by(ComplianceEvaluation.evaluation_date.desc())
        .first()
    )

    if not evaluation:
        # Run initial evaluation if none exists
        engine = ComplianceEngine(db)
        evaluation = engine.evaluate_application(application, current_user)
        db.commit()
        db.refresh(evaluation)

    return ComplianceEvaluationOut(
        id=evaluation.id,
        application_id=evaluation.application_id,
        overall_status=evaluation.overall_status,
        readiness_score=evaluation.readiness_score,
        total_rules=evaluation.total_rules,
        passed_rules=evaluation.passed_rules,
        failed_rules=evaluation.failed_rules,
        evaluation_date=evaluation.evaluation_date,
        findings=[
            ComplianceFindingOut(
                id=f.id,
                rule_code=f.rule_code,
                status=f.status,
                message=f.message,
                affected_field=f.affected_field,
                remediation_action=f.remediation_action,
                calculated_value=f.calculated_value,
                expected_value=f.expected_value
            )
            for f in evaluation.findings
        ]
    )


@router.get("/rules/active", response_model=List[ComplianceRuleOut])
def list_active_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all currently active statutory compliance rules and handbook citations."""
    rules = db.query(ComplianceRule).filter(ComplianceRule.is_active.is_(True)).all()
    return rules
