import { content } from '@/content/index.js'
import { humanize } from '@/lib/format.js'

// Why a monitor failed, in words ("Timed out: No response within 10 seconds")
export const describeCause = (cause) => {
  if (!cause) return content.common.placeholder
  const label = content.enums.checkError[cause.type] ?? humanize(cause.type)
  return cause.message ? `${label}${content.common.colon} ${cause.message}` : label
}
