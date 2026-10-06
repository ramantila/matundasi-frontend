# Matundasi Frontend

Admin portal for the Matundasi exploration database. It is a Next.js 15 App Router app that talks to `../matundasi-backend` (Spring Boot, port 8065).

## Run

```bash
cp .env.example .env.local   # first time only
npm install
npm run dev                  # http://localhost:4600
```

The browser calls `/api/*` on the Next.js server, and `next.config.mjs` forwards it to `BACKEND_URL`. The backend has no CORS config, so this proxy is required. Restart the dev server after changing `BACKEND_URL`.

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8065` | Spring Boot server that receives the proxied `/api/*` calls |
| `NEXT_PUBLIC_API_URL` | *(empty)* | Leave empty to use the proxy. Set it only if the backend allows CORS. |
| `NEXT_PUBLIC_AUTH_ENABLED` | `false` | Set to `true` once `/api/v1/auth/login` exists in the backend |

## Structure (same layout as cdm-frontend)

```
app/
  layout.js                 fonts, icons, theme bootstrap
  login/page.js             login → sessionStorage 'matundasiSession'
  dashboard/layout.js       Sidebar + Navbar + Footer + toasts, auth guard
  dashboard/page.js         overview
  dashboard/<module>/page.js            list page (create/edit open in a modal)
components/                 Sidebar, Navbar, ResourceListPage, ResourceFormModal, FormField, …
services/
  interceptor.js            axios instance (JWT header, 401 → login, unwrap helpers)
  <module>.js               get/getById/create/update/delete for one backend module
lib/
  resources.js              ← one config per backend module (fields, sections, columns, stats, filters, rules)
  navigation.js             sidebar sections and breadcrumbs, built from resources.js
  permissions.js, session.js, reportExport.js (Excel/PDF), format.js, …
```

Every list page and its create/edit modal render from the module's entry in `lib/resources.js`. The field names, types, required flags and ranges in that file mirror the backend request records (`modules/*/payload/*Requests.java`). The cross-field `rules` mirror the checks in the service classes, such as *to > from* and *assayed ≤ samples*.

## Adding a backend module

1. Write `services/<slug>.js` (copy any existing service and change `BASE` and the function names).
2. Add an entry to the list in `lib/resources.js`, with fields matching the `*Requests` record.
3. Create `app/dashboard/<slug>/page.js` (copy it from any module).

The module then appears in the sidebar, the header search and the dashboard automatically.

## Permissions

While `NEXT_PUBLIC_AUTH_ENABLED=false`, every user can do everything. Once auth is on, the session's `permissions` array is checked against `VIEW_<SLUG>`, `ADD_<SLUG>`, `EDIT_<SLUG>` and `DELETE_<SLUG>`. For example, `rab-collars` uses `VIEW_RAB_COLLARS`.
