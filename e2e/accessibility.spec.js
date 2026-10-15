import AxeBuilder from '@axe-core/playwright'

import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { addHistory, addIncident, addMonitor, createCustomer, staffEmail } from './support/db.js'
import { signIn, uniqueTag } from './support/flows.js'
import { expect, test } from './support/test.js'

// Every main screen is checked against WCAG 2.1 A/AA with axe, in light and in dark mode
// (the dark theme is a second set of colour tokens, so its contrast needs its own check).
const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const audit = async (page, name) => {
  const { violations } = await new AxeBuilder({ page }).withTags(RULES).analyze()
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`)
  expect(summary, `accessibility problems on ${name}`).toEqual([])
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme })

    test('sign-in screens', async ({ page }) => {
      for (const path of [paths.client.login, paths.client.register, paths.client.forgotPassword, paths.admin.login]) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await audit(page, path)
      }
    })

    test('customer screens with data', async ({ page }) => {
      const customer = await createCustomer({ tag: uniqueTag('a11y') })
      const monitor = await addMonitor({ clientId: customer.clientId, name: 'Audit API', health: 'UP' })
      await addMonitor({ clientId: customer.clientId, name: 'Down API', health: 'DOWN' })
      await addMonitor({ clientId: customer.clientId, name: 'Paused API', status: 'PAUSED' })
      await addHistory({ clientId: customer.clientId, monitorId: monitor.id })
      await addIncident({ clientId: customer.clientId, monitorId: monitor.id, monitorName: 'Audit API' })
      await addIncident({ clientId: customer.clientId, monitorId: monitor.id, monitorName: 'Audit API', status: 'RESOLVED' })
      await signIn(page, customer.email)
      await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()

      for (const path of [paths.client.dashboard, paths.client.monitors, paths.client.monitor(monitor.id), paths.client.monitorEdit(monitor.id), paths.client.monitorNew, paths.client.incidents, paths.client.team, paths.client.billing, paths.client.account]) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // let data and charts finish loading before the audit
        await page.waitForLoadState('networkidle')
        await audit(page, path)
      }
    })

    test('customer dialogs and menus', async ({ page }) => {
      const customer = await createCustomer({ tag: uniqueTag('a11yd') })
      await addMonitor({ clientId: customer.clientId, name: 'Menu API' })
      await signIn(page, customer.email)
      await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
      await page.goto(paths.client.monitors)
      await page.getByRole('row').filter({ hasText: 'Menu API' }).getByRole('button', { name: content.common.actions.rowActions }).click()
      await expect(page.getByRole('menuitem', { name: content.monitors.actions.edit })).toBeVisible()
      await audit(page, 'row menu')
      await page.keyboard.press('Escape')

      await page.goto(paths.client.team)
      await page.getByRole('button', { name: content.team.add }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await audit(page, 'add team member dialog')
    })

    test('staff screens', async ({ page }) => {
      const customer = await createCustomer({ tag: uniqueTag('a11ya') })
      await addMonitor({ clientId: customer.clientId, name: 'Staff view API', health: 'UP' })
      await signIn(page, staffEmail('Sam Super'), undefined, { admin: true })
      await expect(page.getByRole('heading', { name: content.admin.dashboard.title })).toBeVisible()

      for (const path of [paths.admin.dashboard, paths.admin.customers, paths.admin.customer(customer.clientId), paths.admin.planRequests, paths.admin.employees, paths.admin.auditLog, paths.admin.account]) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await page.waitForLoadState('networkidle')
        await audit(page, path)
      }
    })
  })
}
