import { AlertTriangle, HardDrive } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FilterTabs } from './components/FilterTabs'
import { ThemeToggle } from './components/ThemeToggle'
import { TodoComposer } from './components/TodoComposer'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import { todayLabel } from './lib/format'
import type { Filter } from './store/types'

function LoadingRows() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 border-b border-line/70 px-4 py-3.5 last:border-b-0">
          <div className="size-5 animate-pulse rounded-[7px] bg-surface-2" />
          <div
            className="h-3.5 animate-pulse rounded-full bg-surface-2"
            style={{ width: `${64 - row * 14}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function App() {
  const { status, todos, error, backend, actions } = useTodos()
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    void actions.init()
  }, [actions])

  const counts = useMemo(() => {
    const active = todos.filter((todo) => !todo.done).length
    return { all: todos.length, active, done: todos.length - active }
  }, [todos])

  const visible = useMemo(
    () =>
      todos.filter((todo) =>
        filter === 'all' ? true : filter === 'active' ? !todo.done : todo.done,
      ),
    [todos, filter],
  )

  function switchToBasicStorage() {
    const url = new URL(window.location.href)
    url.searchParams.set('storage', 'local')
    window.location.replace(url)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[38rem] flex-col px-5 pb-10 pt-14 sm:pt-20">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            {todayLabel}
          </p>
          <h1 className="mt-2 font-display text-[2.75rem] leading-none tracking-[-0.01em] text-ink sm:text-6xl">
            Things to do<span className="text-accent">.</span>
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="mt-9 flex flex-col gap-4">
        <TodoComposer onAdd={(title) => void actions.add(title)} />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">{error}</p>
            {status === 'error' && (
              <button
                type="button"
                onClick={switchToBasicStorage}
                className="shrink-0 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
              >
                Use basic storage
              </button>
            )}
          </div>
        )}

        <FilterTabs value={filter} counts={counts} onChange={setFilter} />

        {status === 'loading' ? (
          <LoadingRows />
        ) : (
          <TodoList
            todos={visible}
            filter={filter}
            total={todos.length}
            onToggle={(id) => void actions.toggle(id)}
            onRename={(id, title) => void actions.rename(id, title)}
            onRemove={(id) => void actions.remove(id)}
          />
        )}

        <footer className="mt-1 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-[13px] text-muted" aria-live="polite">
            {counts.all === 0
              ? 'No tasks yet'
              : counts.active === 0
                ? 'All done'
                : `${counts.active} left`}
          </p>

          <div className="flex items-center gap-4">
            {counts.done > 0 && (
              <button
                type="button"
                onClick={() => void actions.clearCompleted()}
                className="rounded text-[13px] text-muted underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Clear completed
              </button>
            )}
            <span
              className="hidden items-center gap-1.5 text-[11px] text-muted/70 sm:flex"
              title="Your tasks are stored only in this browser."
            >
              <HardDrive size={12} aria-hidden="true" />
              {backend === 'indexeddb' ? 'Saved in this browser' : 'Local storage'}
            </span>
          </div>
        </footer>
      </main>

      <p className="mt-auto pt-12 text-center text-[11px] text-muted/70">
        Local-first — your tasks never leave this browser.
      </p>
    </div>
  )
}

export default App
