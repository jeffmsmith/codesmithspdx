# TypeScript Lint Fixes — Patterns & Anti-Patterns

**Purpose:** Reference for common fixes applied to ESLint + TypeScript compiler errors. Use as decision authority when similar issues arise.

---

## TS2345 — Argument Type Mismatch (common in React props)

### Fix: Add missing properties to mock / inline state objects

**When:** TypeScript infers a narrower type from a literal value than the target expects. This commonly happens with test mocks, inline state assignments, and `useActionState` mock setups.

**How:** Ensure every property that the target type expects is present on the mock/inline value. Use `as` type assertions sparingly — prefer adding the missing properties to match the type exactly.

**Example:**

```typescript
// Before: TypeScript infers { step: number; error: string | null }
const mockActionState = {
  state: { step: 1, error: null },
  submitAction: vi.fn(),
  isPending: false,
};

// After: all properties matching the LoginFormState type
const mockActionState = {
  state: {
    step: 1,
    error: null as string | null | undefined,
    username: undefined as string | undefined,
    challengeId: undefined as string | undefined,
  },
  submitAction: vi.fn(),
  isPending: false,
};
```

**Why not `any`:** Using `any` on the mock defeats type safety. The mock should match the real type.

---

## @typescript-eslint/no-extraneous-class — Classes with only static members

### Fix: Convert static-only test helper classes to async functions

**When:** A class in test files contains only `static` methods. This is common when modules need to be re-imported for test isolation.

**How:** Replace the class with a simple async function. Update all callers to use the function instead of `ClassName.method()`.

**Example:**

```typescript
// Before: static-only test helper class
class AppStoreModule {
  static async load(): Promise<typeof import("./AppStore").AppStore> {
    delete (globalThis as Record<string, unknown>).__app_store_state$;
    delete (globalThis as Record<string, unknown>).__app_store_initialized;
    vi.resetModules();
    const mod = await import("./AppStore");
    return mod.AppStore;
  }
}

// After: simple async function
async function loadAppStore(): Promise<typeof import("./AppStore").AppStore> {
  delete (globalThis as Record<string, unknown>).__app_store_state$;
  delete (globalThis as Record<string, unknown>).__app_store_initialized;
  vi.resetModules();
  const mod = await import("./AppStore");
  return mod.AppStore;
}
```

**Why:** Classes with only static members are namespaces masquerading as classes. A function is the correct abstraction.

---

## @typescript-eslint/require-await — Async callbacks with no `await`

### Fix: Remove `async` from callbacks that don't `await` anything

**When:** An `it()` test callback is marked `async` but contains no `await` expressions. Common when callbacks only call `.subscribe()` (sync) or `expect()` without awaiting.

**How:** Remove the `async` keyword from the callback.

**Example:**

```typescript
// Before
it("should emit when state changes", async () => {
  const sub = AppStore.getStateObservable().subscribe(() => { emitted = true; });
  AppStore.setRooms([]);
  expect(emitted).toBe(true);
  sub.unsubscribe();
});

// After
it("should emit when state changes", () => {
  const sub = AppStore.getStateObservable().subscribe(() => { emitted = true; });
  AppStore.setRooms([]);
  expect(emitted).toBe(true);
  sub.unsubscribe();
});
```

**Note:** If a test callback genuinely needs to `await` something (e.g., `waitFor`, `act`), keep `async`. Only remove it when the body has zero `await` expressions.

---

## @typescript-eslint/no-floating-promises — `await` on `void` functions

### Fix: Remove `await` from `void` functions; handle errors differently

**When:** `await` is used on a function that returns `void` (not `Promise<void>`). This is the most common floating-promise error in this codebase.

**How:**
1. If the function is fire-and-forget (e.g., sets `window.location.href`), remove `await` and the `.catch()` handler.
2. If the function should return a promise, change its return type from `void` to `Promise<void>` and add `async`.
3. For callback handlers (e.g., `onClick`), simply call the function without `await`.

**Example — Before: redirect function marked `async` unnecessarily**

```typescript
// authService.ts — returns void but marked async
export async function initiatePkceLogin(): Promise<void> {
  // ...
  window.location.href = url;
}

// LoginForm.tsx — awaiting void, .catch() on void
try {
  await initiatePkceLogin();
} catch (err) {
  return { error: err instanceof Error ? err.message : "Login failed", step: 2 };
}

// Button onClick
onClick={() => {
  initiatePkceLogin().catch((err) => { console.error(err); });
}}
```

**After:**

```typescript
// authService.ts — sync void
export function initiatePkceLogin(): void {
  // ...
  window.location.href = url;
}

// LoginForm.tsx — fire-and-forget
initiatePkceLogin();
// unreachable — initiatePkceLogin redirects

// Button onClick
onClick={() => {
  initiatePkceLogin();
}}
```

