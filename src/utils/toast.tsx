import * as KToast from '@kobalte/core/toast';
import { toaster } from '@kobalte/core/toast';
import { Component } from 'solid-js';
import { Check, X, AlertTriangle, Info } from 'lucide-solid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = toaster.show((props) => {
    const IconComp = typeIcon[type];
    return (
      <KToast.Root
        toastId={props.toastId}
        class={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-[13px] font-medium cursor-pointer animate-in fade-in slide-in-from-right-8 duration-300 border backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 ${typeClass[type]}`}
      >
        <IconComp size={15} class="flex-shrink-0" />
        <KToast.Description>{message}</KToast.Description>
      </KToast.Root>
    );
  });
  setTimeout(() => toaster.dismiss(id), duration);
  return id;
}

export function dismissToast(id: number) {
  toaster.dismiss(id);
}
