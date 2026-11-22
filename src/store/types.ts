export type Filter = 'all' | 'active' | 'done'

export type TodoBackend = 'indexeddb' | 'localstorage'

export interface Todo {
  id: string
  title: string
  done: boolean
  /** Manual position; lower comes first. */
  order: number
  createdAt: string
  updatedAt: string
}

export type StoreStatus = 'loading' | 'ready' | 'error'

export interface TodoSnapshot {
  status: StoreStatus
  todos: Todo[]
  /** Last recoverable error, if any. Cleared by the next successful write. */
  error: string | null
  backend: TodoBackend
}

export interface TodoStore {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getSnapshot(): TodoSnapshot
  add(title: string): Promise<void>
  toggle(id: string): Promise<void>
  rename(id: string, title: string): Promise<void>
  remove(id: string): Promise<void>
  clearCompleted(): Promise<void>
  close(): Promise<void>
}
