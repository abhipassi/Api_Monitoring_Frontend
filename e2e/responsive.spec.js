import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { addHistory, addIncident, addMonitor, createCustomer, staffEmail } from './support/db.js'
import { signIn, uniqueTag } from './support/flows.js'
import { expect, test } from './support/test.js'

// A phone-sized screen: the sidebar becomes a slide-in menu, wide tables drop optional columns,
// and no page may scroll sideways.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

const expectNoSidewaysScroll = async (page) => {
  const where = new URL(page.url()).pathname
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `${where} is wider than the screen by this many pixels`).toBeLessThanOrEqual(1)
}

const signedIn = async (page) => {
  const customer = await createCustomer({ tag: uniqueTag('mob') })
  const monitor = await addMonitor({ clientId: customer.clientId, name: 'Phone API', health: 'UP' })
  await addHistory({ clientId: customer.clientId, monitorId: monitor.id })
  await addIncident({ clientId: customer.clientId, monitorId: monitor.id, monitorName: 'Phone API' })
  await signIn(page, customer.email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  return { customer, monitor }
}

test('sign-in and sign-up fit the screen', async ({ page }) => {
  for (const path of [paths.client.login, paths.client.register, paths.client.forgotPassword, paths.admin.login]) {
    await page.goto(path)
    await expect(page.getByRole('button').first()).toBeVisible()
    await expectNoSidewaysScroll(page)
  }
})

test('the menu opens as a panel, navigates, and closes itself', async ({ page }) => {
  await signedIn(page)
  // no permanent sidebar on a phone
  await expect(page.getByRole('link', { name: content.nav.client.team })).toBeHidden()

  await page.getByRole('button', { name: content.common.actions.openMenu }).click()
  const menu = page.getByRole('dialog', { name: content.nav.mainNavigation })
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: content.nav.client.monitors }).click()
  await expect(page.getByRole('heading', { name: content.monitors.title, exact: true })).toBeVisible()
  await expect(menu).toBeHidden()

  await page.getByRole('button', { name: content.common.actions.openMenu }).click()
  await page.getByRole('button', { name: content.common.actions.closeMenu }).click()
  await expect(menu).toBeHidden()
})

test('tables keep the essentials and drop optional columns', async ({ page }) => {
  await signedIn(page)
  await page.goto(paths.client.monitors)
  await expect(page.getByRole('columnheader', { name: content.monitors.list.columns.monitor })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: content.monitors.list.columns.health })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: content.monitors.list.columns.lastChecked })).toBeHidden()
  await expectNoSidewaysScroll(page)
})

test('main customer pages never scroll sideways', async ({ page }) => {
  const { monitor } = await signedIn(page)
  for (const path of [paths.client.dashboard, paths.client.monitors, paths.client.monitor(monitor.id), paths.client.monitorNew, paths.client.incidents, paths.client.team, paths.client.billing, paths.client.account]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoSidewaysScroll(page)
  }
})

test('main staff pages never scroll sideways', async ({ page }) => {
  const customer = await createCustomer({ tag: uniqueTag('mobadm') })
  await signIn(page, staffEmail('Sam Super'), undefined, { admin: true })
  for (const path of [paths.admin.dashboard, paths.admin.customers, paths.admin.customer(customer.clientId), paths.admin.planRequests, paths.admin.employees, paths.admin.auditLog]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoSidewaysScroll(page)
  }
})

test('dialogs fit a phone too', async ({ page }) => {
  await signedIn(page)
  await page.goto(paths.client.team)
  await page.getByRole('button', { name: content.team.add }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box.width).toBeLessThanOrEqual(390)
  expect(box.x).toBeGreaterThanOrEqual(0)
})
