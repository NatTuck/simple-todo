import { newId } from '../lib/id'
import type { Todo, TodoSnapshot, TodoStore } from './types'

const STORAGE_KEY = 'simple-todo:todos:v1'

const byOrder = (a: Todo, b: Todo) =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') return false

  const todo = value as Partial<Todo>
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.done === 'boolean' &&
    typeof todo.order === 'number' &&
    typeof todo.createdAt === 'string' &&
    typeof todo.updatedAt === 'string'
  )
}

function parse(raw: string | null): Todo[] {
  if (!raw) return []

  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter(isTodo).sort(byOrder) : []
  } catch {
    return []
  }
}

/**
 * Minimal fallback for browsers where IndexedDB is unavailable (private mode,
 * locked-down profiles). Implements the same contract as the PouchDB store.
 */
export function createLocalStore(storage: Storage): TodoStore {
  let todos: Todo[] = []
  let snapshot: TodoSnapshot = {
    status: 'loading',
    todos: [],
    error: null,
    backend: 'localstorage',
  }

  const listeners = new Set<() => void>()
  let initialized = false
  let onStorage: ((event: StorageEvent) => void) | null = null

  function emit() {
    for (const listener of listeners) listener()
  }

  function set(patch: Partial<TodoSnapshot>) {
    snapshot = { ...snapshot, ...patch }
    emit()
  }

  function load() {
    todos = parse(storage.getItem(STORAGE_KEY))
    set({ todos, status: 'ready', error: null })
  }

  function commit(next: Todo[]) {
    todos = [...next].sort(byOrder)
    storage.setItem(STORAGE_KEY, JSON.stringify(todos))
    set({ todos, status: 'ready', error: null })
  }

  async function guard(task: () => void): Promise<void> {
    try {
      task()
      set({ error: null })
    } catch (error) {
      set({ error: describe(error) })
    }
  }

  async function init(): Promise<void> {
    if (initialized) return
    initialized = true

    try {
      load()
    } catch (error) {
      set({ status: 'error', error: describe(error) })
      return
    }

    if (typeof window !== 'undefined') {
      onStorage = (event) => {
        if (event.key === STORAGE_KEY || event.key === null) {
          try {
            load()
          } catch {
            /* ignore unreadable storage */
          }
        }
      }
      window.addEventListener('storage', onStorage)
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  async function add(title: string): Promise<void> {
    await guard(() => {
      const clean = title.trim()
      if (!clean) return

      const stamp = new Date().toISOString()
      const order = todos.reduce((max, todo) => Math.max(max, todo.order), -1) + 1

      commit([
        ...todos,
        {
          id: newId(),
          title: clean,
          done: false,
          order,
          createdAt: stamp,
          updatedAt: stamp,
        },
      ])
    })
  }

  async function toggle(id: string): Promise<void> {
    await guard(() => {
      const stamp = new Date().toISOString()
      commit(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done, updatedAt: stamp } : todo)))
    })
  }

  async function rename(id: string, title: string): Promise<void> {
    const clean = title.trim()
    if (!clean) return

    await guard(() => {
      const stamp = new Date().toISOString()
      commit(todos.map((todo) => (todo.id === id ? { ...todo, title: clean, updatedAt: stamp } : todo)))
    })
  }

  async function remove(id: string): Promise<void> {
    await guard(() => {
      commit(todos.filter((todo) => todo.id !== id))
    })
  }

  async function clearCompleted(): Promise<void> {
    await guard(() => {
      commit(todos.filter((todo) => !todo.done))
    })
  }

  async function close(): Promise<void> {
    if (onStorage) window.removeEventListener('storage', onStorage)
    onStorage = null
  }

  return {
    init,
    subscribe,
    getSnapshot: () => snapshot,
    add,
    toggle,
    rename,
    remove,
    clearCompleted,
    close,
  }
}
