import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { createCustomer } from './support/db.js'
import { EMAIL_DOMAIN, EMAIL_PREFIX } from './support/env.js'
import { chooseOwnPassword, chooseRowAction, signIn, uniqueTag } from './support/flows.js'
import { expect, mailbox, test } from './support/test.js'

const text = content.team
const form = text.addForm

const emailFor = (tag) => `${EMAIL_PREFIX}${tag}@${EMAIL_DOMAIN}`

const ownerOnTeamPage = async (page, options = {}) => {
  const customer = await createCustomer({ tag: uniqueTag('team'), ...options })
  await signIn(page, customer.email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await page.goto(paths.client.team)
  await expect(page.getByRole('heading', { name: text.title })).toBeVisible()
  return customer
}

const addMember = async (page, { name, email, role }) => {
  await page.getByRole('button', { name: text.add }).click()
  await page.getByLabel(form.name).fill(name)
  await page.getByLabel(form.email).fill(email)
  if (role) await page.getByLabel(form.role).selectOption(role)
  await page.getByRole('button', { name: form.submit }).click()
}

test('the owner sees themselves and the seat usage', async ({ page }) => {
  await ownerOnTeamPage(page)
  await expect(page.getByText(text.seats(1, 2))).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Olive Owner' }).getByText(content.common.states.you)).toBeVisible()
  // there is no menu on your own row
  await expect(page.getByRole('row').filter({ hasText: 'Olive Owner' }).getByRole('button')).toHaveCount(0)
})

test('add a teammate: they get a password by email and must choose their own', async ({ page, browser }) => {
  await ownerOnTeamPage(page)
  const email = emailFor(uniqueTag('mate'))
  await addMember(page, { name: 'Mia Member', email })
  await expect(page.getByText(text.toasts.added)).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: 'Mia Member' })
  await expect(row).toBeVisible()
  await expect(row.getByText(text.pending)).toBeVisible()
  await expect(page.getByText(text.seats(2, 2))).toBeVisible()

  const mail = await mailbox.waitFor(email, /team account/i)
  expect(mail.raw).toContain('Olive Owner added you')
  const temporary = mailbox.passwordIn(mail)

  // the teammate, in their own browser session
  const context = await browser.newContext()
  const mate = await context.newPage()
  await signIn(mate, email, temporary)
  await expect(mate).toHaveURL(/\/change-password$/)
  await chooseOwnPassword(mate, temporary)
  await expect(mate.getByRole('heading', { name: content.dashboard.title })).toBeVisible()

  // members don't see Billing, and can look at the team but not change it
  await expect(mate.getByRole('link', { name: content.nav.client.billing })).toHaveCount(0)
  await mate.goto(paths.client.team)
  await expect(mate.getByText(text.ownerOnlyNote)).toBeVisible()
  await expect(mate.getByRole('button', { name: text.add })).toHaveCount(0)
  await mate.goto(paths.client.billing)
  await expect(mate.getByRole('heading', { name: content.billing.ownerOnly.title })).toBeVisible()
  await context.close()

  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: 'Mia Member' }).getByText(text.pending).filter({ visible: true })).toHaveCount(0)
})

test('the seat limit stops a third person and explains why', async ({ page }) => {
  await ownerOnTeamPage(page)
  await addMember(page, { name: 'Seat Taker', email: emailFor(uniqueTag('seat')) })
  await expect(page.getByText(text.toasts.added)).toBeVisible()
  await expect(page.getByText(text.limitReached(2))).toBeVisible()
  await expect(page.getByRole('button', { name: text.add })).toBeDisabled()
})

test('the add form catches mistakes and the server refuses an email already in use', async ({ page }) => {
  const other = await createCustomer({ tag: uniqueTag('taken') })
  await ownerOnTeamPage(page)
  await page.getByRole('button', { name: text.add }).click()
  await page.getByRole('button', { name: form.submit }).click()
  await expect(page.getByText(content.validation.required(form.name))).toBeVisible()
  await expect(page.getByText(content.validation.required(content.common.fields.email))).toBeVisible()

  await page.getByLabel(form.name).fill('Dup')
  await page.getByLabel(form.email).fill(other.email)
  await page.getByRole('button', { name: form.submit }).click()
  await expect(page.getByRole('alert').getByText(/already exists/i)).toBeVisible()
})

test('change a role, disable someone (ending their session at once), restore, and remove', async ({ page, browser }) => {
  await ownerOnTeamPage(page)
  const email = emailFor(uniqueTag('roles'))
  await addMember(page, { name: 'Rory Roles', email })
  await expect(page.getByText(text.toasts.added)).toBeVisible()

  const temporary = mailbox.passwordIn(await mailbox.waitFor(email, /team account/i))
  const context = await browser.newContext()
  const mate = await context.newPage()
  await signIn(mate, email, temporary)
  await chooseOwnPassword(mate, temporary)
  await expect(mate.getByRole('heading', { name: content.dashboard.title })).toBeVisible()

  await chooseRowAction(page, 'Rory Roles', text.rowActions.makeOwner)
  await expect(page.getByText(text.toasts.updated).first()).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Rory Roles' }).getByText(content.enums.role.OWNER).filter({ visible: true })).toBeVisible()
  await chooseRowAction(page, 'Rory Roles', text.rowActions.makeMember)
  await expect(page.getByRole('row').filter({ hasText: 'Rory Roles' }).getByText(content.enums.role.MEMBER).filter({ visible: true })).toBeVisible()

  await chooseRowAction(page, 'Rory Roles', text.rowActions.disable)
  await expect(page.getByText(text.disable.message('Rory Roles'))).toBeVisible()
  await page.getByRole('button', { name: text.disable.confirm }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Rory Roles' }).getByText(content.enums.memberStatus.DISABLED).filter({ visible: true })).toBeVisible()

  // the teammate's open session is refused on their next request
  await mate.goto(paths.client.monitors)
  await expect(mate).toHaveURL(/\/login$/)

  await chooseRowAction(page, 'Rory Roles', text.rowActions.enable)
  await expect(page.getByRole('row').filter({ hasText: 'Rory Roles' }).getByText(content.enums.memberStatus.ACTIVE).filter({ visible: true })).toBeVisible()

  await chooseRowAction(page, 'Rory Roles', text.rowActions.remove)
  await page.getByRole('button', { name: text.remove.confirm }).click()
  await expect(page.getByText(text.toasts.removed)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Rory Roles' })).toHaveCount(0)
  await context.close()
})

test('resend login details to someone who has not signed in yet', async ({ page }) => {
  await ownerOnTeamPage(page)
  const email = emailFor(uniqueTag('resend'))
  await addMember(page, { name: 'Rae Resend', email })
  await expect(page.getByText(text.toasts.added)).toBeVisible()
  const first = mailbox.passwordIn(await mailbox.waitFor(email, /team account/i))

  await chooseRowAction(page, 'Rae Resend', text.rowActions.resend)
  await expect(page.getByText(text.toasts.resent)).toBeVisible()
  await expect.poll(async () => (await mailbox.all(email)).length).toBe(2)
  const second = mailbox.passwordIn((await mailbox.all(email)).at(-1))
  expect(second).not.toBe(first)
})
