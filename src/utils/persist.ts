import { createSignal, createEffect } from 'solid-js';

/**
 * Creates a signal that persists its value to localStorage.
 * On init, reads from localStorage; on change, writes back.
 */
export function createPersistedSignal<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key);
  let initial = defaultValue;
  if (stored !== null) {
    try {
      initial = JSON.parse(stored) as T;
    } catch {
      console.warn(`Failed to parse persisted value for key "${key}", using default`);
      localStorage.removeItem(key);
    }
  }
  const [value, setValue] = createSignal<T>(initial);

  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return [value, setValue] as const;
}
