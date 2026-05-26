import { Component, createSignal, Show, createEffect } from 'solid-js';
import { t } from '../utils/i18n';
import { selectedIds, torrentStore, fetchTorrents } from '../store/torrentStore';
import { rpcCall } from '../api/rpc';

interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
}

export const LabelDialog: Component<LabelDialogProps> = (props) => {
  const [labelInput, setLabelInput] = createSignal('');

  createEffect(() => {
    if (props.open) {
      const ids = selectedIds();
      if (ids.length > 0) {
        const first = torrentStore.items[ids[0]];
        const labels = first?.labels || [];
        setLabelInput(labels.join(', '));
      } else {
        setLabelInput('');
      }
    }
  });

  const confirm = async () => {
    const ids = selectedIds();
    const labels = labelInput()
      .split(',')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    await rpcCall('torrent_set', { ids, labels });
    props.onClose();
    fetchTorrents(true);
  };

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={props.onClose}>
        <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 p-5 gap-4" onClick={(e) => e.stopPropagation()}>
          <h2 class="text-base font-bold text-foreground m-0">{t('context.set_labels')}</h2>
          <input
            type="text"
            class="flex h-10 w-full rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 focus:bg-background px-3 py-2 text-[13px] text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            value={labelInput()}
            onInput={(e) => setLabelInput(e.currentTarget.value)}
            placeholder={t('context.set_labels_hint')}
            autofocus
          />
          <div class="flex justify-end gap-2 pt-2 mt-1 border-t border-border/50">
            <button class="bg-background border border-border/80 text-foreground hover:bg-muted px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors active:scale-[0.98]" onClick={props.onClose}>{t('dialog.cancel')}</button>
            <button class="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" onClick={confirm}>{t('dialog.ok')}</button>
          </div>
        </div>
      </div>
    </Show>
  );
};
