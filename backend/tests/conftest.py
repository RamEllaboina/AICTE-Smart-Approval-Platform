import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.scripts.seed_demo_data import seed_initial_data
from app.core.security import create_access_token
from app.models.user import User, UserRoleEnum

TEST_DB_URL = "sqlite:///./test_aicte.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_initial_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def institution_admin_token(db_session):
    user = db_session.query(User).filter(User.email == "principal@delhitechnical.edu.in").first()
    return create_access_token(subject=user.id, role=UserRoleEnum.INSTITUTION_ADMIN.value, institution_id=user.institution_id)


@pytest.fixture
def reviewer_token(db_session):
    user = db_session.query(User).filter(User.email == "reviewer1@aicte.gov.in").first()
    return create_access_token(subject=user.id, role=UserRoleEnum.REVIEWER.value)


@pytest.fixture
def approver_token(db_session):
    user = db_session.query(User).filter(User.email == "approver@aicte.gov.in").first()
    return create_access_token(subject=user.id, role=UserRoleEnum.APPROVING_AUTHORITY.value)


@pytest.fixture
def system_admin_token(db_session):
    user = db_session.query(User).filter(User.email == "admin@aicte.gov.in").first()
    return create_access_token(subject=user.id, role=UserRoleEnum.SYSTEM_ADMIN.value)
