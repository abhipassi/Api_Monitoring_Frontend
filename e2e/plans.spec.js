import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { createCustomer, staffEmail } from './support/db.js'
import { PLAN_KEY_PREFIX } from './support/env.js'
import { chooseRowAction, signIn, startsWith, uniqueTag } from './support/flows.js'
import { expect, test } from './support/test.js'

const text = content.admin.plans
const form = text.form
const nav = content.nav.admin

const asSuper = async (page) => {
  await signIn(page, staffEmail('Sam Super'), undefined, { admin: true })
  await expect(page.getByRole('heading', { name: content.admin.dashboard.title })).toBeVisible()
}

// Keys are capital letters, digits and underscores
const newKey = () => `${PLAN_KEY_PREFIX}${uniqueTag('p').toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 24)

const fillPlan = async (dialog, { key, name, description = '', price = '12', limits = {}, features = '' }) => {
  if (key) await dialog.getByLabel(startsWith(form.key)).fill(key)
  await dialog.getByLabel(startsWith(form.name)).fill(name)
  await dialog.getByLabel(form.description).fill(description)
  await dialog.getByLabel(startsWith(form.price)).fill(price)
  const values = { maxMonitors: '10', minIntervalSeconds: '60', maxTimeoutSeconds: '30', maxTeamMembers: '5', retentionDays: '14', ...limits }
  for (const [field, value] of Object.entries(values)) await dialog.getByLabel(startsWith(form.limits[field])).fill(value)
  if (features) await dialog.getByLabel(form.features).fill(features)
}

const createPlan = async (page, plan) => {
  await page.goto(paths.admin.plans)
  await page.getByRole('button', { name: text.new }).click()
  const dialog = page.getByRole('dialog')
  await fillPlan(dialog, plan)
  await dialog.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(text.toasts.created)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: plan.key })).toBeVisible()
}

test('the plans page lists the starting plans with their customers, and is only for people allowed to manage plans', async ({ page }) => {
  await asSuper(page)
  await expect(page.getByRole('link', { name: nav.plans })).toBeVisible()
  await page.getByRole('link', { name: nav.plans }).click()
  await expect(page.getByRole('heading', { name: text.title, exact: true })).toBeVisible()
  for (const key of ['FREE', 'STARTER', 'ENTERPRISE']) {
    await expect(page.getByRole('row').filter({ hasText: key }).first()).toBeVisible()
  }
  await expect(page.getByRole('row').filter({ hasText: 'FREE' }).getByText(text.badges.default)).toBeVisible()
})

test('staff without the plans permission neither see the page in the menu nor can open it', async ({ page }) => {
  await signIn(page, staffEmail('Rita Reader'), undefined, { admin: true })
  await expect(page.getByRole('heading', { name: content.admin.dashboard.title })).toBeVisible()
  await expect(page.getByRole('link', { name: nav.plans })).toHaveCount(0)
  await page.goto(paths.admin.plans)
  await expect(page.getByRole('heading', { name: content.errors.forbidden.title })).toBeVisible()
})

test('the form explains mistakes before anything is saved', async ({ page }) => {
  await asSuper(page)
  await page.goto(paths.admin.plans)
  await page.getByRole('button', { name: text.new }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: form.submitCreate }).click()
  await expect(dialog.getByText(content.validation.required(form.key))).toBeVisible()
  await expect(dialog.getByText(content.validation.required(form.name))).toBeVisible()
  await expect(dialog.getByText(content.validation.wholeNumber(form.limits.maxMonitors))).toBeVisible()

  await fillPlan(dialog, { key: newKey(), name: 'Bad', limits: { retentionDays: '0' } })
  await dialog.getByLabel(form.features).fill(Array.from({ length: 11 }, (_, i) => `Feature ${i}`).join('\n'))
  await dialog.getByRole('button', { name: form.submitCreate }).click()
  await expect(dialog.getByText(content.validation.atLeast(form.limits.retentionDays, 1))).toBeVisible()
  await expect(dialog.getByText(form.featuresTooMany(10))).toBeVisible()
})

test('create a plan: it appears in the list, in the audit log, and customers see it on their billing page', async ({ page, browser }) => {
  const key = newKey()
  await asSuper(page)
  await createPlan(page, { key, name: 'Team plan', description: 'For small teams', price: '29.5', features: 'Email alerts\nPriority support', limits: { maxMonitors: '25', retentionDays: '14' } })
  const row = page.getByRole('row').filter({ hasText: key })
  await expect(row.getByText('Team plan')).toBeVisible()
  await expect(row.getByText('25', { exact: true })).toBeVisible()
  await expect(row.getByText(text.days(14))).toBeVisible()

  // a customer sees it with everything staff wrote
  const customer = await createCustomer({ tag: uniqueTag('seeplan') })
  const context = await browser.newContext()
  const owner = await context.newPage()
  await signIn(owner, customer.email)
  await expect(owner.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await owner.goto(paths.client.billing)
  const region = owner.getByRole('region', { name: content.billing.plans.title })
  await expect(region.getByRole('heading', { name: 'Team plan' })).toBeVisible()
  await expect(region.getByText('For small teams')).toBeVisible()
  await expect(region.getByText('Priority support')).toBeVisible()
  await expect(region.getByText(content.billing.plans.features.monitors(25))).toBeVisible()
  await expect(region.getByText(content.billing.plans.features.retention(14))).toBeVisible()
  await context.close()

  // and it is in the audit log
  await page.goto(paths.admin.auditLog)
  await expect(page.getByRole('row').filter({ hasText: 'Team plan' }).getByText(content.enums.auditAction['plan.create'])).toBeVisible()
})

test('edit a plan: customers on it get the new limits straight away', async ({ page, browser }) => {
  const key = newKey()
  await asSuper(page)
  await createPlan(page, { key, name: 'Growth', limits: { maxMonitors: '4' } })
  const customer = await createCustomer({ tag: uniqueTag('onplan'), plan: key })
  await page.reload()

  const context = await browser.newContext()
  const owner = await context.newPage()
  await signIn(owner, customer.email)
  await expect(owner.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await owner.goto(paths.client.billing)
  await expect(owner.getByRole('progressbar', { name: content.billing.current.monitors })).toHaveAttribute('max', '4')

  await chooseRowAction(page, key, text.edit)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(form.affected(1))).toBeVisible()
  await expect(dialog.getByLabel(startsWith(form.key))).toBeDisabled()
  await dialog.getByLabel(startsWith(form.limits.maxMonitors)).fill('40')
  await dialog.getByLabel(startsWith(form.name)).fill('Growth plus')
  await dialog.getByRole('button', { name: form.submitEdit }).click()
  await expect(page.getByText(text.toasts.updated)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: key }).getByText('Growth plus')).toBeVisible()

  await owner.reload()
  await expect(owner.getByRole('progressbar', { name: content.billing.current.monitors })).toHaveAttribute('max', '40')
  await expect(owner.getByRole('heading', { name: 'Growth plus' })).toBeVisible()
  await context.close()

  await page.goto(paths.admin.auditLog)
  await expect(page.getByText('Monitors: 4 → 40').first()).toBeVisible()
})

test('shortening history warns first', async ({ page }) => {
  const key = newKey()
  await asSuper(page)
  await createPlan(page, { key, name: 'Memory', limits: { retentionDays: '30' } })
  await createCustomer({ tag: uniqueTag('mem'), plan: key })
  await page.reload()
  await chooseRowAction(page, key, text.edit)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(form.shorterHistory)).toHaveCount(0)
  await dialog.getByLabel(startsWith(form.limits.retentionDays)).fill('7')
  await expect(dialog.getByText(form.shorterHistory)).toBeVisible()
})

test('archiving hides a plan from new customers; customers already on it keep it', async ({ page, browser }) => {
  const key = newKey()
  await asSuper(page)
  await createPlan(page, { key, name: 'Old school' })
  const onIt = await createCustomer({ tag: uniqueTag('stay'), plan: key })
  const other = await createCustomer({ tag: uniqueTag('other') })

  await chooseRowAction(page, key, text.edit)
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(form.isActive).uncheck()
  await dialog.getByRole('button', { name: form.submitEdit }).click()
  await expect(page.getByText(text.toasts.updated)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: key }).getByText(text.badges.archived)).toBeVisible()

  const context = await browser.newContext()
  const stays = await context.newPage()
  await signIn(stays, onIt.email)
  await expect(stays.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await stays.goto(paths.client.billing)
  const stayRegion = stays.getByRole('region', { name: content.billing.plans.title })
  await expect(stayRegion.getByRole('heading', { name: 'Old school' })).toBeVisible()
  await expect(stayRegion.getByText(content.billing.plans.archived)).toBeVisible()

  // a different customer needs a browser of their own (they would share this one's sign-in)
  const otherContext = await browser.newContext()
  const newcomer = await otherContext.newPage()
  await signIn(newcomer, other.email)
  await expect(newcomer.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await newcomer.goto(paths.client.billing)
  await expect(newcomer.getByRole('heading', { name: content.billing.title })).toBeVisible()
  await expect(newcomer.getByRole('region', { name: content.billing.plans.title }).getByRole('heading', { name: 'Old school' })).toHaveCount(0)
  await context.close()
  await otherContext.close()
})

test('the default plan can neither be archived nor unset here', async ({ page }) => {
  await asSuper(page)
  await page.goto(paths.admin.plans)
  await chooseRowAction(page, 'FREE', text.edit)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel(form.isDefault)).toBeDisabled()
  await expect(dialog.getByLabel(form.isActive)).toBeDisabled()
})
