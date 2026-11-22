import PouchDB from 'pouchdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPouchStore, type PouchTodoDoc } from './pouch'
import type { TodoStore } from './types'

PouchDB.plugin(memoryAdapter)

describe('PouchDB store', () => {
  let db: PouchDB.Database<PouchTodoDoc>
  let store: TodoStore
  let name: string

  function openStore() {
    db = new PouchDB<PouchTodoDoc>(name, { adapter: 'memory' })
    store = createPouchStore(db)
    return store
  }

  beforeEach(async () => {
    name = `todos-${crypto.randomUUID()}`
    await openStore().init()
  })

  afterEach(async () => {
    await db.destroy().catch(() => undefined)
    await store.close().catch(() => undefined)
  })

  it('starts empty and ready', () => {
    expect(store.getSnapshot().status).toBe('ready')
    expect(store.getSnapshot().todos).toEqual([])
    expect(store.getSnapshot().backend).toBe('indexeddb')
  })

  it('adds trimmed titles and ignores blank input', async () => {
    await store.add('  Buy coffee  ')
    await store.add('   ')

    const todos = store.getSnapshot().todos
    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({ title: 'Buy coffee', done: false, order: 0 })
  })

  it('toggles and renames a task', async () => {
    await store.add('Write plan')
    const { id } = store.getSnapshot().todos[0]

    await store.toggle(id)
    expect(store.getSnapshot().todos[0].done).toBe(true)

    await store.rename(id, '  Write the plan  ')
    expect(store.getSnapshot().todos[0].title).toBe('Write the plan')

    await store.rename(id, '   ')
    expect(store.getSnapshot().todos[0].title).toBe('Write the plan')
  })

  it('removes a task and clears only completed ones', async () => {
    await store.add('One')
    await store.add('Two')
    await store.add('Three')

    const [first, second] = store.getSnapshot().todos
    await store.toggle(second.id)
    await store.clearCompleted()
    expect(store.getSnapshot().todos.map((todo) => todo.title)).toEqual(['One', 'Three'])

    await store.remove(first.id)
    expect(store.getSnapshot().todos.map((todo) => todo.title)).toEqual(['Three'])
  })

  it('persists tasks across store instances', async () => {
    await store.add('Survives a reload')
    await store.close()

    const reopened = openStore()
    await reopened.init()

    expect(store.getSnapshot().todos[0].title).toBe('Survives a reload')
  })
})
