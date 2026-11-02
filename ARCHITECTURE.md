# AICTE Smart Approval Platform - Architecture Document
**Problem Statement ID:** SIH26262  
**Target:** Smart Approval Workflow Automation, Compliance Monitoring and Intelligent Alert Management  
**Status:** Architectural Blueprint & Prototype Specification (Synthetic Data & Sample Configurable Regulatory Rules)

---

## 1. System Overview & Objectives
The AICTE Smart Approval Platform is an enterprise-grade administrative workflow automation, compliance evaluation, and audit tracking system. It modernizes institutional technical education approvals through:
- **Centralized Application & Document Management:** Structured intake with integrity checks, versioning, and private document storage.
- **Configurable Deterministic Compliance Engine:** Explainable validation of regulatory norms (infrastructure, faculty-student ratios, land requirements, requisite documentation) without arbitrary or black-box logic.
- **Deterministic State Machine & Workflow Automation:** Explicit, role-governed transitions (Draft -> Submitted -> Completeness Check -> Under Review -> Correction/Deficiency -> Review Completed -> Approving Authority Final Decision).
- **Reviewer & Deficiency Management:** Role-isolated workspaces for scrutiny, observations, deficiency issuances, institutional rectification, and transparent recommendation audit logs.
- **Proactive Deadline Monitoring & Alerts:** Multi-tier warning thresholds (72h, 24h, overdue), escalation policies, in-app notifications, and transactional email queuing via Celery & Redis.
- **Real-Time Operational Analytics:** Dashboards for Institutions, Reviewers, and System Administrators measuring cycle times, bottleneck stages, workload balance, and compliance readiness scores.
- **Immutable Audit Trail:** Append-only event store capturing all state transitions, uploads, evaluations, decisions, and administrative actions with actor metadata and correlation IDs.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                 |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + TanStack Query + Recharts|
|                                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  +------------+  |
|  | Institution Portal |  | Reviewer Workspace |  | Approving Board |  | Admin/Audit|  |
|  +--------------------+  +--------------------+  +-----------------+  +------------+  |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / REST (JSON)
                                            v
+---------------------------------------------------------------------------------------+
|                                      API GATEWAY                                      |
|                       Nginx Reverse Proxy / SSL Termination / Rate Limiter             |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                    APPLICATION CORE                                   |
|                          FastAPI (Python 3.11/3.13) + Pydantic v2                     |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  |  Security & RBAC Middleware (Argon2id, JWT Access/Refresh, Correlation ID)      |  |
|  +---------------------------------------------------------------------------------+  |
|                                                                                       |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|  | Auth & Institution  |   | Application Service |   | Document Storage Adapter    |  |
|  | Service             |   | (Draft, Revisions)  |   | (Local FS / S3 Private)     |  |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|                                                                                       |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|  | Deterministic       |   | State Machine       |   | Review & Deficiency         |  |
|  | Compliance Engine   |   | Workflow Engine     |   | Management Service          |  |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|                                                                                       |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|  | Notification Engine |   | Deadline &          |   | Append-Only Audit           |  |
|  | (In-app & Outbox)   |   | Escalation Engine   |   | Event Service               |  |
|  +---------------------+   +---------------------+   +-----------------------------+  |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
+---------------------------------+  +------------------+  +----------------------------+
|        DATABASE LAYER           |  | CACHE & BROKER   |  |     ASYNCHRONOUS JOBS      |
| PostgreSQL 16 (SQLAlchemy 2.x)  |  | Redis 7          |  | Celery Workers & Beat      |
| - ACID Transactions             |  | - Session tokens |  | - Deadline check cron      |
| - Optimistic Concurrency Locking|  | - Rate limiting  |  | - Email notification retry |
| - Immutable Audit Log Table     |  | - Celery broker  |  | - Compliance batch runs    |
+---------------------------------+  +------------------+  +----------------------------+
```

---

## 3. Technology Decisions & Rationale

| Layer | Chosen Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + Vite + TypeScript | High performance, instant HMR, strict type safety for mission-critical enterprise workflows. |
| **Frontend Styling** | Tailwind CSS + Lucide Icons | Clean government-portal aesthetics (Navy/Slate/Indigo), responsive layout, zero CSS bloat. |
| **State & Data Fetching**| TanStack Query v5 + React Hook Form + Zod | Robust client cache invalidation, optimistic updates, type-safe schema validation before submission. |
| **Visualizations** | Recharts | Composable SVG-based dashboards for application volumes, bottleneck durations, and workload analytics. |
| **Backend API** | FastAPI + Pydantic v2 | High-throughput asynchronous Python ASGI, auto-generating OpenAPI 3.1 docs, strict request/response contracts. |
| **ORM & Migrations** | SQLAlchemy 2.0 (Async/Sync) + Alembic | Explicit declarative 2.0 syntax, type-checked models, transaction isolation, enterprise migration safety. |
| **Relational Database** | PostgreSQL 16 (with SQLite dual-compatibility for test execution) | Robust relational constraints, JSONB support for declarative compliance rules, ACID compliance. |
| **Task Queue & Cache** | Celery + Redis | Asynchronous outbox email delivery, periodic deadline escalation scheduler (Celery Beat), token denylist cache. |
| **Security & Passwords** | Argon2id + Short-lived JWTs | State-of-the-art password hashing (RFC 9106), cryptographic resistance to GPU attacks, token rotation. |
| **Document Storage** | Pluggable Adapter (Local Secure Path & S3) | Storage keys generated server-side, SHA-256 checksum verification, mime sniffing, anti-path traversal. |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Permission / Action | Institution Admin | Reviewer | Approving Authority | System Administrator |
|---|:---:|:---:|:---:|:---:|
| Manage Own Institution Profile | **CRUD** | - | - | Read |
| Create / Edit Application Draft | **Own** | - | - | Read |
| Upload / Replace Application Documents | **Own** | - | - | Read |
| Submit Application | **Own** | - | - | - |
| Run Compliance Pre-check | **Own** | Assigned | All | All |
| View Assigned Applications | - | **Assigned Only** | All (In Scope) | All |
| Add Review Comments / Observations | - | **Assigned Only** | Read | Read |
| Issue Deficiency Notice | - | **Assigned Only** | Read | - |
| Respond to Deficiency Notice | **Own** | - | - | - |
| Submit Review Recommendation | - | **Assigned Only** | - | - |
| Grant Final Approval / Rejection | - | - | **Authorized** | - |
| Reassign Reviewers / Manage Deadlines | - | - | - | **Full** |
| Configure Rules & Workflows | - | - | - | **Full** |
| Access Global Audit Logs & Analytics | - | - | Summary | **Full** |

---

## 5. Workflow State Machine Specification

Applications traverse an explicit directed acyclic state graph with defined transition gates:

```
[DRAFT] 
   |
   | (Institution triggers submit with mandatory attachments)
   v
