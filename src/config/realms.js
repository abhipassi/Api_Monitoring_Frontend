import { endpoints } from './endpoints.js'
import { paths } from './routes.js'

// The website has two signed-in areas that share one set of screens (login, reset password, ...).
// A realm says which endpoints, storage key and paths a given area uses.
export const REALM_KEYS = Object.freeze({ client: 'client', admin: 'admin' })

export const realms = Object.freeze({
  client: {
    key: REALM_KEYS.client,
    tokenStorageKey: 'apimon.client.token',
    auth: endpoints.client.auth,
    paths: paths.client,
    homePath: paths.client.dashboard,
  },
  admin: {
    key: REALM_KEYS.admin,
    tokenStorageKey: 'apimon.admin.token',
    auth: endpoints.admin.auth,
    paths: paths.admin,
    homePath: paths.admin.dashboard,
  },
})

// Which area an API call belongs to decides which token is attached
export const realmForUrl = (url = '') =>
  url.startsWith(endpoints.admin.prefix) ? realms.admin : realms.client
