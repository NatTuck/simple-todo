# Simple Todo

A tiny, local-first todo list. No accounts, no backend, no database to babysit — every task is stored in the browser and never leaves the device.

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
deploy/nginx/             nginx vhost used on the server
scripts/deploy.sh         manual build + rsync deploy
.github/workflows/ci.yml  lint, tests and build on push
```

## Deploying

The app is served as static files by nginx at
**https://simple-todo.ironbeard.com**. Deploys are manual:

```bash
npm run deploy
```

This runs the production build and rsyncs `dist/` to
`nat@simple-todo.ironbeard.com:/var/www/simple-todo`. Set `DEPLOY_HOST` or
`DEPLOY_TARGET` to override the defaults.

### One-time server setup

The server already runs nginx and certbot. To recreate the setup:

1. Create the web root (owned by the deploy user, readable by nginx):

   ```bash
   sudo install -d -o nat -g www-data -m 2755 /var/www/simple-todo
   ```

2. Start with only the port-80 `server` block from
   `deploy/nginx/simple-todo.conf` in
   `/etc/nginx/sites-available/simple-todo`, enable it, and reload nginx:

   ```bash
   sudo ln -s /etc/nginx/sites-available/simple-todo /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Issue the certificate while the HTTPS block is still absent:

   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot \
     -d simple-todo.ironbeard.com \
     --deploy-hook "systemctl reload nginx"
   ```

4. Replace the vhost with the complete `deploy/nginx/simple-todo.conf`,
   reload nginx, and confirm the renewal timer is active:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   systemctl list-timers | grep certbot
   ```

5. DNS for `simple-todo.ironbeard.com` must point at the server.

CI (`.github/workflows/ci.yml`) runs lint, tests and the build on every push,
but does not deploy.

## Notes

- The visual theme lives in `src/index.css`: semantic colour tokens are declared for light and dark, then exposed to Tailwind via `@theme inline`.
- PouchDB adds roughly 55 kB gzipped. If that ever matters more than sync-readiness, the `TodoStore` interface makes swapping in Dexie or `idb` straightforward.
- To add cloud sync later, PouchDB can replicate to any CouchDB-compatible endpoint without changing the UI.
