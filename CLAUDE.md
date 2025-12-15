# CLAUDE.md

**ALWAYS RESPOND IN KOREAN**
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for a shopping application built in three different rendering modes (CSR, SSR, SSG) using both Vanilla JavaScript and React. The project demonstrates implementing the same application with different frameworks and rendering strategies.

**Key packages:**

- `packages/vanilla` - Vanilla JavaScript implementation
- `packages/react` - React implementation
- `packages/lib` - Shared library with custom hooks, HOCs, Router, Store, and Observer implementations

## Development Commands

### Root-level commands

```bash
# Build all packages
pnpm run build

# Lint and fix all packages
pnpm run lint:fix

# Type check all packages
pnpm run tsc

# Format code
pnpm run prettier:write

# Run unit tests (lib package only)
pnpm run test:unit

# Run all E2E tests
pnpm run test:e2e

# Run basic E2E tests only
pnpm run test:e2e:basic

# Run advanced E2E tests only
pnpm run test:e2e:advanced

# Run E2E tests in UI mode
pnpm run test:e2e:ui

# View E2E test report
pnpm run test:e2e:report

# Serve both Vanilla and React apps for testing
pnpm run serve:test
```

### Vanilla package commands (packages/vanilla)

```bash
# Development with CSR (port 5173)
pnpm run dev

# Development with SSR (port 5173)
pnpm run dev:ssr

# Build client for production
pnpm run build:client

# Build SSR server
pnpm run build:server

# Build static site (SSG)
pnpm run build:ssg

# Build all (client + server + SSG)
pnpm run build

# Preview CSR build (port 4173)
pnpm run preview:csr

# Preview SSR build (port 4174)
pnpm run preview:ssr

# Preview SSG build (port 4178)
pnpm run preview:ssg

# Preview with build first
pnpm run preview:csr-with-build
pnpm run preview:ssr-with-build
pnpm run preview:ssg-with-build

# Serve all modes concurrently for testing
pnpm run serve:test
```

### React package commands (packages/react)

```bash
# Development with CSR (port 5175)
pnpm run dev

# Development with SSR (port 5176)
pnpm run dev:ssr

# Build client for production
pnpm run build:client

# Build SSR server
pnpm run build:server

# Build static site (SSG)
pnpm run build:ssg

# Build all (client + server + SSG)
pnpm run build

# Type check without emitting
pnpm run tsc

# Preview CSR build (port 4175)
pnpm run preview:csr

# Preview SSR build (port 4176)
pnpm run preview:ssr

# Preview SSG build (port 4179)
pnpm run preview:ssg

# Serve all modes concurrently for testing
pnpm run serve:test
```

### Lib package commands (packages/lib)

```bash
# Build library
pnpm run build

# Type check
pnpm run tsc

# Run unit tests
pnpm run test

# Run basic tests only
pnpm run test:basic

# Run advanced tests only
pnpm run test:advanced
```

## Architecture

### Monorepo Structure

- Uses pnpm workspaces for package management
- Three main packages: `vanilla`, `react`, and `lib`
- Shared `lib` package contains framework-agnostic utilities
- Both implementations support CSR, SSR, and SSG rendering modes

### Rendering Modes

Each app (Vanilla and React) can run in three rendering modes:

1. **CSR (Client-Side Rendering)**: Built with `build:client`, served on ports 4173/4175
2. **SSR (Server-Side Rendering)**: Built with `build:server`, served with Express on ports 4174/4176
3. **SSG (Static Site Generation)**: Built with `build:ssg`, pre-renders all routes to static HTML, served on ports 4178/4179

### Shared Library (`packages/lib`)

The `@hanghae-plus/lib` package provides framework-agnostic utilities:

**Core patterns:**

- **Observer Pattern** (`createObserver.ts`): Subscribe/notify mechanism for reactive updates
- **Store Pattern** (`createStore.ts`): Redux-like state management using reducer pattern
- **Storage Pattern** (`createStorage.ts`): localStorage wrapper with observer notifications
- **Router** (`Router.ts`): Client-side router with dynamic route matching and query param handling

**Custom Hooks:**

- `useStore`: Subscribe to store state changes
- `useStorage`: Subscribe to localStorage changes
- `useRouter`: Access router state and navigation
- `useAutoCallback`: Auto-memoized callbacks
- `useShallowState`: State with shallow equality checks
- `useShallowSelector`: Optimized store selectors with shallow comparison
- `useDeepMemo`: Deep equality memoization
- `useMemo`, `useCallback`, `useRef`: Custom implementations

