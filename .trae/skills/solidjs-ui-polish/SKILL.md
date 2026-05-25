---
name: "solidjs-ui-polish"
description: "Polishes SolidJS components for reactivity correctness, performance, and UI refinement. Invoke when user asks to fix SolidJS reactivity issues, optimize rendering, polish component behavior, or implement SolidJS best practices."
---

# SolidJS UI Polish Skill

You are a SolidJS framework expert specializing in fine-grained reactivity, component architecture, and UI performance optimization. Apply these principles when working on the TRWM project.

## Project Context

TRWM is a Transmission BitTorrent Web Manager using SolidJS 1.9+, Vite 8, and TypeScript 6. The project polls Transmission RPC every 2 seconds and updates a reactive store with torrent data. Key challenges include maintaining smooth UI updates under frequent data changes, proper reactive dependency tracking, and efficient list rendering.

## SolidJS Reactivity Rules

### 1. Signal & Store Access Patterns

**Rule: Always access reactive values inside tracking scopes**

```tsx
// BAD: Accessing store outside tracking scope
const items = torrentStore.items;
const list = Object.values(items); // Not reactive!

// GOOD: Access inside createMemo or component body
const torrentList = createMemo(() => {
  const items = torrentStore.items;
  return Object.values(items);
});
```

**Rule: Establish fine-grained dependencies on store properties**

When a `createMemo` needs to react to specific property changes in a Store:

```tsx
// BAD: Only tracks the items reference, not property changes
const selectedTorrents = createMemo(() => {
  return selectedIds().map(id => torrentStore.items[id]);
});

// GOOD: Access properties to establish reactive tracking
const selectedTorrents = createMemo(() => {
  const ids = selectedIds();
  const result: Torrent[] = [];
  for (const id of ids) {
    const t = torrentStore.items[id];
    if (!t) continue;
    // Access key properties to establish reactive dependencies
    void t.rate_download;
    void t.rate_upload;
    void t.percent_done;
    void t.status;
    void t.error;
    result.push(t);
  }
  return result;
});
```

**Note:** The `void t.xxx` pattern is a pragmatic workaround for SolidJS Store's proxy-based reactivity. It forces the proxy getter to register the dependency. This is acceptable when you need a memo to re-run on specific property changes but don't want to destructure all properties.

### 2. Effect Dependency Control

**Rule: Use `on()` to explicitly control effect dependencies**

```tsx
// BAD: Effect runs on ANY reactive change in its body
createEffect(() => {
  const t = firstSelectedTorrent();
  if (t) syncForm(t); // Re-runs every 2s when torrent data updates!
});

// GOOD: Only run when specific dependency changes
createEffect(on(selectedIds, () => {
  const t = firstSelectedTorrent();
  if (t) syncForm(t);
}));

// GOOD: Also trigger on tab switch
createEffect(on(() => props.activeTab, (tab) => {
  if (tab === 'settings') syncForm();
}));
```

### 3. Store Updates with `reconcile`

**Rule: Use `reconcile` for bulk data replacement from RPC**

```tsx
// When receiving full torrent data from RPC:
setTorrentStore('items', reconcile(newItems, { key: 'id' }));

// `reconcile` does deep diff and only updates changed properties
// This preserves SolidJS Store proxy references for unchanged items
// `key` option ensures items are matched by id, not array index
```

**Rule: Use `produce` for targeted mutations**

```tsx
// When updating a single torrent's properties:
setTorrentStore('items', id, produce(t => {
  t.rate_download = newData.rate_download;
  t.status = newData.status;
}));
```

### 4. Component Props Reactivity

**Rule: Access props via function call or destructuring in tracking scope**

```tsx
// BAD: Destructuring outside tracking scope
const { torrents, activeTab } = props; // Loses reactivity!

// GOOD: Access via props.xxx in JSX (tracking scope)
<div>{props.torrents.length}</div>

// GOOD: Destructure in function parameter (SolidJS compiles this correctly)
const MyComponent: Component<{ items: Torrent[] }> = (props) => {
  // props.items is reactive when accessed in JSX/expressions
};
```

## Component Architecture Rules

### 1. Component Size & Responsibility

**Rule: One component per file, max ~200 lines**

If a component exceeds 200 lines, identify sub-components to extract:

| Pattern | Extract To |
|---------|-----------|
| Context menu logic | `components/ContextMenu.tsx` |
| Label dialog | `components/Modals/LabelDialog.tsx` |
| Keyboard shortcuts | `composables/useKeyboardShortcuts.ts` |
| Detail panel tabs | Already extracted (good) |
| Form sections in settings | Sub-components within SettingsTab |

### 2. State Management

**Rule: Global state in stores, local state in signals**

```
src/store/
  torrentStore.ts    — Torrent data, selection, filters
  modalStore.ts      — Modal open/close state
  rpc-session.ts     — Shared RPC session state
```

**Rule: Derived state uses `createMemo`, not signals**

```tsx
// BAD: Manually syncing derived state
const [count, setCount] = createSignal(0);
createEffect(() => setCount(torrentList().length));

// GOOD: Memoized derivation
const count = createMemo(() => torrentList().length);
```

### 3. Event Handler Patterns

