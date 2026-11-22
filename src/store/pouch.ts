import { newId } from '../lib/id'
import type { Todo, TodoSnapshot, TodoStore } from './types'

export interface PouchTodoDoc {
  _id: string
  _rev?: string
  type: 'todo'
  title: string
  done: boolean
  order: number
  createdAt: string
  updatedAt: string
}

const PREFIX = 'todo:'
const RANGE_END = `${PREFIX}\ufff0`

const byOrder = (a: Todo, b: Todo) =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

function toTodo(doc: PouchTodoDoc): Todo {
  return {
    id: doc._id.slice(PREFIX.length),
    title: doc.title,
    done: doc.done,
    order: doc.order,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function isConflict(error: unknown): boolean {
  return (error as { status?: number }).status === 409
}

function isNotFound(error: unknown): boolean {
  return (error as { status?: number }).status === 404
}

/**
 * PouchDB-backed store. Every mutation is a single local write followed by a
 * re-read, which keeps the React snapshot free of incremental-update bugs.
 */
export function createPouchStore(db: PouchDB.Database<PouchTodoDoc>): TodoStore {
  let snapshot: TodoSnapshot = {
    status: 'loading',
    todos: [],
    error: null,
    backend: 'indexeddb',
  }

  const listeners = new Set<() => void>()
  let initPromise: Promise<void> | null = null
  let feed: PouchDB.Core.Changes<PouchTodoDoc> | null = null
  let refreshQueued = false

  function emit() {
    for (const listener of listeners) listener()
  }

  function set(patch: Partial<TodoSnapshot>) {
    snapshot = { ...snapshot, ...patch }
    emit()
  }

  async function readAll(): Promise<Todo[]> {
    const result = await db.allDocs({
      include_docs: true,
      startkey: PREFIX,
      endkey: RANGE_END,
    })

    return result.rows
      .flatMap((row) => (row.doc ? [row.doc] : []))
      .map(toTodo)
      .sort(byOrder)
  }

  async function refresh() {
    const todos = await readAll()
    set({ todos, status: 'ready', error: null })
  }

  function scheduleRefresh() {
    if (refreshQueued) return
    refreshQueued = true

    queueMicrotask(() => {
      refreshQueued = false
      refresh().catch((error: unknown) => set({ error: describe(error) }))
    })
  }

  async function guard(task: () => Promise<void>): Promise<void> {
    try {
      await task()
      set({ error: null })
    } catch (error) {
      set({ error: describe(error) })
    }
  }

  async function mutate(id: string, change: (doc: PouchTodoDoc) => PouchTodoDoc) {
    await guard(async () => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const doc = (await db.get(`${PREFIX}${id}`)) as PouchTodoDoc
          await db.put({ ...change(doc), updatedAt: new Date().toISOString() })
          break
        } catch (error) {
          if (attempt < 2 && isConflict(error)) continue
          throw error
        }
      }

      await refresh()
    })
  }

  async function removeDoc(id: string) {
    try {
      const doc = (await db.get(`${PREFIX}${id}`)) as PouchTodoDoc
      if (doc._rev) await db.remove(doc._id, doc._rev)
    } catch (error) {
      if (!isNotFound(error)) throw error
    }
  }

  async function init(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await db.info()
          await refresh()

          feed = db
            .changes({ since: 'now', live: true })
            .on('change', scheduleRefresh)
            .on('error', (error: unknown) => set({ error: describe(error) }))
        } catch (error) {
          set({ status: 'error', error: describe(error) })
        }
      })()
    }

    return initPromise
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  async function add(title: string): Promise<void> {
    await guard(async () => {
      const clean = title.trim()
      if (!clean) return

      const stamp = new Date().toISOString()
      const order = snapshot.todos.reduce((max, todo) => Math.max(max, todo.order), -1) + 1

      await db.put({
        _id: `${PREFIX}${newId()}`,
        type: 'todo',
        title: clean,
        done: false,
        order,
        createdAt: stamp,
        updatedAt: stamp,
      })

      await refresh()
    })
  }

  async function toggle(id: string): Promise<void> {
    await mutate(id, (doc) => ({ ...doc, done: !doc.done }))
  }

  async function rename(id: string, title: string): Promise<void> {
    const clean = title.trim()
    if (!clean) return

    await mutate(id, (doc) => ({ ...doc, title: clean }))
  }

  async function remove(id: string): Promise<void> {
    await guard(async () => {
      await removeDoc(id)
      await refresh()
    })
  }

  async function clearCompleted(): Promise<void> {
    await guard(async () => {
      const completed = snapshot.todos.filter((todo) => todo.done)
      for (const todo of completed) await removeDoc(todo.id)
      await refresh()
    })
  }

  async function close(): Promise<void> {
    await feed?.cancel()
    feed = null
    await db.close()
    initPromise = null
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
