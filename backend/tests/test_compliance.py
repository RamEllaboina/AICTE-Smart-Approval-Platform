from app.services.compliance.engine import ComplianceEngine
from app.models.application import Application


def test_compliance_engine_evaluation(db_session):
    # Find application 1
    app1 = db_session.query(Application).filter(Application.application_number == "AICTE-2026-ENG01").first()
    assert app1 is not None

    engine = ComplianceEngine(db_session)
    evaluation = engine.evaluate_application(app1)

    assert evaluation.total_rules > 0
    assert evaluation.readiness_score > 0
    assert len(evaluation.findings) == evaluation.total_rules

    # Verify each finding has an explainable result
    for f in evaluation.findings:
        assert f.status in ["PASSED", "FAILED", "WARNING", "NOT_APPLICABLE"]
        assert f.rule_code.startswith("RULE-")
        assert len(f.message) > 0


def test_compliance_missing_built_up_area_fails(db_session):
    # Create test application with 0 built-up area
    test_app = Application(
        application_number="TEST-COMP-01",
        institution_id=db_session.query(Application).first().institution_id,
        category="NEW_PROGRAM",
        academic_year="2026-2027",
        status="DRAFT",
        title="Test Incomplete App",
        details_json={
            "built_up_area_sqm": 50.0,  # Below threshold
            "total_approved_intake": 300,
            "land_area_acres": 0.5  # Below threshold
        }
    )
    db_session.add(test_app)
    db_session.flush()

    engine = ComplianceEngine(db_session)
    evaluation = engine.evaluate_application(test_app)

    assert evaluation.failed_rules > 0
    assert evaluation.readiness_score < 100.0
    failed_codes = [f.rule_code for f in evaluation.findings if f.status == "FAILED"]
    assert "RULE-INFRA-AREA" in failed_codes or "RULE-LAND-MINIMUM" in failed_codes
