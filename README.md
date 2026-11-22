# Simple Todo

A tiny, local-first todo list. No accounts, no server, no database to babysit — every task is stored in the browser and never leaves the device.

Built for a CS2010 demo, but pleasant enough to actually use.

## Features

- Add, rename, complete and delete tasks
- Filter by all / active / done, with live counts
- Clear completed in one click
- Light and dark themes (follows the OS by default)
- Keyboard friendly: `Enter` adds, `Enter` saves an edit, `Esc` cancels it
- Works offline once loaded; data survives reloads
- Accessible controls, focus rings and reduced-motion support

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styles | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Storage | PouchDB 9 on IndexedDB, with a localStorage fallback |
| Icons | Lucide |
| Tests | Vitest + PouchDB memory adapter |

There is intentionally no router, state library or backend.

## Getting started

```bash
npm install
npm run dev
```

The app is then available at the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the store tests once (`test:watch` for watch mode) |
| `npm run lint` | Run oxlint |

## How storage works

- **Primary:** PouchDB with the IndexedDB adapter, in a database called `simple-todo`.
- **Fallback:** if IndexedDB is unavailable (some private-mode or locked-down browsers), the same store contract is implemented over `localStorage`. You can force this path with `?storage=local`.
- **Last resort:** if even localStorage is blocked, an in-memory adapter keeps the app usable for the session — with no persistence.

The UI never talks to storage directly. `src/store/` exposes a small `TodoStore` interface, and React subscribes to an immutable snapshot through `useSyncExternalStore`:

```
components → useTodos() → todos store → PouchDB / localStorage
```

Each mutation writes once and re-reads the todo range, so there is no incremental-update bookkeeping. PouchDB's live `changes()` feed also refreshes the list when another tab writes.

Deleting the site's browser data (or using a different browser/device) results in an empty list — that is the trade-off of having no backend.

## Project layout

```
src/
  App.tsx                 layout, filters, footer
  components/             composer, list, item, empty state, theme toggle
  hooks/useTodos.ts       React binding for the store snapshot
  hooks/useTheme.ts       light / dark / system theme
  store/
    types.ts              Todo model + TodoStore contract
    pouch.ts              IndexedDB implementation
    local.ts              localStorage fallback
    index.ts              picks the best available backend
  lib/                    small helpers
.github/workflows/deploy.yml
```

## Deploying to GitHub Pages

1. Push the repository to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow runs lint, tests and the build, then publishes `dist/`.

`vite.config.ts` derives the asset base path from `GITHUB_REPOSITORY`, so project sites are served correctly from `https://<user>.github.io/<repo>/`. Repositories named `<user>.github.io` are served from the domain root automatically.

## Notes

- The visual theme lives in `src/index.css`: semantic colour tokens are declared for light and dark, then exposed to Tailwind via `@theme inline`.
- PouchDB adds roughly 55 kB gzipped. If that ever matters more than sync-readiness, the `TodoStore` interface makes swapping in Dexie or `idb` straightforward.
- To add cloud sync later, PouchDB can replicate to any CouchDB-compatible endpoint without changing the UI.
