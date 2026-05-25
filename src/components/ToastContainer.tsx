import { Component, For } from 'solid-js';
import { toasts, dismissToast, type ToastType } from '../utils/toast';

const typeIcon: Record<ToastType, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const typeClass: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
};

export const ToastContainer: Component = () => {
  return (
    <div class="toast-container">
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast ${typeClass[toast.type]}`} onClick={() => dismissToast(toast.id)}>
            <span class="toast-icon">{typeIcon[toast.type]}</span>
            <span class="toast-msg">{toast.message}</span>
          </div>
        )}
      </For>
    </div>
  );
};
