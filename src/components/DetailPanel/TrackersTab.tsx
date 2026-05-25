import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent, TrackerStat } from '../../types/transmission';
import { formatTimestamp } from '../../utils/format';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents } from '../../store/torrentStore';
import { t } from '../../utils/i18n';

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
              <th width="36"></th>
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
              <th width="36"></th>
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

      <style>{`
        .trwm-trackers-tab { display:flex; flex-direction:column; gap:12px; height:100%; overflow:hidden; }
        .trackers-toolbar { display:flex; gap:8px; flex-shrink:0; }
        .add-tracker-form { display:flex; flex-direction:column; gap:8px; width:100%; background:var(--bg-secondary); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); }
        .add-tracker-form textarea { background:var(--bg-primary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:8px; font-family:inherit; resize:vertical; }
        .form-hint { font-size:11px; color:var(--text-muted); }
        .form-actions { display:flex; gap:8px; }
        .trackers-table-container { flex:1; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); }
        .trackers-table { width:100%; border-collapse:collapse; text-align:left; font-size:12px; }
        .trackers-table th { background:var(--bg-secondary); color:var(--text-secondary); font-weight:600; padding:6px 8px; border-bottom:1px solid var(--border-color); user-select:none; white-space:nowrap; }
        .trackers-table td { padding:5px 8px; border-bottom:1px solid var(--border-color); vertical-align:middle; }
        .trackers-table tbody tr:hover { background:var(--bg-hover); }
        .selected-row { background:rgba(59,130,246,0.1)!important; }
        .tracker-url-cell { word-break:break-all; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .backup-tag { font-size:10px; color:var(--text-muted); background:var(--bg-tertiary); padding:0 4px; border-radius:3px; margin-left:4px; }
        .announce-result-cell { word-break:break-all; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .empty-row { text-align:center; color:var(--text-muted); padding:24px!important; }
        .text-success { color:var(--color-success-500); }
        .text-danger { color:var(--color-danger-500); }
        .text-muted { color:var(--text-muted); }
        .detail-btn { background:none; border:none; cursor:pointer; font-size:14px; color:var(--color-primary-500); padding:2px 4px; border-radius:3px; }
        .detail-btn:hover { background:var(--bg-hover); }
        /* Buttons */
        .trwm-btn { border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary); padding:6px 12px; font-size:13px; font-weight:500; border-radius:var(--radius-sm); cursor:pointer; transition:all 0.15s ease; }
        .trwm-btn:hover:not(:disabled) { background:var(--bg-hover); }
        .trwm-btn.primary { background:var(--color-primary-500); color:#fff; border-color:var(--color-primary-500); }
        .trwm-btn.primary:hover:not(:disabled) { background:var(--color-primary-600); }
        .trwm-btn.danger { background:var(--color-danger-500); color:#fff; border-color:var(--color-danger-500); }
        .trwm-btn.danger:hover:not(:disabled) { background:#dc2626; }
        .trwm-btn:disabled { opacity:0.5; cursor:not-allowed; }
        /* Detail Modal */
        .tracker-detail-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.15s ease; }
        .tracker-detail-glass { background:var(--bg-primary); border:1px solid var(--border-color); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.2); max-width:520px; width:90%; max-height:80vh; overflow-y:auto; padding:16px; }
        .tracker-detail-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
        .tracker-detail-title { font-size:12px; font-weight:600; word-break:break-all; color:var(--text-primary); flex:1; margin-right:8px; }
        .tracker-detail-close { background:none; border:none; font-size:18px; cursor:pointer; color:var(--text-muted); padding:0 4px; }
        .tracker-detail-close:hover { color:var(--text-primary); }
        .tracker-detail-section { margin-bottom:12px; }
        .tracker-detail-section:last-child { margin-bottom:0; }
        .tracker-detail-section-title { font-size:11px; font-weight:700; color:var(--color-primary-500); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid var(--border-color); }
        .tracker-detail-grid { display:flex; flex-direction:column; gap:3px; }
        .detail-row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
        .detail-label { font-size:12px; color:var(--text-secondary); white-space:nowrap; }
        .detail-value { font-size:12px; color:var(--text-primary); text-align:right; word-break:break-all; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};
