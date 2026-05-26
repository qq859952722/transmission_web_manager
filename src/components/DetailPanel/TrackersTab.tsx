import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent, TrackerStat } from '../../types/transmission';
import { formatTimestamp } from '../../utils/format';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { cn } from '../../lib/utils';
import { Server, Plus, Trash2, Info, Activity, Clock, BarChart3, Database } from 'lucide-solid';

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

import { createResizableColumns } from '../../hooks/createResizableColumns';

export const TrackersTab: Component<{ torrent: Torrent }> = (props) => {
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [newTrackerUrls, setNewTrackerUrls] = createSignal('');
  const [updating, setUpdating] = createSignal(false);
  const [selectedTrackerIds, setSelectedTrackerIds] = createSignal<number[]>([]);
  const [detailTracker, setDetailTracker] = createSignal<TrackerStat | null>(null);

  const { widths: colWidths, handleMouseDown } = createResizableColumns('trwm-trackers-widths', [
    { id: 'select', width: 36 },
    { id: 'idx', width: 30 },
    { id: 'url', width: 250 },
    { id: 'status', width: 100 },
    { id: 'seeds', width: 60 },
    { id: 'peers', width: 60 },
    { id: 'announce', width: 120 },
    { id: 'next', width: 120 },
    { id: 'actions', width: 40 },
  ]);

  const handleAddTrackers = async () => {
    const urls = newTrackerUrls().split('\n').map((u) => u.trim()).filter((u) => u.length > 0);
    if (urls.length === 0) return;
    setUpdating(true);
    try {
      await rpcCall('torrent_set', { ids: [props.torrent.id], tracker_add: urls });
      setNewTrackerUrls('');
      setShowAddForm(false);
      await fetchTorrents(true);
    } catch (e) {
      console.error(e);
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
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectTracker = (id: number) => {
    const ids = selectedTrackerIds();
    setSelectedTrackerIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const StatusDot = (props: { state: number }) => {
    const colorClass = props.state === 3 ? "bg-success" : props.state === 1 || props.state === 2 ? "bg-warning" : "bg-muted-foreground";
    const pulseClass = props.state === 3 ? "animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "";
    return <div class={cn("w-2 h-2 rounded-full", colorClass, pulseClass)} />;
  };

  return (
    <div class="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="flex flex-col sm:flex-row gap-3">
        <Show
          when={showAddForm()}
          fallback={
            <div class="flex gap-2">
              <button class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50" disabled={updating()} onClick={() => setShowAddForm(true)}>
                <Plus size={16} /> {t('dialog.tracker.add_title')}
              </button>
              <button class="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold px-4 py-1.5 rounded-lg border border-destructive/20 transition-colors text-sm disabled:opacity-50" disabled={updating() || selectedTrackerIds().length === 0} onClick={handleRemoveTrackers}>
                <Trash2 size={16} /> {t('context.remove_tracker')}
              </button>
            </div>
          }
        >
          <div class="flex flex-col gap-2.5 bg-secondary/50 border border-border rounded-xl p-3 w-full backdrop-blur-md shadow-sm">
            <textarea rows="3" class="bg-background border border-border rounded-lg p-2 text-sm outline-none focus:border-primary w-full resize-y font-mono" placeholder={t('dialog.tracker.add_label')} value={newTrackerUrls()} onInput={(e) => setNewTrackerUrls(e.currentTarget.value)} disabled={updating()} />
            <div class="text-xs text-muted-foreground">{t('dialog.tracker.hint')}</div>
            <div class="flex gap-2 justify-end">
              <button class="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm" onClick={() => setShowAddForm(false)} disabled={updating()}>{t('dialog.cancel')}</button>
              <button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-1.5 rounded-lg transition-colors text-sm" onClick={handleAddTrackers} disabled={updating()}>{t('dialog.ok')}</button>
            </div>
          </div>
        </Show>
      </div>

      <div class="flex-1 overflow-auto bg-background/50 backdrop-blur-md rounded-xl border border-border shadow-sm relative">
        <table class="w-full min-w-max text-left border-collapse table-fixed text-[11px]">
          <thead class="sticky top-0 bg-secondary/90 backdrop-blur-md z-10 font-bold text-muted-foreground uppercase tracking-wider shadow-sm">
            <tr>
              <th class="py-1 px-1.5 text-center relative group p-0" style={{ width: `${colWidths().select}px` }}>
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'select')} />
              </th>
              <th class="py-1 px-1.5 relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().idx}px` }}>
                #
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'idx')} />
              </th>
              <th class="py-1 px-1.5 relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().url}px` }}>
                {t('dialog.add.tracker_url')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'url')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().status}px` }}>
                {t('detail.general.status')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'status')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().seeds}px` }}>
                {t('columns.seeds')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'seeds')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().peers}px` }}>
                {t('columns.peers')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'peers')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().announce}px` }}>
                {t('detail.trackers.detail_announce_result')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'announce')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().next}px` }}>
                {t('detail.trackers.detail_next_announce')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'next')} />
              </th>
              <th class="py-1 px-1.5 relative group p-0" style={{ width: `${colWidths().actions}px` }}>
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'actions')} />
              </th>
            </tr>
          </thead>
          <tbody class="font-medium text-foreground divide-y divide-border/50">
            <Show
              when={props.torrent.tracker_stats && props.torrent.tracker_stats.length > 0}
              fallback={
                <tr>
                  <td colspan="9" class="py-12 text-center text-muted-foreground/60">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <Server size={32} class="opacity-50" />
                      <span>{t('status.no_trackers')}</span>
                    </div>
                  </td>
                </tr>
              }
            >
              <For each={props.torrent.tracker_stats}>
                {(stat, i) => (
                  <tr class={cn("transition-colors group", selectedTrackerIds().includes(stat.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50")}>
                    <td class="py-1 px-1.5 text-center">
                      <input type="checkbox" class="accent-primary" checked={selectedTrackerIds().includes(stat.id)} onChange={() => toggleSelectTracker(stat.id)} />
                    </td>
                    <td class="py-1 px-1.5 text-muted-foreground/50 font-mono text-[10px]">{i() + 1}</td>
                    <td class="py-1 px-1.5 flex items-center gap-2 select-text" title={stat.announce}>
                      <span class={cn("truncate max-w-[300px]", stat.last_announce_succeeded ? "text-foreground" : "text-muted-foreground")}>{stat.announce}</span>
                      <Show when={stat.is_backup}>
                        <span class="px-1 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground border border-border font-bold uppercase">{t('detail.trackers.backup')}</span>
                      </Show>
                    </td>
                    <td class="py-1 px-1.5 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <StatusDot state={stat.announce_state} />
                        <span class={cn("text-[10px]", stat.announce_state === 3 ? "text-success font-bold" : "text-muted-foreground")}>{announceStateText(stat.announce_state)}</span>
                      </div>
                    </td>
                    <td class="py-1 px-1.5 text-center font-mono text-primary text-[10px]">{countOrDash(stat.seeder_count)}</td>
                    <td class="py-1 px-1.5 text-center font-mono text-success text-[10px]">{countOrDash(stat.leecher_count)}</td>
                    <td class="py-1 px-1.5 text-center truncate max-w-[120px]" title={stat.last_announce_result}>
                      <Show when={stat.has_announced} fallback={<span class="text-muted-foreground/50">-</span>}>
                        <span class={cn("text-[10px]", stat.last_announce_succeeded ? "text-success font-bold" : "text-destructive font-medium")}>
                          {stat.last_announce_succeeded ? t('detail.trackers.announce_ok') : (stat.last_announce_result || '-')}
                        </span>
                      </Show>
                    </td>
                    <td class="py-1 px-1.5 text-center font-mono text-muted-foreground text-[10px]">{timeOrDash(stat.next_announce_time)}</td>
                    <td class="py-1 px-1.5 text-center">
                      <button class="p-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100" onClick={() => setDetailTracker(stat)} title={t('detail.trackers.detail_btn')}>
                        <Info size={14} />
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <Show when={detailTracker()}>
        {(tr) => (
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDetailTracker(null)}>
            <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/50">
                <div class="flex items-center gap-3">
                  <Server size={20} class="text-primary" />
                  <span class="text-base font-bold text-foreground font-mono tracking-tight truncate max-w-[500px]">{tr().announce}</span>
                </div>
                <button class="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-colors" onClick={() => setDetailTracker(null)}>✕</button>
              </div>

              <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
                {/* Basic */}
                <div class="flex flex-col gap-2 md:col-span-2">
                  <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Database size={14} /> {t('detail.trackers.detail_basic')}</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
                    <span class="text-muted-foreground">{t('detail.trackers.detail_host')}</span><span class="font-mono break-all pr-2">{tr().host || '-'}</span>
                    <span class="text-muted-foreground">{t('dialog.add.tier')}</span><span class="font-bold">{tr().tier}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.backup')}</span><span class="font-bold text-warning">{tr().is_backup ? t('common.yes') : t('common.no')}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.detail_scrape_url')}</span><span class="font-mono text-[10px] break-all">{tr().scrape || '-'}</span>
                  </div>
                </div>

                {/* Announce */}
                <div class="flex flex-col gap-2">
                  <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> {t('detail.trackers.detail_announce')}</h4>
                  <div class="grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-3 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
                    <span class="text-muted-foreground">{t('detail.general.status')}</span><span class="text-right flex items-center gap-2 justify-end"><StatusDot state={tr().announce_state}/> {announceStateText(tr().announce_state)}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.detail_has_announced')}</span><span class="text-right">{tr().has_announced ? t('common.yes') : t('common.no')}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.detail_last_announce')}</span><span class="text-right font-mono">{timeOrDash(tr().last_announce_time)}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.detail_next_announce')}</span><span class="text-right font-mono">{timeOrDash(tr().next_announce_time)}</span>
                    <span class="text-muted-foreground">{t('detail.trackers.detail_announce_result')}</span><span class="text-right">
                      <Show when={tr().last_announce_succeeded} fallback={<span class="text-destructive font-bold">{tr().last_announce_result || '-'}</span>}>
                        <span class="text-success font-bold">{t('detail.trackers.announce_ok')}</span>
                      </Show>
                    </span>
                  </div>
                </div>

                {/* Stats & Scrape */}
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-2">
                    <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} /> {t('detail.trackers.detail_stats')}</h4>
                    <div class="grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-3 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
                      <span class="text-muted-foreground">{t('columns.seeds')}</span><span class="text-right font-mono text-primary font-bold">{countOrDash(tr().seeder_count)}</span>
                      <span class="text-muted-foreground">{t('columns.peers')}</span><span class="text-right font-mono text-success font-bold">{countOrDash(tr().leecher_count)}</span>
                      <span class="text-muted-foreground">{t('detail.trackers.downloader_count')}</span><span class="text-right font-mono">{countOrDash(tr().downloader_count)}</span>
                      <span class="text-muted-foreground">{t('detail.general.downloaded')}</span><span class="text-right font-mono">{countOrDash(tr().download_count)}</span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('detail.trackers.detail_scrape')}</h4>
                    <div class="grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-3 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
                      <span class="text-muted-foreground">{t('detail.trackers.detail_last_scrape')}</span><span class="text-right font-mono">{timeOrDash(tr().last_scrape_time)}</span>
                      <span class="text-muted-foreground">{t('detail.trackers.detail_next_scrape')}</span><span class="text-right font-mono">{timeOrDash(tr().next_scrape_time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
