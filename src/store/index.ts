import PouchDB from 'pouchdb'
import { createLocalStore } from './local'
import { createPouchStore, type PouchTodoDoc } from './pouch'
import type { TodoStore } from './types'

/**
 * Escape hatch for testing the fallback path: ?storage=local
 */
function forceLocalStorage(): boolean {
  if (typeof window === 'undefined') return true
  return new URLSearchParams(window.location.search).get('storage') === 'local'
}

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function createStore(): TodoStore {
  const storage = getLocalStorage()

  if (forceLocalStorage() || !hasIndexedDb() || !storage) {
    return createLocalStore(storage ?? memoryStorage())
  }

  try {
    return createPouchStore(
      new PouchDB<PouchTodoDoc>('simple-todo', { auto_compaction: true }),
    )
  } catch (error) {
    console.warn('IndexedDB is unavailable; falling back to localStorage.', error)
    return createLocalStore(storage)
  }
}

/** Last-resort in-memory Storage so the app still works without any persistence. */
function memoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

export const todoStore = createStore()
