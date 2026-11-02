from app.models.application import Application
from app.models.institution import Institution


def test_cross_institution_isolation(client, institution_admin_token, db_session):
    """
    Institution A (Delhi Tech) user attempts to access Institution B (Mumbai Tech) application.
    Must be rejected with 403 Forbidden.
    """
    mumbai_inst = db_session.query(Institution).filter(Institution.aicte_id == "1-9876543210").first()
    mumbai_app = db_session.query(Application).filter(Application.institution_id == mumbai_inst.id).first()

    assert mumbai_app is not None

    # Delhi Tech user tries to fetch Mumbai Tech application
    response = client.get(
        f"/api/v1/applications/{mumbai_app.id}",
        headers={"Authorization": f"Bearer {institution_admin_token}"}
    )

    assert response.status_code == 403
    data = response.json()
    assert "FORBIDDEN" in str(data).upper() or "permission" in str(data).lower()


def test_institution_user_cannot_access_audit_logs(client, institution_admin_token):
    """Institution administrator cannot access system audit logs."""
    response = client.get(
        "/api/v1/admin/audit-events",
        headers={"Authorization": f"Bearer {institution_admin_token}"}
    )
    assert response.status_code == 403


def test_system_admin_can_access_audit_logs(client, system_admin_token):
    """System administrator is permitted to inspect audit logs."""
    response = client.get(
        "/api/v1/admin/audit-events",
        headers={"Authorization": f"Bearer {system_admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
