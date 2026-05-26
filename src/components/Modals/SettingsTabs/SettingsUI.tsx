import { Component, JSX, splitProps, Show } from 'solid-js';
import { cn } from '../../../lib/utils';
import { Switch as UISwitch } from '../../ui/switch';
import { Select as UISelect } from '../../ui/select';

/**
 * SettingsSection: The grouped container for a section of settings.
 */
export const SettingsSection: Component<{ title?: string; children: any; class?: string }> = (props) => {
  return (
    <div class={cn("flex flex-col gap-2 mb-6", props.class)}>
      <Show when={props.title}>
        <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{props.title}</h4>
      </Show>
      <div class="bg-secondary/30 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm flex flex-col divide-y divide-border/40">
        {props.children}
      </div>
    </div>
  );
};

/**
 * SettingsRow: A single row inside a SettingsSection.
 */
export const SettingsRow: Component<{ label: string; desc?: string; children: any; class?: string; onClick?: () => void }> = (props) => {
  const isClickable = !!props.onClick;
  return (
    <div
      class={cn(
        "flex items-center justify-between gap-4 px-4 py-2.5 min-h-[48px] transition-colors",
        isClickable && "cursor-pointer hover:bg-muted/50 active:bg-muted",
        props.class
      )}
      onClick={props.onClick}
    >
      <div class="flex flex-col flex-1 min-w-0 pr-4">
        <span class="text-sm font-medium text-foreground">{props.label}</span>
        <Show when={props.desc}>
          <span class="text-xs text-muted-foreground/80 mt-0.5 leading-snug">{props.desc}</span>
        </Show>
      </div>
      <div class="flex items-center shrink-0">
        {props.children}
      </div>
    </div>
  );
};

/**
 * SettingsInput: A standardized text/number input for settings.
 */
export const SettingsInput: Component<JSX.InputHTMLAttributes<HTMLInputElement> & { class?: string }> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return (
    <input
      class={cn(
        "bg-background hover:bg-muted/40 focus:bg-background border border-border rounded-lg px-2.5 py-1 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-[2px] focus:ring-primary/20 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-32 text-right",
        local.class
      )}
      {...others}
    />
  );
};

/**
 * SettingsSelect: A standardized select dropdown for settings.
 */
export const SettingsSelect: Component<{
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  class?: string;
  disabled?: boolean;
}> = (props) => {
  return (
    <UISelect
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      value={props.options.find(o => o.value === props.value)}
      onChange={(v: any) => v && props.onChange(v.value ?? v)}
      disabled={props.disabled}
      itemComponent={(p) => <>{p.item.label}</>}
      renderValue={(v) => <>{v.label}</>}
      triggerClass={cn("w-full appearance-none bg-background hover:bg-muted/40 focus:bg-background border border-border rounded-lg pl-2.5 pr-7 py-1 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-[2px] focus:ring-primary/20 shadow-sm disabled:opacity-50 text-right cursor-pointer h-[30px]", props.class)}
    />
  );
};

/**
 * SettingsSwitch: A standard switch integration for settings row.
 */
export const SettingsSwitch: Component<{ checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }> = (props) => {
  return <UISwitch checked={props.checked} onCheckedChange={props.onCheckedChange} disabled={props.disabled} />;
};

/**
 * SettingsButton: A standard button for settings actions.
 */
export const SettingsButton: Component<JSX.ButtonHTMLAttributes<HTMLButtonElement> & { class?: string; variant?: 'primary' | 'destructive' | 'outline' }> = (props) => {
  const [local, others] = splitProps(props, ['class', 'variant']);
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    outline: "bg-background border-border hover:bg-muted text-foreground",
  };
  const activeVariant = variantClasses[local.variant || 'outline'];
  return (
    <button
      class={cn(
        "px-3 py-1 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 active:scale-[0.98]",
        activeVariant,
        local.class
      )}
      {...others}
    />
  );
};
