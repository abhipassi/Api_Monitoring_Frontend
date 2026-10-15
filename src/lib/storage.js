import { realms } from '@/config/realms.js'

// Session tokens live in localStorage. Storage can throw (private windows, blocked cookies),
// so every access is guarded and falls back to memory for the current tab.
const memory = new Map()

const read = (key) => {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

const write = (key, value) => {
  memory.set(key, value)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // memory copy above is enough for this tab
  }
}

const remove = (key) => {
  memory.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // nothing stored to remove
  }
}

export const tokenStore = {
  get: (realmKey) => read(realms[realmKey].tokenStorageKey),
  set: (realmKey, token) => write(realms[realmKey].tokenStorageKey, token),
  clear: (realmKey) => remove(realms[realmKey].tokenStorageKey),
}
