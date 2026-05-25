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
      <div class="trwm-label-dialog-overlay" onClick={props.onClose}>
        <div class="trwm-label-dialog" onClick={(e) => e.stopPropagation()}>
          <div class="trwm-label-dialog-title">{t('context.set_labels')}</div>
          <input
            type="text"
            class="trwm-label-dialog-input"
            value={labelInput()}
            onInput={(e) => setLabelInput(e.currentTarget.value)}
            placeholder={t('context.set_labels_hint')}
          />
          <div class="trwm-label-dialog-actions">
            <button class="trwm-label-dialog-btn" onClick={confirm}>{t('dialog.ok')}</button>
            <button class="trwm-label-dialog-btn" onClick={props.onClose}>{t('dialog.cancel')}</button>
          </div>
        </div>
      </div>
    </Show>
  );
};
