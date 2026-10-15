import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { addMonitor, createCustomer, staffEmail } from './support/db.js'
import { EMAIL_DOMAIN, EMAIL_PREFIX } from './support/env.js'
import { chooseOwnPassword, chooseRowAction, signIn, signOut, startsWith, uniqueTag } from './support/flows.js'
import { expect, mailbox, test } from './support/test.js'

const admin = content.admin
const nav = content.nav.admin

const asSuper = async (page) => {
  await signIn(page, staffEmail('Sam Super'), undefined, { admin: true })
  await expect(page.getByRole('heading', { name: admin.dashboard.title })).toBeVisible()
}

test('staff sign in separately and the super admin sees every section', async ({ page }) => {
  await asSuper(page)
  for (const label of [nav.dashboard, nav.customers, nav.planRequests, nav.employees, nav.auditLog, nav.account]) {
    await expect(page.getByRole('link', { name: label })).toBeVisible()
  }
  await expect(page.getByText(content.nav.areaLabel.admin)).toBeVisible()
})

test('the overview shows platform totals', async ({ page }) => {
  const customer = await createCustomer({ tag: uniqueTag('ov'), plan: 'STARTER' })
  await addMonitor({ clientId: customer.clientId, name: 'Overview mon', health: 'UP' })
  await asSuper(page)
  await expect(page.getByRole('main').getByText(admin.dashboard.stats.customers, { exact: true })).toBeVisible()
  await expect(page.getByText(admin.dashboard.stats.revenueSample)).toBeVisible()
  await expect(page.getByText(admin.dashboard.byPlan.title)).toBeVisible()
})

test('a staff member with only "view customers" sees less, and cannot change anything', async ({ page }) => {
  const customer = await createCustomer({ tag: uniqueTag('ro') })
  await signIn(page, staffEmail('Rita Reader'), undefined, { admin: true })
  await expect(page.getByRole('heading', { name: admin.dashboard.title })).toBeVisible()
  await expect(page.getByRole('link', { name: nav.customers })).toBeVisible()
  for (const label of [nav.planRequests, nav.employees, nav.auditLog]) {
    await expect(page.getByRole('link', { name: label })).toHaveCount(0)
  }

  // typing the address of a page they may not open shows "No access"
  await page.goto(paths.admin.planRequests)
  await expect(page.getByRole('heading', { name: content.errors.forbidden.title })).toBeVisible()
  await page.goto(paths.admin.employees)
  await expect(page.getByRole('heading', { name: content.errors.forbidden.title })).toBeVisible()

  await page.goto(paths.admin.customer(customer.clientId))
  await expect(page.getByText(admin.customer.manage.noPermission)).toBeVisible()
  await expect(page.getByRole('button', { name: admin.customer.manage.applyPlan })).toBeDisabled()
  await expect(page.getByRole('button', { name: admin.customer.manage.suspend })).toBeDisabled()
})

test('customers: search, open one, change the plan, and see the change in the audit log', async ({ page }) => {
  const tag = uniqueTag('cust')
  const customer = await createCustomer({ tag })
  await addMonitor({ clientId: customer.clientId, name: 'C one' })
  await asSuper(page)
  await page.getByRole('link', { name: nav.customers }).click()

  await page.getByRole('searchbox').fill(tag)
  const row = page.getByRole('row').filter({ hasText: customer.companyName })
  await expect(row).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(row.getByText(content.enums.plan.FREE)).toBeVisible()
  await row.getByRole('link', { name: customer.companyName }).click()

  await expect(page.getByRole('heading', { name: customer.companyName })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: content.billing.current.monitors })).toHaveAttribute('max', '5')
  await page.getByLabel(admin.customer.manage.planLabel).selectOption('STARTER')
  await page.getByRole('button', { name: admin.customer.manage.applyPlan }).click()
  await expect(page.getByText(admin.customer.toasts.planChanged)).toBeVisible()
  await expect(page.getByRole('progressbar', { name: content.billing.current.monitors })).toHaveAttribute('max', '50')
  await expect(page.getByText(/Plan: Free → Starter/)).toBeVisible()

  const mail = await mailbox.waitFor(customer.email, /plan was changed/i)
  expect(mail.raw).toContain('from Free to Starter')

  await page.getByRole('link', { name: nav.auditLog }).click()
  await expect(page.getByText(/Plan: Free → Starter/).first()).toBeVisible()
  await expect(page.getByText(content.enums.auditAction['client.update']).first()).toBeVisible()
})

test('downgrading explains what will not fit', async ({ page }) => {
  const customer = await createCustomer({ tag: uniqueTag('down'), plan: 'STARTER' })
  for (let i = 1; i <= 7; i++) await addMonitor({ clientId: customer.clientId, name: `Many ${i}` })
  await asSuper(page)
  await page.goto(paths.admin.customer(customer.clientId))
  await page.getByLabel(admin.customer.manage.planLabel).selectOption('FREE')
  await page.getByRole('button', { name: admin.customer.manage.applyPlan }).click()
  await expect(page.getByText(admin.customer.warningsTitle)).toBeVisible()
  await expect(page.getByText(/7 monitors exist but the Free plan allows 5/)).toBeVisible()
})

