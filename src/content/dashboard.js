export const dashboard = {
  title: 'Dashboard',
  description: 'How your APIs are doing right now.',
  stats: {
    monitors: 'Monitors',
    monitorsHint: (up, down) => `${up} up, ${down} down`,
    uptime: 'Uptime',
    uptimeHint: (checks) => `Across ${checks}`,
    response: 'Average response',
    responseHint: 'Successful checks only',
    incidents: 'Ongoing incidents',
    incidentsNone: 'Everything is running',
    incidentsHint: 'Need attention',
  },
  table: {
    title: 'Your monitors',
    monitor: 'Monitor',
    health: 'Status',
    uptime: 'Uptime',
    response: 'Avg response',
    checks: 'Checks',
  },
  usage: {
    title: 'Your plan',
    monitors: 'Monitors',
    team: 'Team members',
    manage: 'Manage plan',
  },
  empty: {
    title: 'Add your first monitor',
    description: 'Tell us which API to watch and how often. We will check it and email your team if it stops responding.',
    action: 'Add a monitor',
  },
}
