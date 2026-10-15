import { z } from 'zod'

import { content } from '@/content/index.js'

// Building blocks for form validation, so every form words its errors the same way
const v = content.validation

export const requiredText = (label, { max } = {}) => {
  let schema = z.string().trim().min(1, v.required(label))
  if (max) schema = schema.max(max, v.maxLength(label, max))
  return schema
}

export const emailField = (label = content.common.fields.email) =>
  z.string().trim().min(1, v.required(label)).email(v.email)

export const passwordField = (label, minLength) =>
  z.string().min(1, v.required(label)).min(minLength, v.passwordMin(minLength))

// For <input type="number"> registered with { valueAsNumber: true } (an empty box gives NaN)
export const wholeNumber = (label, { min, max } = {}) => {
  let schema = z.number({ error: v.wholeNumber(label) }).int(v.wholeNumber(label))
  if (min != null) schema = schema.min(min, v.atLeast(label, min))
  if (max != null) schema = schema.max(max, v.atMost(label, max))
  return schema
}

// Two password boxes that must match, with the error shown on the second
export const withMatchingPasswords = (shape, { password = 'newPassword', confirm = 'confirmPassword' } = {}) =>
  z.object(shape).refine((values) => values[password] === values[confirm], {
    path: [confirm],
    message: v.passwordsDiffer,
  })
