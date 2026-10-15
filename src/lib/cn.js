import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Joins class names and lets a later Tailwind class override an earlier one (p-2 then p-4 -> p-4)
export const cn = (...inputs) => twMerge(clsx(inputs))
