import { type Component, createSignal, createMemo, For, Index, Show, onMount, onCleanup } from 'solid-js';
import { createPersistedSignal } from '../../utils/persist';
import { createVirtualizer } from '@tanstack/solid-virtual';
import { createResizableColumns } from '../../hooks/createResizableColumns';
import type { Torrent } from '../../types/transmission';
import {
  filteredTorrents,
  selectedIds,
  toggleSelect,
  clearSelection,
  selectAll,
  startTorrents,
  pauseTorrents,
  removeTorrents,
} from '../../store/torrentStore';
import {
  formatBytes,
  formatSpeed,
  formatETA,
  formatPercent,
  formatRatio,
  getRatioClass,
  getStatusText,
  getStatusColor,
  formatTimestamp
} from '../../utils/format';
import { t } from '../../utils/i18n';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { ChevronUp, ChevronDown, Play, Pause, Clock, CheckCircle2, RotateCw, AlertTriangle } from 'lucide-solid';

// Column IDs type
type ColumnId =
  | 'queue_position'
  | 'name'
  | 'total_size'
  | 'percent_done'
  | 'status'
  | 'seeds'
  | 'peers'
  | 'rate_download'
  | 'rate_upload'
  | 'eta'
  | 'upload_ratio'
  | 'downloaded_ever'
  | 'uploaded_ever'
  | 'added_date'
  | 'done_date'
  | 'download_dir'
  | 'labels';

interface ColumnDef {
  id: ColumnId;
  label: string;
  width: number; // in px
  align: 'left' | 'right' | 'center';
  visible: boolean;
}

