import { type Component, Show, createSignal, createEffect, For, createMemo } from 'solid-js';
import { closeHistoryModal, showHistoryModal } from '../../store/modalStore';
import { db, type HistoryRecord } from '../../store/db';
import { createResizableColumns } from '../../hooks/createResizableColumns';
import { formatBytes, formatTimestamp, formatRatio, formatSpeed, getStatusColor, getStatusText } from '../../utils/format';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { Copy, Link, CheckSquare, Square, Trash2, X, Download, Info } from 'lucide-solid';

export const HistoryModal: Component = () => {
  const [records, setRecords] = createSignal<HistoryRecord[]>([]);
  const [search, setSearch] = createSignal('');
  const [selectedRecord, setSelectedRecord] = createSignal<HistoryRecord | null>(null);
  const [selectedIds, setSelectedIds] = createSignal<Set<number>>(new Set());

  const { widths: colWidths, handleMouseDown } = createResizableColumns('trwm-history-widths', [
    { id: 'select', width: 36 },
    { id: 'name', width: 280 },
    { id: 'size', width: 85 },
    { id: 'status', width: 85 },
    { id: 'ratio', width: 65 },
    { id: 'actions', width: 100 },
  ]);

  const [statusFilter, setStatusFilter] = createSignal<string>('all');

  const filteredRecords = createMemo(() => {
    const query = search().trim().toLowerCase();
    const filter = statusFilter();
    
    return records().filter((r) => {
      let statusMatch = true;
      if (filter === 'downloading') statusMatch = r.deleted_date === 0 && (r.error || 0) === 0 && r.status === 4;
      else if (filter === 'seeding') statusMatch = r.deleted_date === 0 && (r.error || 0) === 0 && r.status === 6;
      else if (filter === 'stopped') statusMatch = r.deleted_date === 0 && (r.error || 0) === 0 && r.status === 0;
      else if (filter === 'error') statusMatch = r.deleted_date === 0 && (r.error || 0) > 0;
      else if (filter === 'deleted') statusMatch = r.deleted_date > 0;

      if (!statusMatch) return false;
      if (!query) return true;

      return (
        r.name.toLowerCase().includes(query) ||
        r.hash_string.toLowerCase().includes(query) ||
        r.labels.some((l) => l.toLowerCase().includes(query))
      );
    });
  });

  const selectedCount = createMemo(() => selectedIds().size);
  const allSelected = createMemo(() => filteredRecords().length > 0 && selectedIds().size === filteredRecords().length);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected()) {
      setSelectedIds(new Set<number>());
    } else {
      setSelectedIds(new Set(filteredRecords().map((r) => r.id!)));
    }
  };

  const copyMagnetLinks = (recs: HistoryRecord[]) => {
    const links = recs
      .filter((r) => r.magnet_link)
      .map((r) => r.magnet_link!);
    if (links.length === 0) {
      showToast(t('history.no_magnet_links'), 'warning');
      return;
    }
    navigator.clipboard.writeText(links.join('\n')).then(() => {
      showToast(t('history.copied_magnet_links', { n: links.length }), 'success');
    }).catch(() => {
      showToast(t('history.copy_failed'), 'error');
    });
  };

  const copySelectedMagnetLinks = () => {
    const recs = filteredRecords().filter((r) => selectedIds().has(r.id!));
    copyMagnetLinks(recs);
  };

  const copyAllMagnetLinks = () => {
    copyMagnetLinks(filteredRecords());
  };

  const exportTorrents = (recs: HistoryRecord[]) => {
    const withMagnets = recs.filter((r) => r.magnet_link);
    if (withMagnets.length === 0) {
      showToast(t('history.no_magnet_links'), 'warning');
      return;
    }
    
    withMagnets.forEach((r) => {
      const link = r.magnet_link!;
      const content = `d10:magnet-uri${new Blob([link]).size}:${link}e`;
      const blob = new Blob([content], { type: 'application/x-bittorrent' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${r.name || r.hash_string}.torrent`;
      a.click();
      URL.revokeObjectURL(url);
    });
    showToast(t('history.exported_torrents', { n: withMagnets.length }), 'success');
  };

  const exportSelectedTorrents = () => {
    const recs = filteredRecords().filter((r) => selectedIds().has(r.id!));
    exportTorrents(recs);
  };

  const batchDeleteSelected = async () => {
    const ids = [...selectedIds()];
    if (ids.length === 0) return;
    await db.history.bulkDelete(ids);
    setSelectedIds(new Set<number>());
    loadRecords();
    if (selectedRecord() && ids.includes(selectedRecord()!.id!)) {
      setSelectedRecord(null);
    }
    showToast(t('history.batch_deleted', { n: ids.length }), 'success');
  };

  // Load records from Dexie reactively
  const loadRecords = async () => {
    try {
      let list = await db.history.reverse().sortBy('added_date');
      setRecords(list);
    } catch (e) {
      console.error('Failed to load history records', e);
    }
  };

  // Reload when modal opens
  createEffect(() => {
    if (showHistoryModal()) {
      loadRecords();
      setSelectedIds(new Set<number>());
    }
  });

  const handleDeleteRecord = async (id: number) => {
    await db.history.delete(id);
    loadRecords();
    if (selectedRecord()?.id === id) {
      setSelectedRecord(null);
    }
  };

  const handleClearAll = async () => {
    await db.history.clear();
    loadRecords();
    setSelectedRecord(null);
  };

  // Export JSON file
  const exportJSON = () => {
    try {
      const dataStr = JSON.stringify(records(), null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trwm_download_history_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(t('history.export_failed'), 'error');
    }
  };

  // Export CSV file
  const exportCSV = () => {
    try {
      let csvContent = 'Name,Hash,Size,Labels,Added Date,Deleted Date,Ratio,Downloaded,Uploaded\n';
      for (const r of records()) {
        const name = `"${r.name.replace(/"/g, '""')}"`;
        const labels = `"${r.labels.join(',')}"`;
        csvContent += `${name},${r.hash_string},${r.total_size},${labels},${formatTimestamp(
          r.added_date
        )},${formatTimestamp(r.deleted_date)},${r.upload_ratio.toFixed(2)},${r.downloaded_ever},${
          r.uploaded_ever
        }\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trwm_download_history_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(t('history.export_failed'), 'error');
    }
  };

  return (
    <Show when={showHistoryModal()}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeHistoryModal}>
        <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
            <h2 class="m-0 text-base font-bold text-foreground">{t('history.title')}</h2>
            <button class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={closeHistoryModal}>
              <X size={20} />
            </button>
          </div>

          <div class="flex-1 flex overflow-hidden">
            {/* History Table Column */}
            <div class="flex-[2] flex flex-col border-r border-border/50 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-secondary/20 shrink-0">
                <input
                  type="text"
                  class="flex-1 h-8 px-3 text-[13px] bg-background/50 border border-border/80 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all"
                  placeholder={t('history.search_placeholder')}
                  value={search()}
                  onInput={(e) => setSearch(e.currentTarget.value)}
                />
                <select
                  class="h-8 px-2 text-[13px] bg-background/50 border border-border/80 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all cursor-pointer"
                  value={statusFilter()}
                  onChange={(e) => setStatusFilter(e.currentTarget.value)}
                >
                  <option value="all">{t('sidebar.status_all')}</option>
                  <option value="downloading">{t('status.downloading')}</option>
                  <option value="seeding">{t('status.seeding')}</option>
                  <option value="stopped">{t('status.stopped')}</option>
                  <option value="error">{t('sidebar.status_error')}</option>
                  <option value="deleted">{t('dialog.delete.title')}</option>
                </select>
                <Show when={selectedCount() > 0}>
                  <button class="flex items-center gap-1.5 bg-background border border-border/80 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={copySelectedMagnetLinks} title={t('history.copy_selected_magnet')}>
                    <Link size={14} />
                    <span>{t('history.copy_magnet')}</span>
                    <span class="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{selectedCount()}</span>
                  </button>
                  <button class="flex items-center gap-1.5 bg-background border border-border/80 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={exportSelectedTorrents} title={t('history.export_torrent')}>
                    <Download size={14} />
                    <span>{t('history.export_torrent')}</span>
                    <span class="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{selectedCount()}</span>
                  </button>
                  <button class="flex items-center gap-1.5 bg-background border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={batchDeleteSelected} title={t('history.batch_delete')}>
                    <Trash2 size={14} />
                    <span>{t('history.batch_delete')}</span>
                    <span class="text-[10px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{selectedCount()}</span>
                  </button>
                </Show>
                <Show when={selectedCount() === 0}>
                  <button class="flex items-center gap-1.5 bg-background border border-border/80 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={copyAllMagnetLinks} title={t('history.copy_all_magnet')}>
                    <Copy size={14} />
                    {t('history.copy_magnet')}
                  </button>
                  <button class="bg-background border border-border/80 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={exportJSON}>
                    {t('history.export_json')}
                  </button>
                  <button class="bg-background border border-border/80 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={exportCSV}>
                    {t('history.export_csv')}
                  </button>
                  <button class="bg-background border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" onClick={handleClearAll}>
                    {t('history.clear_all')}
                  </button>
                </Show>
              </div>

              <div class="flex-1 overflow-auto">
                <table class="w-full min-w-max text-left text-[11px] border-collapse table-fixed">
                  <thead>
                    <tr>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm text-center relative group p-0" style={{ width: `${colWidths().select}px` }}>
                        <span class="inline-flex items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors py-1.5 w-full h-full" onClick={toggleSelectAll}>
                          <Show when={allSelected()} fallback={<Square size={13} />}>
                            <CheckSquare size={13} class="text-primary" />
                          </Show>
                        </span>
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'select')} />
                      </th>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold px-2 py-1.5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().name}px` }}>
                        {t('columns.name')}
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'name')} />
                      </th>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold px-2 py-1.5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm relative group whitespace-nowrap overflow-hidden text-ellipsis text-right" style={{ width: `${colWidths().size}px` }}>
                        {t('columns.size')}
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'size')} />
                      </th>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold px-2 py-1.5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm relative group whitespace-nowrap overflow-hidden text-ellipsis text-center" style={{ width: `${colWidths().status}px` }}>
                        {t('columns.status')}
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'status')} />
                      </th>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold px-2 py-1.5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm relative group whitespace-nowrap overflow-hidden text-ellipsis text-right" style={{ width: `${colWidths().ratio}px` }}>
                        {t('columns.ratio')}
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'ratio')} />
                      </th>
                      <th class="bg-secondary/30 text-muted-foreground font-semibold px-2 py-1.5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm relative group whitespace-nowrap overflow-hidden text-ellipsis text-center" style={{ width: `${colWidths().actions}px` }}>
                        {t('history.actions')}
                        <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'actions')} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <Show
                      when={filteredRecords().length > 0}
                      fallback={
                        <tr>
                          <td colspan="6" class="empty-row">
                            {t('history.empty')}
                          </td>
                        </tr>
                      }
                    >
                      <For each={filteredRecords()}>
                        {(rec) => {
                          const isSelected = createMemo(() => selectedIds().has(rec.id!));
                          const isActive = createMemo(() => selectedRecord()?.id === rec.id);
                          return (
                            <tr
                              class={`cursor-pointer border-b border-border/50 transition-colors ${isActive() ? 'bg-primary/10' : isSelected() ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                              onClick={() => setSelectedRecord(rec)}
                            >
                              <td class="px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <span class="inline-flex items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors" onClick={() => toggleSelect(rec.id!)}>
                                  <Show when={isSelected()} fallback={<Square size={13} />}>
                                    <CheckSquare size={13} class="text-primary" />
                                  </Show>
                                </span>
                              </td>
                              <td class="px-2 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis" title={rec.name}>
                                {rec.name}
                              </td>
                              <td class="px-2 py-1.5 font-mono text-right">{formatBytes(rec.total_size)}</td>
                              <td class="px-2 py-1.5 text-center text-[9px] font-bold">
                                {rec.deleted_date > 0 ? (
                                  <span class="text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t('dialog.delete.title')}</span>
                                ) : (rec.error || 0) > 0 ? (
                                  <span class="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">{t('sidebar.status_error')}</span>
                                ) : (
                                  <span
                                    class="px-1.5 py-0.5 rounded border shadow-sm uppercase tracking-wide inline-block whitespace-nowrap"
                                    style={{
                                      color: getStatusColor(rec.status),
                                      'border-color': `color-mix(in srgb, ${getStatusColor(rec.status)} 30%, transparent)`,
                                      'background-color': `color-mix(in srgb, ${getStatusColor(rec.status)} 15%, transparent)`
                                    }}
                                  >
                                    {getStatusText(rec.status)}
                                  </span>
                                )}
                              </td>
                              <td class="px-2 py-1.5 font-mono text-right">{formatRatio(rec.upload_ratio)}</td>
                              <td class="px-2 py-1.5 flex justify-center">
                                <div class="flex items-center gap-1">
                                  <Show when={rec.magnet_link}>
                                    <button
                                      class="inline-flex items-center justify-center px-1 py-0.5 bg-background border border-border/80 text-primary hover:bg-primary/10 hover:border-primary rounded transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(rec.magnet_link!).then(() => {
                                          showToast(t('history.magnet_copied'), 'success');
                                        });
                                      }}
                                      title={t('history.copy_magnet')}
                                    >
                                      <Link size={12} />
                                    </button>
                                  </Show>
                                  <button
                                    class="inline-flex items-center justify-center px-1 py-0.5 bg-background border border-border/80 text-foreground hover:bg-muted hover:border-border rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRecord(rec);
                                    }}
                                    title={t('history.view_detail')}
                                  >
                                    <Info size={13} />
                                  </button>
                                  <button
                                    class="bg-background border border-destructive/30 text-destructive hover:bg-destructive/10 px-1.5 py-0.5 rounded transition-colors flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRecord(rec.id!);
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time slice snapshots details column */}
            <div class="flex-1 min-w-[300px] bg-secondary/10 overflow-y-auto">
              <Show
                when={selectedRecord()}
                fallback={<div class="flex items-center justify-center h-full text-muted-foreground text-[13px]">{t('detail.empty_msg')}</div>}
              >
                {(rec) => (
                  <div class="flex flex-col gap-2 p-6">
                    <h3 class="m-0 mb-3 text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{t('history.detail_info')}</h3>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.name')}:</span>
                      <span class="text-foreground text-right break-all">{rec().name}</span>
                    </div>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.hash')}:</span>
                      <span class="text-foreground text-right break-all font-mono text-xs">{rec().hash_string}</span>
                    </div>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.download_dir')}:</span>
                      <span class="text-foreground text-right break-all">{rec().download_dir}</span>
                    </div>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.downloaded')}:</span>
                      <span class="text-foreground text-right break-all font-mono">{formatBytes(rec().downloaded_ever)}</span>
                    </div>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.uploaded')}:</span>
                      <span class="text-foreground text-right break-all font-mono">{formatBytes(rec().uploaded_ever)}</span>
                    </div>

                    <div class="flex justify-between text-[12px] gap-3 mt-4 border-t border-border/50 pt-3">
                      <span class="text-muted-foreground shrink-0">{t('history.added_at')}:</span>
                      <span class="text-foreground text-right font-mono">{formatTimestamp(rec().added_date)}</span>
                    </div>
                    <Show when={rec().deleted_date > 0}>
                      <div class="flex justify-between text-[12px] gap-3">
                        <span class="text-muted-foreground shrink-0">{t('history.deleted_at')}:</span>
                        <span class="text-foreground text-right font-mono">{formatTimestamp(rec().deleted_date)}</span>
                      </div>
                    </Show>

                    <div class="flex justify-between text-[12px] gap-3 mt-4 border-t border-border/50 pt-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.speed.avg_download')}:</span>
                      <span class="text-success text-right font-mono font-bold">{formatSpeed(rec().avg_rate_download || 0)}</span>
                    </div>
                    <div class="flex justify-between text-[12px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.speed.avg_upload')}:</span>
                      <span class="text-info text-right font-mono font-bold">{formatSpeed(rec().avg_rate_upload || 0)}</span>
                    </div>

                    <Show when={rec().creator}>
                      <div class="flex justify-between text-[12px] gap-3">
                        <span class="text-muted-foreground shrink-0">{t('detail.general.creator')}:</span>
                        <span class="text-foreground text-right break-all">{rec().creator}</span>
                      </div>
                    </Show>
                    <Show when={rec().comment}>
                      <div class="flex justify-between text-[12px] gap-3">
                        <span class="text-muted-foreground shrink-0">{t('detail.general.comment')}:</span>
                        <span class="text-foreground text-right break-all">{rec().comment}</span>
                      </div>
                    </Show>
                    <Show when={rec().magnet_link}>
                      <div class="flex flex-col items-stretch text-[12px] gap-1.5 mt-2">
                        <span class="text-muted-foreground">{t('dialog.add.magnet_link')}:</span>
                        <span class="font-mono text-[11px] break-all bg-background border border-border/50 p-2.5 rounded-lg max-h-[80px] overflow-y-auto text-muted-foreground">{rec().magnet_link}</span>
                      </div>
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>

          <div class="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0">
            <button class="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold py-2 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" onClick={closeHistoryModal}>
              {t('dialog.ok')}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
