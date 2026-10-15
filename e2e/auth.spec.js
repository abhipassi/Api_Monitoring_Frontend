import { content } from '../src/content/index.js'
import { paths } from '../src/config/routes.js'
import { EMAIL_DOMAIN, EMAIL_PREFIX, PASSWORD } from './support/env.js'
import { createCustomer } from './support/db.js'
import { chooseOwnPassword, registerAndSignIn, signIn, signOut, uniqueTag } from './support/flows.js'
import { expect, mailbox, test } from './support/test.js'

const auth = content.auth
const emailFor = (tag) => `${EMAIL_PREFIX}${tag}@${EMAIL_DOMAIN}`

test('a visitor who opens a private page is sent to sign in', async ({ page }) => {
  await page.goto(paths.client.monitors)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: auth.login.title })).toBeVisible()
})

test('sign up, use the emailed password once, then choose your own', async ({ page }) => {
  const email = emailFor(uniqueTag('signup'))
  await registerAndSignIn(page, email)

  // The dashboard of a brand-new account invites the first monitor
  await expect(page.getByRole('heading', { name: content.dashboard.empty.title })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test('someone on the emailed password cannot open other pages until they change it', async ({ page }) => {
  const email = emailFor(uniqueTag('forced'))
  await page.goto(paths.client.register)
  await page.getByLabel(auth.register.name).fill('Forced Person')
  await page.getByLabel(auth.register.company).fill('Forced Co')
  await page.getByLabel(auth.shared.email).fill(email)
  await page.getByRole('button', { name: auth.register.submit }).click()
  const temporary = mailbox.passwordIn(await mailbox.waitFor(email, /account/i))

  await signIn(page, email, temporary)
  await expect(page).toHaveURL(/\/change-password$/)
  await page.goto(paths.client.monitors)
  await expect(page).toHaveURL(/\/change-password$/)

  await chooseOwnPassword(page, temporary)
  await page.goto(paths.client.monitors)
  await expect(page.getByRole('heading', { name: content.monitors.title, exact: true })).toBeVisible()
})

test('the change-password form explains its own mistakes', async ({ page }) => {
  const email = emailFor(uniqueTag('mistakes'))
  await page.goto(paths.client.register)
  await page.getByLabel(auth.register.name).fill('Mistake Maker')
  await page.getByLabel(auth.register.company).fill('Oops Co')
  await page.getByLabel(auth.shared.email).fill(email)
  await page.getByRole('button', { name: auth.register.submit }).click()
  const temporary = mailbox.passwordIn(await mailbox.waitFor(email, /account/i))
  await signIn(page, email, temporary)

  await page.getByRole('button', { name: auth.change.submit }).click()
  await expect(page.getByText(content.validation.required(auth.shared.currentPassword))).toBeVisible()

  await page.getByLabel(auth.shared.currentPassword).fill(temporary)
  await page.getByLabel(auth.shared.newPassword, { exact: true }).fill('short')
  await page.getByLabel(auth.shared.confirmPassword).fill('different')
  await page.getByRole('button', { name: auth.change.submit }).click()
  await expect(page.getByText(content.validation.passwordMin(8))).toBeVisible()
  await expect(page.getByText(content.validation.passwordsDiffer)).toBeVisible()

  await page.getByLabel(auth.shared.currentPassword).fill('not-the-password')
  await page.getByLabel(auth.shared.newPassword, { exact: true }).fill('a-good-new-password')
  await page.getByLabel(auth.shared.confirmPassword).fill('a-good-new-password')
  await page.getByRole('button', { name: auth.change.submit }).click()
  await expect(page.getByRole('alert').getByText(/current password is incorrect/i)).toBeVisible()
})

test('a wrong password is explained and keeps you on the page', async ({ page }) => {
  const { email } = await createCustomer({ tag: uniqueTag('wrong') })
  await signIn(page, email, 'not-the-password')
  await expect(page.getByRole('alert').getByText(/invalid email or password/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('empty and malformed sign-in details are caught before sending', async ({ page }) => {
  await page.goto(paths.client.login)
  await page.getByRole('button', { name: auth.login.submit }).click()
  await expect(page.getByText(content.validation.required(content.common.fields.email))).toBeVisible()
  await expect(page.getByText(content.validation.required(auth.shared.password))).toBeVisible()
  await page.getByLabel(auth.shared.email).fill('not-an-email')
  await page.getByRole('button', { name: auth.login.submit }).click()
  await expect(page.getByText(content.validation.email)).toBeVisible()
})

test('forgot password: request a link, open it from the email, set a new password, sign in', async ({ page }) => {
  const { email } = await createCustomer({ tag: uniqueTag('forgot') })

  await page.goto(paths.client.forgotPassword)
  await page.getByLabel(auth.shared.email).fill(email)
  await page.getByRole('button', { name: auth.forgot.submit }).click()
  await expect(page.getByText(auth.forgot.doneTitle)).toBeVisible()

  const mail = await mailbox.waitFor(email, /reset/i)
  const link = mailbox.linkIn(mail, /http:\/\/localhost:\d+\/reset-password\?token=[0-9a-f]+/)
  expect(link).toBeTruthy()

  await page.goto(link)
  await page.getByLabel(auth.shared.newPassword, { exact: true }).fill('brand-new-password-1')
  await page.getByLabel(auth.shared.confirmPassword).fill('brand-new-password-1')
  await page.getByRole('button', { name: auth.reset.submit }).click()
  await expect(page.getByText(auth.reset.doneTitle).first()).toBeVisible()

  await signIn(page, email, 'brand-new-password-1')
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()

  // The same link cannot be used twice
  await page.goto(link)
  await page.getByLabel(auth.shared.newPassword, { exact: true }).fill('another-password-22')
  await page.getByLabel(auth.shared.confirmPassword).fill('another-password-22')
  await page.getByRole('button', { name: auth.reset.submit }).click()
  await expect(page.getByRole('alert').getByText(/invalid or has expired/i)).toBeVisible()
})

test('a reset page without a token offers a way to request a new link', async ({ page }) => {
  await page.goto(paths.client.resetPassword)
  await expect(page.getByText(auth.reset.missingToken)).toBeVisible()
  await page.getByRole('link', { name: auth.reset.requestNew }).click()
  await expect(page).toHaveURL(/forgot-password$/)
})

test('signing out ends the session', async ({ page }) => {
  const { email } = await createCustomer({ tag: uniqueTag('signout') })
  await signIn(page, email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await signOut(page)
  await expect(page).toHaveURL(/\/login$/)
  await page.goto(paths.client.monitors)
  await expect(page).toHaveURL(/\/login$/)
})

test('a signed-in person visiting the sign-in page is sent to the dashboard', async ({ page }) => {
  const { email } = await createCustomer({ tag: uniqueTag('already') })
  await signIn(page, email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await page.goto(paths.client.login)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
})

test('staff and customer sessions are separate', async ({ page }) => {
  const { email } = await createCustomer({ tag: uniqueTag('separate') })
  await signIn(page, email)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  await page.goto(paths.admin.customers)
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: auth.login.adminTitle })).toBeVisible()
  // and the customer's own password does not work on the staff sign-in
  await signIn(page, email, PASSWORD, { admin: true })
  await expect(page.getByRole('alert')).toBeVisible()
})
