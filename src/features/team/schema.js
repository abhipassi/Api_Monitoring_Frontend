import { z } from 'zod'

import { content } from '@/content/index.js'
import { emailField, requiredText } from '@/lib/schemas.js'

export const addMemberSchema = (limits) =>
  z.object({
    name: requiredText(content.team.addForm.name, { max: limits.maxNameLength }),
    email: emailField(),
    role: z.string().min(1, content.validation.chooseOne(content.team.addForm.role)),
  })
