import { uptimeThresholds } from '@/config/app.js'

// Which colour tone an uptime percentage deserves (null = no data yet)
export const uptimeTone = (percent) => {
  if (percent == null) return 'neutral'
  if (percent >= uptimeThresholds.good) return 'success'
  if (percent >= uptimeThresholds.warn) return 'warning'
  return 'danger'
}
