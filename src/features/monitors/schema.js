import { z } from 'zod'

import { appConfig } from '@/config/app.js'
import { content } from '@/content/index.js'
import { requiredText, wholeNumber } from '@/lib/schemas.js'

const text = content.monitors.form
const v = content.validation

// Mirrors the API's rules (limits come from GET /api/meta and the customer's plan), so mistakes are caught
// before sending. The API checks everything again.
export const buildMonitorSchema = ({ limits }) =>
  z
    .object({
      name: requiredText(text.name, { max: limits.maxNameLength }),
      url: z
        .string()
        .trim()
        .min(1, v.required(text.url))
        .max(limits.maxUrlLength, v.maxLength(text.url, limits.maxUrlLength))
        .regex(/^https?:\/\/\S+$/i, v.url),
      method: z.string().min(1, v.chooseOne(text.method)),
      expectedStatus: wholeNumber(text.expectedStatus, { min: 100, max: 599 }),
      intervalSeconds: wholeNumber(text.interval, { min: 1 }),
      timeoutSeconds: wholeNumber(text.timeout, { min: 1 }),
      headers: z
        .array(
          z.object({
            name: z.string().trim().min(1, v.headerName),
            value: z.string().trim().min(1, v.headerValue),
          })
        )
        .max(limits.maxHeaders, text.headersLimit(limits.maxHeaders))
        .refine((headers) => new Set(headers.map((h) => h.name.toLowerCase())).size === headers.length, v.headerDuplicate),
      body: z.string().max(limits.maxBodyLength, v.maxLength(text.body, limits.maxBodyLength)),
    })
    .refine((values) => values.timeoutSeconds < values.intervalSeconds, {
      path: ['timeoutSeconds'],
      message: v.timeoutShorter,
    })
    .refine((values) => !values.body.trim() || appConfig.methodsWithBody.includes(values.method), {
      path: ['body'],
      message: v.bodyNeedsMethod,
    })

// Form state <-> API shape
export const toFormValues = (monitor, planLimits) => {
  if (monitor) {
    return {
      name: monitor.name,
      url: monitor.url,
      method: monitor.method,
      expectedStatus: monitor.expectedStatus,
      intervalSeconds: monitor.intervalSeconds,
      timeoutSeconds: monitor.timeoutSeconds,
      headers: monitor.headers.map(({ name, value }) => ({ name, value })),
      body: monitor.body ?? '',
    }
  }
  const defaults = appConfig.monitorDefaults
  const intervalSeconds = Math.max(defaults.intervalSeconds, planLimits?.minIntervalSeconds ?? 0)
  return {
    name: '',
    url: '',
    method: defaults.method,
    expectedStatus: defaults.expectedStatus,
    intervalSeconds,
    timeoutSeconds: Math.min(defaults.timeoutSeconds, planLimits?.maxTimeoutSeconds ?? defaults.timeoutSeconds, intervalSeconds - 1),
    headers: [],
    body: '',
  }
}

export const toPayload = (values) => ({
  name: values.name.trim(),
  url: values.url.trim(),
  method: values.method,
  expectedStatus: values.expectedStatus,
  intervalSeconds: values.intervalSeconds,
  timeoutSeconds: values.timeoutSeconds,
  headers: values.headers.map(({ name, value }) => ({ name: name.trim(), value: value.trim() })),
  // An empty box means "no body"; clearing it is how an existing one is removed
  body: values.body.trim() ? values.body : null,
})
