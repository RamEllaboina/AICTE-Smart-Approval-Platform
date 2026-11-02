export type Role = 'INSTITUTION_ADMIN' | 'REVIEWER' | 'APPROVING_AUTHORITY' | 'SYSTEM_ADMIN';

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  roles: Role[];
  institution_id?: string | null;
  institution_name?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: UserSession;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'COMPLETENESS_CHECK'
  | 'RETURNED_FOR_CORRECTION'
  | 'RESUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVIEW_COMPLETED'
  | 'PENDING_FINAL_DECISION'
  | 'APPROVED'
  | 'REJECTED';

export type ApplicationCategory =
  | 'NEW_PROGRAM'
  | 'INTAKE_MODIFICATION'
  | 'INSTITUTION_UPDATE';

export interface ApplicationItem {
  id: string;
  application_number: string;
  institution_id: string;
  institution_name?: string | null;
  category: ApplicationCategory;
  academic_year: string;
  status: ApplicationStatus;
  title: string;
  current_revision: number;
  compliance_score: number;
  submission_date?: string | null;
  deadline_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  category: string;
  title: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_checksum: string;
  is_verified: boolean;
  created_at: string;
}

export interface TransitionHistoryItem {
  id: string;
  from_state: string;
  to_state: string;
  actor_role: string;
  reason?: string | null;
  created_at: string;
}

export interface ApplicationDetail extends ApplicationItem {
  details_json: Record<string, any>;
  documents: DocumentItem[];
  transition_history: TransitionHistoryItem[];
  has_unresolved_deficiencies: boolean;
  assigned_reviewer_name?: string | null;
}

export interface ComplianceFinding {
  id: string;
  rule_code: string;
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_APPLICABLE';
  message: string;
  affected_field?: string | null;
  remediation_action?: string | null;
  calculated_value?: string | null;
  expected_value?: string | null;
}

export interface ComplianceEvaluation {
  id: string;
  application_id: string;
  overall_status: 'PASSED' | 'FAILED' | 'WARNING';
  readiness_score: number;
  total_rules: number;
  passed_rules: number;
  failed_rules: number;
  evaluation_date: string;
  findings: ComplianceFinding[];
}

export interface ComplianceRule {
  id: string;
  rule_code: string;
  name: string;
  category: string;
  description: string;
  rule_type: string;
  severity: string;
  handbook_reference?: string | null;
  is_active: boolean;
  version: number;
  condition_json: Record<string, any>;
}

export interface DeficiencyResponse {
  id: string;
  response_notes: string;
  supporting_document_id?: string | null;
  submitted_at: string;
}

export interface DeficiencyItem {
  id: string;
  application_id: string;
  rule_id?: string | null;
  reviewer_id?: string | null;
  title: string;
  description: string;
  requested_correction: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  due_date: string;
  status: 'OPEN' | 'SUBMITTED' | 'RESOLVED' | 'REJECTED';
  created_at: string;
  resolved_at?: string | null;
  responses: DeficiencyResponse[];
}

export interface ReviewComment {
  id: string;
  reviewer_id?: string | null;
  stage: string;
  comment_type: 'INTERNAL_OBSERVATION' | 'FORMAL_RECOMMENDATION' | 'FINAL_DECISION_NOTE';
  content: string;
  recommendation?: 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'DEFICIENCY_FOUND' | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  read_at?: string | null;
  link_url?: string | null;
  created_at: string;
}

export interface DeadlineItem {
  id: string;
  application_id: string;
  task_type: string;
  due_date: string;
  is_completed: boolean;
  is_overdue: boolean;
  hours_remaining: number;
}

export interface BottleneckIndicator {
  stage: string;
  stage_label: string;
  active_count: number;
  avg_hours_in_stage: number;
  target_sla_hours: number;
  is_bottleneck: boolean;
  status_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface AdminStats {
  total_applications: number;
  status_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  average_processing_days: number;
  overdue_count: number;
  bottlenecks: BottleneckIndicator[];
  reviewer_workloads: Array<{
    reviewer_id: string;
    reviewer_name: string;
    email: string;
    active_assigned: number;
    completed: number;
  }>;
}

export interface InstitutionStats {
  total_applications: number;
  draft_count: number;
  under_review_count: number;
  returned_for_correction_count: number;
  approved_count: number;
  rejected_count: number;
  pending_deficiencies_count: number;
  unread_notifications_count: number;
}

export interface ReviewerStats {
  assigned_count: number;
  under_scrutiny_count: number;
  review_completed_count: number;
  overdue_count: number;
  open_deficiencies_count: number;
}
