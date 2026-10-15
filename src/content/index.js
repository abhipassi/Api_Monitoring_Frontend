import { account } from './account.js'
import { admin } from './admin.js'
import { auth } from './auth.js'
import { billing } from './billing.js'
import { common } from './common.js'
import { dashboard } from './dashboard.js'
import { enums } from './enums.js'
import { errors } from './errors.js'
import { incidents } from './incidents.js'
import { monitors } from './monitors.js'
import { nav } from './nav.js'
import { team } from './team.js'
import { validation } from './validation.js'

// All wording shown to people. Components import `content` and never contain sentences themselves,
// so copy can be edited (or translated) in one place.
export const content = {
  account,
  admin,
  auth,
  billing,
  common,
  dashboard,
  enums,
  errors,
  incidents,
  monitors,
  nav,
  team,
  validation,
}
