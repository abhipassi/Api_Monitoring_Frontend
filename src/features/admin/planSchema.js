import { z } from 'zod'

import { content } from '@/content/index.js'
import { requiredText, wholeNumber } from '@/lib/schemas.js'

const text = content.admin.plans.form
const v = content.validation

export const MAX_FEATURES = 10
export const MAX_FEATURE_LENGTH = 80
const MAX_NAME_LENGTH = 40
const MAX_DESCRIPTION_LENGTH = 160

// Features are typed one per line in a single box
export const featureLines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean)

// ranges: the allowed range of each limit, from GET /api/meta
export const planSchema = ({ editing, ranges }) => {
  const limit = (field) => wholeNumber(text.limits[field], ranges[field])

  return z.object({
    key: editing ? z.string() : z.string().trim().min(1, v.required(text.key)),
    name: requiredText(text.name, { max: MAX_NAME_LENGTH }),
    description: z.string().trim().max(MAX_DESCRIPTION_LENGTH, v.maxLength(text.description, MAX_DESCRIPTION_LENGTH)),
    priceMonthly: z.number({ error: v.number(text.price) }).min(0, v.atLeast(text.price, 0)),
    maxMonitors: limit('maxMonitors'),
    minIntervalSeconds: limit('minIntervalSeconds'),
    maxTimeoutSeconds: limit('maxTimeoutSeconds'),
    maxTeamMembers: limit('maxTeamMembers'),
    retentionDays: limit('retentionDays'),
    features: z.string().superRefine((value, context) => {
      const lines = featureLines(value)
      if (lines.length > MAX_FEATURES) context.addIssue({ code: 'custom', message: text.featuresTooMany(MAX_FEATURES) })
      else if (lines.some((line) => line.length > MAX_FEATURE_LENGTH)) context.addIssue({ code: 'custom', message: text.featuresTooLong(MAX_FEATURE_LENGTH) })
    }),
    sortOrder: wholeNumber(text.order, { min: -1000, max: 1000 }),
    isRecommended: z.boolean(),
    isDefault: z.boolean(),
    isActive: z.boolean(),
  })
}
