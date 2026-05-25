import { type Component, createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { createVirtualizer } from '@tanstack/solid-virtual';
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
import './TorrentTable.css';

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

  // Sort State
  const [sortKey, setSortKey] = createSignal<ColumnId>('queue_position');
  const [sortAsc, setSortAsc] = createSignal<boolean>(true);

  // Column Definitions
  const [columns, setColumns] = createSignal<ColumnDef[]>([
    { id: 'queue_position', label: '#', width: 40, align: 'center', visible: true },
    { id: 'name', label: t('columns.name'), width: 280, align: 'left', visible: true },
    { id: 'total_size', label: t('columns.size'), width: 80, align: 'right', visible: true },
    { id: 'percent_done', label: t('columns.progress'), width: 120, align: 'left', visible: true },
    { id: 'status', label: t('columns.status'), width: 85, align: 'center', visible: true },
    { id: 'seeds', label: t('columns.seeds'), width: 70, align: 'center', visible: true },
    { id: 'peers', label: t('columns.peers'), width: 70, align: 'center', visible: true },
    { id: 'rate_download', label: t('columns.rate_dl'), width: 90, align: 'right', visible: true },
    { id: 'rate_upload', label: t('columns.rate_ul'), width: 90, align: 'right', visible: true },
    { id: 'eta', label: t('columns.eta'), width: 90, align: 'center', visible: true },
    { id: 'upload_ratio', label: t('columns.ratio'), width: 60, align: 'right', visible: true },
    { id: 'downloaded_ever', label: t('columns.downloaded'), width: 95, align: 'right', visible: false },
    { id: 'uploaded_ever', label: t('columns.uploaded'), width: 95, align: 'right', visible: false },
    { id: 'added_date', label: t('columns.added'), width: 130, align: 'center', visible: false },
    { id: 'done_date', label: t('columns.done_date'), width: 130, align: 'center', visible: false },
    { id: 'download_dir', label: t('columns.download_dir'), width: 150, align: 'left', visible: false },
    { id: 'labels', label: t('columns.labels'), width: 100, align: 'left', visible: true },
  ]);

  // Handle Sort Toggle
  const handleSort = (colId: ColumnId) => {
    if (sortKey() === colId) {
      setSortAsc(!sortAsc());
    } else {
      setSortKey(colId);
      setSortAsc(true);
    }
  };

  // Get Sorted Torrents Memo
  const sortedTorrentsList = createMemo(() => {
    const list = [...filteredTorrents()];
    const key = sortKey();
    const asc = sortAsc();

    list.sort((a, b) => {
      let valA: any = a[key as keyof Torrent];
      let valB: any = b[key as keyof Torrent];

      // Handle custom sorting cases (like tracking array length or null safety)
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

  // Set up Row Virtualizer
  const rowVirtualizer = createVirtualizer({
    get count() { return sortedTorrentsList().length; },
    getScrollElement: () => parentRef || null,
    estimateSize: () => 38,
    overscan: 10,
  });

  // Handle Keyboard Navigation
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

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  // Header context menu to hide/show columns
  const [showHeaderMenu, setShowHeaderMenu] = createSignal(false);
  const [headerMenuPos, setHeaderMenuPos] = createSignal({ x: 0, y: 0 });

  const onHeaderContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setHeaderMenuPos({ x: e.clientX, y: e.clientY });
    setShowHeaderMenu(true);
  };

  const toggleColumnVisible = (id: ColumnId) => {
    setColumns(
      columns().map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  // Close context menu on click outside
  onMount(() => {
    const closeMenu = () => {
      setShowHeaderMenu(false);
    };
    window.addEventListener('click', closeMenu);
    onCleanup(() => window.removeEventListener('click', closeMenu));
  });

  return (
    <div class="trwm-table-container">
      {/* Header Context Menu */}
      <Show when={showHeaderMenu()}>
        <div
          class="trwm-header-menu"
          style={{
            position: 'fixed',
            left: `${headerMenuPos().x}px`,
            top: `${headerMenuPos().y}px`,
            'z-index': 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="trwm-header-menu-title">{t('toolbar.settings')}</div>
          <For each={columns()}>
            {(col) => (
              <label class="trwm-header-menu-item">
                <input
                  type="checkbox"
                  checked={col.visible}
                  disabled={col.id === 'name'} // Name column cannot be hidden
                  onChange={() => toggleColumnVisible(col.id)}
                />
                <span>{col.label}</span>
              </label>
            )}
          </For>
        </div>
      </Show>

      {/* Main Table */}
      <div class="trwm-torrent-table">
        {/* Table Header */}
        <div class="trwm-table-header" onContextMenu={onHeaderContextMenu}>
          <For each={columns().filter((c) => c.visible)}>
            {(col) => (
              <div
                class={`trwm-table-th align-${col.align} ${
                  sortKey() === col.id ? `sorted-${sortAsc() ? 'asc' : 'desc'}` : ''
                }`}
                style={{ width: `${col.width}px` }}
                onClick={() => handleSort(col.id)}
              >
                {col.label}
                <Show when={sortKey() === col.id}>
                  <span class="sort-indicator">{sortAsc() ? ' ▴' : ' ▾'}</span>
                </Show>
              </div>
            )}
          </For>
        </div>

        {/* Scrollable Rows Body */}
        <div
          ref={parentRef}
          class="trwm-table-body"
          onClick={() => clearSelection()}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => {
                const torrent = sortedTorrentsList()[virtualRow.index];
                const isSelected = createMemo(() => selectedIds().includes(torrent.id));

                // Double Click behavior
                const handleDoubleClick = () => {
                  if (torrent.status === 0) {
                    startTorrents([torrent.id]);
                  } else {
                    pauseTorrents([torrent.id]);
                  }
                };

                return (
                  <div
                    class={`trwm-table-tr ${isSelected() ? 'selected' : ''}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(torrent.id, e.ctrlKey || e.metaKey, e.shiftKey);
                      props.onSelect(torrent.id);
                    }}
                    onDblClick={handleDoubleClick}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!selectedIds().includes(torrent.id)) {
                        toggleSelect(torrent.id, false, false);
                      }
                      props.onContextMenu(e, selectedIds());
                    }}
                  >
                    <For each={columns().filter((c) => c.visible)}>
                      {(col) => {
                        const cellStyle = { width: `${col.width}px` };

                        return (
                          <div
                            class={`trwm-table-td align-${col.align}`}
                            style={cellStyle}
                          >
                            {/* Render different cell content based on column id */}
                            <Show when={col.id === 'queue_position'} fallback={null}>
                              <span class="text-mono">{torrent.queue_position >= 0 ? torrent.queue_position : '-'}</span>
                            </Show>

                            <Show when={col.id === 'name'} fallback={null}>
                              <div class="cell-name-container" title={torrent.name}>
                                <span class="cell-name">{torrent.name}</span>
                              </div>
                            </Show>

                            <Show when={col.id === 'total_size'} fallback={null}>
                              <span class="text-mono">{formatBytes(torrent.total_size)}</span>
                            </Show>

                            <Show when={col.id === 'percent_done'} fallback={null}>
                              <div class="cell-progress-container">
                                <div class="cell-progress-bar">
                                  <div
                                    class={`cell-progress-fill ${
                                      torrent.status === 2 || torrent.status === 1 ? 'verifying' : ''
                                    }`}
                                    style={{
                                      width: `${torrent.percent_done * 100}%`,
                                      'background-color': getStatusColor(torrent.status),
                                    }}
                                  />
                                </div>
                                <span class="cell-progress-text text-mono">
                                  {formatPercent(torrent.percent_done)}
                                </span>
                              </div>
                            </Show>

                            <Show when={col.id === 'status'} fallback={null}>
                              <span
                                class="status-badge"
                                style={{
                                  color: getStatusColor(torrent.status),
                                  'border-color': getStatusColor(torrent.status),
                                }}
                              >
                                {getStatusText(torrent.status)}
                              </span>
                            </Show>

                            <Show when={col.id === 'seeds'} fallback={null}>
                              <span class="text-mono">
                                {torrent.peers_sending_to_us} ({torrent.peers_known || 0})
                              </span>
                            </Show>

                            <Show when={col.id === 'peers'} fallback={null}>
                              <span class="text-mono">
                                {torrent.peers_connected} ({torrent.peers_getting_from_us || 0})
                              </span>
                            </Show>

                            <Show when={col.id === 'rate_download'} fallback={null}>
                              <span class={`text-mono ${torrent.rate_download > 0 ? 'active-download' : ''}`}>
                                {torrent.rate_download > 0 ? formatSpeed(torrent.rate_download) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'rate_upload'} fallback={null}>
                              <span class={`text-mono ${torrent.rate_upload > 0 ? 'active-upload' : ''}`}>
                                {torrent.rate_upload > 0 ? formatSpeed(torrent.rate_upload) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'eta'} fallback={null}>
                              <span class="text-mono">{formatETA(torrent.eta)}</span>
                            </Show>

                            <Show when={col.id === 'upload_ratio'} fallback={null}>
                              <span class={`text-mono ${getRatioClass(torrent.upload_ratio)}`}>
                                {formatRatio(torrent.upload_ratio)}
                              </span>
                            </Show>

                            <Show when={col.id === 'downloaded_ever'} fallback={null}>
                              <span class="text-mono">{formatBytes(torrent.downloaded_ever)}</span>
                            </Show>

                            <Show when={col.id === 'uploaded_ever'} fallback={null}>
                              <span class="text-mono">{formatBytes(torrent.uploaded_ever)}</span>
                            </Show>

                            <Show when={col.id === 'added_date'} fallback={null}>
                              <span class="text-mono">{formatTimestamp(torrent.added_date)}</span>
                            </Show>

                            <Show when={col.id === 'done_date'} fallback={null}>
                              <span class="text-mono">
                                {torrent.done_date ? formatTimestamp(torrent.done_date) : '-'}
                              </span>
                            </Show>

                            <Show when={col.id === 'download_dir'} fallback={null}>
                              <span class="cell-dir" title={torrent.download_dir}>
                                {torrent.download_dir}
                              </span>
                            </Show>

                            <Show when={col.id === 'labels'} fallback={null}>
                              <div class="cell-labels" title={torrent.labels?.join(', ')}>
                                <For each={torrent.labels}>
                                  {(l) => <span class="cell-label-badge">{l}</span>}
                                </For>
                              </div>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
