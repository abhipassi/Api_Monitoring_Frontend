# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The website for the API-monitoring service in `../Backend`: a customer area (`/`) and a staff area (`/admin`) in one React app. React 19, Vite, Tailwind v4, React Router, TanStack Query, react-hook-form + zod, Recharts.

## Commands

```bash
npm run dev        # http://localhost:5173 (needs ../Backend running; set VITE_API_URL in .env)
npm run check      # lint + unit tests + build
npm run lint       # oxlint + the two guard scripts below
npm test           # vitest
npm run e2e        # Playwright: real browser, real API + worker + MongoDB + Redis (see below)
```

`.env`: `VITE_API_URL` (required, no trailing slash), `VITE_APP_NAME` (tab title until the API answers). The API's `FRONTEND_URL` must be this site's origin or CORS blocks every request.

## The rules this codebase enforces (by lint, not by convention)

1. **No inline CSS.** `style=` is a lint error (`react/forbid-dom-props`, plus `scripts/check-design-rules.js`).
2. **No raw colours anywhere except `src/index.css`.** Components use tokens (`bg-surface`, `text-fg-muted`, `border-line`, `bg-primary`, `text-danger-soft-fg`...). Light and dark come from the same tokens. Tailwind arbitrary values (`w-[137px]`, `bg-[#fff]`) are banned: use the scale or add a token.
3. **No sentences in components.** `react/jsx-no-literals` forbids literal text in JSX and the design script forbids literal `placeholder/title/aria-label/alt/label` text. All wording is in `src/content/*.js` (one file per area, `content.<area>.<key>`, functions for text with parameters). `scripts/check-content-keys.js` fails if a `content.a.b` (or `const text = content.a; text.b`) doesn't exist.
4. **No hard-coded URLs or numbers.** Addresses come from `.env` via `src/config/env.js`, API paths from `config/endpoints.js`, page paths from `config/routes.js`, tunables (page size, refresh intervals, interval presets) from `config/app.js`. **Plans, prices, limits, enum values and the staff permission list come from `GET /api/meta`** (`useMeta()`); never type a plan name or limit. Plans are edited by staff, so look names up with `usePlans()` (`nameOf(key)`, `rankOf(key)`, `activePlans`) or show them with `<PlanBadge planKey>` (both in `features/meta/`); there is no `content.enums.plan`. `meta.plans` includes archived plans (`isActive:false`): offer only active plans for choosing, but keep showing the plan a customer is already on.
5. `Button` is `type="button"` unless you pass `submit`.

## Structure

- `src/components/ui/` reusable primitives (Button/IconButton/ButtonLink, fields, Card, Badge/StatusBadge, Alert/ErrorList, DataTable, Pagination, Modal/ConfirmDialog (native `<dialog>`), Drawer, ActionMenu (native popover + CSS anchor positioning, class `.menu-popover`), SegmentedControl (real radios), SearchInput, Meter (native `<progress>`), StatCard, EmptyState, PageHeader...). `components/charts` (Recharts with token colours), `components/layout` (AppShell, nav config in `navigation.js`), `components/feedback` (toasts, loaders, error boundary).
- `StatusBadge kind="health" value="DOWN"`: tone from `constants/tones.js`, label from `content/enums.js`, unknown values fall back to `humanize()`. Add new statuses to both.
- **Admin Plans screen:** `pages/admin/AdminPlansPage.jsx` + `features/admin/PlanFormModal.jsx` + `planSchema.js` (zod; the allowed range of each limit comes from `meta.limits.planLimits`, not typed). Features are typed one per line. After a plan change `useCreatePlan`/`useUpdatePlan` also invalidate `queryKeys.meta` and billing, because plans are part of the site-wide config. The menu item and route need the `plans.manage` permission.
- `src/features/<area>/` data hooks (`api.js`, TanStack Query; mutations invalidate by `config/queryKeys.js`), feature components, zod schemas. `src/pages/{auth,client,admin,shared}`.
- **Two realms, one set of screens** (`config/realms.js`): `AuthProvider realm="client"|"admin"` gives each area its own token (`localStorage`), endpoints and paths, so Login/Forgot/Reset/ChangePassword/Account pages are written once. `lib/api.js` picks the token by URL prefix, turns every failure into `ApiError`, and emits `auth:expired` / `auth:password-change-required` events. Guards in `features/auth/guards.jsx`; someone still on the emailed password can only reach `/change-password`.
- Lists keep filters, search and page in the URL (`hooks/useListParams`). Formatting uses `Intl` with the browser's locale (`lib/format.js`); uptime values are 0-100.
- Staff pages are permission-aware (`useAuth().can('clients.manage')`); the backend enforces them again.

## Tests

- `vitest` unit tests live beside the code (`*.test.js[x]`): formatting, schemas, UI primitives, route guards, list params.
- `e2e/` Playwright (Chromium; `npx playwright install chromium` once). **It runs on its own database `<your database>_e2e`** (address derived from the Backend's `.env` in `e2e/support/env.js`), where the API creates its own starting plans, so plans edited in your real database can't break a test. Test plans use the key prefix `ZZE2E_` and are removed afterwards. `playwright.config.js` starts a support process (fake SMTP server, a controllable "monitored API", mail-reading HTTP endpoint, the monitor worker), the real Backend API (`NODE_ENV=test`, private Redis prefix `apimon-e2e`) and Vite on port 5180. Test data is only `zz-e2e-*@example.com` and is removed before and after. Specs use labels from `src/content` instead of retyping them. Any browser `pageerror` or `console.error` fails a test.
- The e2e harness imports the Backend's models by relative path (`../../../Backend`), so both folders must sit side by side.
