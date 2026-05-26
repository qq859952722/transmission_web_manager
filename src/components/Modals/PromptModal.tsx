import { Component, Show, createSignal, createEffect } from 'solid-js';
import { t } from '../../utils/i18n';
import { X } from 'lucide-solid';

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

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={props.onCancel}>
        <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
            <h3 class="m-0 text-base font-bold text-foreground">{props.title}</h3>
            <button class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={props.onCancel}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} class="flex flex-col">
            <div class="flex flex-col gap-2 p-6">
              <Show when={props.label}>
                <label class="text-[13px] font-medium text-foreground">{props.label}</label>
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
            <div class="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0">
              <button type="button" class="bg-background border border-border/80 text-foreground hover:bg-muted px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors active:scale-[0.98]" onClick={props.onCancel}>{t('dialog.cancel')}</button>
              <button type="submit" class="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">{t('dialog.ok')}</button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
