import { type JSX, splitProps } from 'solid-js';
import { cn } from '../../lib/utils';

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, ['class', 'type', 'error', 'id']);
  
  return (
    <div class="relative w-full">
      <input
        type={local.type || 'text'}
        class={cn(
          'flex h-9 w-full rounded-md border border-input/80 bg-muted/40 hover:bg-muted/60 focus:bg-background px-3 py-1 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
          local.error && 'border-destructive focus-visible:ring-destructive',
          local.class
        )}
        id={local.id}
        aria-invalid={!!local.error}
        aria-describedby={local.error ? `${local.id}-error` : undefined}
        {...others}
      />
      {local.error && (
        <p id={`${local.id}-error`} class="mt-1 text-xs text-destructive font-medium" role="alert">
          {local.error}
        </p>
      )}
    </div>
  );
}
