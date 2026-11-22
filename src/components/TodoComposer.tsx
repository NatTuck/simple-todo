import { Plus } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'

interface TodoComposerProps {
  onAdd: (title: string) => void
}

export function TodoComposer({ onAdd }: TodoComposerProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const canSubmit = value.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = value.trim()
    if (!title) return

    onAdd(title)
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 pl-4 shadow-card transition focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10"
    >
      <label htmlFor="new-todo" className="sr-only">
        New task
      </label>
      <input
        id="new-todo"
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="What needs doing?"
        autoComplete="off"
        maxLength={200}
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ink caret-accent placeholder:text-muted/70 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Add task"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-contrast transition-colors hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Plus size={19} strokeWidth={2.5} />
      </button>
    </form>
  )
}
