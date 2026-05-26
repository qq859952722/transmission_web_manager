import { Component, JSX, splitProps } from 'solid-js';
import { cn } from '../../lib/utils';

export interface SwitchProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: Component<SwitchProps> = (props) => {
  const [local, rest] = splitProps(props, ['checked', 'onCheckedChange', 'disabled', 'class']);
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={local.checked}
      disabled={local.disabled}
      class={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.checked ? "bg-primary border-primary shadow-sm" : "bg-muted-foreground/30 border-muted-foreground/30 shadow-inner hover:bg-muted-foreground/40",
        local.class
      )}
      onClick={() => local.onCheckedChange(!local.checked)}
      {...rest}
    >
      <span
        data-state={local.checked ? "checked" : "unchecked"}
        class={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          local.checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
};
