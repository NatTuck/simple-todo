import type { Filter, Todo } from '../store/types'
import { EmptyState } from './EmptyState'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  filter: Filter
  total: number
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onRemove: (id: string) => void
}

export function TodoList({
  todos,
  filter,
  total,
  onToggle,
  onRename,
  onRemove,
}: TodoListProps) {
  if (todos.length === 0) return <EmptyState filter={filter} total={total} />

  return (
    <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRename={onRename}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