```tsx
// Use onMount/onCleanup for DOM event listeners
onMount(() => {
  const handler = (e: KeyboardEvent) => { ... };
  document.addEventListener('keydown', handler);
  onCleanup(() => document.removeEventListener('keydown', handler));
});

// Use createEffect for reactive side effects
createEffect(() => {
  const ids = selectedIds();
  // This re-runs when selectedIds changes
  fetchDetails(ids);
});
```

## Performance Optimization Rules

### 1. List Rendering

**Rule: Always use `<For>` for dynamic lists, never `.map()`**

```tsx
// BAD: Creates all DOM nodes on every update
{torrents().map(t => <TorrentRow torrent={t} />)}

// GOOD: Fine-grained keyed updates
<For each={torrents()}>
  {(torrent) => <TorrentRow torrent={torrent} />}
</For>
```

### 2. Virtual Scrolling

**Rule: Use `@tanstack/solid-virtual` for lists > 50 items**

```tsx
import { createVirtualizer } from '@tanstack/solid-virtual';

const virtualizer = createVirtualizer({
  count: () => sortedList().length,  // MUST be getter for reactivity!
  getScrollElement: () => scrollRef,
  estimateSize: () => 30,  // Row height
  overscan: 10,
});
```

**Critical: `count` must be a getter function**, not a plain value. Without the getter, the virtualizer won't react to list changes.

### 3. Memoization

**Rule: Memoize expensive computations**

```tsx
// Expensive sorting/filtering
const sortedList = createMemo(() => {
  const list = torrentList();
  const sortBy = sortField();
  const dir = sortDirection();
  return [...list].sort((a, b) => {
    // Sort logic...
  });
});
```

**Rule: Don't over-memoize** — simple property access doesn't need `createMemo`

### 4. Avoiding Unnecessary Re-renders

**Rule: Split components at reactive boundaries**

```tsx
// BAD: Entire table re-renders when one cell changes
<For each={torrents()}>
  {(t) => (
    <tr>
      <td>{t.name}</td>
      <td>{formatSpeed(t.rate_download)}</td>  // Changes every 2s
    </tr>
  )}
</For>

// GOOD: Isolate frequently-changing cells
const SpeedCell: Component<{torrent: Torrent}> = (props) => {
  // Only this cell re-renders when rate_download changes
  return <td>{formatSpeed(props.torrent.rate_download)}</td>;
};
```

## TypeScript Rules

### 1. No `@ts-nocheck`

**Rule: Never use `@ts-nocheck`**. If a file has it, fix the type errors instead.

Common fixes:
- Add proper interface definitions for external data
- Use type assertions (`as Type`) sparingly for genuinely unknown shapes
- Import types from `src/types/transmission.ts`

### 2. Type Definitions

**Rule: Keep `src/types/transmission.ts` as the single source of truth**

All RPC-related types should be defined here with snake_case field names (matching JSON-RPC 2.0 protocol):

```typescript
export interface Torrent {
  id: number;
  name: string;
  rate_download: number;  // NOT rateDownload
  rate_upload: number;    // NOT rateUpload
  // ...
}
```

### 3. Store Type Safety

```typescript
// Define store shape explicitly
interface TorrentStoreState {
  items: Record<number, Torrent>;
  selectedIds: number[];
  // ...
}

const [torrentStore, setTorrentStore] = createStore<TorrentStoreState>({
  items: {},
  selectedIds: [],
});
```

## RPC Integration Rules

### 1. JSON-RPC 2.0 Protocol

All RPC calls must use JSON-RPC 2.0 format for Transmission 4.1+:

```typescript
{
  jsonrpc: "2.0",
  method: "torrent_set",     // underscore format
  params: {                   // NOT "arguments"
    ids: [1, 2, 3],
    download_limited: true,   // snake_case params
  },
  id: 1
}
```

### 2. Parameter Naming

**Rule: All RPC parameters must use snake_case**

```typescript
// BAD: camelCase (legacy protocol)
rpcCall('torrent-set', { bandwidthPriority: 1, downloadLimited: true })

// GOOD: snake_case (JSON-RPC 2.0)
rpcCall('torrent_set', { bandwidth_priority: 1, download_limited: true })
```

### 3. Table Format

Use `format: "table"` for `torrent_get` to reduce response size:

```typescript
// Response format:
// { result: { torrents: [["id", "name", ...], [1, "foo", ...], [2, "bar", ...]] } }
// First row = headers, rest = data rows
```

### 4. Session ID Sharing

All RPC modules must use the shared session state from `src/api/rpc-session.ts`:

```typescript
import { getSessionId, setSessionId } from './rpc-session';
```

## Common Anti-Patterns to Avoid

| Anti-Pattern | Fix |
|---|---|
| `createEffect(() => { const x = signal(); ... })` without `on()` | Use `createEffect(on(signal, callback))` |
| `Object.values(store.items)` in component body without memo | Wrap in `createMemo` |
| `.map()` for list rendering | Use `<For each={}>` |
| `style={{...}}` for static values | Use CSS classes or Tailwind |
| Inline `<style>` blocks in TSX | Extract to `.css` file |
| Destructuring props outside tracking scope | Access `props.xxx` directly |
| `recently-active` with JSON-RPC 2.0 table format | Doesn't work; fetch all torrents |
| SolidJS Store Proxy objects in IndexedDB | Use `JSON.parse(JSON.stringify(obj))` first |
