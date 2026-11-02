from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict


class ComplianceRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rule_code: str
    name: str
    category: str
    description: str
    rule_type: str
    severity: str
    handbook_reference: Optional[str] = None
    is_active: bool
    version: int
    condition_json: Dict[str, Any]


class ComplianceFindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rule_code: str
    status: str
    message: str
    affected_field: Optional[str] = None
    remediation_action: Optional[str] = None
    calculated_value: Optional[str] = None
    expected_value: Optional[str] = None


class ComplianceEvaluationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    overall_status: str
    readiness_score: float
    total_rules: int
    passed_rules: int
    failed_rules: int
    evaluation_date: datetime
    findings: List[ComplianceFindingOut] = []
