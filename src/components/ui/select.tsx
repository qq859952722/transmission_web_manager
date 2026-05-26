import { splitProps, JSX, Show } from 'solid-js';
import { Select as KSelect, type SelectRootProps } from '@kobalte/core/select';
import { Check, ChevronDown } from 'lucide-solid';
import { cn } from '../../lib/utils';

export interface SelectProps<T> extends Omit<SelectRootProps<T>, 'options' | 'value' | 'onChange' | 'itemComponent'> {
  options: T[];
  value?: T | null;
  onChange?: (val: T | null) => void;
  class?: string;
  triggerClass?: string;
  contentClass?: string;
  placeholder?: JSX.Element;
  itemComponent?: (props: { item: T }) => JSX.Element;
  renderValue?: (item: T) => JSX.Element;
}

export function Select<T>(props: SelectProps<T>) {
  const [local, others] = splitProps(props, [
    'class',
    'triggerClass',
    'contentClass',
    'placeholder',
    'itemComponent',
    'renderValue',
    'options',
    'value',
    'onChange',
  ]);

  return (
    // @ts-expect-error Kobalte Select generic inference issue
    <KSelect<T>
      options={local.options}
      defaultValue={local.value ?? undefined}
      onChange={local.onChange}
      class={cn('w-full', local.class)}
      itemComponent={(itemProps) => (
        <KSelect.Item
          item={itemProps.item}
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <KSelect.ItemIndicator>
              <Check size={14} />
            </KSelect.ItemIndicator>
          </span>
          <KSelect.ItemLabel>
            {local.itemComponent ? local.itemComponent({ item: (itemProps.item as any)?.rawValue ?? itemProps.item }) : String((itemProps.item as any)?.rawValue ?? itemProps.item)}
          </KSelect.ItemLabel>
        </KSelect.Item>
      )}
      {...others}
    >
      <KSelect.Trigger
        class={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          local.triggerClass
        )}
      >
        {/* Render trigger text from our own value prop instead of Kobalte's internal state.
            This works around a Kobalte bug where the controlled `value` prop doesn't
            update the trigger text display. */}
        <span class="truncate">
          <Show when={local.value != null} fallback={local.placeholder}>
            {local.renderValue ? local.renderValue(local.value!) : String(local.value!)}
          </Show>
        </span>
        <KSelect.Icon>
          <ChevronDown size={14} class="opacity-50" />
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content
          class={cn(
            'relative z-[99999] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95',
            local.contentClass
          )}
        >
          <KSelect.Listbox class="p-1 max-h-60 overflow-auto" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  );
}
