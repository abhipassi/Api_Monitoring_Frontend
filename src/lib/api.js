import axios from 'axios'

import { appConfig } from '@/config/app.js'
import { env } from '@/config/env.js'
import { realmForUrl, realms } from '@/config/realms.js'
import { ApiError } from './errors.js'
import { AUTH_EVENTS, events } from './events.js'
import { tokenStore } from './storage.js'

const instance = axios.create({
  baseURL: env.apiUrl,
  timeout: appConfig.requestTimeoutMs,
})

// Calls where a 401 just means "wrong credentials / bad link", not "your session ended"
const noSessionUrls = new Set(
  Object.values(realms).flatMap((r) => [r.auth.login, r.auth.forgotPassword, r.auth.resetPassword, r.auth.register].filter(Boolean))
)

instance.interceptors.request.use((config) => {
  const realm = realmForUrl(config.url)
  const token = tokenStore.get(realm.key)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = ApiError.from(error)
    const url = error.config?.url
    const realm = realmForUrl(url)

    if (apiError.status === 401 && !noSessionUrls.has(url)) {
      events.emit(AUTH_EVENTS.expired, realm.key)
    }
    if (apiError.status === 403 && apiError.code === 'PASSWORD_CHANGE_REQUIRED') {
      events.emit(AUTH_EVENTS.passwordChangeRequired, realm.key)
    }
    return Promise.reject(apiError)
  }
)

// Thin helpers that return the response body (the API wraps every payload in { success, message, ... })
export const api = {
  get: (url, params) => instance.get(url, { params }).then((r) => r.data),
  post: (url, body) => instance.post(url, body).then((r) => r.data),
  patch: (url, body) => instance.patch(url, body).then((r) => r.data),
  delete: (url) => instance.delete(url).then((r) => r.data),
}
