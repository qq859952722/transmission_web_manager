import { Component, Show, createSignal, createEffect } from 'solid-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { t } from '../../utils/i18n';

interface PromptModalProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number';
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: Component<PromptModalProps> = (props) => {
  const [value, setValue] = createSignal('');

  createEffect(() => {
    if (props.open) {
      setValue(props.defaultValue || '');
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const v = value().trim();
    if (v.length > 0) {
      props.onConfirm(v);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) props.onCancel();
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent class="p-0 overflow-hidden sm:rounded-3xl max-w-sm border-border bg-popover/90 backdrop-blur-xl shadow-2xl">
        <DialogHeader class="px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} class="flex flex-col">
          <div class="flex flex-col gap-2 p-6">
            <Show when={props.label}>
              <DialogDescription class="text-[13px] font-medium text-foreground m-0">{props.label}</DialogDescription>
            </Show>
            <input
              type={props.inputType || 'text'}
              class="flex h-10 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-[13px] text-foreground shadow-sm transition-all focus:outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={props.placeholder || ''}
              value={value()}
              onInput={(e) => setValue(e.currentTarget.value)}
              autofocus
            />
          </div>
          <DialogFooter class="px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0 gap-2 sm:space-x-0">
            <button type="button" class="bg-background border border-border/80 text-foreground hover:bg-muted px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors active:scale-[0.98]" onClick={props.onCancel}>{t('dialog.cancel')}</button>
            <button type="submit" class="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">{t('dialog.ok')}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
