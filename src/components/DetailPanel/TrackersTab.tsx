import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent, TrackerStat } from '../../types/transmission';
import { formatTimestamp } from '../../utils/format';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import './TrackersTab.css';

function announceStateText(state: number): string {
  switch (state) {
    case 0: return t('status.stopped');
    case 1: return t('status.check_wait');
    case 2: return t('sidebar.status_queued');
    case 3: return t('sidebar.status_active');
    default: return '-';
  }
}

function scrapeStateText(state: number): string {
  switch (state) {
    case 0: return t('status.stopped');
    case 1: return t('sidebar.status_queued');
    case 2: return t('sidebar.status_active');
    default: return '-';
  }
}

function countOrDash(val: number | undefined): string {
  return val !== undefined && val >= 0 ? String(val) : '-';
}

function timeOrDash(ts: number | undefined): string {
  return ts && ts > 0 ? formatTimestamp(ts) : '-';
}

export const TrackersTab: Component<{ torrent: Torrent }> = (props) => {
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [newTrackerUrls, setNewTrackerUrls] = createSignal('');
  const [updating, setUpdating] = createSignal(false);
  const [selectedTrackerIds, setSelectedTrackerIds] = createSignal<number[]>([]);
  const [detailTracker, setDetailTracker] = createSignal<TrackerStat | null>(null);

  const handleAddTrackers = async () => {
    const urls = newTrackerUrls()
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0) return;
    setUpdating(true);
    try {
      await rpcCall('torrent_set', { ids: [props.torrent.id], tracker_add: urls });
      setNewTrackerUrls('');
      setShowAddForm(false);
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to add trackers', e);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveTrackers = async () => {
    const ids = selectedTrackerIds();
    if (ids.length === 0) return;
    setUpdating(true);
    try {
      await rpcCall('torrent_set', { ids: [props.torrent.id], tracker_remove: ids });
      setSelectedTrackerIds([]);
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to remove trackers', e);
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectTracker = (id: number) => {
    const ids = selectedTrackerIds();
    setSelectedTrackerIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  return (
    <div class="trwm-trackers-tab">
      <div class="trackers-toolbar">
        <Show
          when={showAddForm()}
          fallback={
            <>
              <button class="trwm-btn primary" disabled={updating()} onClick={() => setShowAddForm(true)}>
                {t('dialog.tracker.add_title')}
              </button>
              <button class="trwm-btn danger" disabled={updating() || selectedTrackerIds().length === 0} onClick={handleRemoveTrackers}>
                {t('context.remove_tracker')}
              </button>
            </>
          }
        >
          <div class="add-tracker-form">
            <textarea rows="3" placeholder={t('dialog.tracker.add_label')} value={newTrackerUrls()} onInput={(e) => setNewTrackerUrls(e.currentTarget.value)} disabled={updating()} />
            <div class="form-hint">{t('dialog.tracker.hint')}</div>
            <div class="form-actions">
              <button class="trwm-btn primary" onClick={handleAddTrackers} disabled={updating()}>{t('dialog.ok')}</button>
              <button class="trwm-btn" onClick={() => setShowAddForm(false)} disabled={updating()}>{t('dialog.cancel')}</button>
            </div>
          </div>
        </Show>
      </div>

      <div class="trackers-table-container">
        <table class="trackers-table">
          <thead>
            <tr>
              <th width="36" />
              <th width="36">#</th>
              <th>{t('dialog.add.tracker_url')}</th>
              <th width="70">{t('detail.general.status')}</th>
              <th width="50">{t('columns.seeds')}</th>
              <th width="50">{t('columns.peers')}</th>
              <th width="50">{t('detail.trackers.downloader_count')}</th>
              <th width="110">{t('detail.trackers.detail_last_announce')}</th>
              <th width="110">{t('detail.trackers.detail_announce_result')}</th>
              <th width="110">{t('detail.trackers.detail_next_announce')}</th>
              <th width="50">{t('detail.general.downloaded')}</th>
              <th width="36" />
            </tr>
          </thead>
          <tbody>
            <Show
              when={props.torrent.tracker_stats && props.torrent.tracker_stats.length > 0}
              fallback={<tr><td colspan="12" class="empty-row">{t('status.no_trackers')}</td></tr>}
            >
              <For each={props.torrent.tracker_stats}>
                {(stat, i) => (
                  <tr class={selectedTrackerIds().includes(stat.id) ? 'selected-row' : ''}>
                    <td class="text-center">
                      <input type="checkbox" checked={selectedTrackerIds().includes(stat.id)} onChange={() => toggleSelectTracker(stat.id)} />
                    </td>
                    <td class="text-mono text-center">{i() + 1}</td>
                    <td class="tracker-url-cell" title={stat.announce}>
                      {stat.announce}
                      <Show when={stat.is_backup}>
                        <span class="backup-tag">{t('detail.trackers.backup')}</span>
                      </Show>
                    </td>
                    <td class="text-center">{announceStateText(stat.announce_state)}</td>
                    <td class="text-mono text-center">{countOrDash(stat.seeder_count)}</td>
                    <td class="text-mono text-center">{countOrDash(stat.leecher_count)}</td>
                    <td class="text-mono text-center">{countOrDash(stat.downloader_count)}</td>
                    <td class="text-mono text-center">{timeOrDash(stat.last_announce_time)}</td>
                    <td class="announce-result-cell" title={stat.last_announce_result}>
                      <Show when={stat.has_announced} fallback={<span class="text-muted">{t('common.loading')}</span>}>
                        <span class={stat.last_announce_succeeded ? 'text-success' : 'text-danger'}>
                          {stat.last_announce_succeeded ? t('detail.trackers.announce_ok') : (stat.last_announce_result || '-')}
                        </span>
                      </Show>
                    </td>
                    <td class="text-mono text-center">{timeOrDash(stat.next_announce_time)}</td>
                    <td class="text-mono text-center">{countOrDash(stat.download_count)}</td>
                    <td class="text-center">
                      <button class="detail-btn" onClick={() => setDetailTracker(stat)} title={t('detail.trackers.detail_btn')}>ⓘ</button>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      {/* Tracker Detail Modal */}
      <Show when={detailTracker()}>
        {(tr) => (
          <div class="tracker-detail-overlay" onClick={() => setDetailTracker(null)}>
            <div class="tracker-detail-glass" onClick={(e) => e.stopPropagation()}>
              <div class="tracker-detail-header">
                <div class="tracker-detail-title">{tr().announce}</div>
                <button class="tracker-detail-close" onClick={() => setDetailTracker(null)}>×</button>
              </div>

              <div class="tracker-detail-section">
                <div class="tracker-detail-section-title">{t('detail.trackers.detail_basic')}</div>
                <div class="tracker-detail-grid">
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_host')}</span><span class="detail-value text-mono">{tr().host || '-'}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_sitename')}</span><span class="detail-value">{tr().sitename || '-'}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('dialog.add.tier')}</span><span class="detail-value">{tr().tier}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.backup')}</span><span class="detail-value">{tr().is_backup ? t('common.yes') : t('common.no')}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_scrape_url')}</span><span class="detail-value text-mono" style={{ 'font-size': '10px', 'word-break': 'break-all' }}>{tr().scrape || '-'}</span></div>
                </div>
              </div>

              <div class="tracker-detail-section">
                <div class="tracker-detail-section-title">{t('detail.trackers.detail_announce')}</div>
                <div class="tracker-detail-grid">
                  <div class="detail-row"><span class="detail-label">{t('detail.general.status')}</span><span class="detail-value">{announceStateText(tr().announce_state)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_has_announced')}</span><span class="detail-value">{tr().has_announced ? t('common.yes') : t('common.no')}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_last_announce')}</span><span class="detail-value">{timeOrDash(tr().last_announce_time)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_next_announce')}</span><span class="detail-value">{timeOrDash(tr().next_announce_time)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_announce_result')}</span><span class="detail-value">
                    <Show when={tr().last_announce_succeeded} fallback={<span class="text-danger">{tr().last_announce_result || '-'}</span>}>
                      <span class="text-success">{t('detail.trackers.announce_ok')}</span>
                    </Show>
                  </span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_announce_timed_out')}</span><span class="detail-value">{tr().last_announce_timed_out ? t('common.yes') : t('common.no')}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_announce_start_time')}</span><span class="detail-value">{timeOrDash(tr().last_announce_start_time)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_announce_peer_count')}</span><span class="detail-value">{countOrDash(tr().last_announce_peer_count)}</span></div>
                </div>
              </div>

              <div class="tracker-detail-section">
                <div class="tracker-detail-section-title">{t('detail.trackers.detail_scrape')}</div>
                <div class="tracker-detail-grid">
                  <div class="detail-row"><span class="detail-label">{t('detail.general.status')}</span><span class="detail-value">{scrapeStateText(tr().scrape_state)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_has_scraped')}</span><span class="detail-value">{tr().has_scraped ? t('common.yes') : t('common.no')}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_last_scrape')}</span><span class="detail-value">{timeOrDash(tr().last_scrape_time)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_next_scrape')}</span><span class="detail-value">{timeOrDash(tr().next_scrape_time)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_scrape_result')}</span><span class="detail-value">
                    <Show when={tr().last_scrape_succeeded} fallback={<span class="text-danger">{tr().last_scrape_result || '-'}</span>}>
                      <span class="text-success">{t('detail.trackers.announce_ok')}</span>
                    </Show>
                  </span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_scrape_timed_out')}</span><span class="detail-value">{tr().last_scrape_timed_out ? t('common.yes') : t('common.no')}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.detail_scrape_start_time')}</span><span class="detail-value">{timeOrDash(tr().last_scrape_start_time)}</span></div>
                </div>
              </div>

              <div class="tracker-detail-section">
                <div class="tracker-detail-section-title">{t('detail.trackers.detail_stats')}</div>
                <div class="tracker-detail-grid">
                  <div class="detail-row"><span class="detail-label">{t('columns.seeds')}</span><span class="detail-value">{countOrDash(tr().seeder_count)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('columns.peers')}</span><span class="detail-value">{countOrDash(tr().leecher_count)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.trackers.downloader_count')}</span><span class="detail-value">{countOrDash(tr().downloader_count)}</span></div>
                  <div class="detail-row"><span class="detail-label">{t('detail.general.downloaded')}</span><span class="detail-value">{countOrDash(tr().download_count)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>


    </div>
  );
};
