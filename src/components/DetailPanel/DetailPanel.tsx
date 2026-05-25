import { Component, createSignal, createMemo, Show, Switch, Match } from 'solid-js';
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
import './DetailPanel.css';

export const DetailPanel: Component<{
  onClose: () => void;
}> = (props) => {
  const [activeTab, setActiveTab] = createSignal<string>('general');

  // Selected torrents reactive memo
  // Access individual torrent properties to establish fine-grained reactivity
  const selectedTorrents = createMemo(() => {
    const ids = selectedIds();
    const items = torrentStore.items;
    const result: Torrent[] = [];
    for (const id of ids) {
      const t = items[id];
      if (!t) continue;
      // Access key properties to establish reactive dependencies
      // so changes to rate_download, percent_done, etc. trigger re-renders
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
    <div class="trwm-detail-panel">
      {/* Panel Tabs Header */}
      <div class="trwm-detail-tabs">
        <Show when={torrentCount() > 0}>
          <div class="trwm-tab-scroller">
            {tabs
              .filter((tab) => !tab.singleOnly || torrentCount() === 1)
              .map((tab) => (
                <button
                  class={`trwm-detail-tab ${activeTab() === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        </Show>
        <div class="trwm-detail-spacer" />
        <button
          class="trwm-detail-close-btn"
          onClick={props.onClose}
          title={t('toolbar.detail_toggle')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Tabs Content Panel */}
      <div class="trwm-detail-content">
        <Switch>
          <Match when={torrentCount() === 0}>
            <div class="trwm-detail-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{t('detail.empty_msg')}</span>
            </div>
          </Match>

          <Match when={torrentCount() > 1}>
            <div class="trwm-detail-multi-view">
              <div class="multi-title">{t('detail.multi_msg', { n: torrentCount() })}</div>
              <Show when={activeTab() === 'general'}>
                <GeneralTab torrents={selectedTorrents()} />
              </Show>
              <Show when={activeTab() === 'settings'}>
                <SettingsTab torrents={selectedTorrents()} activeTab={activeTab()} />
              </Show>
            </div>
          </Match>

          <Match when={torrentCount() === 1}>
            <div class="trwm-detail-single-view">
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
