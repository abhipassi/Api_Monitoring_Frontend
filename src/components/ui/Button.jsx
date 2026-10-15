import { Link } from 'react-router'

import { buttonStyles } from './buttonStyles.js'
import { Spinner } from './Spinner.jsx'

// Pass `submit` for a form's submit button; every other button is type="button" so it never submits by accident
export function Button({
  variant = 'primary',
  size = 'md',
  submit = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <button
      type={submit ? 'submit' : 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : LeftIcon && <LeftIcon aria-hidden="true" className="size-4" />}
      {children}
      {!loading && RightIcon && <RightIcon aria-hidden="true" className="size-4" />}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', size = 'md', leftIcon: LeftIcon, rightIcon: RightIcon, className, children, ...props }) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {LeftIcon && <LeftIcon aria-hidden="true" className="size-4" />}
      {children}
      {RightIcon && <RightIcon aria-hidden="true" className="size-4" />}
    </Link>
  )
}

// A button that shows only an icon; `label` is required because it is all a screen reader gets
export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={buttonStyles({ variant, size, iconOnly: true, className })}
      {...props}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  )
}
