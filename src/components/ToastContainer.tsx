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
  success: 'bg-success/10 text-success border-success/30',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-primary/10 text-primary border-primary/30',
};

export const ToastContainer: Component = () => {
  return (
    <div class="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-[400px] pointer-events-none">
      <For each={toasts()}>
        {(toast) => {
          const IconComp = typeIcon[toast.type];
          return (
            <div
              class={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-[13px] font-medium cursor-pointer animate-in fade-in slide-in-from-right-8 duration-300 border backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 ${typeClass[toast.type]}`}
              onClick={() => dismissToast(toast.id)}
            >
              <IconComp size={15} class="flex-shrink-0" />
              <span>{toast.message}</span>
            </div>
          );
        }}
      </For>
    </div>
  );
};
