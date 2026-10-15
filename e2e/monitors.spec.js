import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { addHistory, addIncident, addMonitor, createCustomer } from './support/db.js'
import { urls } from './support/env.js'
import { chooseRowAction, createMonitorInUi, signIn, startsWith, uniqueTag } from './support/flows.js'
import { expect, targetApi, test } from './support/test.js'

const text = content.monitors
const form = text.form

test.beforeEach(async () => {
  await targetApi.setHealthy(true)
})

const signedInCustomer = async (page, options = {}) => {
  const customer = await createCustomer({ tag: uniqueTag('mon'), ...options })
  await signIn(page, customer.email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  return customer
}

test('a new account sees helpful empty states', async ({ page }) => {
  await signedInCustomer(page)
  await expect(page.getByRole('heading', { name: content.dashboard.empty.title })).toBeVisible()
  await page.getByRole('link', { name: content.nav.client.monitors }).click()
  await expect(page.getByRole('heading', { name: text.list.empty.title })).toBeVisible()
  await page.getByRole('link', { name: content.nav.client.incidents }).click()
  await expect(page.getByRole('heading', { name: content.incidents.empty.title })).toBeVisible()
})

test('create a monitor: the first check runs at once and the page shows the result', async ({ page }) => {
  await signedInCustomer(page)
  await createMonitorInUi(page, { name: 'Checkout API', url: urls.target })
  await expect(page.getByText(text.toasts.created)).toBeVisible()

  // The worker checks straight away, and the page refreshes itself
  await expect(page.getByText('Up', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('cell', { name: text.detail.recent.passed })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(text.detail.errors.none)).toBeVisible()

  await page.getByRole('link', { name: text.title }).first().click()
  const row = page.getByRole('row').filter({ hasText: 'Checkout API' })
  await expect(row.getByText('Up', { exact: true })).toBeVisible()
})

test('a failing API shows as Down, with the reason', async ({ page }) => {
  await targetApi.setHealthy(false)
  await signedInCustomer(page)
  await createMonitorInUi(page, { name: 'Flaky API', url: urls.target })
  await expect(page.getByText('Down', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('cell', { name: text.detail.recent.failed })).toBeVisible()
  await expect(page.getByText(content.enums.checkError.UNEXPECTED_STATUS).first()).toBeVisible()
})

test('the form explains mistakes before anything is sent', async ({ page }) => {
  await signedInCustomer(page)
  await page.goto(paths.client.monitorNew)
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(content.validation.required(form.name))).toBeVisible()
  await expect(page.getByText(content.validation.required(form.url))).toBeVisible()

  await page.getByLabel(startsWith(form.url)).fill('ftp://example.com')
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(content.validation.url)).toBeVisible()
  await expect(page).toHaveURL(/monitors\/new$/)
})

test('headers and the request body appear only when they apply', async ({ page }) => {
  await signedInCustomer(page)
  await page.goto(paths.client.monitorNew)
  await expect(page.getByLabel(form.body)).toHaveCount(0) // GET has no body
  await page.getByLabel(form.method).selectOption('POST')
  await expect(page.getByLabel(form.body)).toBeVisible()
  await page.getByLabel(form.method).selectOption('GET')
  await expect(page.getByLabel(form.body)).toHaveCount(0)

  await page.getByRole('button', { name: form.addHeader }).click()
  await page.getByLabel(startsWith(form.name)).fill('With headers')
  await page.getByLabel(startsWith(form.url)).fill(urls.target)
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(content.validation.headerName)).toBeVisible()
  await expect(page.getByText(content.validation.headerValue)).toBeVisible()

  await page.getByLabel(form.headerName).fill('X-Api-Key')
  await page.getByLabel(form.headerValue).fill('secret')
  await page.getByRole('button', { name: form.addHeader }).click()
  await page.getByLabel(form.headerName).nth(1).fill('x-api-key')
  await page.getByLabel(form.headerValue).nth(1).fill('other')
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(content.validation.headerDuplicate)).toBeVisible()

  await page.getByRole('button', { name: form.removeHeader }).nth(1).click()
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByRole('heading', { name: 'With headers' })).toBeVisible()
})

