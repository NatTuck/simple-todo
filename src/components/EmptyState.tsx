import { Archive, CheckCheck, Sparkles } from 'lucide-react'
import type { Filter } from '../store/types'

const COPY: Record<Filter, { icon: typeof Sparkles; title: string; body: string }> = {
  all: {
    icon: Sparkles,
    title: 'Nothing here yet',
    body: 'Add your first task above — it stays on this device.',
  },
  active: {
    icon: CheckCheck,
    title: 'All clear',
    body: 'No open tasks. Enjoy the quiet.',
  },
  done: {
    icon: Archive,
    title: 'Nothing completed',
    body: 'Finished tasks will collect here.',
  },
}

export function EmptyState({ filter, total }: { filter: Filter; total: number }) {
  // With no tasks at all, always invite the first one.
  const { icon: Icon, title, body } = COPY[total === 0 ? 'all' : filter]

  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
      <Icon size={22} strokeWidth={1.5} className="mb-2 text-muted/60" aria-hidden="true" />
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="text-[13px] text-muted">{body}</p>
    </div>
  )
}
