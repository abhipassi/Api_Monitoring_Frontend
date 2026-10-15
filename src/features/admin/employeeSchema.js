import { z } from 'zod'

import { content } from '@/content/index.js'
import { emailField, requiredText } from '@/lib/schemas.js'

const text = content.admin.employees.form
const v = content.validation

export const employeeSchema = ({ editing, limits }) =>
  z.object({
    name: requiredText(text.name, { max: limits.maxNameLength }),
    // Email and phone can only be set when the person is added
    email: editing ? z.string() : emailField(),
    phone: editing ? z.string() : z.string().trim().min(1, v.required(text.phone)).regex(/^[\d\s-]+$/, text.phoneHint),
    role: z.string().min(1, v.chooseOne(text.role)),
    status: z.string(),
    permissions: z.array(z.string()),
  })
