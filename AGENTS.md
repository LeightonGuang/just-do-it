## Development

When starting the dev server:

```bash
npx astro dev
```

To run a production build and verify there are no errors:

```bash
npm run build
```

## Import Path Guidelines

All files that import from `src/db/schema` must use the correct relative path based on their directory depth. Here's how to calculate it:

- Count the number of `.ts` directories in the path (excluding `db/` itself)
- Files at **depth 4** (e.g., `src/pages/api/projects/index.ts`) → use `"../../../db/schema"`
- Files at **depth 5** (e.g., `src/pages/api/projects/[projectId]/index.ts`) → use `"../../../../db/schema"`  
- Files at **depth 6** (e.g., `src/components/master-control/commands/hooks/...`) → use `"../../../../../db/schema"`

### Directory Depth Examples:

| File Path | Depth | Relative Import Path |
|-----------|-------|---------------------|
| `src/pages/api/projects/index.ts` | 4 | `"../../../db/schema"` |
| `src/pages/api/projects/[projectId]/index.ts` | 5 | `"../../../../db/schema"` |
| `src/pages/api/projects/[projectId]/columns/index.ts` | 6 | `"../../../../../db/schema"` |
| `src/components/kanban/contexts/actions.ts` | 5 | `"../../../../db/schema"` |
| `src/components/master-control/commands/hooks/useEntitySuggestions.ts` | 6 | `"../../../../../db/schema"` |

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)