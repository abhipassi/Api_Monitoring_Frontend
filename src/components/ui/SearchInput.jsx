import { useState } from 'react'
import { Search } from 'lucide-react'

import { appConfig } from '@/config/app.js'
import { content } from '@/content/index.js'
import { useDebouncedCallback } from '@/hooks/useDebounce.js'
import { cn } from '@/lib/cn.js'
import { Input } from './controls.jsx'

// Calls onChange once typing pauses, so a list is not re-fetched on every keystroke
export function SearchInput({ value = '', onChange, placeholder = content.common.search.placeholder, label = content.common.fields.search, className }) {
  const [text, setText] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const notify = useDebouncedCallback(onChange, appConfig.searchDebounceMs)

  // The page can reset the search (e.g. a "clear filters" button); follow it
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
      <Input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        className="pl-9"
        onChange={(event) => {
          setText(event.target.value)
          notify(event.target.value)
        }}
      />
    </div>
  )
}
