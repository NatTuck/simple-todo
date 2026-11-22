import { cn } from '../lib/cn'
import type { Filter } from '../store/types'

const OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
]

interface FilterTabsProps {
  value: Filter
  counts: Record<Filter, number>
  onChange: (filter: Filter) => void
}

export function FilterTabs({ value, counts, onChange }: FilterTabsProps) {
  return (
    <div className="flex justify-center">
      <div
        role="group"
        aria-label="Filter tasks"
        className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-1 shadow-card"
      >
        {OPTIONS.map((option) => {
          const active = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                active
                  ? 'bg-ink text-canvas shadow-sm'
                  : 'text-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              {option.label}
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  active ? 'text-canvas/60' : 'text-muted/60',
                )}
              >
                {counts[option.value]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