test('suspending locks the customer out; restoring lets them back in', async ({ page, browser }) => {
  const customer = await createCustomer({ tag: uniqueTag('susp') })
  const context = await browser.newContext()
  const owner = await context.newPage()
  await signIn(owner, customer.email)
  await expect(owner.getByRole('heading', { name: content.dashboard.title })).toBeVisible()

  await asSuper(page)
  await page.goto(paths.admin.customer(customer.clientId))
  await page.getByRole('button', { name: admin.customer.manage.suspend }).click()
  await expect(page.getByText(admin.customer.confirm.suspendMessage(customer.companyName))).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: admin.customer.confirm.suspendAction }).click()
  await expect(page.getByText(admin.customer.toasts.suspended)).toBeVisible()
  await expect(page.getByText(content.enums.clientStatus.SUSPENDED).first()).toBeVisible()

  // the customer's existing session no longer works...
  await owner.goto(paths.client.monitors)
  await expect(owner.getByRole('heading', { name: content.monitors.title })).toHaveCount(0)
  // ...and they cannot sign in again
  await signIn(owner, customer.email)
  await expect(owner.getByRole('alert')).toContainText(/unavailable/i)

  await page.getByRole('button', { name: admin.customer.manage.restore }).click()
  await page.getByRole('dialog').getByRole('button', { name: admin.customer.confirm.restoreAction }).click()
  await expect(page.getByText(admin.customer.toasts.restored)).toBeVisible()
  await signIn(owner, customer.email)
  // signed back in, and returned to the page they were trying to open when they were locked out
  await expect(owner.getByText(content.nav.areaLabel.client)).toBeVisible()
  await expect(owner.getByRole('heading', { name: content.monitors.title, exact: true })).toBeVisible()
  await context.close()
})

test('add a staff member with limited permissions; they set their own password and see only what they may', async ({ page, browser }) => {
  await asSuper(page)
  await page.getByRole('link', { name: nav.employees }).click()
  const email = `${EMAIL_PREFIX}${uniqueTag('hire')}@${EMAIL_DOMAIN}`
  const form = admin.employees.form

  await page.getByRole('button', { name: admin.employees.add }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: form.submitCreate }).click()
  await expect(dialog.getByText(content.validation.required(form.name))).toBeVisible()

  await dialog.getByLabel(startsWith(form.name)).fill('Hana Hire')
  await dialog.getByLabel(startsWith(form.email)).fill(email)
  await dialog.getByLabel(startsWith(form.phone)).fill(`97${String(Date.now()).slice(-8)}`)
  await dialog.getByLabel('View customers, their usage and incidents').check()
  await dialog.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByText(admin.employees.toasts.created)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Hana Hire' })).toBeVisible()

  const temporary = mailbox.passwordIn(await mailbox.waitFor(email, /account/i))
  const context = await browser.newContext()
  const hire = await context.newPage()
  await signIn(hire, email, temporary, { admin: true })
  await expect(hire).toHaveURL(/\/admin\/change-password$/)
  await chooseOwnPassword(hire, temporary)
  await expect(hire.getByRole('heading', { name: admin.dashboard.title })).toBeVisible()
  await expect(hire.getByRole('link', { name: nav.customers })).toBeVisible()
  await expect(hire.getByRole('link', { name: nav.auditLog })).toHaveCount(0)

  // widen their access: it applies on their very next page
  await chooseRowAction(page, 'Hana Hire', admin.employees.edit)
  await page.getByRole('dialog').getByLabel('View the audit log').check()
  await page.getByRole('dialog').getByRole('button', { name: form.submitEdit }).click()
  await expect(page.getByText(admin.employees.toasts.updated)).toBeVisible()
  await hire.reload()
  await expect(hire.getByRole('link', { name: nav.auditLog })).toBeVisible()

  // deactivate them: their session ends
  await chooseRowAction(page, 'Hana Hire', admin.employees.edit)
  await page.getByRole('dialog').getByLabel(form.status).selectOption('INACTIVE')
  await page.getByRole('dialog').getByRole('button', { name: form.submitEdit }).click()
  await expect(page.getByText(admin.employees.toasts.updated)).toBeVisible()
  await hire.goto(paths.admin.customers)
  await expect(hire).toHaveURL(/\/admin\/login$/)
  await context.close()
})

test('a super admin cannot change their own role', async ({ page }) => {
  await asSuper(page)
  await page.getByRole('link', { name: nav.employees }).click()
  await chooseRowAction(page, 'Sam Super', admin.employees.edit)
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(admin.employees.form.role).selectOption('STAFF')
  await dialog.getByRole('button', { name: admin.employees.form.submitEdit }).click()
  await expect(dialog.getByRole('alert').getByText(/can't change your own role/i)).toBeVisible()
})

test('staff can sign out', async ({ page }) => {
  await asSuper(page)
  await signOut(page)
  await expect(page).toHaveURL(/\/admin\/login$/)
})
