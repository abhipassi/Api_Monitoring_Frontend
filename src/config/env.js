// The only place environment variables are read. Everything else imports `env`.
const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('VITE_API_URL is not set. Copy .env.example to .env and set the API address.')
}

export const env = Object.freeze({
  apiUrl: apiUrl.replace(/\/+$/, ''),
  // Shown until the API's own app name has loaded
  appName: import.meta.env.VITE_APP_NAME || '',
})