**Why:** `void` means "no value returned." You cannot `await` void and you cannot call `.catch()` on void.

---

## @typescript-eslint/no-floating-promises — `await` on `void` mock functions

### Fix: Remove `await` from mock helper calls

**When:** A test helper function returns `void` (or is declared as such). Tests `await mockFetch(...)` and get a floating-promise error.

**How:** If the mock function doesn't return anything meaningful, remove `await`.

**Example:**

```typescript
// Before
async function mockFetch(ok: boolean, data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(data) });
}
await mockFetch(true, rooms);  // ERROR: await on void

// After
function mockFetch(ok: boolean, data: unknown, status = 200): void {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(data) });
}
mockFetch(true, rooms);  // No await
```

**Why:** `mockResolvedValue` on `vi.fn()` sets up the mock but the mock function returns `undefined`/`void`. The `await` belongs on the actual service function (`fetchRooms()`), not on the mock setup.

---

## no-unused-vars — Unused imports

### Fix: Remove the import

**When:** An import is declared but never used in the file.

**How:** Remove the import statement.

**Example:**

```typescript
// Before: Component and ReactNode imported but not used
import { useCallback, useRef, useState, use, Component, type ReactNode } from "react";

// After: only used imports remain
import { useCallback, useState, use } from "react";
```

---

## @typescript-eslint/no-unused-vars — Unused variables

### Fix: Remove the variable or prefix with `_` if intentionally unused

**When:** A variable is declared but never read.

**How:** Remove the variable. If it's a callback parameter that needs to stay for signature compatibility, prefix with `_`.

---

## Prettier — Formatting authority

### Setup

**When:** You need Prettier to handle all formatting so agents and humans don't fight over indentation, quotes, and semicolons.

**How:** Install `prettier`, `eslint-config-prettier`, and `prettier-plugin-tailwindcss`. Add `.prettierrc` and `.prettierignore`. Add `prettierConfig` to ESLint flat config `extends` array. Add `format`/`format:check` scripts to `package.json`.

**Files created:**
- `ui/.prettierrc` — 2-space indent, single quotes, semicolons, trailing comma ES5, 100 char print width, Tailwind plugin
- `ui/.prettierignore` — excludes `node_modules`, `dist`, `coverage`, `*.d.ts`, playwright cache
- `ui/eslint.config.js` — imports `prettierConfig`, adds it to `extends` to disable all formatting rules
- `ui/package.json` scripts — `format` (prettier --write .) and `format:check` (prettier --check .)

**Why Prettier:** The previous 4-space vs 2-space indentation war across test files cost more time than the formatting rules themselves. Prettier is opinionated — no `noqa` equivalents, no `prettier-ignore` needed. Run `npm run format` once and the entire codebase is normalized. The IDE can run Prettier on save.

---

## ESLint Config: 2-space indentation

### Fix: Use consistent 2-space indentation

**When:** Files mix 4-space and 2-space indentation, or have inconsistent bracket alignment.

**How:** The ESLint config in this project does not include Prettier — formatting is done by the editor. Consistent 2-space indentation is the convention.

---

## ESLint Config: Removing Rule Suppressions

### Fix: Replace rule suppression with code-level fix

**When:** A lint rule is suppressed globally in `eslint.config.js` (e.g., `"@typescript-eslint/no-extraneous-class": "off"`), masking real issues rather than fixing them.

**How:** Instead of suppressing the rule, fix the code. Only keep suppressions that are genuinely unfixable at the code level.

**Example — Before: global suppressions**

```javascript
// eslint.config.js — suppressions masking real issues
{
  files: ["**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/require-await": "off",
  },
}
```

**After: suppressions removed, test files get targeted allowances**

```javascript
// eslint.config.js — active rules, targeted test file allowances
{
  files: ["**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-floating-promises": ["error"],
  },
},
{
  files: ["**/*.test.ts", "**/*.test.tsx"],
  rules: {
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
  },
}
```

**Why:** Suppressed rules are dead rules. Every rule should enforce something. Test files need `no-unsafe-call`/`no-unsafe-member-access` suppressed because `vi.fn()` returns `any`.

---

## tsconfig: Missing Node.js types

### Fix: Add `"node"` to `types` in tsconfig.app.json

**When:** TypeScript can't resolve Node.js built-in module types (e.g., `import("fs")` in Playwright fixtures). The error is `Cannot find module 'node:fs' or its corresponding type declarations`.

**How:** Add `"node"` to the `types` array in `compilerOptions`. This gives the compiler access to Node.js built-in type declarations.

**Example:**