test('the plan limit is explained on the list and by the server when exceeded', async ({ page }) => {
  const customer = await signedInCustomer(page)
  for (let i = 1; i <= 5; i++) await addMonitor({ clientId: customer.clientId, name: `Monitor ${i}` })

  await page.goto(paths.client.monitors)
  await expect(page.getByText(text.list.limitReached(5))).toBeVisible()
  await expect(page.getByText(text.list.usage(5, 5))).toBeVisible()

  await page.getByRole('link', { name: text.new }).click()
  await page.getByLabel(startsWith(form.name)).fill('One too many')
  await page.getByLabel(startsWith(form.url)).fill(urls.target)
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByRole('alert').getByText(/FREE plan allows up to 5 monitors/)).toBeVisible()
})

test('plan limits shape the choices: a FREE plan offers no check faster than every 5 minutes', async ({ page }) => {
  await signedInCustomer(page)
  await page.goto(paths.client.monitorNew)
  const interval = page.getByLabel(form.interval)
  await expect(interval).toBeVisible()
  const options = await interval.locator('option').allTextContents()
  expect(options.length).toBeGreaterThan(3)
  expect(options.join(' ')).not.toMatch(/\b30\s?s|\b1\s?min\b/i)
  await expect(page.getByText(/allows checks as often as every/)).toBeVisible()
})

test('edit a monitor', async ({ page }) => {
  await signedInCustomer(page)
  await createMonitorInUi(page, { name: 'Before', url: urls.target })
  await page.getByRole('link', { name: text.actions.edit }).click()
  await expect(page.getByLabel(startsWith(form.name))).toHaveValue('Before')
  await page.getByLabel(startsWith(form.name)).fill('After')
  await page.getByLabel(form.expectedStatus).fill('204')
  await page.getByRole('button', { name: form.submitEdit }).click()
  await expect(page.getByText(text.toasts.updated)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'After' })).toBeVisible()
  await expect(page.getByText('204').first()).toBeVisible()
})

test('pause and resume from the monitor page', async ({ page }) => {
  await signedInCustomer(page)
  await createMonitorInUi(page, { name: 'Pausable', url: urls.target })
  await page.getByRole('button', { name: text.actions.pause }).click()
  await expect(page.getByText(text.toasts.paused)).toBeVisible()
  await expect(page.getByText(text.detail.pausedNote)).toBeVisible()
  await expect(page.getByRole('button', { name: text.actions.resume })).toBeVisible()
  await page.getByRole('button', { name: text.actions.resume }).click()
  await expect(page.getByText(text.toasts.resumed)).toBeVisible()
  await expect(page.getByText(text.detail.pausedNote)).toHaveCount(0)
})

test('row menu in the list: view, pause and delete', async ({ page }) => {
  const customer = await signedInCustomer(page)
  await addMonitor({ clientId: customer.clientId, name: 'Row One' })
  await addMonitor({ clientId: customer.clientId, name: 'Row Two' })
  await page.goto(paths.client.monitors)

  await chooseRowAction(page, 'Row One', text.actions.pause)
  await expect(page.getByText(text.toasts.paused)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Row One' }).getByText(content.enums.monitorStatus.PAUSED)).toBeVisible()

  await chooseRowAction(page, 'Row Two', text.actions.delete)
  await expect(page.getByText(text.delete.message('Row Two'))).toBeVisible()
  await page.getByRole('button', { name: text.delete.confirm }).click()
  await expect(page.getByText(text.toasts.deleted)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Row Two' })).toHaveCount(0)

  await chooseRowAction(page, 'Row One', text.actions.view)
  await expect(page.getByRole('heading', { name: 'Row One' })).toBeVisible()
})

test('delete from the monitor page asks first, then returns to the list', async ({ page }) => {
  await signedInCustomer(page)
  await createMonitorInUi(page, { name: 'Doomed', url: urls.target })
  await page.getByRole('button', { name: text.actions.delete }).click()
  await page.getByRole('button', { name: content.common.actions.cancel }).click()
  await expect(page.getByRole('heading', { name: 'Doomed' })).toBeVisible()

  await page.getByRole('button', { name: text.actions.delete }).click()
  await page.getByRole('button', { name: text.delete.confirm }).click()
  await expect(page).toHaveURL(/\/monitors$/)
  await expect(page.getByRole('heading', { name: text.list.empty.title })).toBeVisible()
})

test('search and status filters live in the address bar and can be cleared', async ({ page }) => {
  const customer = await signedInCustomer(page)
  await addMonitor({ clientId: customer.clientId, name: 'Alpha service' })
  await addMonitor({ clientId: customer.clientId, name: 'Beta service' })
  await addMonitor({ clientId: customer.clientId, name: 'Gamma paused', status: 'PAUSED' })
  await page.goto(paths.client.monitors)
  await expect(page.getByRole('row')).toHaveCount(4)

  await page.getByRole('searchbox').fill('alpha')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page).toHaveURL(/search=alpha/)

  await page.goto(`${paths.client.monitors}?status=PAUSED`)
  await expect(page.getByRole('row').filter({ hasText: 'Gamma paused' })).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2)

  await page.goto(`${paths.client.monitors}?search=nothing-like-this`)
  await expect(page.getByRole('heading', { name: text.list.empty.filteredTitle })).toBeVisible()
  await page.getByRole('button', { name: content.common.actions.clear }).click()
  await expect(page.getByRole('row')).toHaveCount(4)
})

