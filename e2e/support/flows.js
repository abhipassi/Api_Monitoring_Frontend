import { content } from '../../src/content/index.js'
import { paths } from '../../src/config/routes.js'
import { PASSWORD } from './env.js'
import { expect, mailbox } from './test.js'

const auth = content.auth

export const uniqueTag = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

// Labels of required fields end with an asterisk, so match on how the label starts
export const startsWith = (text) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)

export async function signIn(page, email, password = PASSWORD, { admin = false } = {}) {
  await page.goto(admin ? paths.admin.login : paths.client.login)
  await page.getByLabel(auth.shared.email).fill(email)
  await page.getByLabel(auth.shared.password, { exact: true }).fill(password)
  await page.getByRole('button', { name: auth.login.submit }).click()
}

// The "choose your own password" page shown after signing in with an emailed password
export async function chooseOwnPassword(page, currentPassword, newPassword = PASSWORD) {
  await expect(page.getByRole('heading', { name: auth.change.title })).toBeVisible()
  await page.getByLabel(auth.shared.currentPassword).fill(currentPassword)
  await page.getByLabel(auth.shared.newPassword, { exact: true }).fill(newPassword)
  await page.getByLabel(auth.shared.confirmPassword).fill(newPassword)
  await page.getByRole('button', { name: auth.change.submit }).click()
  // Wait until the change has gone through and the app has moved on
  await expect(page.getByRole('heading', { name: auth.change.title })).toBeHidden()
}

export async function signOut(page) {
  await page.getByRole('button', { name: content.nav.userMenu }).click()
  await page.getByRole('button', { name: content.common.actions.signOut }).click()
}

// Sign up through the form, read the emailed password, sign in, and replace it. Ends on the dashboard.
export async function registerAndSignIn(page, email, { name = 'Pat Owner', company = 'Pat Co' } = {}) {
  await page.goto(paths.client.register)
  await page.getByLabel(auth.register.name).fill(name)
  await page.getByLabel(auth.register.company).fill(company)
  await page.getByLabel(auth.shared.email).fill(email)
  await page.getByRole('button', { name: auth.register.submit }).click()
  await expect(page.getByRole('heading', { name: auth.register.doneTitle })).toBeVisible()

  const mail = await mailbox.waitFor(email, /account/i)
  const temporary = mailbox.passwordIn(mail)
  await signIn(page, email, temporary)
  await chooseOwnPassword(page, temporary)
  await expect(page.getByRole('heading', { name: content.dashboard.title })).toBeVisible()
  return { email, temporaryPassword: temporary }
}

// Fill in the "new monitor" form and submit it; ends on the new monitor's page
export async function createMonitorInUi(page, { name, url }) {
  const form = content.monitors.form
  await page.goto(paths.client.monitorNew)
  await page.getByLabel(startsWith(form.name)).fill(name)
  await page.getByLabel(startsWith(form.url)).fill(url)
  await page.getByRole('button', { name: form.submitCreate }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

// Open a table row's "..." menu and pick an item
export async function chooseRowAction(page, rowText, actionLabel) {
  const row = page.getByRole('row').filter({ hasText: rowText })
  await row.getByRole('button', { name: content.common.actions.rowActions }).click()
  await page.getByRole('menuitem', { name: actionLabel }).click()
}
