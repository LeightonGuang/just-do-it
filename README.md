# Just Do It

A task management application built with Astro, React, Tailwind CSS, Cloudflare D1, and Drizzle ORM.

---

## Table of Contents

- [Database](#database)

  - [Development Database](#development-database)
  - [Database Reset](#database-reset)
  - [Hard Reset](#hard-reset)
  - [If `.wrangler` Is Locked](#if-wrangler-is-locked)

- [Database Migrations](#database-migrations)
- [Production Database](#production-database)
- [Available Scripts](#available-scripts)
- [Quick Reference](#quick-reference)
- [Development Rule](#development-rule)

---

# Commands

## Table of commands

| command | sub command | keyword     | argument   | description                     |
| ------- | ----------- | ----------- | ---------- | ------------------------------- |
| /create | do          | in          | project    | create a new do                 |
|         | project     | -           | pjt name   | create a new project            |
|         | column      | in          | project    | create a new column             |
| /delete | do          | -           | do title   | delete a do                     |
|         | project     | -           | pjt name   | delete a project                |
|         | column      | in          | project    | delete a column                 |
| /move   | do          | to          | column     | move a do to a different column |
| /edit   | do          | title       | new title  | edit a do title                 |
|         | do          | description | new desc   | edit a do description           |
|         | do          | due_at      | new date   | edit a do due date              |
|         | project     | name        | new name   | edit project name               |
|         | project     | colour      | hex colour | edit project colour             |
|         | column      | name        | new name   | edit project column name        |
|         | column      | order       | new order  | edit project column order       |

# Database

This project uses:

- **Cloudflare D1** — Database
- **Drizzle ORM** — Database schema and queries
- **Drizzle Kit** — Migration generation
- **Wrangler** — D1 management

The database has two main workflows:

- **Development** — The local database can be reset or completely rebuilt whenever needed.
- **Production** — Use migrations to safely update the existing database.

---

# Development Database

During development, it is acceptable to destroy and rebuild the local database because migration history and local data do not need to be preserved.

There are two reset commands depending on what you need.

## Database Reset

```bash
npm run db:reset
```

This deletes the local `.wrangler` state and then applies the **existing Drizzle migrations** to a fresh local D1 database.

Use this when your existing migrations are correct and you simply want to recreate the local D1 environment.

The flow is:

```text
.wrangler
   ↓
Delete local Wrangler state
   ↓
Fresh local D1
   ↓
Apply existing migrations
   ↓
Local database recreated
```

---

## Hard Reset

```bash
npm run db:hard-reset
```

A hard reset **drops the database tables defined in `scripts/reset.sql`**.

This is useful when you want to completely wipe the existing local tables without preserving any of their data.

The reset SQL is located at:

```text
scripts/reset.sql
```

Example:

```sql
DROP TABLE IF EXISTS dos;
DROP TABLE IF EXISTS columns;
DROP TABLE IF EXISTS projects;
```

Tables with foreign-key dependencies should be dropped in the correct order, starting with the tables that depend on other tables.

For example:

```text
dos
 ↓
columns
 ↓
projects
```

So `dos` should be dropped before `columns`, and `columns` before `projects`.

### Important

`db:hard-reset` **only drops the tables**.

It does not:

- Delete `.wrangler`
- Delete Drizzle migrations
- Generate a new migration
- Apply migrations automatically

If you want to rebuild the database from your current Drizzle schema, run:

```bash
npm run db:hard-reset
npm run drizzle:generate
npm run migrate:local
```

---

## If `.wrangler` Is Locked

If you see:

```text
The process cannot access the file
'metadata.sqlite' because it is being used by another process.
```

first make sure all Astro/Wrangler development servers are stopped.

```text
Ctrl + C
```

Make sure `npm run dev` and any other Astro/Wrangler processes are stopped.

Wrangler/Miniflare may have SQLite files inside `.wrangler` open while the development server is running.

If the problem persists, check for running Node processes:

```powershell
Get-Process node
```

If necessary, terminate the Node processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Then run your database command again.

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

If you do not care about the existing local database, use the hard reset workflow instead.

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

> **Never run destructive reset commands against the production database.**

---

# Available Scripts

| Script                     | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`              | Start the Astro development server                                         |
| `npm run build`            | Build the application                                                      |
| `npm run preview`          | Preview the production build                                               |
| `npm run astro`            | Run Astro CLI commands                                                     |
| `npm run cf-typegen`       | Generate Cloudflare Worker types                                           |
| `npm run drizzle:generate` | Generate Drizzle migrations                                                |
| `npm run migrate:local`    | Apply migrations to local D1                                               |
| `npm run migrate:remote`   | Apply migrations to remote D1                                              |
| `npm run db:reset`         | Delete local Wrangler state and recreate local D1 from existing migrations |
| `npm run db:hard-reset`    | Drop local D1 tables using `scripts/reset.sql`                             |
| `npm run query:local`      | Execute SQL against local D1                                               |
| `npm run query:remote`     | Execute SQL against remote D1                                              |

---

# Package Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "cf-typegen": "wrangler types",
    "drizzle:generate": "drizzle-kit generate",
    "migrate:local": "wrangler d1 migrations apply just-do-it --local",
    "migrate:remote": "wrangler d1 migrations apply just-do-it --remote",
    "db:reset": "powershell -Command \"if (Test-Path .wrangler) { Remove-Item -Recurse -Force .wrangler }\" && npm run migrate:local",
    "db:hard-reset": "npx wrangler d1 execute just-do-it --local --file=scripts/reset.sql",
    "query:local": "npx wrangler d1 execute just-do-it --local --command",
    "query:remote": "npx wrangler d1 execute just-do-it --remote --command"
  }
}
```

---

# Quick Reference

### Start development

```bash
npm run dev
```

### Query the local database

```bash
npm run query:local "SELECT * FROM dos"
```

### Query the remote database

```bash
npm run query:remote "SELECT * FROM dos"
```

### Change the database schema and preserve local data

```bash
npm run drizzle:generate
npm run migrate:local
```

### Reset the local database

```bash
npm run db:reset
```

This recreates the local D1 environment using the existing migration files.

### Completely drop the local database tables

```bash
npm run db:hard-reset
```

Then, if you want to rebuild them from the current Drizzle schema:

```bash
npm run drizzle:generate
npm run migrate:local
```

### Apply migrations to production

```bash
npm run drizzle:generate
npm run migrate:local

# Test locally

npm run migrate:remote
```

---

# Development Rule

While the project is still in development:

### I don't care about the existing database

Use:

```bash
npm run db:hard-reset
npm run drizzle:generate
npm run migrate:local
```

This drops the local tables and rebuilds them from the current schema.

### I want to keep my local data

Use:

```bash
npm run drizzle:generate
npm run migrate:local
```

This creates and applies a migration without destroying the existing database.

### The application is deployed

Use migrations:

```bash
npm run drizzle:generate
npm run migrate:local

# Test

npm run migrate:remote
```

> **Production rule: Keep the existing database and safely migrate it. Never use destructive reset commands on production.**
