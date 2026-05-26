import { Component, createSignal, createMemo, Show, Switch, Match, For } from 'solid-js';
import { selectedIds, torrentStore } from '../../store/torrentStore';
import { Torrent } from '../../types/transmission';
import { t } from '../../utils/i18n';
import { GeneralTab } from './GeneralTab';
import { FilesTab } from './FilesTab';
import { TrackersTab } from './TrackersTab';
import { PeersTab } from './PeersTab';
import { PiecesTab } from './PiecesTab';
import { SpeedTab } from './SpeedTab';
import { SettingsTab } from './SettingsTab';
import { cn } from '../../lib/utils';
import { X, Search } from 'lucide-solid';

export const DetailPanel: Component<{
  onClose: () => void;
}> = (props) => {
  const [activeTab, setActiveTab] = createSignal<string>('general');

  const selectedTorrents = createMemo(() => {
    const ids = selectedIds();
    const items = torrentStore.items;
    const result: Torrent[] = [];
    for (const id of ids) {
      const t = items[id];
      if (!t) continue;
      void t.rate_download;
      void t.rate_upload;
      void t.percent_done;
      void t.status;
      void t.pieces;
      void t.peers;
      void t.tracker_stats;
      void t.files;
      void t.file_stats;
      result.push(t);
    }
    return result;
  });

  const torrentCount = () => selectedTorrents().length;
  const singleTorrent = () => selectedTorrents()[0];

  const tabs = [
    { id: 'general', label: t('detail.tabs.general') },
    { id: 'files', label: t('detail.tabs.files'), singleOnly: true },
    { id: 'trackers', label: t('detail.tabs.trackers'), singleOnly: true },
    { id: 'peers', label: t('detail.tabs.peers'), singleOnly: true },
    { id: 'pieces', label: t('detail.tabs.pieces'), singleOnly: true },
    { id: 'speed', label: t('detail.tabs.speed'), singleOnly: true },
    { id: 'settings', label: t('detail.tabs.settings') },
  ];

  return (
    <div class="flex flex-col h-full w-full overflow-hidden bg-background border-t border-border">
      {/* Panel Tabs Header */}
      <div class="flex items-center h-9 bg-secondary/80 backdrop-blur-md border-b border-border px-1.5 shrink-0 relative z-10">
        <Show when={torrentCount() > 0}>
          <div class="flex items-center gap-1 h-full overflow-x-auto no-scrollbar mask-fade-right">
            <For each={tabs.filter((tab) => !tab.singleOnly || torrentCount() === 1)}>
              {(tab) => (
                <button
                  class={cn(
                    "h-full px-3 text-xs font-medium border-b-2 transition-all duration-200 whitespace-nowrap outline-none",
                    activeTab() === tab.id 
                      ? "text-primary border-primary font-semibold"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              )}
            </For>
          </div>
        </Show>
        <div class="flex-1" />
        <button
          class="w-7 h-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={props.onClose}
          title={t('toolbar.detail_toggle')}
        >
          <X size={16} stroke-width={2.5} />
        </button>
      </div>

      {/* Tabs Content Panel */}
      <div class="flex-1 overflow-y-auto bg-background p-3 md:p-4 animate-in fade-in duration-200">
        <Switch>
          <Match when={torrentCount() === 0}>
            <div class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
              <Search size={48} stroke-width={1.5} class="opacity-50" />
              <span class="text-sm font-medium">{t('detail.empty_msg')}</span>
            </div>
          </Match>

          <Match when={torrentCount() > 1}>
            <div class="flex flex-col h-full">
              <div class="text-sm font-bold text-foreground mb-3 tracking-wide">{t('detail.multi_msg', { n: torrentCount() })}</div>
              <Show when={activeTab() === 'general'}>
                <GeneralTab torrents={selectedTorrents()} />
              </Show>
              <Show when={activeTab() === 'settings'}>
                <SettingsTab torrents={selectedTorrents()} activeTab={activeTab()} />
              </Show>
            </div>
          </Match>

          <Match when={torrentCount() === 1}>
            <div class="h-full">
              <Switch>
                <Match when={activeTab() === 'general'}>
                  <GeneralTab torrents={[singleTorrent()]} />
                </Match>
                <Match when={activeTab() === 'files'}>
                  <FilesTab torrent={singleTorrent()} />
                </Match>
                <Match when={activeTab() === 'trackers'}>
                  <TrackersTab torrent={singleTorrent()} />
                </Match>
                <Match when={activeTab() === 'peers'}>
                  <PeersTab torrent={singleTorrent()} />
                </Match>
                <Match when={activeTab() === 'pieces'}>
                  <PiecesTab torrent={singleTorrent()} />
                </Match>
                <Match when={activeTab() === 'speed'}>
                  <SpeedTab torrent={singleTorrent()} />
                </Match>
                <Match when={activeTab() === 'settings'}>
                  <SettingsTab torrents={[singleTorrent()]} activeTab={activeTab()} />
                </Match>
              </Switch>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};
