from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.compliance import (
    ComplianceRule,
    ComplianceEvaluation,
    ComplianceFinding,
    FindingStatusEnum,
    RuleSeverityEnum
)
from app.models.user import User


class ComplianceEngine:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_application(
        self,
        application: Application,
        evaluator: Optional[User] = None
    ) -> ComplianceEvaluation:
        """
        Deterministically evaluates an application against all active compliance rules.
        Does NOT execute dynamic code or unverified scripts.
        """
        rules = (
            self.db.query(ComplianceRule)
            .filter(
                ComplianceRule.is_active.is_(True),
                (ComplianceRule.category == "ALL") | (ComplianceRule.category == application.category)
            )
            .all()
        )

        details = application.details_json or {}
        # Map document categories available on this application
        attached_docs = {doc.category for doc in application.documents}

        findings_data: List[Dict[str, Any]] = []
        total_rules = 0
        passed_rules = 0
        failed_rules = 0

        for rule in rules:
            cond = rule.condition_json or {}
            c_type = cond.get("type")
            status = FindingStatusEnum.PASSED.value
            message = f"Complies with {rule.name}."
            affected_field = None
            remediation = None
            calc_val = None
            exp_val = None

            total_rules += 1

            if c_type == "min_value":
                field = cond.get("field")
                min_val = float(cond.get("min_val", 0))
                unit = cond.get("unit", "")
                exp_val = f">= {min_val} {unit}"
                affected_field = field

                actual_val = details.get(field)
                if actual_val is None:
                    status = FindingStatusEnum.FAILED.value
                    calc_val = "Not Provided"
                    message = f"Missing mandatory field '{field}'. Minimum required is {min_val} {unit}."
                    remediation = f"Enter valid {field.replace('_', ' ')} value in application details."
                    failed_rules += 1
                else:
                    try:
                        num_val = float(actual_val)
                        calc_val = f"{num_val} {unit}"
                        if num_val < min_val:
                            status = FindingStatusEnum.FAILED.value
                            message = f"Provided {field.replace('_', ' ')} ({num_val} {unit}) is below statutory minimum threshold ({min_val} {unit})."
                            remediation = f"Ensure institutional facilities satisfy the minimum {min_val} {unit} norm."
                            failed_rules += 1
                        else:
                            passed_rules += 1
                    except (ValueError, TypeError):
                        status = FindingStatusEnum.FAILED.value
                        calc_val = str(actual_val)
                        message = f"Invalid numeric format for field '{field}'."
                        remediation = "Provide a valid numeric value."
                        failed_rules += 1

            elif c_type == "min_ratio":
                num_field = cond.get("numerator_field")
                den_field = cond.get("denominator_field")
                min_ratio = float(cond.get("min_ratio_value", 0))
                unit = cond.get("unit", "")
                exp_val = f">= {min_ratio} {unit}"
                affected_field = f"{num_field} / {den_field}"

                num_val = details.get(num_field)
                den_val = details.get(den_field)

                if num_val is None or den_val is None:
                    status = FindingStatusEnum.FAILED.value
                    calc_val = "Incomplete parameters"
                    message = f"Both '{num_field}' and '{den_field}' must be specified to calculate ratio."
                    remediation = f"Provide values for both {num_field} and {den_field}."
                    failed_rules += 1
                else:
                    try:
                        n = float(num_val)
                        d = float(den_val)
                        if d <= 0:
                            ratio = 0.0
                        else:
                            ratio = round(n / d, 3)

                        calc_val = f"{ratio} {unit} (Numerator: {n}, Denominator: {d})"
                        if ratio < min_ratio:
                            status = FindingStatusEnum.FAILED.value
                            message = f"Calculated ratio ({ratio}) is below required minimum threshold ({min_ratio} {unit})."
                            remediation = f"Increase {num_field.replace('_', ' ')} or calibrate {den_field.replace('_', ' ')} to meet norm."
                            failed_rules += 1
                        else:
                            passed_rules += 1
                    except (ValueError, TypeError):
                        status = FindingStatusEnum.FAILED.value
                        calc_val = "Non-numeric values"
                        message = "Failed to calculate ratio due to non-numeric inputs."
                        remediation = "Ensure both numerator and denominator contain valid numbers."
                        failed_rules += 1

            elif c_type == "required_document_category":
                doc_cat = cond.get("document_category")
                exp_val = f"Document type '{doc_cat}' attached"
                affected_field = doc_cat

                if doc_cat in attached_docs:
                    status = FindingStatusEnum.PASSED.value
                    calc_val = "Uploaded & Attached"
                    message = f"Required document category '{doc_cat}' is present."
                    passed_rules += 1
                else:
                    status = FindingStatusEnum.FAILED.value
                    calc_val = "Missing"
                    message = f"Mandatory document '{doc_cat}' has not been uploaded."
                    remediation = f"Upload valid signed copy of {doc_cat.replace('_', ' ')} in Document section."
                    failed_rules += 1

            elif c_type == "boolean_true":
                field = cond.get("field")
                exp_val = "True"
                affected_field = field

                is_true = details.get(field) is True
                calc_val = str(details.get(field, False))
                if is_true:
                    status = FindingStatusEnum.PASSED.value
                    message = f"Statutory requirement '{rule.name}' is fulfilled."
                    passed_rules += 1
                else:
                    status = FindingStatusEnum.WARNING.value if rule.severity == RuleSeverityEnum.MEDIUM.value else FindingStatusEnum.FAILED.value
                    message = f"Institution must verify and confirm compliance for '{rule.name}'."
                    remediation = f"Verify infrastructure and confirm '{field}' compliance."
                    if status == FindingStatusEnum.FAILED.value:
                        failed_rules += 1
                    else:
                        passed_rules += 1  # Warnings do not strictly penalize total pass

            else:
                # Unsupported or unconfigured rule type
                status = FindingStatusEnum.NOT_APPLICABLE.value
                calc_val = "N/A"
                exp_val = "N/A"
                message = "Rule type not recognized or currently not applicable."

            findings_data.append({
                "rule_id": rule.id,
                "rule_code": rule.rule_code,
                "status": status,
                "message": message,
                "affected_field": affected_field,
                "remediation_action": remediation,
                "calculated_value": calc_val,
                "expected_value": exp_val,
                "severity": rule.severity
            })

        # Calculate readiness score (percentage of passing rules)
        readiness_score = round((passed_rules / total_rules * 100.0), 1) if total_rules > 0 else 100.0

        # Overall evaluation status
        if failed_rules > 0:
            overall_status = "FAILED"
        elif any(f["status"] == FindingStatusEnum.WARNING.value for f in findings_data):
            overall_status = "WARNING"
        else:
            overall_status = "PASSED"

        evaluation = ComplianceEvaluation(
            application_id=application.id,
            evaluated_by_id=evaluator.id if evaluator else None,
            overall_status=overall_status,
            readiness_score=readiness_score,
            total_rules=total_rules,
            passed_rules=passed_rules,
            failed_rules=failed_rules,
            evaluation_date=datetime.now(timezone.utc)
        )
        self.db.add(evaluation)
        self.db.flush()

        for f_data in findings_data:
            finding = ComplianceFinding(
                evaluation_id=evaluation.id,
                rule_id=f_data["rule_id"],
                rule_code=f_data["rule_code"],
                status=f_data["status"],
                message=f_data["message"],
                affected_field=f_data["affected_field"],
                remediation_action=f_data["remediation_action"],
                calculated_value=f_data["calculated_value"],
                expected_value=f_data["expected_value"]
            )
            self.db.add(finding)

        # Update application compliance score
        application.compliance_score = readiness_score
        self.db.flush()

        return evaluation
