import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsInput, SettingsButton } from './SettingsUI';
import { Tag, Trash2, Library } from 'lucide-solid';

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
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.label.saved_label')}>
        <div class="p-4 flex flex-col gap-4">
          <form onSubmit={props.onAddLabel} class="flex items-center gap-3">
            <SettingsInput
              type="text"
              class="flex-1 text-left"
              placeholder={t('dialog.label.placeholder')}
              value={props.newLabelText()}
              onInput={(e) => props.setNewLabelText(e.currentTarget.value)}
            />
            <SettingsButton variant="primary" type="submit" disabled={!props.newLabelText().trim()}>
              {t('dialog.add.submit')}
            </SettingsButton>
          </form>

          <Show
            when={(() => {
              const saved = new Set(props.savedLabels());
              const fromTorrent = new Set(props.torrentLabels());
              const all = new Set([...saved, ...fromTorrent]);
              return all.size > 0;
            })()}
            fallback={
              <div class="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground bg-secondary/30 rounded-xl border border-border">
                <Library size={24} class="opacity-50" />
                <span class="text-[13px]">{t('dialog.label.no_labels')}</span>
              </div>
            }
          >
            <div class="flex flex-col divide-y divide-border/50 border border-border rounded-xl bg-secondary/30">
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
                    <div class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group">
                      <div class="flex items-center gap-3">
                        <Tag size={16} class="text-primary" />
                        <span class="font-mono text-[13px] font-bold text-foreground">{lbl}</span>
                        <span class="px-2 py-0.5 bg-background border border-border text-[10px] text-muted-foreground rounded-full">
                          {source}
                        </span>
                      </div>
                      <Show when={isSaved}>
                        <button
                          type="button"
                          class="p-1.5 text-destructive hover:bg-destructive/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => props.onDeleteLabel(lbl)}
                          title={t('dialog.delete.submit')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </SettingsSection>
    </div>
  );
};
