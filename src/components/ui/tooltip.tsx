import { splitProps, type Component, type JSX } from 'solid-js';
import { Tooltip as KobalteTooltip } from '@kobalte/core/tooltip';
import { cn } from '../../lib/utils';

export const TooltipRoot = KobalteTooltip;
export const TooltipTrigger = KobalteTooltip.Trigger;
export const TooltipPortal = KobalteTooltip.Portal;

export const TooltipContent: Component<any> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children']);
  return (
    <KobalteTooltip.Portal>
      <KobalteTooltip.Content
        class={cn(
          "z-50 overflow-hidden rounded-md bg-secondary border border-border/80 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class
        )}
        {...others}
      >
        <KobalteTooltip.Arrow class="fill-secondary stroke-border/80 stroke-[1px]" />
        {local.children}
      </KobalteTooltip.Content>
    </KobalteTooltip.Portal>
  );
};

export const Tooltip: Component<{
  text?: string | JSX.Element;
  children: JSX.Element;
  class?: string;
  placement?: any;
  disabled?: boolean;
}> = (props) => {
  return (
    <TooltipRoot openDelay={300} closeDelay={150} placement={props.placement || "top"} disabled={props.disabled || !props.text}>
      <TooltipTrigger as="div" class="inline-flex">
        {props.children}
      </TooltipTrigger>
      <TooltipContent class={props.class}>
        {props.text}
      </TooltipContent>
    </TooltipRoot>
  );
};
