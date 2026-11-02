# AICTE Smart Approval Platform - Implementation Plan
**Problem Statement ID:** SIH26262  
**Standard:** Smart Approval Workflow Automation, Compliance Monitoring and Intelligent Alert Management

---

## Roadmap & Execution Strategy

### Phase 1: Repository Inspection and System Blueprinting [COMPLETED]
- [x] Inspect workspace and system environment (Node 22, Python 3.13, Docker 29).
- [x] Create comprehensive `ARCHITECTURE.md`.
- [x] Create modular `IMPLEMENTATION_PLAN.md`.
- [x] Define entity models, state machines, and RBAC matrix.

---

### Phase 2: Backend Foundation
- [ ] Initialize Python backend environment with `requirements.txt` and project layout.
- [ ] Implement `core/config.py` with strict Pydantic settings and `.env` parsing.
- [ ] Implement database layer with SQLAlchemy 2.0 (`db/session.py`, `models/base.py`).
- [ ] Build core domain models:
  - `User`, `Role`, `UserRole`
  - `Institution`, `InstitutionMember`
  - `Application`, `ApplicationRevision`
  - `ApplicationDocument`, `DocumentVersion`
  - `WorkflowDefinition`, `WorkflowState`, `WorkflowTransition`, `ApplicationTransitionHistory`
  - `ComplianceRule`, `ComplianceRuleVersion`, `ComplianceEvaluation`, `ComplianceFinding`
  - `Deficiency`, `DeficiencyResponse`
  - `ReviewerAssignment`, `ReviewComment`
  - `Deadline`, `Notification`, `AuditEvent`
- [ ] Implement security module (`core/security.py`) using Argon2id password hashing and JWT token generator with claims.
- [ ] Implement RBAC dependencies & permission checks (`api/deps.py`).
- [ ] Implement seed data script (`scripts/seed_demo_data.py`) with rich synthetic institutions, test users, and configurable rules.
- [ ] Build `/api/v1/health` and `/api/v1/auth` endpoints.
- [ ] Write and run initial unit tests (`tests/test_auth.py`, `tests/test_security.py`).

---

### Phase 3: Frontend Foundation & Design System
- [ ] Initialize Vite + React + TypeScript in `frontend/`.
- [ ] Configure Tailwind CSS with professional government SaaS palette (Navy `#0F172A`, Slate `#334155`, Cobalt `#1E40AF`, Amber `#D97706`, Emerald `#059669`).
- [ ] Set up routing (`react-router-dom`) with layout shells and protected role boundaries:
  - Public Landing Page with system description & SIH prototype disclaimer.
  - Login & Demo Quick-Login Switcher (Institution Admin, Reviewer, Approving Authority, System Admin).
  - Portal Navigation Shell with breadcrumbs, role badges, and notification bell.
- [ ] Build reusable UI primitives: Data tables, status badges, modal dialogs, loading skeletons, alert banners, stat cards.
- [ ] Implement API client with automatic JWT token management and 401 handling.

---

### Phase 4: Applications & Document Management
- [ ] Backend:
  - Application CRUD (Draft, Save, Update, Detail, List, Filter).
  - Secure File Storage service (Local disk adapter with SHA-256 integrity check, mime-type verification, anti-traversal).
  - Upload endpoints (`POST /api/v1/applications/{id}/documents`), download endpoint (`GET /api/v1/documents/{id}/download`).
- [ ] Frontend:
  - Multi-step Institutional Application Wizard (Basic Info, Program Details, Infrastructure & Land, Faculty Metrics, Required Document Checklist).
  - Real-time Draft Auto-save indicator.
  - Document Upload Zone with progress, type validation, and preview/download links.
- [ ] Integration tests for application and document lifecycle.

---

### Phase 5: Configurable Compliance Engine & Workflow Automation
- [ ] Backend:
  - Declarative Rules Evaluator (`services/compliance/engine.py`):
    - Evaluates required fields, mandatory document uploads, floor space ratios, faculty-to-student ratios.
    - Calculates Compliance Readiness Score (%) with explainable breakdown.
  - Workflow State Machine (`services/workflow/engine.py`):
    - Enforces allowed transitions, permissions, and validation preconditions.
    - Immutably logs transitions in `ApplicationTransitionHistory` and `AuditEvent`.
  - Reviewer & Deficiency Management:
    - Reviewer assignment logic (workload-aware recommendation).
    - Deficiency notice issuance and resolution tracking.
    - Formal recommendation & Final Decision recording (Approval/Rejection/Return).
- [ ] Frontend:
  - Interactive Workflow Stepper & Timeline with audit timestamps.
  - Compliance Evaluation Panel with clear Pass/Fail tags, source handbook citations, and actionable fixes.
  - Reviewer Workspace with document inspection pane, observation notes, and deficiency issuance drawer.
  - Institution Deficiency Response view with re-upload action.
  - Approving Authority Decision Modal with mandatory reason and digital concurrence.

---

### Phase 6: Alerts, Notifications & Deadline Monitoring
- [ ] Backend:
  - Notification Service with In-App feed and Outbox queue.
  - Deadline tracking engine with 72h / 24h warning thresholds and overdue escalation flags.
  - Periodic background check task (Celery beat / async loop).
- [ ] Frontend:
  - Notification Center with unread badges, filter by severity, and deep links to relevant applications.
  - Deadline countdown badges and overdue warnings on application cards.

---

### Phase 7: Analytics Dashboards & Admin Differentiators
- [ ] Backend:
  - Aggregate analytics queries (`api/v1/analytics/`):
    - Cycle time per workflow stage.
    - Bottleneck detection (stages exceeding target SLAs).
    - Reviewer workload distribution.
    - Category-wise application volumes.
  - Audit log search and export endpoints.
- [ ] Frontend:
  - Institution Dashboard: Active applications, pending actions, status breakdown.
  - Reviewer Dashboard: Assigned queue, SLA countdowns, priority sorting.
  - Admin Master Dashboard: Recharts interactive graphs (stage durations, bottleneck alerts, workload balance).
  - Admin Workflow & Rules Management UI to adjust rule thresholds and deadlines without code changes.
  - Audit Trail Viewer with actor search and chronological inspection.

---

### Phase 8: Testing, Security Hardening & Quality Assurance
- [ ] Backend test suite (Pytest):
  - Unit tests for compliance rules engine.
  - State machine boundary tests (prevent illegal transitions).
  - Security tests (Cross-institution access prevention, IDOR document checks, unauthorized decision prevention).
- [ ] Frontend tests & end-to-end flow validation.
- [ ] Verify error states, network resilience, and input sanitization.

---

### Phase 9: Deployment & DevOps Package
- [ ] Multi-stage `Dockerfile` for backend.
- [ ] Production `Dockerfile` and `nginx.conf` for frontend.
- [ ] Unified `docker-compose.yml` (PostgreSQL, Redis, Backend, Frontend, Celery Worker).
- [ ] Documentation:
  - `README.md` (Quickstart, feature highlights, demo credentials).
  - `DEPLOYMENT.md` (Production deployment instructions, cloud runbooks, backup/restore).
  - `SECURITY.md` (Threat model, RBAC details, data protection controls).
  - `.env.example`.
