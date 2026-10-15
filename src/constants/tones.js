// The visual "tone" of every status value the API can return. Components read these, so the
// same status looks the same on every screen. Unknown values fall back to neutral.
export const TONES = Object.freeze(['neutral', 'primary', 'success', 'warning', 'danger', 'info'])

export const statusTones = Object.freeze({
  health: { UP: 'success', DOWN: 'danger', UNKNOWN: 'neutral' },
  monitorStatus: { ACTIVE: 'success', PAUSED: 'neutral' },
  incident: { OPEN: 'danger', RESOLVED: 'success' },
  resolution: { RECOVERED: 'success', PAUSED: 'neutral' },
  role: { OWNER: 'primary', MEMBER: 'neutral', SUPER_ADMIN: 'primary', STAFF: 'neutral' },
  memberStatus: { ACTIVE: 'success', DISABLED: 'neutral' },
  clientStatus: { ACTIVE: 'success', SUSPENDED: 'danger' },
  planRequest: { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELED: 'neutral' },
  employeeStatus: { ACTIVE: 'success', INACTIVE: 'neutral' },
  plan: { FREE: 'neutral', STARTER: 'info', ENTERPRISE: 'primary' },
  direction: { UPGRADE: 'success', DOWNGRADE: 'warning' },
})

export const toneFor = (kind, value) => statusTones[kind]?.[value] ?? 'neutral'