export const TorrentTable: Component<{
  onSelect: (id: number) => void;
  onContextMenu: (e: MouseEvent, ids: number[]) => void;
}> = (props) => {
  let parentRef: HTMLDivElement | undefined;

  const [sortKey, setSortKey] = createPersistedSignal<ColumnId>('trwm-sort-key', 'queue_position');
  const [sortAsc, setSortAsc] = createPersistedSignal<boolean>('trwm-sort-asc', true);

  const defaultVisible: Record<string, boolean> = {
    queue_position: true, name: true, total_size: true, percent_done: true,
    status: true, seeds: true, peers: true, rate_download: true, rate_upload: true,
    eta: true, upload_ratio: true, downloaded_ever: false, uploaded_ever: false,
    added_date: false, done_date: false, download_dir: false, labels: true,
  };
  const [columnVisibility, setColumnVisibility] = createPersistedSignal<Record<string, boolean>>(
    'trwm-column-visibility', defaultVisible
  );

  const [columns, setColumns] = createSignal<ColumnDef[]>([
    { id: 'queue_position', label: '#', width: 40, align: 'center', visible: true },
    { id: 'name', label: t('columns.name'), width: 280, align: 'left', visible: true },
    { id: 'total_size', label: t('columns.size'), width: 80, align: 'right', visible: true },
    { id: 'percent_done', label: t('columns.progress'), width: 130, align: 'left', visible: true },
    { id: 'status', label: t('columns.status'), width: 100, align: 'center', visible: true },
    { id: 'seeds', label: t('columns.seeds'), width: 70, align: 'center', visible: true },
    { id: 'peers', label: t('columns.peers'), width: 70, align: 'center', visible: true },
    { id: 'rate_download', label: t('columns.rate_dl'), width: 100, align: 'right', visible: true },
    { id: 'rate_upload', label: t('columns.rate_ul'), width: 100, align: 'right', visible: true },
    { id: 'eta', label: t('columns.eta'), width: 90, align: 'center', visible: true },
    { id: 'upload_ratio', label: t('columns.ratio'), width: 60, align: 'right', visible: true },
    { id: 'downloaded_ever', label: t('columns.downloaded'), width: 110, align: 'right', visible: false },
    { id: 'uploaded_ever', label: t('columns.uploaded'), width: 110, align: 'right', visible: false },
    { id: 'added_date', label: t('columns.added'), width: 130, align: 'center', visible: false },
    { id: 'done_date', label: t('columns.done_date'), width: 130, align: 'center', visible: false },
    { id: 'download_dir', label: t('columns.download_dir'), width: 150, align: 'left', visible: false },
    { id: 'labels', label: t('columns.labels'), width: 100, align: 'left', visible: true },
  ]);

  const { widths: colWidths, handleMouseDown } = createResizableColumns('trwm-torrent-table-widths', columns());

  const visibleColumns = createMemo(() => {
    const vis = columnVisibility();
    const w = colWidths();
    return columns().map(col => ({ 
      ...col, 
      visible: vis[col.id] ?? col.visible,
      width: w[col.id] ?? col.width
    }));
  });

  const handleSort = (colId: ColumnId) => {
    if (sortKey() === colId) {
      setSortAsc(!sortAsc());
    } else {
      setSortKey(colId);
      setSortAsc(true);
    }
  };

  const sortedTorrentsList = createMemo(() => {
    const list = [...filteredTorrents()];
    const key = sortKey();
    const asc = sortAsc();

    list.sort((a, b) => {
      let valA: any = a[key as keyof Torrent];
      let valB: any = b[key as keyof Torrent];

      if (key === 'seeds') {
        valA = a.tracker_stats ? Math.max(...a.tracker_stats.map(s => s.seeder_count), 0) : 0;
        valB = b.tracker_stats ? Math.max(...b.tracker_stats.map(s => s.seeder_count), 0) : 0;
      } else if (key === 'peers') {
        valA = a.peers_connected;
        valB = b.peers_connected;
      } else if (key === 'labels') {
        valA = a.labels?.join(',') || '';
        valB = b.labels?.join(',') || '';
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return list;
  });

  const ROW_HEIGHT = 22;

  const rowVirtualizer = createVirtualizer({
    get count() { return sortedTorrentsList().length; },
    getScrollElement: () => parentRef || null,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      selectAll();
    } else if (e.key === 'Escape') {
      clearSelection();
    } else if (e.key === 'Delete') {
      const ids = selectedIds();
      if (ids.length > 0) {
        removeTorrents(ids, false);
      }
    }
  };

  onMount(() => window.addEventListener('keydown', handleKeyDown));
  onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

  const [showHeaderMenu, setShowHeaderMenu] = createSignal(false);
  const [headerMenuPos, setHeaderMenuPos] = createSignal({ x: 0, y: 0 });

  const onHeaderContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setHeaderMenuPos({ x: e.clientX, y: e.clientY });
    setShowHeaderMenu(true);
  };

  const toggleColumnVisible = (id: ColumnId) => {
    setColumnVisibility(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  onMount(() => {
    const closeMenu = () => setShowHeaderMenu(false);
    window.addEventListener('click', closeMenu);
    onCleanup(() => window.removeEventListener('click', closeMenu));
  });

  return (
    <div class="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header Context Menu */}
      <Show when={showHeaderMenu()}>
        <div
          class="fixed z-[9999] bg-popover/80 backdrop-blur-xl border border-border rounded-md p-2 shadow-lg min-w-[180px] max-h-[350px] overflow-y-auto flex flex-col gap-1"
          style={{
            left: `${headerMenuPos().x}px`,
            top: `${headerMenuPos().y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 border-b border-border mb-1">{t('toolbar.settings')}</div>
          <For each={visibleColumns()}>
            {(col) => (
              <label class="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-foreground text-xs transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  class="accent-primary cursor-pointer w-3.5 h-3.5"
                  checked={col.visible}
                  disabled={col.id === 'name'}
                  onChange={() => toggleColumnVisible(col.id)}
                />
                <span>{col.label}</span>
              </label>
            )}
          </For>
        </div>
      </Show>

      {/* Main Table */}
      <div class="flex flex-col h-full w-full overflow-hidden">
        {/* Table Header */}
        <div 
          class="flex bg-secondary/90 backdrop-blur-md border-b border-border select-none font-semibold text-muted-foreground text-[11px] h-8 items-center pr-2 shrink-0 sticky top-0 z-10" 
          onContextMenu={onHeaderContextMenu}
        >
          <For each={visibleColumns().filter((c) => c.visible)}>
            {(col) => (
              <div
                class={cn(
                  "flex items-center h-full px-2 md:px-3 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition-colors hover:bg-muted hover:text-foreground relative group",
                  col.align === 'left' ? "justify-start text-left" : col.align === 'right' ? "justify-end text-right" : "justify-center text-center"
                )}
                style={{ width: `${col.width}px` }}
                onClick={() => handleSort(col.id)}
              >
                {col.label}
                <Show when={sortKey() === col.id}>
                  {sortAsc() ? <ChevronUp size={12} class="ml-1 text-primary" stroke-width={3} /> : <ChevronDown size={12} class="ml-1 text-primary" stroke-width={3} />}
                </Show>
                
                <div
                  class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => handleMouseDown(e, col.id)}
                />
              </div>
            )}
          </For>
        </div>

        {/* Scrollable Rows Body */}
        <div
          ref={parentRef}
          class="flex-1 overflow-auto relative"
          onClick={() => clearSelection()}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Index each={rowVirtualizer.getVirtualItems()}>
              {(virtualRowAccessor) => {
                const virtualRow = virtualRowAccessor;
                const torrent = () => sortedTorrentsList()[virtualRow().index];
                const isSelected = createMemo(() => {
                  const t = torrent();
                  return t ? selectedIds().includes(t.id) : false;
                });

                const handleDoubleClick = () => {
                  const t = torrent();
                  if (!t) return;
                  if (t.status === 0) startTorrents([t.id]);
                  else pauseTorrents([t.id]);
                };

                return (
                  <Show when={torrent()}>
                  <div
                    class={cn(
                      "absolute top-0 left-0 w-full flex items-center border-b border-border/50 cursor-pointer bg-background transition-colors select-none group",
                      isSelected() 
                        ? "bg-primary/10 hover:bg-primary/15" 
                        : "hover:bg-muted/50"
                    )}
                    style={{
                      height: `${virtualRow().size}px`,
                      transform: `translateY(${virtualRow().start}px)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(torrent().id, e.ctrlKey || e.metaKey, e.shiftKey);
                      props.onSelect(torrent().id);
                    }}
                    onDblClick={handleDoubleClick}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!selectedIds().includes(torrent().id)) {
                        toggleSelect(torrent().id, false, false);
                      }
                      props.onContextMenu(e, selectedIds());
                    }}
                  >
                    <For each={visibleColumns().filter((c) => c.visible)}>
                      {(col) => {
                        return (
                          <div
                            class={cn(
                              "flex items-center h-full px-2 md:px-3 whitespace-nowrap overflow-hidden text-ellipsis text-[11px] md:text-xs text-foreground",
                              col.align === 'left' ? "justify-start text-left" : col.align === 'right' ? "justify-end text-right" : "justify-center text-center"
                            )}
                            style={{ width: `${col.width}px` }}
                          >
                            <Show when={col.id === 'queue_position'} fallback={null}>
                              <span class="font-mono text-muted-foreground">{torrent().queue_position >= 0 ? torrent().queue_position : '-'}</span>
                            </Show>

                            <Show when={col.id === 'name'} fallback={null}>
                              <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap" title={torrent().name}>
                                <span class="font-medium">{torrent().name}</span>
                              </div>
                            </Show>

                            <Show when={col.id === 'total_size'} fallback={null}>
                              <span class="font-mono">{formatBytes(torrent().total_size)}</span>
                            </Show>

                            <Show when={col.id === 'percent_done'} fallback={null}>
                              <div class="flex items-center gap-2 w-full">
                                <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
                                  <div
                                    class={cn(
                                      "h-full rounded-full transition-all duration-300 relative overflow-hidden",
                                      (torrent().status === 2 || torrent().status === 1) ? 'animate-pulse' : ''
                                    )}
                                    style={{
                                      width: `${torrent().percent_done * 100}%`,
                                      'background-color': getStatusColor(torrent().status),
                                    }}
                                  >
                                    <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                  </div>
                                </div>
                                <span class="font-mono text-[10px] min-w-[36px] text-right">
                                  {formatPercent(torrent().percent_done)}
                                </span>
                              </div>
                            </Show>

                            <Show when={col.id === 'status'} fallback={null}>
                              <span
                                class="flex items-center justify-center gap-1 w-fit mx-auto text-[9px] px-1.5 py-[2px] rounded-[4px] border font-bold uppercase tracking-wide leading-tight shadow-sm"
                                style={{
                                  color: getStatusColor(torrent().status),
                                  'border-color': `color-mix(in srgb, ${getStatusColor(torrent().status)} 30%, transparent)`,
                                  'background-color': `color-mix(in srgb, ${getStatusColor(torrent().status)} 15%, transparent)`
                                }}
                              >
                                <Show when={torrent().status === 0}><Pause size={10} /></Show>
                                <Show when={torrent().status === 1 || torrent().status === 2}><RotateCw size={10} class="animate-spin" /></Show>
                                <Show when={torrent().status === 3 || torrent().status === 5}><Clock size={10} /></Show>
                                <Show when={torrent().status === 4 || torrent().status === 6}><Play size={10} /></Show>
                                <Show when={torrent().status === 7}><CheckCircle2 size={10} /></Show>
                                <span>{getStatusText(torrent().status)}</span>
                              </span>
                            </Show>

                            <Show when={col.id === 'seeds'} fallback={null}>
                               <span class="font-mono text-muted-foreground">
                                {torrent().peers_sending_to_us} <span class="opacity-60">({torrent().peers_known || 0})</span>
                              </span>
                            </Show>

                            <Show when={col.id === 'peers'} fallback={null}>
                               <span class="font-mono text-muted-foreground">
                                {torrent().peers_connected} <span class="opacity-60">({torrent().peers_getting_from_us || 0})</span>
                              </span>
                            </Show>

                            <Show when={col.id === 'rate_download'} fallback={null}>
                              <span class={cn("font-mono", torrent().rate_download > 0 ? 'text-primary font-bold' : 'text-muted-foreground')}>
                                {torrent().rate_download > 0 ? formatSpeed(torrent().rate_download) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'rate_upload'} fallback={null}>
                              <span class={cn("font-mono", torrent().rate_upload > 0 ? 'text-success font-bold' : 'text-muted-foreground')}>
                                {torrent().rate_upload > 0 ? formatSpeed(torrent().rate_upload) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'eta'} fallback={null}>
                              <span class="font-mono text-muted-foreground">{formatETA(torrent().eta)}</span>
                            </Show>

                            <Show when={col.id === 'upload_ratio'} fallback={null}>
                              <span class={cn("font-mono", getRatioClass(torrent().upload_ratio))}>
                                {formatRatio(torrent().upload_ratio)}
                              </span>
                            </Show>

                            <Show when={col.id === 'downloaded_ever'} fallback={null}>
                              <span class="font-mono text-muted-foreground">{formatBytes(torrent().downloaded_ever)}</span>
                            </Show>

                            <Show when={col.id === 'uploaded_ever'} fallback={null}>
                              <span class="font-mono text-muted-foreground">{formatBytes(torrent().uploaded_ever)}</span>
                            </Show>

                            <Show when={col.id === 'added_date'} fallback={null}>
                              <span class="font-mono text-muted-foreground">{formatTimestamp(torrent().added_date)}</span>
                            </Show>

                            <Show when={col.id === 'done_date'} fallback={null}>
                              <span class="font-mono text-muted-foreground">
                                {torrent().done_date ? formatTimestamp(torrent().done_date) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'download_dir'} fallback={null}>
                              <span class="text-muted-foreground text-[10px] truncate" title={torrent().download_dir}>
                                {torrent().download_dir}
                              </span>
                            </Show>

                            <Show when={col.id === 'labels'} fallback={null}>
                              <div class="flex gap-1 overflow-hidden w-full" title={torrent().labels?.join(', ')}>
                                <For each={torrent().labels}>
                                  {(l) => <Badge variant="secondary" class="h-4 text-[9px] px-1 font-semibold rounded-[3px] border-none">{l}</Badge>}
                                </For>
                              </div>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                  </Show>
                );
              }}
            </Index>
          </div>
        </div>
      </div>
    </div>
  );
};