[SUBMITTED]
   |
   | (System automated validation / Initial registrar screen)
   v
[COMPLETENESS_CHECK] ----(Critical deficiencies detected)----> [RETURNED_FOR_CORRECTION]
   |                                                                  |
   | (Passes compliance completeness gate)                            | (Institution rectifies)
   |                                                                  v
   |                                                            [RESUBMITTED]
   |                                                                  |
   +------------------------------------------------------------------+
   |
   v
[PENDING_REVIEW] (Admin or automated round-robin assigns Reviewer)
   |
   v
[UNDER_REVIEW] (Reviewer scrutinizes docs, records observations)
   |
   +----(Reviewer issues deficiency)----> [RETURNED_FOR_CORRECTION]
   |
   v
[REVIEW_COMPLETED] (Reviewer submits formalized recommendation)
   |
   v
[PENDING_FINAL_DECISION] (Approving Authority panel review)
   |
   +----(Requires remediation)---------> [RETURNED_FOR_CORRECTION]
   |
   +----(Meets statutory norms)---------> [APPROVED] (Terminal Success)
   |
   +----(Fails mandatory requirements)--> [REJECTED] (Terminal Failure)
```

**Guard Rules:**
1. Direct jumps (e.g. `DRAFT -> APPROVED`) are strictly rejected at the service layer with `400 Bad Request` / `WorkflowTransitionError`.
2. Every state change is executed inside an atomic database transaction.
3. Every state change creates an immutable `ApplicationTransitionHistory` and an `AuditEvent` entry with before-state, after-state, actor ID, IP/correlation ID, and mandatory notes/reason code.

---

## 6. Deterministic Compliance Rules Engine

The engine evaluates application parameters and documents using a declarative JSON-based AST (Abstract Syntax Tree) without evaluating dynamic Python code:
- **Rule Categories:**
  - `REQUIRED_FIELD`: Ensures mandatory institutional and program fields are non-empty.
  - `REQUIRED_DOCUMENT`: Verifies specified document types are uploaded, non-empty, and checksummed.
  - `NUMERIC_RANGE`: Validates built-up area per student, land area in acres, laboratory space, faculty-student ratios.
  - `CONDITIONAL_REQUIREMENT`: E.g., If `category == 'NEW_PROGRAM'`, then `land_conversion_certificate` is mandatory.
  - `CROSS_FIELD_CONSISTENCY`: E.g., `total_faculty_count >= student_intake / ratio`.
- **Explainable Evaluation Output:**
  - Rule ID, Rule Version, Rule Name, Pass/Fail/Warning status, Calculated Value vs Required Threshold, Citation/Source Reference (e.g. AICTE Approval Process Handbook norm), and remediation advice.

---

## 7. Audit & Event Sourcing Model
The `audit_events` table is append-only. No application role (including System Administrator) possesses SQL update/delete privileges over audit records.
- Fields: `id`, `correlation_id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `timestamp_utc`, `ip_address`, `before_state_json`, `after_state_json`, `metadata_json`.

---

## 8. Data Security, Privacy & Integrity
1. **Passwords:** Argon2id hash (`argon2-cffi`) with custom salt and high memory cost parameter.
2. **Session Security:** Short-lived access JWT (15-30 min) + rotating refresh token stored securely.
3. **Document Protection:** No public URLs. All file requests flow through `/api/v1/documents/{id}/download` enforcing resource ownership or assigned reviewer authorization.
4. **Anti-Tampering:** SHA-256 hash calculated on initial upload and verified before serving.
5. **Rate Limiting:** IP and user-based bucket rate limiting on authentication and submission endpoints.
