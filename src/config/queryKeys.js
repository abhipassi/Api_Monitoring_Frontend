// Cache keys for server data. Mutations invalidate by these prefixes, so keep names stable.
export const queryKeys = Object.freeze({
  meta: ['meta'],

  monitors: {
    all: ['monitors'],
    list: (params) => ['monitors', 'list', params],
    detail: (id) => ['monitors', 'detail', id],
    stats: (id, range) => ['monitors', 'stats', id, range],
    chart: (id, range) => ['monitors', 'chart', id, range],
    results: (id) => ['monitors', 'results', id],
  },
  incidents: { all: ['incidents'], list: (params) => ['incidents', 'list', params] },
  overview: (range) => ['overview', range],
  team: ['team'],
  billing: ['billing'],

  admin: {
    stats: ['admin', 'stats'],
    clients: { all: ['admin', 'clients'], list: (params) => ['admin', 'clients', 'list', params], detail: (id) => ['admin', 'clients', 'detail', id] },
    plans: ['admin', 'plans'],
    planRequests: { all: ['admin', 'plan-requests'], list: (params) => ['admin', 'plan-requests', 'list', params] },
    employees: { all: ['admin', 'employees'], list: (params) => ['admin', 'employees', 'list', params] },
    auditLogs: (params) => ['admin', 'audit-logs', params],
  },
})
