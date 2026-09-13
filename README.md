# Just Do It

## Migrate database

1. `npm run drizzle:generate`
2. `npm run migrate:local`

## Generate database migrations

After updating the Drizzle schema, generate a migration:

`npm run drizzle:generate`

### Apply migrations locally

`npm run migrate:local`

### Start the development server

`npm run dev`

The application will be available at the local Astro development URL.

## Available Scripts

### Script Description

| Script                     | Description                        |
| -------------------------- | ---------------------------------- |
| `npm run dev`              | Start the Astro development server |
| `npm run build`            | Build the application              |
| `npm run preview`          | Preview the production build       |
| `npm run astro`            | Run Astro CLI commands             |
| `npm run generate-types`   | Generate Cloudflare Worker types   |
| `npm run drizzle:generate` | Generate Drizzle migrations        |
| `npm run migrate:local`    | Apply migrations to local D1       |
| `npm run migrate:remote`   | Apply migrations to remote D1      |
