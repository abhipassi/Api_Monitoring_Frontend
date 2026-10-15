import { z } from 'zod'

import { content } from '@/content/index.js'
import { emailField, passwordField, requiredText, withMatchingPasswords } from '@/lib/schemas.js'

const field = content.auth.shared
const v = content.validation

export const loginSchema = z.object({
  email: emailField(),
  password: z.string().min(1, v.required(field.password)),
})

export const registerSchema = z.object({
  name: requiredText(content.auth.register.name, { max: 100 }),
  email: emailField(),
  companyName: requiredText(content.auth.register.company, { max: 100 }),
})

export const forgotSchema = z.object({ email: emailField() })

export const resetSchema = (minLength) =>
  withMatchingPasswords({
    newPassword: passwordField(field.newPassword, minLength),
    confirmPassword: z.string().min(1, v.required(field.confirmPassword)),
  })

export const changePasswordSchema = (minLength) =>
  withMatchingPasswords({
    currentPassword: z.string().min(1, v.required(field.currentPassword)),
    newPassword: passwordField(field.newPassword, minLength),
    confirmPassword: z.string().min(1, v.required(field.confirmPassword)),
  }).refine((values) => values.currentPassword !== values.newPassword, {
    path: ['newPassword'],
    message: v.passwordSame,
  })
