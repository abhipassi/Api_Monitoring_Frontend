// Every URL path of the website. Components link with these builders; nothing types a path by hand.
const client = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  changePassword: '/change-password',
  dashboard: '/',
  monitors: '/monitors',
  monitorNew: '/monitors/new',
  monitor: (id) => `/monitors/${id}`,
  monitorEdit: (id) => `/monitors/${id}/edit`,
  incidents: '/incidents',
  team: '/team',
  billing: '/billing',
  account: '/account',
}

const adminBase = '/admin'
const admin = {
  base: adminBase,
  login: `${adminBase}/login`,
  forgotPassword: `${adminBase}/forgot-password`,
  resetPassword: `${adminBase}/reset-password`,
  changePassword: `${adminBase}/change-password`,
  dashboard: adminBase,
  customers: `${adminBase}/customers`,
  customer: (id) => `${adminBase}/customers/${id}`,
  planRequests: `${adminBase}/plan-requests`,
  employees: `${adminBase}/employees`,
  auditLog: `${adminBase}/audit-log`,
  account: `${adminBase}/account`,
}

export const paths = Object.freeze({ client, admin })

// Route patterns for <Route path>, derived from the builders so the two can never drift apart
const PARAM = ':id'
export const patterns = Object.freeze({
  monitor: client.monitor(PARAM),
  monitorEdit: client.monitorEdit(PARAM),
  customer: admin.customer(PARAM),
})

// Query-string names used by more than one page
export const searchParams = Object.freeze({
  token: 'token',
  page: 'page',
  search: 'search',
  status: 'status',
  range: 'range',
})
