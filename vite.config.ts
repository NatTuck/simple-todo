import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Served from the domain root at https://simple-todo.ironbeard.com.
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    // PouchDB's ESM browser build imports Node's "events"; Vite would
    // otherwise externalize it and crash at runtime ("Class extends ...").
    alias: {
      events: 'events/',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
