# Just Do It

A task management application built with Astro, React, Tailwind CSS, Cloudflare D1, and Drizzle ORM.

---

## Table of Contents

- [Database](#database)
  - [Development Database](#development-database)
  - [Hard Reset](#hard-reset)
  - [If `.wrangler` Is Locked](#if-wrangler-is-locked)
- [Database Migrations](#database-migrations)
- [Production Database](#production-database)
- [Available Scripts](#available-scripts)
- [Quick Reference](#quick-reference)
- [Development Rule](#development-rule)

## Database

This project uses:

- **Cloudflare D1** — Database
- **Drizzle ORM** — Database schema and queries
- **Drizzle Kit** — Migration generation
- **Wrangler** — D1 management

The database has two workflows:

- **Development** — Hard reset the local database whenever needed.
- **Production** — Use migrations to safely update the existing database.

---

# Development Database

During development, the database can be completely rebuilt whenever the schema changes.

Migration history does **not** need to be preserved at this stage.

## Hard Reset

A hard reset:

1. Deletes the local `.wrangler` state.
2. Deletes the existing Drizzle migrations.
3. Generates a new migration from the current `schema.ts`.
4. Applies the migration to the local D1 database.

### Before resetting

**Stop the development server first:**

```text
Ctrl + C
```

Make sure `npm run dev` and any other Astro/Wrangler processes are stopped.

This is required because Wrangler/Miniflare may have SQLite files inside `.wrangler` open.

### Reset the database

```bash
npm run db:reset
```

The resulting database is completely fresh and is based on the current Drizzle schema.

### Reset flow

```text
src/db/schema.ts
       │
       │ Change schema
       ▼
npm run db:reset
       │
       ├── Delete .wrangler
       │
       ├── Delete drizzle/migrations
       │
       ├── Generate migration
       │
       └── Apply migration to local D1
       │
       ▼
Fresh local database
```

---

## If `.wrangler` Is Locked

If you see:

```text
The process cannot access the file
'metadata.sqlite' because it is being used by another process.
```

first make sure all Astro/Wrangler development servers are stopped.

If the problem persists, check for running Node processes:

```powershell
Get-Process node
```

If necessary, terminate the Node processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Then run:

```bash
npm run db:reset
```

> **Warning:** This terminates all running Node processes, including other Node applications.

---

# Database Migrations

## Development

When you want to preserve the existing local database and apply a schema change:

```bash
npm run drizzle:generate
npm run migrate:local
```

The workflow is:

```text
schema.ts
    ↓
drizzle:generate
    ↓
New migration
    ↓
migrate:local
    ↓
Local D1 updated
```

However, while the project is still in early development, you can simply use:

```bash
npm run db:reset
```

if you don't need to preserve the existing data or migration history.

---

# Production Database

Once the application is deployed, **do not use the hard reset workflow on the production database**.

Production should use permanent migrations so existing data is preserved.

The production workflow is:

```text
schema.ts
    ↓
drizzle:generate
    ↓
Review migration
    ↓
migrate:local
    ↓
Test locally
    ↓
migrate:remote
    ↓
Production database updated
```

Commands:

```bash
npm run drizzle:generate
npm run migrate:local
```

After testing locally:

```bash
npm run migrate:remote
```

Migration history should be preserved once the application is deployed.

---

# Available Scripts

| Script                     | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Start the Astro development server                |
| `npm run build`            | Build the application                             |
| `npm run preview`          | Preview the production build                      |
| `npm run astro`            | Run Astro CLI commands                            |
| `npm run generate-types`   | Generate Cloudflare Worker types                  |
| `npm run drizzle:generate` | Generate Drizzle migrations                       |
| `npm run migrate:local`    | Apply migrations to local D1                      |
| `npm run migrate:remote`   | Apply migrations to remote D1                     |
| `npm run db:clean`         | Delete local Wrangler state and migration history |
| `npm run db:reset`         | Hard reset and rebuild the local database         |

---

# Package Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",

    "generate-types": "wrangler types",

    "drizzle:generate": "drizzle-kit generate",

    "migrate:local": "wrangler d1 migrations apply just-do-it --local",
    "migrate:remote": "wrangler d1 migrations apply just-do-it --remote",

    "db:clean": "powershell -Command \"if (Test-Path .wrangler) { Remove-Item -Recurse -Force .wrangler }; if (Test-Path drizzle/migrations) { Remove-Item -Recurse -Force drizzle/migrations }\"",

    "db:reset": "npm run db:clean && npm run drizzle:generate && npm run migrate:local"
  }
}
```

---

# Quick Reference

### Start development

```bash
npm run dev
```

### Change the database schema and preserve local data

```bash
npm run drizzle:generate
npm run migrate:local
```

### Completely reset the local database

First stop the dev server:

```text
Ctrl + C
```

Then:

```bash
npm run db:reset
```

### Apply migrations to production

```bash
npm run drizzle:generate
npm run migrate:local
# Test locally
npm run migrate:remote
```

---

## Development Rule

While the project is still in development:

```bash
npm run db:reset
```

> **"I don't care about the existing database. Rebuild everything."**

Once deployed:

```bash
npm run drizzle:generate
npm run migrate:local
# Test
npm run migrate:remote
```

> **"Keep the existing database and safely migrate it."**
