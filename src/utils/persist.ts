import { createSignal, createEffect } from 'solid-js';

/**
 * Creates a signal that persists its value to localStorage.
 * On init, reads from localStorage; on change, writes back.
 */
export function createPersistedSignal<T>(key: string, defaultValue: T) {
  let stored: string | null = null;
  try { stored = localStorage.getItem(key); } catch { stored = null; }
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
    try { localStorage.setItem(key, JSON.stringify(value())); } catch { /* ignore */ }
  });

  return [value, setValue] as const;
}
