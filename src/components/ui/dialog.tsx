import { Component, JSX, splitProps } from 'solid-js';
import * as KDialog from '@kobalte/core/dialog';
import { cn } from '../../lib/utils';
import { X } from 'lucide-solid';

// Export the root dialog component and trigger
export const Dialog = KDialog.Root;
export const DialogTrigger = KDialog.Trigger;

export const DialogPortal: Component<{ children: JSX.Element }> = (props) => (
  <KDialog.Portal>{props.children}</KDialog.Portal>
);

export const DialogOverlay: Component<any> = (props) => {
  const local = props as any;
  return (
    <KDialog.Overlay
      class={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0',
        local.class ?? ''
      )}
      {...local}
    />
  );
};

export const DialogContent: Component<any> = (props) => {
  const { class: className, hideClose, children, ...rest } = props as any;
  return (
    <DialogPortal>
      <DialogOverlay />
      <KDialog.Content
        class={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%] sm:rounded-lg',
          className ?? ''
        )}
        aria-modal="true"
        {...rest}
      >
        {children}
        {!hideClose && (
          <KDialog.CloseButton class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-accent data-[expanded]:text-muted-foreground">
            <X size={16} />
            <span class="sr-only">Close</span>
          </KDialog.CloseButton>
        )}
      </KDialog.Content>
    </DialogPortal>
  );
};

export const DialogHeader: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { class: className, ...rest } = props;
  return <div class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...rest} />;
};

export const DialogFooter: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { class: className, ...rest } = props;
  return <div class={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...rest} />;
};

export const DialogTitle: Component<any> = (props) => {
  const { class: className, ...rest } = props as any;
  return <KDialog.Title class={cn('text-lg font-semibold leading-none tracking-tight', className ?? '')} {...rest} />;
};

export const DialogDescription: Component<any> = (props) => {
  const { class: className, ...rest } = props as any;
  return <KDialog.Description class={cn('text-sm text-muted-foreground', className ?? '')} {...rest} />;
};
