# @prisma/studio-core

`@prisma/studio-core` is the embeddable Prisma Studio package.

It provides the same core experience as Prisma Studio: a visual way to explore schema, browse table data, edit rows, filter/sort/paginate records, inspect relation data, and run SQL queries with an operation log.

This package is published to npm and consumed by Prisma surfaces such as Console and CLI integrations.

## Embedding Studio

Import the UI entrypoint, include the packaged CSS once, and pass a configured adapter into `Studio`:

```tsx
import { Studio } from "@prisma/studio-core/ui";
import "@prisma/studio-core/ui/index.css";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";

const adapter = createPostgresAdapter({
  executor: createStudioBFFClient({
    url: "/api/query",
  }),
});

export function EmbeddedStudio() {
  return (
    <Studio
      adapter={adapter}
      aiFilter={async (request) => {
        const response = await fetch("/api/ai-filter", {
          body: JSON.stringify({ prompt: request }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });

        const payload = (await response.json()) as {
          error?: unknown;
          text?: unknown;
        };

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : `AI filter request failed (${response.status} ${response.statusText})`,
          );
        }

        if (typeof payload.text !== "string") {
          throw new Error("AI filter response did not include text.");
        }

        return payload.text;
      }}
    />
  );
}
```

`adapter` is required. `aiFilter` is optional and is the new LLM completion hook: it takes the user's natural-language request and returns JSON text describing one or more filters. When `aiFilter` is omitted, Studio renders only the manual filter controls and hides the inline AI prompt entirely.
Studio no longer renders a built-in fullscreen header button. If your host needs fullscreen behavior, render that control at the host container level, as the local demo does.
Studio handles prompt construction, type-aware validation, correction retries, and conversion into the normal URL-backed filter pills. The hook can return regular column filters or a SQL fallback when the request cannot be expressed with the predefined operators.

## Telemetry

This package includes anonymized telemetry to help us improve Prisma Studio.
Use implies consent. Learn more in our [Privacy Policy](https://www.prisma.io/privacy).

## Run Studio Locally

Requirements:

- Node.js `^20.19 || ^22.12 || ^24.0`
- `pnpm` `8`
- `bun`

Install dependencies and start the demo:

```sh
pnpm install
pnpm demo:ppg
```

Then open [http://localhost:4310](http://localhost:4310).

To enable the demo's AI filtering flow, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.
The demo reads that key server-side and calls Anthropic Haiku 4.5 directly over HTTP for the `aiFilter` hook. Set `STUDIO_DEMO_AI_FILTERING_ENABLED=false` to hide the AI filter UI without removing the key. `.env` and `.env.local` are gitignored.

The demo:

- starts Prisma Postgres dev (`ppg-dev`) programmatically via `@prisma/dev`
- uses direct TCP for query execution
- seeds sample relational data on startup
- auto-rebuilds and reloads the UI when source files change

The demo database is intentionally ephemeral: it is pre-seeded when the demo starts and reset when the demo process stops.

## Useful Commands

- `pnpm demo:ppg` - run local Studio demo with seeded Prisma Postgres dev
- `pnpm typecheck` - run TypeScript checks
- `pnpm lint` - run ESLint (`--fix`)
- `pnpm test` - run default vitest suite
- `pnpm test:checkpoint` - run checkpoint tests
- `pnpm test:data` - run data-layer tests
- `pnpm test:demo` - run demo/server tests
- `pnpm test:ui` - run UI tests
- `pnpm test:e2e` - run e2e tests
- `pnpm demo:ppg:build` - bundle the demo server with `bun build`
- `pnpm demo:ppg:bundle` - build and run the bundled demo server
- `pnpm build` - build distributable package with `tsup`
- `pnpm check:exports` - validate package export map/types

When bundling the demo with `bun build`, we use `--packages external` so
`@prisma/dev` can resolve its PGlite runtime assets (WASM/data/extensions)
directly from `node_modules` at runtime.

## Development Workflow

For day-to-day development, use an agent with Playwright available and let the agent run the demo itself.

Recommended flow:

1. Let the agent run `pnpm demo:ppg`.
2. Let the agent inspect terminal logs and browser behavior together.
3. Let the agent verify UI state via Playwright after changes.

Because the demo is pre-seeded and resets between runs, update seed data whenever needed to reproduce richer scenarios.

Seed data lives in `/Users/sorenschmidt/code/studio-private/demo/ppg-dev/server.ts` (`seedDatabase`).
