# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pnpm workspace monorepo implementing a shopping mall application in both Vanilla JavaScript and React, with a shared custom library that provides React-like primitives. The project demonstrates SSR (Server-Side Rendering), SSG (Static Site Generation), and CSR (Client-Side Rendering) patterns.

## Monorepo Structure

Three packages in `packages/`:

- `@hanghae-plus/lib`: Custom framework library providing React-like hooks, store management, and routing
- `@hanghae-plus/shopping-vanilla`: Vanilla JS shopping mall implementation
- `@hanghae-plus/shopping-react`: React shopping mall implementation

Both vanilla and React packages consume the shared `lib` package via workspace dependencies.

## Essential Commands

### Development
```bash
# Install dependencies (MUST use pnpm, requires Node.js >= 22, pnpm >= 10)
pnpm install

# Vanilla package - run all rendering modes in parallel
pnpm -F @hanghae-plus/shopping-vanilla serve:test
# This runs 5 servers: DevCSR (5173), DevSSR (5174), ProdCSR (4173), ProdSSR (4174), SSG (4178)

# React package - run all rendering modes in parallel
pnpm -F @hanghae-plus/shopping-react serve:test
# This runs 5 servers: DevCSR (5175), DevSSR (5176), ProdCSR (4175), ProdSSR (4176), SSG (4179)

# Run both vanilla and React test servers together (root)
pnpm run serve:test
```

### Individual Development Servers
```bash
# Vanilla CSR dev server (port 5173)
pnpm -F @hanghae-plus/shopping-vanilla dev

# Vanilla SSR dev server (port 5174)
pnpm -F @hanghae-plus/shopping-vanilla dev:ssr

# React CSR dev server (port 5175)
pnpm -F @hanghae-plus/shopping-react dev

# React SSR dev server (port 5176)
pnpm -F @hanghae-plus/shopping-react dev:ssr
```

### Building
```bash
# Build all packages
pnpm run build

# Build specific package (includes CSR + SSR + SSG)
pnpm -F @hanghae-plus/shopping-vanilla build
pnpm -F @hanghae-plus/shopping-react build

# Build without SSG (CSR + SSR only)
pnpm -F @hanghae-plus/shopping-vanilla build:without-ssg
```

### Testing
```bash
# Run unit tests (lib package)
pnpm run test:unit

# Run E2E tests (requires serve:test to be running)
pnpm run test:e2e

# Run only basic E2E tests
pnpm run test:e2e:basic

# Run only advanced E2E tests
pnpm run test:e2e:advanced

# Run E2E tests in UI mode
pnpm run test:e2e:ui

# Show E2E test report
pnpm run test:e2e:report
```

### Code Quality
```bash
# Type check all packages
pnpm run tsc

# Lint and auto-fix all packages
pnpm run lint:fix

# Format code with Prettier
pnpm run prettier:write
```

## Core Architecture

### Custom React-like Library (`@hanghae-plus/lib`)

The `lib` package provides a custom framework with React-like primitives:

**State Management:**
- `createStore(reducer, initialState)`: Redux-style store with observer pattern
- `createObserver()`: Pub/sub implementation for reactive updates
- `createStorage(key, initialValue)`: localStorage wrapper with reactivity

**Router:**
- `Router` class: Custom SPA router with dynamic route matching (`/products/:id/`)
- Supports `data-link` attribute for declarative navigation
- Query parameter management via `router.query` getter/setter
- `useRouter()` hook for accessing router in components

**React Hooks (for React package):**
- `useStore(store, selector?)`: Subscribe to store updates
- `useMemo(fn, deps)`: Memoization
- `useCallback(fn, deps)`: Function memoization
- `useRef(initialValue)`: Ref management
- `useStorage(key, initialValue)`: localStorage hook
- `useShallowSelector(store, selector)`: Shallow-equal store subscription
- `useDeepMemo(fn, deps)`: Deep-equal memoization

**HOCs:**
- `memo(Component)`: Shallow-equal memoization
- `deepMemo(Component)`: Deep-equal memoization

### Store Pattern

Both packages use Redux-style stores with actions and reducers:

**Vanilla stores** (`packages/vanilla/src/stores/`):
- `productStore`: Products list, details, related products, categories
- `cartStore`: Cart items, selection state, totals
- `uiStore`: Modal, toast, loading states

**Store usage pattern:**
```javascript
const store = createStore(reducer, initialState);

// Dispatch actions
store.dispatch({ type: 'ACTION_TYPE', payload: data });

// Subscribe to changes
store.subscribe(() => {
  const state = store.getState();
  // Update UI
});
```

### Rendering Strategies

**CSR (Client-Side Rendering):**
- Standard Vite dev server
- Client-side routing and data fetching
- Entry point: `src/main.js` (vanilla) or `src/main.tsx` (React)

**SSR (Server-Side Rendering):**
- Express server: `server.js` in each package
- Server entry: `src/main-server.js` (vanilla) or `src/main-server.tsx` (React)
- Data prefetching on server before rendering
- HTML template injection: `<!--app-html-->`, `<!--app-head-->`
- Initial state hydration via `window.__INITIAL_DATA__`

**SSG (Static Site Generation):**
- Build script: `static-site-generate.js` in each package
- Pre-renders all product detail pages at build time
- Generates `/products/:id/index.html` for each product
- Deployed to `/dist/vanilla` or `/dist/react` for GitHub Pages

### Hydration Pattern

Server renders HTML with initial state, client picks up from there:

1. Server fetches data and renders HTML
2. Server injects `<script>window.__INITIAL_DATA__ = {...}</script>`
3. Client checks `window.__INITIAL_DATA__` and initializes stores with it
4. Client attaches event listeners (hydration)
5. Subsequent navigation is CSR

### API Mocking

Uses MSW (Mock Service Worker) for API mocking:

- Mock handlers: `src/mocks/handlers.js`
- Product data: `src/mocks/items.json` (340+ products)
- Categories API, products list/detail APIs
- Works in both browser and Node.js (SSR)

### Routing Structure

- `/`: Home page (product list with filters, search, pagination)
- `/products/:id/`: Product detail page (with related products)

Router supports:
- Dynamic parameters: `:id`
- Query strings: `?search=...&category1=...&sort=...`
- Declarative links: `<a href="/products/1/" data-link>`

## Development Workflow

### Adding New Features

1. For shared utilities/hooks: Add to `packages/lib/src/`
2. For vanilla-specific: Add to `packages/vanilla/src/`
3. For React-specific: Add to `packages/react/src/`

### Running Tests

E2E tests require both vanilla and React test servers running:
```bash
# Terminal 1: Start all test servers
pnpm run serve:test

# Terminal 2: Run E2E tests
pnpm run test:e2e
```

### Modifying SSR/SSG

**SSR changes:**
- Server logic: Edit `server.js` and `src/main-server.js/tsx`
- Ensure data prefetching happens before render
- Update HTML template in `index.html` if needed

**SSG changes:**
- Edit `static-site-generate.js`
- Ensure all dynamic routes are generated
- Test with `build:ssg` and `preview:ssg`

## Important Notes

### Package Manager
MUST use pnpm. Project requires Node.js >= 22 and pnpm >= 10. Do not use npm or yarn.

### Workspace Dependencies
The `lib` package is referenced via `"@hanghae-plus/lib": "workspace:*"` in vanilla and React packages. Changes to `lib` require rebuilding dependent packages in production, but work automatically in dev mode.

### Store State Shape
When modifying stores, maintain immutability. The store only triggers updates if `!Object.is(newState, state)`.

### Router Navigation
Use `data-link` attribute on links for SPA navigation. Direct `href` changes without `data-link` will cause full page reloads.

### Git Hooks
Husky runs lint-staged on commit, which runs prettier and eslint on staged files.

## Testing Strategy

- **Unit tests**: Vitest for `lib` package testing React hooks and utilities
- **E2E tests**: Playwright tests across all rendering modes (CSR/SSR/SSG)
- **DOM tests**: `@testing-library/dom` for vanilla component testing
- **API mocking**: MSW intercepts API calls in both dev and test environments