```json
// Before
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}

// After
{
  "compilerOptions": {
    "types": ["vite/client", "node"]
  }
}
```

**Why:** Vite client types are needed for Vite-specific globals (`import.meta`). Node types are needed when the code imports Node built-ins (like `fs` in Playwright test fixtures).

---

## Vitest Config: Preventing Playwright E2E tests from running as unit tests

### Fix: Add `include`/`exclude` patterns to vitest.config.ts

**When:** Playwright E2E test files (`playwright/tests/**/*.spec.ts`) are accidentally picked up by `vitest` during unit test runs. This causes spurious failures because E2E tests require a real browser and dev server.

**How:** Explicitly specify which files vitest should run with `include` and `exclude` patterns.

**Example:**

```typescript
// Before: vitest tries to find ALL *.test files including E2E
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
  },
});

// After: narrow include, exclude playwright directory
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/playwright/**"],
  },
});
```

**Why:** Playwright E2E tests use `*.spec.ts` naming and live in a `playwright/` directory. `include` + `exclude` makes the test scope explicit and prevents cross-framework contamination.

---

## React 19: Class Components vs Functional Components

### Fix: Remove `Component` class, convert to functional components with hooks

**When:** A class component exists only as an error boundary and uses `getDerivedStateFromError` / `componentDidCatch`. This pattern is obsolete with React 19's `use()` hook and Suspense integration.

**How:** Remove the error boundary class entirely. Let `use()` handle promise rejections through the existing Suspense boundary in the parent component (`App.tsx`).

**Example:**

```typescript
// Before: class error boundary wrapping AgentPanel
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) return <div className="red">Error</div>;
    return this.props.children;
  }
}

// Usage: <ErrorBoundary><AgentPanel /></ErrorBoundary>

// After: remove ErrorBoundary entirely
// use(agentsPromise) in AgentPanel throws on rejection — caught by Suspense in App.tsx
```

**Why:** React 19's `use()` hook integrates with Suspense for error handling. Class-based error boundaries are a React 18 pattern. In React 19, if a promise in `use()` rejects, it bubbles through Suspense boundaries.

---

## React 19: useSyncExternalStore for reactive data

### Fix: Replace RxJS BehaviorSubject with `useSyncExternalStore`

**When:** RxJS is used for simple pub/sub observables but the codebase doesn't actually need RxJS operators (map, filter, merge, etc.). This adds an unnecessary dependency and type complexity.

**How:** Replace with a simple subscriber pattern using `useSyncExternalStore` from React. The store module exports `subscribe`, `getSnapshot`, and `getServerSnapshot`.

**Example:**

```typescript
// AgentModels.ts — simple pub/sub store
type Listener = () => void;
let models: string[] = [];
const listeners = new Set<Listener>();

export function subscribeModels(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getModels(): string[] { return models; }

export async function refreshModels(): Promise<void> {
  models = await listModels().catch(() => []);
  notify();
}
```

```typescript
// useAgentModels.ts — React hook
import { useSyncExternalStore } from "react";
import { getModels, subscribeModels } from "./AgentModels";

function subscribe(handleChange: () => void): () => void {
  return subscribeModels(handleChange);
}

export function useAgentModels(): string[] {
  return useSyncExternalStore(subscribe, getModels, () => []);
}
```

**Why `useSyncExternalStore`:** It's the React 19 pattern for subscribing to external state sources. No RxJS dependency, no complex operators — just plain subscribe/getSnapshot functions. The `getServerSnapshot` fallback (`() => []`) prevents SSR mismatches.

---

## Dynamic Node.js imports for Node built-ins

### Fix: Use `await import()` instead of `import { x } from "node:module"`

**When:** TypeScript can't resolve Node.js built-in module types in a file that isn't in the Node.js build (e.g., Playwright E2E fixtures). The error is `Cannot find module 'node:fs' or its corresponding type declarations`.

**How:** Use dynamic `await import("fs")` instead of static `import { writeFileSync } from "node:fs"`. Cast the result to the expected type shape.

**Example:**

```typescript
// Before: static import fails with tsconfig.app.json
import { writeFileSync } from "node:fs";
writeFileSync(stateFile, JSON.stringify({ cookies, origins: [] }));

// After: dynamic import — resolves at runtime, bypasses tsconfig
const stateFile = new URL("../../storage-state.json", import.meta.url).pathname;
const fsModule = (await import("fs")) as {
  writeFileSync: (file: string, data: string) => void;
};
fsModule.writeFileSync(stateFile, JSON.stringify({ cookies, origins: [] }));
```

**Why:** Static imports from `node:` modules require the `@types/node` package and `tsconfig.app.json` types. Dynamic `import()` resolves at runtime regardless of TypeScript config.