test('charts, statistics and the time range selector', async ({ page }) => {
  const customer = await signedInCustomer(page)
  const monitor = await addMonitor({ clientId: customer.clientId, name: 'History API', health: 'UP' })
  await addHistory({ clientId: customer.clientId, monitorId: monitor.id })

  await page.goto(paths.client.monitor(monitor.id))
  await expect(page.getByRole('heading', { name: 'History API' })).toBeVisible()
  await expect(page.locator('.recharts-wrapper')).toHaveCount(2)
  await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
  await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible()
  await expect(page.getByText(content.enums.checkError.UNEXPECTED_STATUS).first()).toBeVisible()

  // Recharts shows its tooltip after real mouse movement over the plot, so move across it like a person would
  const box = await page.locator('.recharts-wrapper').first().boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
  await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 4 })
  await expect(page.locator('.recharts-tooltip-wrapper').first()).toBeVisible()
  await expect(page.locator('.recharts-tooltip-wrapper').first()).toContainText(content.monitors.detail.charts.average)
  await page.screenshot({ path: 'e2e/.results/monitor-detail.png', fullPage: true })

  await page.locator('label', { hasText: content.enums.rangeShort['7d'] }).click()
  await expect(page).toHaveURL(/range=7d/)
  await expect(page.locator('.recharts-wrapper')).toHaveCount(2)
})

test('incidents are listed, filterable, and link back to the monitor', async ({ page }) => {
  const customer = await signedInCustomer(page)
  const monitor = await addMonitor({ clientId: customer.clientId, name: 'Broken API', health: 'DOWN' })
  await addIncident({ clientId: customer.clientId, monitorId: monitor.id, monitorName: 'Broken API', status: 'OPEN' })
  await addIncident({ clientId: customer.clientId, monitorId: monitor.id, monitorName: 'Broken API', status: 'RESOLVED' })

  await page.goto(paths.client.incidents)
  await expect(page.getByText(content.incidents.openCount(1))).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(3)
  await expect(page.getByText(content.enums.checkError.TIMEOUT).first()).toBeVisible()

  await page.locator('label', { hasText: content.enums.incident.OPEN }).click()
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('link', { name: 'Broken API' }).click()
  await expect(page.getByRole('heading', { name: 'Broken API' })).toBeVisible()
  await expect(page.getByRole('heading', { name: text.detail.incidents.title })).toBeVisible()
})

test('an unknown monitor says so instead of failing', async ({ page }) => {
  await signedInCustomer(page)
  await page.goto(paths.client.monitor('64b64b64b64b64b64b64b64b'))
  await expect(page.getByRole('heading', { name: text.detail.notFound.title })).toBeVisible()
  await page.goto(paths.client.monitor('not-an-id'))
  await expect(page.getByRole('heading', { name: text.detail.notFound.title })).toBeVisible()
})

test('the dashboard summarises monitors and plan usage', async ({ page }) => {
  const customer = await signedInCustomer(page)
  await addMonitor({ clientId: customer.clientId, name: 'Dash One', health: 'UP' })
  await addMonitor({ clientId: customer.clientId, name: 'Dash Two', health: 'DOWN' })
  await page.goto(paths.client.dashboard)
  await expect(page.getByText(content.dashboard.stats.monitorsHint(1, 1))).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dash One' })).toBeVisible()
  await expect(page.getByText(content.dashboard.usage.title)).toBeVisible()
  await expect(page.getByRole('progressbar', { name: content.dashboard.usage.monitors })).toHaveAttribute('max', '5')
})
