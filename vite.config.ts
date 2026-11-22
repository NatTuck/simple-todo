import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
 * while user sites live at the domain root. Local dev always uses "/".
 */
function resolveBase(): string {
  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) return '/'

  const [owner, name] = repository.split('/')
  if (!name || name === `${owner}.github.io`) return '/'
  return `/${name}/`
}

export default defineConfig({
  base: resolveBase(),
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
