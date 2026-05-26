import { splitProps, JSX } from 'solid-js';
import { Checkbox as KCheckbox, type CheckboxRootProps } from '@kobalte/core/checkbox';
import { Check } from 'lucide-solid';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends CheckboxRootProps {
  class?: string;
  children?: JSX.Element;
}

export function Checkbox(props: CheckboxProps) {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <KCheckbox
      class={cn('inline-flex items-center gap-2 group', local.class)}
      {...others}
    >
      <KCheckbox.Input class="peer sr-only" />
      <KCheckbox.Control class="h-4 w-4 shrink-0 rounded-sm border border-primary shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[checked]:text-primary-foreground transition-colors group-hover:border-primary/80 flex items-center justify-center">
        <KCheckbox.Indicator>
          <Check size={12} stroke-width={3} />
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      {local.children && (
        <KCheckbox.Label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none cursor-pointer">
          {local.children}
        </KCheckbox.Label>
      )}
    </KCheckbox>
  );
}
