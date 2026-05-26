import { Component, JSX } from 'solid-js';
import * as KTabs from '@kobalte/core/tabs';
import { cn } from '../../lib/utils';

// Export the root Tabs component - extend type to accept children
export const Tabs: Component<KTabs.TabsRootProps & { children?: JSX.Element; class?: string }> = (props) => (
  <KTabs.Root {...props} />
);

export const TabsList: Component<KTabs.TabsListProps & { children?: JSX.Element }> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = (props as any).class;
  return (
    <KTabs.List
      class={cn('flex border-b border-border', cls)}
      {...props}
    />
  );
};

export const TabsTrigger: Component<KTabs.TabsTriggerProps & { children?: JSX.Element; class?: string }> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = (props as any).class;
  return (
    <KTabs.Trigger
      {...props}
      class={cn('px-3 py-1.5 text-sm font-medium transition-colors', cls)}
    />
  );
};

export const TabsContent: Component<KTabs.TabsContentProps & { children?: JSX.Element; class?: string }> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = (props as any).class;
  return (
    <KTabs.Content
      {...props}
      class={cn('mt-4', cls)}
    />
  );
};
