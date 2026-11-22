import { Check, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../lib/cn'
import type { Todo } from '../store/types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onRemove: (id: string) => void
}

export function TodoItem({ todo, onToggle, onRename, onRemove }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelled = useRef(false)

  function startEditing() {
    cancelled.current = false
    setDraft(todo.title)
    setEditing(true)
  }

  function commit() {
    if (cancelled.current) {
      cancelled.current = false
      return
    }

    const next = draft.trim()
    setEditing(false)

    if (!next || next === todo.title) {
      setDraft(todo.title)
      return
    }

    onRename(todo.id, next)
  }

  return (
    <li className="group/row flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/60 animate-[row-in_180ms_ease-out_both]">
      <label className="flex size-6 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          aria-label={todo.done ? `Mark "${todo.title}" as active` : `Mark "${todo.title}" as done`}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'grid size-5 place-items-center rounded-[7px] border transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
            todo.done
              ? 'border-accent bg-accent'
              : 'border-line bg-canvas group-hover/row:border-muted/60',
          )}
        >
          <Check
            size={13}
            strokeWidth={3.5}
            className={cn(
              'text-accent-contrast transition-all duration-150',
              todo.done ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
        </span>
      </label>

      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelled.current = true
              event.currentTarget.blur()
            }
          }}
          aria-label={`Edit "${todo.title}"`}
          maxLength={200}
          className="min-w-0 flex-1 rounded-md bg-canvas px-2 py-1 text-[15px] leading-6 text-ink caret-accent outline-none ring-2 ring-accent/30"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          title="Click to rename"
          className={cn(
            'min-w-0 flex-1 truncate text-left text-[15px] leading-6 transition-colors focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            todo.done ? 'text-muted line-through decoration-muted/40' : 'text-ink',
          )}
        >
          {todo.title}
        </button>
      )}

      <button
        type="button"
        onClick={() => onRemove(todo.id)}
        aria-label={`Delete "${todo.title}"`}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 group-hover/row:opacity-100 group-focus-within/row:opacity-100 max-sm:opacity-100"
      >
        <Trash2 size={15} />
      </button>
    </li>
  )
}
