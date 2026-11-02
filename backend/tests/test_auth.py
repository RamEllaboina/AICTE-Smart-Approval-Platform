def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "principal@delhitechnical.edu.in", "password": "Inst@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "INSTITUTION_ADMIN"
    assert data["user"]["institution_id"] is not None


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "principal@delhitechnical.edu.in", "password": "WrongPassword"}
    )
    assert response.status_code == 401


def test_get_current_user_profile(client, institution_admin_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {institution_admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "principal@delhitechnical.edu.in"
    assert data["role"] == "INSTITUTION_ADMIN"


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["database_connected"] is True
