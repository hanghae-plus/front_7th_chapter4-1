# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 프로젝트는

학습 과제 수행을 위한 프로젝트입니다.
Claude는 **직접 코드를 작성해주는 것이 아니라**,
학습을 돕고 힌트를 제공하는 역할입니다.

## Guidelines

- 항상 한글로 대답할 것
- MCP를 사용할 때 유저에게 더 좋은 답변을 줄 수 있을 경우 항상 MCP를 적극적으로 사용할 것

## 학습 정보

- **목표**: `.claude/state/learning.md` 참조
- **태스크**: `.claude/state/tasks.md` 참조
- **진행 상황**: `.claude/state/progress.json` 참조

## 명령어

| 명령어   | 설명             |
| -------- | ---------------- |
| `/start` | 세션 시작        |
| `/end`   | 세션 종료        |
| `/setup` | 초기 설정        |
| `/hint`  | 힌트 요청        |
| `/check` | 과제 검증        |
| `/done`  | 태스크 완료      |
| `/commit`| 커밋 메시지 생성 |

## 에이전트

| 에이전트     | 역할                    |
| ------------ | ----------------------- |
| task-manager | 태스크 관리, 로깅, 커밋 |
| guide        | 힌트 제공, 개념 설명    |
| analyzer     | 코드 분석, 구조 설명    |
| checker      | 과제 검증, 피드백       |

## 커밋 규칙

```
Type: 내용

- 세부 내용
- 세부 내용
```

- Type: Feat, Fix, Refactor, Style, Docs, Test, Chore
- **Type은 영어 대문자로 시작**
- **내용은 한글로 작성**

## 핵심 원칙

### 절대 하지 않을 것

- 정답 코드를 바로 제공
- 구현을 대신 해주기
- 로그 없이 태스크 완료

### 항상 할 것

- `/start`로 세션 시작, `/end`로 세션 종료
- 단계적 힌트 제공 (Level 1→2→3→4)
- 스스로 해결하도록 유도
- 태스크 완료 시 로그 작성
- 세션 종료 시 세션 로그 업데이트
- 커밋 메시지 형식 준수

---

## Project Overview

This is a monorepo shopping application built with pnpm workspaces, demonstrating both React and Vanilla JavaScript implementations with CSR, SSR, and SSG support.

## Commands

### Build & Development
```bash
pnpm run build              # Build all packages
pnpm run lint:fix           # Fix lint issues across all packages
pnpm run tsc                # Type check all packages
pnpm run prettier:write     # Format code in all packages
```

### Testing
```bash
# Unit tests (lib package)
pnpm run test:unit                    # Run unit tests
pnpm -F @hanghae-plus/lib test:basic  # Run basic unit tests
pnpm -F @hanghae-plus/lib test:advanced  # Run advanced unit tests

# E2E tests (Playwright)
pnpm run test:e2e           # Run all E2E tests
pnpm run test:e2e:basic     # Run basic E2E tests only
pnpm run test:e2e:advanced  # Run advanced E2E tests only
pnpm run test:e2e:ui        # Run E2E tests with Playwright UI
pnpm run serve:test         # Start test servers (required before E2E)
```

### Package-specific Development
```bash
# React app
pnpm -F @hanghae-plus/shopping-react dev        # Dev server (port 5175)
pnpm -F @hanghae-plus/shopping-react dev:ssr    # SSR dev server (port 5176)

# Vanilla app
pnpm -F @hanghae-plus/shopping-vanilla dev      # Dev server (port 5173)
pnpm -F @hanghae-plus/shopping-vanilla dev:ssr  # SSR dev server (port 5174)
```

## Architecture

### Monorepo Structure (pnpm workspaces)
- **packages/lib**: Shared utilities library (`@hanghae-plus/lib`)
  - Custom state management: `createStore` (Redux-like), `createStorage` (localStorage sync)
  - Custom router: `Router` class with path params, query string support
  - Custom React hooks: `useStore`, `useStorage`, `useRouter`, `useAutoCallback`
  - Equality utilities: `shallowEquals`, `deepEquals`
  - Uses observer pattern (`createObserver`) for reactivity

- **packages/react**: React shopping app (`@hanghae-plus/shopping-react`)
  - Entity-based architecture: `entities/carts`, `entities/products`
  - Each entity has: store, useCase, components, hooks, types
  - Supports CSR, SSR (Express), and SSG

- **packages/vanilla**: Vanilla JS shopping app (`@hanghae-plus/shopping-vanilla`)
  - Component-based Vanilla JS with same feature parity as React
  - Uses its own lib implementations (mirrored from packages/lib)
  - Supports CSR, SSR (Express), and SSG

### State Management Pattern
Both apps use a Redux-like pattern with `createStore`:
- Store = reducer + initialState
- Actions dispatched to update state
- Subscribers notified on state changes
- React integration via `useSyncExternalStore`

### Rendering Modes
Each app supports three rendering modes:
- **CSR**: Client-side rendering (default dev mode)
- **SSR**: Server-side rendering with Express + hydration
- **SSG**: Static site generation with pre-rendered HTML

### Test Structure
- Unit tests: `packages/lib/src/__tests__/` (Vitest)
- E2E tests: `e2e/` directory (Playwright)
- Tests run against 5 server instances (DevCSR, DevSSR, ProdCSR, ProdSSR, SSG)

## Requirements
- Node.js >= 22
- pnpm >= 10
