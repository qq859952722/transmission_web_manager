import { Component, createSignal, createMemo, Show, For } from 'solid-js';
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
import { WebseedsTab } from './WebseedsTab';
import { cn } from '../../lib/utils';
import { X, Search } from 'lucide-solid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

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
    { id: 'webseeds', label: t('detail.tabs.webseeds'), singleOnly: true },
    { id: 'speed', label: t('detail.tabs.speed'), singleOnly: true },
    { id: 'settings', label: t('detail.tabs.settings') },
  ];

  return (
    <div class="flex flex-col h-full w-full overflow-hidden bg-background border-t border-border">
      {/* Header with tabs and close button */}
      <Show when={torrentCount() > 0}>
        <Tabs value={activeTab()} onChange={setActiveTab} class="flex flex-col h-full relative z-10 w-full">
          <div class="relative shrink-0">
            <TabsList>
              <For each={tabs.filter((tab) => !tab.singleOnly || torrentCount() === 1)}>
                {(tab) => (
                  <TabsTrigger
                    value={tab.id}
                    class={cn(
                      'data-[selected]:text-primary data-[selected]:border-primary data-[selected]:font-semibold',
                      'text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:bg-muted -mb-px'
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>
            {/* Close button */}
            <button
              class="w-7 h-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors absolute right-2 top-1"
              onClick={props.onClose}
              title={t('toolbar.detail_toggle')}
            >
              <X size={16} stroke-width={2.5} />
            </button>
          </div>

          {/* Tab contents */}
          <div class="flex-1 overflow-y-auto bg-background p-3 md:p-4 animate-in fade-in duration-200 min-h-0">
            <TabsContent value="general" class="m-0 h-full outline-none">
              <Show when={torrentCount() > 1}>
                <div class="flex flex-col h-full">
                  <div class="text-sm font-bold text-foreground mb-3 tracking-wide">
                    {t('detail.multi_msg', { n: torrentCount() })}
                  </div>
                  <GeneralTab torrents={selectedTorrents()} />
                </div>
              </Show>
              <Show when={torrentCount() === 1}>
                <GeneralTab torrents={[singleTorrent()]} />
              </Show>
            </TabsContent>
            <TabsContent value="files" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <FilesTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="trackers" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <TrackersTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="peers" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <PeersTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="pieces" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <PiecesTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="webseeds" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <WebseedsTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="speed" class="m-0 h-full outline-none">
              <Show when={torrentCount() === 1}>
                <SpeedTab torrent={singleTorrent()} />
              </Show>
            </TabsContent>
            <TabsContent value="settings" class="m-0 h-full outline-none">
              <SettingsTab torrents={selectedTorrents()} activeTab={activeTab()} />
            </TabsContent>
          </div>
        </Tabs>
      </Show>

      {/* Empty state */}
      <Show when={torrentCount() === 0}>
        <div class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
          <Search size={48} stroke-width={1.5} class="opacity-50" />
          <span class="text-sm font-medium">{t('detail.empty_msg')}</span>
        </div>
      </Show>
    </div>
  );
};
