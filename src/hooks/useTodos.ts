import { useSyncExternalStore } from 'react'
import { todoStore } from '../store'

export function useTodos() {
  const snapshot = useSyncExternalStore(
    todoStore.subscribe,
    todoStore.getSnapshot,
    todoStore.getSnapshot,
  )

  return { ...snapshot, actions: todoStore }
}
