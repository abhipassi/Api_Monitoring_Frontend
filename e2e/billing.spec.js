import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { addMonitor, createCustomer, staffEmail } from './support/db.js'
import { signIn, uniqueTag } from './support/flows.js'
import { expect, mailbox, test } from './support/test.js'

const text = content.billing

const ownerOnBilling = async (page, options = {}) => {
  const customer = await createCustomer({ tag: uniqueTag('bill'), ...options })
  await signIn(page, customer.email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await page.goto(paths.client.billing)
  await expect(page.getByRole('heading', { name: text.title })).toBeVisible()
  return customer
}

const staffOnRequests = async (browser) => {
  const context = await browser.newContext()
  const staff = await context.newPage()
  await signIn(staff, staffEmail('Sam Super'), undefined, { admin: true })
  await expect(staff.getByRole('heading', { name: content.admin.dashboard.title })).toBeVisible()
  await staff.goto(paths.admin.planRequests)
  await expect(staff.getByRole('heading', { name: content.admin.planRequests.title })).toBeVisible()
  return { staff, context }
}

test('the billing page shows the plan, usage, and says the prices are samples', async ({ page }) => {
  await ownerOnBilling(page)
  await expect(page.getByText(text.sampleNotice.title)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible()
  await expect(page.getByText(text.current.usageTitle)).toBeVisible()
  await expect(page.getByRole('progressbar', { name: text.current.monitors })).toHaveAttribute('max', '5')
  // three plans, written from the API's limits
  await expect(page.getByRole('heading', { name: 'Starter', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Enterprise', exact: true })).toBeVisible()
  await expect(page.getByText(text.plans.features.monitors(50))).toBeVisible()
  await expect(page.getByText(text.plans.features.team(100))).toBeVisible()
  await expect(page.getByRole('region', { name: text.plans.title }).getByText(text.plans.current)).toBeVisible()
})

test('ask for an upgrade with a note, see it waiting, and cancel it', async ({ page }) => {
  await ownerOnBilling(page)
  await page.getByRole('button', { name: text.plans.requestUpgrade }).first().click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: text.request.title('Starter') })).toBeVisible()
  await page.getByLabel(text.request.note).fill('We are growing')
  await page.getByRole('button', { name: text.request.submit }).click()
  await expect(page.getByText(text.toasts.sent)).toBeVisible()

  await expect(page.getByText(text.pending.title('Starter'))).toBeVisible()
  // while one is waiting the other plans can't be requested
  await expect(page.getByRole('button', { name: text.plans.requestUpgrade })).toBeDisabled()
  await expect(page.getByRole('row').filter({ hasText: content.enums.planRequest.PENDING })).toBeVisible()

  await page.getByRole('button', { name: text.pending.cancel }).click()
  await expect(page.getByText(text.toasts.canceled)).toBeVisible()
  await expect(page.getByText(text.pending.title('Starter'))).toHaveCount(0)
})

test('staff approve the request, the customer is emailed and their plan changes', async ({ page, browser }) => {
  const customer = await ownerOnBilling(page)
  await page.getByRole('button', { name: text.plans.requestUpgrade }).first().click()
  await page.getByRole('button', { name: text.request.submit }).click()
  await expect(page.getByText(text.toasts.sent)).toBeVisible()

  const { staff, context } = await staffOnRequests(browser)
  const row = staff.getByRole('row').filter({ hasText: customer.companyName })
  await expect(row).toBeVisible()
  await expect(row.getByText(content.enums.direction.UPGRADE)).toBeVisible()
  await row.getByRole('button', { name: content.admin.planRequests.approve }).click()
  await staff.getByLabel(content.admin.planRequests.noteLabel).fill('Welcome aboard')
  await staff.getByRole('dialog').getByRole('button', { name: content.admin.planRequests.approve }).click()
  await expect(staff.getByText(content.admin.planRequests.toasts.approved)).toBeVisible()
  await context.close()

  const mail = await mailbox.waitFor(customer.email, /plan was changed/i)
  expect(mail.raw).toContain('Welcome aboard')

  await page.reload()
  await expect(page.getByRole('region', { name: text.plans.title }).getByText(text.plans.current)).toBeVisible()
  await expect(page.getByRole('progressbar', { name: text.current.monitors })).toHaveAttribute('max', '50')
  await expect(page.getByRole('row').filter({ hasText: content.enums.planRequest.APPROVED })).toBeVisible()
})

test('a rejection keeps the plan and gives the reason', async ({ page, browser }) => {
  const customer = await ownerOnBilling(page)
  await page.getByRole('button', { name: text.plans.requestUpgrade }).nth(1).click()
  await page.getByRole('button', { name: text.request.submit }).click()
  await expect(page.getByText(text.toasts.sent)).toBeVisible()

  const { staff, context } = await staffOnRequests(browser)
  await staff.getByRole('row').filter({ hasText: customer.companyName }).getByRole('button', { name: content.admin.planRequests.reject }).click()
  await staff.getByLabel(content.admin.planRequests.noteLabel).fill('Please talk to sales first')
  await staff.getByRole('dialog').getByRole('button', { name: content.admin.planRequests.reject }).click()
  await expect(staff.getByText(content.admin.planRequests.toasts.rejected)).toBeVisible()
  await context.close()

  const mail = await mailbox.waitFor(customer.email, /not approved/i)
  expect(mail.raw).toContain('Please talk to sales first')
  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: content.enums.planRequest.REJECTED })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Please talk to sales first' })).toBeVisible()
})

test('a downgrade warns about what will not fit', async ({ page }) => {
  const customer = await ownerOnBilling(page, { plan: 'STARTER' })
  for (let i = 1; i <= 6; i++) await addMonitor({ clientId: customer.clientId, name: `Big ${i}` })
  await page.reload()
  await page.getByRole('button', { name: text.plans.requestDowngrade }).click()
  await page.getByRole('button', { name: text.request.submit }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: text.request.sentTitle })).toBeVisible()
  await expect(page.getByRole('dialog').getByText(/6 monitors exist but the Free plan allows 5/)).toBeVisible()
  await page.getByRole('button', { name: content.common.actions.close }).first().click()
})
