import { Brand } from './Brand.jsx'

// The centred card used by sign in, sign up and password screens
export function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Brand className="mb-8" />
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div>}
    </div>
  )
}
