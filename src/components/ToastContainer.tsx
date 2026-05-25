import { Component, For } from 'solid-js';
import { Check, X, AlertTriangle, Info } from 'lucide-solid';
import { toasts, dismissToast, type ToastType } from '../utils/toast';

const typeIcon: Record<ToastType, Component<{ size?: number; class?: string }>> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
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
        {(toast) => {
          const IconComp = typeIcon[toast.type];
          return (
            <div class={`toast ${typeClass[toast.type]}`} onClick={() => dismissToast(toast.id)}>
              <IconComp size={14} class="toast-icon" />
              <span class="toast-msg">{toast.message}</span>
            </div>
          );
        }}
      </For>
    </div>
  );
};
