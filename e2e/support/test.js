import { expect, test as base } from '@playwright/test'

import { urls } from './env.js'

// Mail the app sent, read back from the fake SMTP server
export const mailbox = {
  all: async (to) => (await fetch(`${urls.control}/mails?to=${encodeURIComponent(to)}`)).json(),

  async waitFor(to, subject, { timeout = 15_000 } = {}) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const found = (await this.all(to)).filter((mail) => subject.test(mail.subject))
      if (found.length) return found.at(-1)
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw new Error(`No email to ${to} matching ${subject} within ${timeout} ms`)
  },

  // "Password: abc123" line of a welcome email
  passwordIn: (mail) => (mail.raw.match(/^Password: (\S+)/m) || [])[1],
  // First link in the email that points at the website
  linkIn: (mail, pattern) => (mail.raw.match(pattern) || [])[0],
}

// Switch the "customer API" that monitors point at between healthy (200) and failing (500)
export const targetApi = {
  setHealthy: (healthy) => fetch(`${urls.control}/target?state=${healthy ? 'up' : 'down'}`, { method: 'POST' }),
}

export const test = base.extend({
  // Any uncaught error or console.error in the page fails the test, except the browser's own
  // note that an API call returned 4xx (several tests deliberately trigger those).
  pageProblems: [
    async ({ page }, use) => {
      const problems = []
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) problems.push(`console: ${message.text()}`)
      })
      await use(problems)
      expect(problems, 'errors reported by the browser').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
