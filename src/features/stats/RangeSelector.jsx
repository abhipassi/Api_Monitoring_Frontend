import { SegmentedControl } from '@/components/ui/SegmentedControl.jsx'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'

// Time range picker (24h / 7d / 30d); the choices come from the API's config
export function RangeSelector({ value, onChange }) {
  const { enums } = useMeta()
  return (
    <SegmentedControl
      label={content.enums.range[value]}
      value={value}
      onChange={onChange}
      options={enums.statRanges.map((range) => ({ value: range, label: content.enums.rangeShort[range] ?? range }))}
    />
  )
}
