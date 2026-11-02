import type {
  AuthResponse,
  UserSession,
  ApplicationItem,
  ApplicationDetail,
  ComplianceEvaluation,
  ComplianceRule,
  DeficiencyItem,
  ReviewComment,
  NotificationItem,
  DeadlineItem,
  InstitutionStats,
  ReviewerStats,
  AdminStats
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aicte_access_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If payload is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login page, clear session and redirect
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('aicte_access_token');
      localStorage.removeItem('aicte_user');
      window.location.href = '/login?expired=true';
    }
    throw new Error('Authentication session expired.');
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.detail?.message || errJson.detail || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle empty bodies (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getMe: () => request<UserSession>('/auth/me'),
  },

  // Institutions
  institutions: {
    getMyInstitution: () => request<any>('/institutions/me'),
    updateMyInstitution: (data: any) =>
      request<any>('/institutions/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Applications
  applications: {
    list: (params?: { status?: string; category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.search) searchParams.append('search', params.search);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<ApplicationItem[]>(`/applications${query}`);
    },
    get: (id: string) => request<ApplicationDetail>(`/applications/${id}`),
    create: (data: { title: string; category: string; academic_year: string; details_json: any }) =>
      request<ApplicationItem>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { title?: string; details_json?: any }) =>
      request<ApplicationDetail>(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    submit: (id: string) =>
      request<ApplicationDetail>(`/applications/${id}/submit`, {
        method: 'POST',
      }),
  },

  // Documents
  documents: {
    upload: (applicationId: string, category: string, title: string, file: File) => {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('file', file);
      return request<any>(`/documents/${applicationId}/upload`, {
        method: 'POST',
        body: formData,
      });
    },
    list: (applicationId: string) => request<any[]>(`/documents/${applicationId}`),
    getDownloadUrl: (documentId: string) => `${API_BASE}/documents/download/${documentId}`,
  },

  // Compliance
  compliance: {
    evaluate: (applicationId: string) =>
      request<ComplianceEvaluation>(`/compliance/${applicationId}/evaluate`, {
        method: 'POST',
      }),
    get: (applicationId: string) =>
      request<ComplianceEvaluation>(`/compliance/${applicationId}`),
    getActiveRules: () => request<ComplianceRule[]>('/compliance/rules/active'),
  },

  // Workflow
  workflow: {
    transition: (applicationId: string, to_state: string, reason?: string) =>
      request<any>(`/workflow/${applicationId}/transition`, {
        method: 'POST',
        body: JSON.stringify({ to_state, reason }),
      }),
  },

  // Reviews & Deficiencies
  reviews: {
    getAssigned: () => request<ApplicationItem[]>('/reviews/assigned'),
    assignReviewer: (applicationId: string, reviewerId: string, priority: string = 'NORMAL') =>
      request<any>(`/reviews/${applicationId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ reviewer_id: reviewerId, priority }),
      }),
    addComment: (
      applicationId: string,
      data: { stage: string; comment_type: string; content: string; recommendation?: string }
    ) =>
      request<ReviewComment>(`/reviews/${applicationId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getComments: (applicationId: string) => request<ReviewComment[]>(`/reviews/${applicationId}/comments`),
    issueDeficiency: (
      applicationId: string,
      data: { title: string; description: string; requested_correction: string; severity: string; due_days: number }
    ) =>
      request<DeficiencyItem>(`/reviews/${applicationId}/deficiencies`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDeficiencies: (applicationId: string) =>
      request<DeficiencyItem[]>(`/reviews/${applicationId}/deficiencies`),
    respondDeficiency: (deficiencyId: string, data: { response_notes: string; supporting_document_id?: string }) =>
      request<any>(`/reviews/deficiencies/${deficiencyId}/respond`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    recordFinalDecision: (applicationId: string, decision: string, reason: string) =>
      request<any>(`/reviews/${applicationId}/final-decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<NotificationItem[]>('/notifications'),
    markRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllRead: () =>
      request<any>('/notifications/read-all', {
        method: 'POST',
      }),
    getDeadlines: () => request<DeadlineItem[]>('/notifications/deadlines'),
  },

  // Analytics
  analytics: {
    getInstitutionStats: () => request<InstitutionStats>('/analytics/institution'),
    getReviewerStats: () => request<ReviewerStats>('/analytics/reviewer'),
    getAdminStats: () => request<AdminStats>('/analytics/admin'),
  },

  // Admin
  admin: {
    getAuditEvents: (params?: { action?: string; entity_type?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.action) searchParams.append('action', params.action);
      if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<any[]>(`/admin/audit-events${query}`);
    },
    getUsers: () => request<any[]>('/admin/users'),
    triggerDeadlineCheck: () =>
      request<any>('/admin/trigger-deadline-check', {
        method: 'POST',
      }),
    getExportUrl: () => `${API_BASE}/admin/export/applications.csv`,
  },
};
