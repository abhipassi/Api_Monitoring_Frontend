// Tunable behaviour of the interface. Change a number here, not inside a component.
export const appConfig = Object.freeze({
  requestTimeoutMs: 20_000,
  pageSize: 20,
  auditPageSize: 25,
  recentChecksPageSize: 25,
  searchDebounceMs: 300,
  toastDurationMs: 5000,
  dashboardRefreshMs: 30_000,
  monitorRefreshMs: 15_000,
  metaStaleMs: 5 * 60_000,
  defaultStatRange: '24h',

  // Check frequencies offered when creating a monitor; the plan's minimum filters this list
  intervalPresetsSeconds: [30, 60, 120, 300, 600, 900, 1800, 3600, 21_600, 43_200, 86_400],
  timeoutPresetsSeconds: [5, 10, 15, 30, 60],

  // Starting values for the "new monitor" form
  monitorDefaults: Object.freeze({
    method: 'GET',
    expectedStatus: 200,
    intervalSeconds: 300,
    timeoutSeconds: 10,
  }),
  // Methods that may carry a request body
  methodsWithBody: ['POST', 'PUT', 'PATCH'],

  // A usage meter turns amber at this share of the limit, red at 100%
  meterWarnRatio: 0.8,
})

// Uptime colouring: at or above `good` is green, at or above `warn` amber, below that red
export const uptimeThresholds = Object.freeze({ good: 99, warn: 95 })
