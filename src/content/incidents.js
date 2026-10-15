export const incidents = {
  title: 'Incidents',
  description: 'Outages detected on your monitors.',
  openCount: (n) => (n === 1 ? '1 ongoing incident' : `${n} ongoing incidents`),
  noneOpen: 'No ongoing incidents',
  filters: { status: 'Status' },
  columns: { monitor: 'Monitor', status: 'Status', started: 'Started', duration: 'Duration', cause: 'Cause', failures: 'Failed checks' },
  empty: {
    title: 'No incidents',
    description: 'When a monitor fails several checks in a row, it shows up here and your team is emailed.',
    filteredTitle: 'No incidents match',
  },
  stillOngoing: 'Ongoing',
}
