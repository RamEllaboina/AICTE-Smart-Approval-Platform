from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.user import User, Role, UserRoleEnum
from app.models.institution import Institution, InstitutionMember
from app.models.compliance import ComplianceRule
from app.models.application import Application, ApplicationStatusEnum, ApplicationCategoryEnum, ApplicationRevision
from app.models.review import (
    ReviewerAssignment,
    ReviewComment,
    Deficiency,
    AssignmentStatusEnum,
    DeficiencyStatusEnum,
    RecommendationEnum
)
from app.models.notification import Notification, Deadline, NotificationPriorityEnum, NotificationChannelEnum
from app.models.audit import AuditEvent
from app.core.security import hash_password
from app.services.compliance.default_rules import DEFAULT_RULES


def seed_initial_data(db: Session):
    """Seed baseline roles, synthetic user accounts, institutions, and compliance rules."""
    # 1. Seed Roles
    roles_map = {}
    for r_enum in UserRoleEnum:
        role = db.query(Role).filter(Role.name == r_enum.value).first()
        if not role:
            role = Role(name=r_enum.value, description=f"System role for {r_enum.value}")
            db.add(role)
            db.flush()
        roles_map[r_enum.value] = role

    # 2. Seed Compliance Rules
    for r_data in DEFAULT_RULES:
        rule = db.query(ComplianceRule).filter(ComplianceRule.rule_code == r_data["rule_code"]).first()
        if not rule:
            rule = ComplianceRule(
                rule_code=r_data["rule_code"],
                name=r_data["name"],
                category=r_data["category"],
                description=r_data["description"],
                rule_type=r_data["rule_type"],
                condition_json=r_data["condition_json"],
                severity=r_data["severity"],
                handbook_reference=r_data["handbook_reference"],
                is_active=True,
                version=1
            )
            db.add(rule)
    db.flush()

    # 3. Seed Users
    demo_users = [
        {
            "email": "admin@aicte.gov.in",
            "password": hash_password("Admin@123"),
            "full_name": "Chief Administrative Officer",
            "role": UserRoleEnum.SYSTEM_ADMIN.value
        },
        {
            "email": "approver@aicte.gov.in",
            "password": hash_password("Approver@123"),
            "full_name": "Dr. Rajeshwar Rao (Approving Authority)",
            "role": UserRoleEnum.APPROVING_AUTHORITY.value
        },
        {
            "email": "reviewer1@aicte.gov.in",
            "password": hash_password("Reviewer@123"),
            "full_name": "Prof. Arvind Sharma (Scrutiny Committee)",
            "role": UserRoleEnum.REVIEWER.value
        },
        {
            "email": "reviewer2@aicte.gov.in",
            "password": hash_password("Reviewer@123"),
            "full_name": "Dr. Meenakshi Sundaram (Infrastructure Expert)",
            "role": UserRoleEnum.REVIEWER.value
        },
        {
            "email": "principal@delhitechnical.edu.in",
            "password": hash_password("Inst@123"),
            "full_name": "Dr. Sunita Kapoor (Principal)",
            "role": UserRoleEnum.INSTITUTION_ADMIN.value
        },
        {
            "email": "director@mumbaitech.edu.in",
            "password": hash_password("Inst@123"),
            "full_name": "Dr. Vikram Deshmukh (Director)",
            "role": UserRoleEnum.INSTITUTION_ADMIN.value
        }
    ]

    user_objs = {}
    for u_info in demo_users:
        user = db.query(User).filter(User.email == u_info["email"]).first()
        if not user:
            user = User(
                email=u_info["email"],
                hashed_password=u_info["password"],
                full_name=u_info["full_name"],
                is_active=True,
                is_verified=True
            )
            user.roles.append(roles_map[u_info["role"]])
            db.add(user)
            db.flush()
        user_objs[u_info["email"]] = user

    # 4. Seed Institutions
    inst1 = db.query(Institution).filter(Institution.aicte_id == "1-1029384751").first()
    if not inst1:
        inst1 = Institution(
            name="Delhi Institute of Engineering and Advanced Technology",
            aicte_id="1-1029384751",
            address="Sector 14, Institutional Area, Rohini",
            state="Delhi",
            district="North West Delhi",
            pin_code="110085",
            contact_email="principal@delhitechnical.edu.in",
            contact_phone="+91-11-27568901",
            category="ENGINEERING_AND_TECHNOLOGY",
            status="ACTIVE"
        )
        db.add(inst1)
        db.flush()

        member1 = InstitutionMember(
            institution_id=inst1.id,
            user_id=user_objs["principal@delhitechnical.edu.in"].id,
            designation="Principal & Professor",
            is_primary_admin=True
        )
        db.add(member1)

    inst2 = db.query(Institution).filter(Institution.aicte_id == "1-9876543210").first()
    if not inst2:
        inst2 = Institution(
            name="Mumbai Technical Institute of Advanced Computing",
            aicte_id="1-9876543210",
            address="Vidyanagari Campus, Kalina, Santacruz East",
            state="Maharashtra",
            district="Mumbai Suburban",
            pin_code="400098",
            contact_email="director@mumbaitech.edu.in",
            contact_phone="+91-22-26543000",
            category="ENGINEERING_AND_TECHNOLOGY",
            status="ACTIVE"
        )
        db.add(inst2)
        db.flush()

        member2 = InstitutionMember(
            institution_id=inst2.id,
            user_id=user_objs["director@mumbaitech.edu.in"].id,
            designation="Director",
            is_primary_admin=True
        )
        db.add(member2)

    # 5. Seed Demonstration Applications if none exist
    app_count = db.query(Application).count()
    if app_count == 0 and inst1:
        now = datetime.now(timezone.utc)
        reviewer1 = user_objs["reviewer1@aicte.gov.in"]
        inst_user = user_objs["principal@delhitechnical.edu.in"]

        # Application 1: Under Review
        app1 = Application(
            application_number="AICTE-2026-ENG01",
            institution_id=inst1.id,
            category=ApplicationCategoryEnum.NEW_PROGRAM.value,
            academic_year="2026-2027",
            status=ApplicationStatusEnum.UNDER_REVIEW.value,
            title="Introduction of B.Tech in Artificial Intelligence & Data Science (60 Seats)",
            details_json={
                "program_name": "Artificial Intelligence & Data Science",
                "proposed_intake": 60,
                "total_approved_intake": 300,
                "built_up_area_sqm": 1500.0,
                "land_area_acres": 3.2,
                "total_faculty_count": 18,
                "corpus_fund_lakhs": 65.0,
                "has_barrier_free_environment": True
            },
            current_revision=2,
            submission_date=now - timedelta(days=5),
            deadline_date=now + timedelta(days=2),
            compliance_score=87.5,
            created_by_id=inst_user.id
        )
        db.add(app1)
        db.flush()

        # Assignment for App 1
        assign1 = ReviewerAssignment(
            application_id=app1.id,
            reviewer_id=reviewer1.id,
            assigned_by_id=user_objs["admin@aicte.gov.in"].id,
            status=AssignmentStatusEnum.ACTIVE.value,
            priority="HIGH"
        )
        db.add(assign1)

        # Observation comment
        comment1 = ReviewComment(
            application_id=app1.id,
            reviewer_id=reviewer1.id,
            stage="UNDER_REVIEW",
            comment_type="INTERNAL_OBSERVATION",
            content="Laboratories and computing infrastructure verified. Land title documents comply with APH Appendix 16.",
            recommendation=RecommendationEnum.RECOMMENDED.value
        )
        db.add(comment1)

        # Application 2: Returned for correction with open deficiency
        app2 = Application(
            application_number="AICTE-2026-INT02",
            institution_id=inst1.id,
            category=ApplicationCategoryEnum.INTAKE_MODIFICATION.value,
            academic_year="2026-2027",
            status=ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value,
            title="Intake Extension in Computer Engineering (60 to 120 Seats)",
            details_json={
                "program_name": "Computer Engineering",
                "proposed_intake": 120,
                "total_approved_intake": 360,
                "built_up_area_sqm": 1600.0,
                "land_area_acres": 3.0,
                "total_faculty_count": 16,
                "corpus_fund_lakhs": 55.0,
                "has_barrier_free_environment": True
            },
            current_revision=2,
            submission_date=now - timedelta(days=8),
            deadline_date=now + timedelta(days=4),
            compliance_score=75.0,
            created_by_id=inst_user.id
        )
        db.add(app2)
        db.flush()

        def2 = Deficiency(
            application_id=app2.id,
            reviewer_id=reviewer1.id,
            title="Fire & Life Safety NOC Renewal Certificate Missing",
            description="The submitted Fire Safety NOC expired on 31-12-2025. Current valid renewal issued by State Fire Authority is mandatory.",
            requested_correction="Upload current valid Fire & Life Safety NOC with verification stamp.",
            severity="HIGH",
            due_date=now + timedelta(days=5),
            status=DeficiencyStatusEnum.OPEN.value
        )
        db.add(def2)

        # Application 3: Draft
        app3 = Application(
            application_number="AICTE-2026-NEW03",
            institution_id=inst1.id,
            category=ApplicationCategoryEnum.NEW_PROGRAM.value,
            academic_year="2026-2027",
            status=ApplicationStatusEnum.DRAFT.value,
            title="M.Tech in Cybersecurity and Cyber Forensics (18 Seats)",
            details_json={
                "program_name": "Cybersecurity and Cyber Forensics",
                "proposed_intake": 18,
                "total_approved_intake": 318,
                "built_up_area_sqm": 1200.0,
                "land_area_acres": 2.8,
                "total_faculty_count": 15,
                "corpus_fund_lakhs": 40.0,
                "has_barrier_free_environment": True
            },
            current_revision=1,
            compliance_score=62.5,
            created_by_id=inst_user.id
        )
        db.add(app3)

        # Application 4: Pending Final Decision (Mumbai Tech)
        if inst2:
            app4 = Application(
                application_number="AICTE-2026-APP04",
                institution_id=inst2.id,
                category=ApplicationCategoryEnum.NEW_PROGRAM.value,
                academic_year="2026-2027",
                status=ApplicationStatusEnum.PENDING_FINAL_DECISION.value,
                title="Advanced Robotics Innovation & Mechatronics Center",
                details_json={
                    "program_name": "Robotics & Automation",
                    "proposed_intake": 60,
                    "total_approved_intake": 240,
                    "built_up_area_sqm": 2200.0,
                    "land_area_acres": 4.5,
                    "total_faculty_count": 22,
                    "corpus_fund_lakhs": 75.0,
                    "has_barrier_free_environment": True
                },
                current_revision=3,
                submission_date=now - timedelta(days=12),
                deadline_date=now + timedelta(days=3),
                compliance_score=100.0,
                created_by_id=user_objs["director@mumbaitech.edu.in"].id
            )
            db.add(app4)
            db.flush()

            # Review comment recommending approval
            rec_comment = ReviewComment(
                application_id=app4.id,
                reviewer_id=user_objs["reviewer2@aicte.gov.in"].id,
                stage="REVIEW_COMPLETED",
                comment_type="FORMAL_RECOMMENDATION",
                content="All physical and digital assets inspected. Complies 100% with AICTE APH 2026-27 statutory norms.",
                recommendation=RecommendationEnum.RECOMMENDED.value
            )
            db.add(rec_comment)

        # Baseline welcome notification
        db.add(Notification(
            recipient_id=inst_user.id,
            title="Welcome to AICTE Smart Approval Portal",
            message="Your institution profile has been initialized with sample synthetic data for demonstration.",
            notification_type="SYSTEM_WELCOME",
            channel=NotificationChannelEnum.IN_APP.value,
            priority=NotificationPriorityEnum.NORMAL.value,
            link_url="/dashboard"
        ))

        # Initial Audit Event
        db.add(AuditEvent(
            actor_email="system@aicte.gov.in",
            actor_role="SYSTEM_ADMIN",
            action="SYSTEM_INITIALIZED",
            entity_type="System",
            entity_id="AICTE_PLATFORM",
            notes="Baseline synthetic data and configurable compliance rules loaded."
        ))

    db.commit()