**HOCs:**

- `memo`: React.memo alternative with shallow comparison
- `deepMemo`: React.memo alternative with deep comparison

**Equality Utilities:**

- `shallowEquals`: Compare objects by shallow equality
- `deepEquals`: Compare objects by deep equality

### Vanilla Implementation

The Vanilla package uses a custom lifecycle system instead of React's component lifecycle:

**withLifecycle HOC** (`packages/vanilla/src/router/withLifecycle.js`):

- Wraps page functions to provide mount/unmount lifecycle
- Supports watchers for reactive updates (similar to React useEffect with dependencies)
- Tracks current/previous page state to determine when to mount/unmount
- Example usage:
  ```javascript
  export const HomePage = withLifecycle(
    {
      onMount: () => {
        /* setup */
      },
      onUnmount: () => {
        /* cleanup */
      },
      watches: [
        [getDeps, callback], // Runs callback when deps change
      ],
    },
    (params) => {
      /* render function */
    },
  );
  ```

**Key architectural decisions:**

- Event-driven architecture using custom event system (`events.js`)
- Manual DOM manipulation with template strings
- Router integration with lifecycle management
- MSW (Mock Service Worker) for API mocking

### React Implementation

Standard React patterns with custom hooks from `@hanghae-plus/lib`:

- Functional components with hooks
- Custom router hooks for navigation
- Store hooks for state management
- SSR support via `main-server.tsx`

### SSR Server Configuration

Both Vanilla and React use Express servers (`server.js`) that:

- Serve static assets in production using `sirv` and `compression`
- Use Vite dev server middleware in development
- Render HTML on the server using `main-server.js/tsx`
- Replace `<!--app-head-->` and `<!--app-html-->` placeholders in index.html
- Support different base URLs via `BASE` environment variable

Production base URLs:

- Vanilla: `/front_7th_chapter4-1/vanilla/`
- React: `/front_7th_chapter4-1/react/`

### Testing

**Unit tests** (Vitest):

- Located in `packages/lib/src/__tests__/`
- Run with `pnpm run test:unit` from root or `pnpm test` from lib package
- Tests for core utilities (Observer, Store, Storage, Router)

**E2E tests** (Playwright):

- Located in `e2e/` directory
- Tests both Vanilla and React implementations across all rendering modes
- Runs against multiple ports (CSR dev/prod, SSR dev/prod, SSG) concurrently
- Test structure defined in `e2e/createTests.ts`
- Split into basic and advanced test suites

## Important Patterns

### Router Usage

The custom Router class supports:

- Dynamic route parameters (`:id` syntax)
- Query parameter management via `router.query` getter/setter
- Programmatic navigation via `router.push(url)`
- Data-link attribute for declarative navigation
- Subscribe to route changes
- Access current route, params, and handler via `router.route`, `router.params`, `router.target`

### Store Usage

Store follows Redux pattern:

```typescript
const store = createStore(reducer, initialState);
store.getState(); // Get current state
store.dispatch(action); // Dispatch action
store.subscribe(callback); // Subscribe to changes
```

### Observer Pattern

Used throughout for reactive updates:

```typescript
const observer = createObserver();
observer.subscribe(callback); // Subscribe to changes
observer.notify(); // Trigger all callbacks
```

## Configuration Files

- **Vite configs**: Each package has its own vite.config (vanilla uses .js, react and lib use .ts)
- **createViteConfig.ts**: Shared Vitest configuration factory at root
- **playwright.config.ts**: E2E test configuration
- **eslint.config.js**: Shared ESLint configuration
- **tsconfig.json**: Root TypeScript configuration
- **pnpm-workspace.yaml**: Workspace package definitions

## MSW (Mock Service Worker)

Both implementations use MSW for API mocking:

- Worker files located in `packages/*/src/mocks/`
- Service worker script served from `public/mockServiceWorker.js`
- Enabled in development and test modes
- Mocking conditionally enabled based on `import.meta.env.MODE`

## Environment Variables

- `NODE_ENV`: "production" or "development"
- `PORT`: Server port (defaults: vanilla=5173, react=5175)
- `BASE`: Base URL path for production builds
- `MODE`: Vite mode ("test" disables mocking initialization)

## Git Hooks

Uses Husky with lint-staged:

- Pre-commit hook runs prettier and eslint on staged files
- Configured per package and at root level
