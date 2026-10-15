// Every API path. The API address itself comes from .env (see env.js).
const clientAuth = '/api/client/auth'
const adminAuth = '/api/admin/auth'

export const endpoints = Object.freeze({
  meta: '/api/meta',

  client: {
    auth: {
      login: `${clientAuth}/login`,
      register: `${clientAuth}/register`,
      forgotPassword: `${clientAuth}/forgot-password`,
      resetPassword: `${clientAuth}/reset-password`,
      changePassword: `${clientAuth}/change-password`,
      me: `${clientAuth}/me`,
    },
    monitors: {
      base: '/api/client/monitors',
      byId: (id) => `/api/client/monitors/${id}`,
      results: (id) => `/api/client/monitors/${id}/results`,
      stats: (id) => `/api/client/monitors/${id}/stats`,
      chart: (id) => `/api/client/monitors/${id}/chart`,
    },
    incidents: { base: '/api/client/incidents' },
    overview: '/api/client/stats/overview',
    team: {
      base: '/api/client/team',
      byId: (id) => `/api/client/team/${id}`,
      resend: (id) => `/api/client/team/${id}/resend-credentials`,
    },
    billing: {
      base: '/api/client/billing',
      planRequests: '/api/client/billing/plan-requests',
      planRequest: (id) => `/api/client/billing/plan-requests/${id}`,
      checkout: '/api/client/billing/checkout',
    },
  },

  admin: {
    auth: {
      login: `${adminAuth}/login`,
      forgotPassword: `${adminAuth}/forgot-password`,
      resetPassword: `${adminAuth}/reset-password`,
      changePassword: `${adminAuth}/change-password`,
      me: `${adminAuth}/me`,
    },
    prefix: '/api/admin',
    meta: '/api/admin/meta',
    stats: '/api/admin/stats',
    clients: '/api/admin/clients',
    client: (id) => `/api/admin/clients/${id}`,
    planRequests: '/api/admin/plan-requests',
    approvePlanRequest: (id) => `/api/admin/plan-requests/${id}/approve`,
    rejectPlanRequest: (id) => `/api/admin/plan-requests/${id}/reject`,
    employees: '/api/admin/employees',
    employee: (id) => `/api/admin/employees/${id}`,
    auditLogs: '/api/admin/audit-logs',
  },
})
