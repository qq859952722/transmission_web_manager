import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';

interface LabelsTabProps {
  savedLabels: () => string[];
  torrentLabels: () => string[];
  newLabelText: () => string;
  setNewLabelText: (v: string) => void;
  onAddLabel: (e: Event) => void;
  onDeleteLabel: (name: string) => void;
}

export const LabelsTab: Component<LabelsTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="labels-library-manager">
        <h4>{t('dialog.label.saved_label')}</h4>
        <form onSubmit={props.onAddLabel} class="flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder={t('dialog.label.placeholder')}
            value={props.newLabelText()}
            onInput={(e) => props.setNewLabelText(e.currentTarget.value)}
          />
          <button type="submit" class="trwm-btn primary whitespace-nowrap">
            {t('dialog.add.submit')}
          </button>
        </form>

        <Show
          when={(() => {
            const saved = new Set(props.savedLabels());
            const fromTorrent = new Set(props.torrentLabels());
            const all = new Set([...saved, ...fromTorrent]);
            return all.size > 0;
          })()}
          fallback={<div class="empty-list-note">{t('dialog.label.no_labels')}</div>}
        >
          <div class="labels-library-list flex-col gap-2">
            <For each={(() => {
              const saved = new Set(props.savedLabels());
              const fromTorrent = new Set(props.torrentLabels());
              const all = new Set([...saved, ...fromTorrent]);
              return [...all].sort();
            })()}>
              {(lbl) => {
                const isFromTorrent = props.torrentLabels().includes(lbl);
                const isSaved = props.savedLabels().includes(lbl);
                const source = isFromTorrent && isSaved
                  ? t('dialog.label.source_both')
                  : isFromTorrent
                    ? t('dialog.label.source_torrent')
                    : t('dialog.label.source_custom');
                return (
                  <div class="label-library-item flex-row justify-between align-center">
                    <div class="label-library-info">
                      <span class="label-badge text-mono">{lbl}</span>
                      <span class="label-source-tag">{source}</span>
                    </div>
                    <Show when={isSaved}>
                      <button
                        type="button"
                        class="trwm-btn-sm danger"
                        onClick={() => props.onDeleteLabel(lbl)}
                        title={t('dialog.delete.submit')}
                      >
                        &times;
                      </button>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
