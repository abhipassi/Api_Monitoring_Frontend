import { cn } from '@/lib/cn.js'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants = {
  primary: 'bg-primary text-fg-inverse hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-hover',
  ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
  danger: 'bg-danger text-fg-inverse hover:bg-danger-hover',
  dangerSoft: 'bg-danger-soft text-danger-soft-fg hover:bg-danger-soft/70',
  link: 'px-0 text-link hover:underline',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

const iconOnlySizes = { sm: 'size-8', md: 'size-10', lg: 'size-11' }

// Shared by <Button>, <ButtonLink> and <IconButton>, so a link that looks like a button is identical to one
export const buttonStyles = ({ variant = 'primary', size = 'md', iconOnly = false, className } = {}) =>
  cn(base, variants[variant], iconOnly ? iconOnlySizes[size] : sizes[size], className)
