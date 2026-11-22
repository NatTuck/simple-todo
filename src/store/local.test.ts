import { describe, expect, it } from 'vitest'
import { createLocalStore } from './local'

/** A Storage shim so the fallback can be tested without a browser. */
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

describe('localStorage fallback store', () => {
  it('performs the same CRUD operations', async () => {
    const storage = memoryStorage()
    const store = createLocalStore(storage)
    await store.init()

    await store.add('Fallback task')
    await store.add('  ')
    expect(store.getSnapshot().todos).toHaveLength(1)
    expect(store.getSnapshot().backend).toBe('localstorage')

    const { id } = store.getSnapshot().todos[0]
    await store.toggle(id)
    expect(store.getSnapshot().todos[0].done).toBe(true)

    await store.rename(id, 'Renamed fallback')
    expect(store.getSnapshot().todos[0].title).toBe('Renamed fallback')

    await store.clearCompleted()
    expect(store.getSnapshot().todos).toEqual([])
  })

  it('reloads persisted tasks from storage', async () => {
    const storage = memoryStorage()
    const first = createLocalStore(storage)
    await first.init()
    await first.add('Remember me')

    const second = createLocalStore(storage)
    await second.init()
    expect(second.getSnapshot().todos[0].title).toBe('Remember me')
  })

  it('survives unreadable storage contents', async () => {
    const storage = memoryStorage()
    storage.setItem('simple-todo:todos:v1', '{not json')

    const store = createLocalStore(storage)
    await store.init()
    expect(store.getSnapshot().todos).toEqual([])
  })
})
