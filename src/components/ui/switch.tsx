import { Component, splitProps } from 'solid-js';
import { Switch as KobalteSwitch } from '@kobalte/core/switch';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  class?: string;
}

export const Switch: Component<SwitchProps> = (props) => {
  const [local, rest] = splitProps(props, ['checked', 'onCheckedChange', 'disabled', 'class']);
  
  return (
    <KobalteSwitch
      checked={local.checked}
      onChange={local.onCheckedChange}
      disabled={local.disabled}
      class={cn("inline-flex items-center", local.class)}
      {...rest}
    >
      <KobalteSwitch.Input class="peer" />
      <KobalteSwitch.Control
        class={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          local.checked ? "bg-primary border-primary shadow-sm" : "bg-muted-foreground/30 border-muted-foreground/30 shadow-inner hover:bg-muted-foreground/40"
        )}
      >
        <KobalteSwitch.Thumb
          class={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            local.checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </KobalteSwitch.Control>
    </KobalteSwitch>
  );
};
