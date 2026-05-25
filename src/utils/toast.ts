import { createSignal } from 'solid-js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;
const [toasts, setToasts] = createSignal<Toast[]>([]);

export { toasts };

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = ++nextId;
  setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, duration);
}

export function dismissToast(id: number) {
  setToasts(prev => prev.filter(t => t.id !== id));
}
