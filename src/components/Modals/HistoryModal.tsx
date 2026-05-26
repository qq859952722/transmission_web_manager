import { type Component, Show, createSignal, createEffect, For, createMemo } from 'solid-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { closeHistoryModal, showHistoryModal } from '../../store/modalStore';
import { db, type HistoryRecord } from '../../store/db';
import { createResizableColumns } from '../../hooks/createResizableColumns';
import { formatBytes, formatTimestamp, formatRatio, formatSpeed, getStatusColor, getStatusText } from '../../utils/format';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { Copy, Link, CheckSquare, Square, Trash2, Download, Info, FileJson, FileSpreadsheet } from 'lucide-solid';
import { Select } from '../ui/select';
import { Tooltip } from '../ui/tooltip';
import { cn } from '../../lib/utils';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const fallbackCopy = (text: string) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
};

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

  const statusOptions = createMemo(() => [
    { value: 'all', label: t('sidebar.status_all') },
    { value: 'downloading', label: t('status.downloading') },
    { value: 'seeding', label: t('status.seeding') },
    { value: 'stopped', label: t('status.stopped') },
    { value: 'error', label: t('sidebar.status_error') },
    { value: 'deleted', label: t('dialog.delete.title') },
  ]);

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

  const copyMagnetLinks = async (recs: HistoryRecord[]) => {
    const links = recs
      .filter((r) => r.magnet_link)
      .map((r) => r.magnet_link!);
    if (links.length === 0) {
      showToast(t('history.no_magnet_links'), 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(links.join('\n'));
      showToast(t('history.copied_magnet_links', { n: links.length }), 'success');
    } catch {
      fallbackCopy(links.join('\n'));
      showToast(t('history.copied_magnet_links', { n: links.length }), 'success');
    }
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
    const links = withMagnets.map((r) => r.magnet_link!).join('\n');
    const blob = new Blob([links], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'magnet_links.txt';
    a.click();
    URL.revokeObjectURL(url);
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
      const list = await db.history.reverse().sortBy('added_date');
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

  const handleOpenChange = (open: boolean) => {
    if (!open) closeHistoryModal();
  };

  return (
    <Dialog open={showHistoryModal()} onOpenChange={handleOpenChange}>
      <DialogContent class="p-0 overflow-hidden sm:rounded-3xl w-full max-w-6xl h-[85vh] border border-border bg-background shadow-2xl flex flex-col">
        <DialogHeader class="px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
          <DialogTitle>{t('history.title')}</DialogTitle>
        </DialogHeader>

        <div class="flex-1 flex overflow-hidden">
          {/* History Table Column */}
          <div class="flex-[2] flex flex-col border-r border-border/50 overflow-hidden">
            <div class="flex items-center px-4 py-3 border-b border-border/50 bg-secondary/10 shrink-0 justify-between">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  class="w-[200px] h-8 px-3 text-[13px] bg-background border border-border/80 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all"
                  placeholder={t('history.search_placeholder')}
                  value={search()}
                  onInput={(e) => setSearch(e.currentTarget.value)}
                />
                <Select
                  options={statusOptions()}
                  optionValue="value"
                  optionTextValue="label"
                  value={statusOptions().find((o) => o.value === statusFilter())}
                  onChange={(v: any) => v && setStatusFilter(v.value ?? v)}
                  itemComponent={(props: any) => {
                    return <span class="text-sm">{props.item.label}</span>;
                  }}
                  renderValue={(v: any) => {
                    return <span class="text-sm">{v?.label ?? String(v)}</span>;
                  }}
                  triggerClass="w-[140px] h-8 bg-background border-border/80"
                />
              </div>

              <div class="flex items-center gap-1.5 ml-auto">
                <Show when={selectedCount() > 0}>
                  <Tooltip text={t('history.copy_selected_magnet')}>
                    <button class="relative flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={copySelectedMagnetLinks}>
                      <Link size={15} />
                      <span class="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-primary text-primary-foreground px-1 py-0 rounded-full min-w-[14px] text-center shadow-sm">{selectedCount()}</span>
                    </button>
                  </Tooltip>
                  <Tooltip text={t('history.export_torrent')}>
                    <button class="relative flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={exportSelectedTorrents}>
                      <Download size={15} />
                    </button>
                  </Tooltip>
                  <Tooltip text={t('history.batch_delete')}>
                    <button class="relative flex items-center justify-center w-8 h-8 bg-background border border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 rounded-lg transition-colors" onClick={batchDeleteSelected}>
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </Show>

                <Show when={selectedCount() === 0}>
                  <Tooltip text={t('history.copy_all_magnet')}>
                    <button class="flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={copyAllMagnetLinks}>
                      <Copy size={15} />
                    </button>
                  </Tooltip>
                  <div class="w-px h-5 bg-border/50 mx-1"></div>
                  <Tooltip text={t('history.export_json')}>
                    <button class="flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={exportJSON}>
                      <FileJson size={15} />
                    </button>
                  </Tooltip>
                  <Tooltip text={t('history.export_csv')}>
                    <button class="flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={exportCSV}>
                      <FileSpreadsheet size={15} />
                    </button>
                  </Tooltip>
                  <div class="w-px h-5 bg-border/50 mx-1"></div>
                  <button class="flex items-center gap-1.5 bg-background border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors" onClick={handleClearAll}>
                    <Trash2 size={13} />
                    {t('history.clear_all')}
                  </button>
                </Show>
              </div>
            </div>

            <div class="flex-1 overflow-auto bg-muted/10 p-4">
              <Show
                when={filteredRecords().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-60 mt-20">
                    <Info size={48} stroke-width={1.5} />
                    <span class="text-base font-medium">{t('history.empty')}</span>
                  </div>
                }
              >
                <div class="flex flex-col gap-2.5 min-w-[700px]">
                  {/* Header */}
                  <div class="flex items-center px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-muted/10 backdrop-blur-md z-10 border-b border-border/40 pb-3 mb-1">
                    <div class="w-[40px] flex justify-center">
                      <span class="inline-flex items-center justify-center cursor-pointer hover:text-primary transition-colors" onClick={toggleSelectAll}>
                        <Show when={allSelected()} fallback={<Square size={14} />}>
                          <CheckSquare size={14} class="text-primary" />
                        </Show>
                      </span>
                    </div>
                    <div class="flex-1 min-w-[200px] px-2">{t('columns.name')}</div>
                    <div class="w-[100px] text-right px-2">{t('columns.size')}</div>
                    <div class="w-[120px] text-center px-2">{t('columns.status')}</div>
                    <div class="w-[80px] text-right px-2">{t('columns.ratio')}</div>
                    <div class="w-[120px] text-center px-2">{t('history.actions')}</div>
                  </div>

                  {/* Items */}
                  <For each={filteredRecords()}>
                    {(rec) => {
                      const isSelected = createMemo(() => selectedIds().has(rec.id!));
                      const isActive = createMemo(() => selectedRecord()?.id === rec.id);
                      return (
                        <div
                          class={cn(
                            "flex items-center px-4 py-3 bg-background rounded-xl border transition-all cursor-pointer group shadow-sm hover:shadow-md",
                            isActive() ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5" : isSelected() ? "border-primary/30 bg-primary/5" : "border-border/60 hover:border-border"
                          )}
                          onClick={() => setSelectedRecord(rec)}
                        >
                          <div class="w-[40px] flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <span class="inline-flex items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors" onClick={() => toggleSelect(rec.id!)}>
                              <Show when={isSelected()} fallback={<Square size={16} />}>
                                <CheckSquare size={16} class="text-primary" />
                              </Show>
                            </span>
                          </div>
                          
                          <div class="flex-1 min-w-[200px] px-2 whitespace-nowrap overflow-hidden text-ellipsis font-medium text-[13px] text-foreground" title={rec.name}>
                            {rec.name}
                          </div>
                          
                          <div class="w-[100px] text-right px-2 font-mono text-[12px] text-muted-foreground">
                            {formatBytes(rec.total_size)}
                          </div>
                          
                          <div class="w-[120px] flex justify-center px-2">
                            {rec.deleted_date > 0 ? (
                              <span class="text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">{t('dialog.delete.title')}</span>
                            ) : (rec.error || 0) > 0 ? (
                              <span class="text-destructive bg-destructive/10 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">{t('sidebar.status_error')}</span>
                            ) : (
                              <span
                                class="px-2.5 py-1 rounded-md border shadow-sm text-[10px] font-bold uppercase tracking-wider inline-block whitespace-nowrap"
                                style={{
                                  color: getStatusColor(rec.status),
                                  'border-color': hexToRgba(getStatusColor(rec.status), 0.3),
                                  'background-color': hexToRgba(getStatusColor(rec.status), 0.1)
                                }}
                              >
                                {getStatusText(rec.status)}
                              </span>
                            )}
                          </div>
                          
                          <div class="w-[80px] text-right px-2 font-mono text-[12px] text-muted-foreground">
                            {formatRatio(rec.upload_ratio)}
                          </div>
                          
                          <div class="w-[120px] flex justify-center px-2">
                            <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Show when={rec.magnet_link}>
                                <Tooltip text={t('history.copy_magnet')}>
                                  <button
                                    class="inline-flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-all shadow-sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await navigator.clipboard.writeText(rec.magnet_link!);
                                        showToast(t('history.magnet_copied'), 'success');
                                      } catch {
                                        fallbackCopy(rec.magnet_link!);
                                        showToast(t('history.magnet_copied'), 'success');
                                      }
                                    }}
                                  >
                                    <Link size={14} />
                                  </button>
                                </Tooltip>
                              </Show>
                              <Tooltip text={t('history.view_detail')}>
                                <button
                                  class={cn("inline-flex items-center justify-center w-8 h-8 bg-background border border-border/80 text-foreground hover:bg-muted rounded-lg transition-all shadow-sm", isActive() && "bg-primary/20 border-primary/50 text-primary")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecord(rec);
                                  }}
                                >
                                  <Info size={15} />
                                </button>
                              </Tooltip>
                              <Tooltip text={t('history.delete')}>
                                <button
                                  class="inline-flex items-center justify-center w-8 h-8 bg-background border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRecord(rec.id!);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          </div>

          {/* Time slice snapshots details column */}
          <div class="flex-1 min-w-[320px] bg-muted/20 border-l border-border/50 overflow-y-auto">
            <Show
              when={selectedRecord()}
              fallback={
                <div class="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <Info size={40} class="opacity-20" />
                  <span class="text-sm font-medium">{t('detail.empty_msg')}</span>
                </div>
              }
            >
              {(rec) => (
                <div class="flex flex-col gap-4 p-5">
                  <div class="bg-background rounded-xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                    <h3 class="m-0 mb-1 text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5"><Info size={12}/> {t('history.detail_info')}</h3>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.name')}:</span>
                      <span class="text-foreground text-right break-all font-medium">{rec().name}</span>
                    </div>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.hash')}:</span>
                      <span class="text-foreground text-right break-all font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">{rec().hash_string}</span>
                    </div>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.download_dir')}:</span>
                      <span class="text-foreground text-right break-all">{rec().download_dir}</span>
                    </div>
                  </div>

                  <div class="bg-background rounded-xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                    <h3 class="m-0 mb-1 text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">{t('stats.title')}</h3>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.downloaded')}:</span>
                      <span class="text-foreground text-right break-all font-mono">{formatBytes(rec().downloaded_ever)}</span>
                    </div>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.general.uploaded')}:</span>
                      <span class="text-foreground text-right break-all font-mono">{formatBytes(rec().uploaded_ever)}</span>
                    </div>
                    <div class="flex justify-between text-[13px] gap-3 border-t border-border/40 pt-2.5 mt-0.5">
                      <span class="text-muted-foreground shrink-0">{t('detail.speed.avg_download')}:</span>
                      <span class="text-success text-right font-mono font-bold">{formatSpeed(rec().avg_rate_download || 0)}</span>
                    </div>
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('detail.speed.avg_upload')}:</span>
                      <span class="text-info text-right font-mono font-bold">{formatSpeed(rec().avg_rate_upload || 0)}</span>
                    </div>
                  </div>

                  <div class="bg-background rounded-xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                    <div class="flex justify-between text-[13px] gap-3">
                      <span class="text-muted-foreground shrink-0">{t('history.added_at')}:</span>
                      <span class="text-foreground text-right font-mono">{formatTimestamp(rec().added_date)}</span>
                    </div>
                    <Show when={rec().deleted_date > 0}>
                      <div class="flex justify-between text-[13px] gap-3 border-t border-border/40 pt-2.5 mt-0.5">
                        <span class="text-muted-foreground shrink-0">{t('history.deleted_at')}:</span>
                        <span class="text-foreground text-right font-mono">{formatTimestamp(rec().deleted_date)}</span>
                      </div>
                    </Show>
                  </div>

                  <Show when={rec().creator || rec().comment || rec().magnet_link}>
                    <div class="bg-background rounded-xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                      <Show when={rec().creator}>
                        <div class="flex justify-between text-[13px] gap-3">
                          <span class="text-muted-foreground shrink-0">{t('detail.general.creator')}:</span>
                          <span class="text-foreground text-right break-all">{rec().creator}</span>
                        </div>
                      </Show>
                      <Show when={rec().comment}>
                        <div class="flex flex-col text-[13px] gap-1.5">
                          <span class="text-muted-foreground">{t('detail.general.comment')}:</span>
                          <span class="text-foreground break-all bg-muted/40 p-2.5 rounded-lg border border-border/40 text-sm">{rec().comment}</span>
                        </div>
                      </Show>
                      <Show when={rec().magnet_link}>
                        <div class="flex flex-col items-stretch text-[13px] gap-1.5">
                          <span class="text-muted-foreground">{t('dialog.add.magnet_link')}:</span>
                          <span class="font-mono text-[11px] break-all bg-muted/40 border border-border/50 p-2.5 rounded-lg max-h-[80px] overflow-y-auto text-muted-foreground select-all">{rec().magnet_link}</span>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  <Show when={rec().files && rec().files!.length > 0}>
                    <div class="bg-background rounded-xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                      <h4 class="text-[13px] font-bold text-muted-foreground">{t('tabs.files')}</h4>
                      <div class="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                        <For each={rec().files}>
                          {(file) => (
                            <div class="flex justify-between items-center text-[12px] p-2 bg-muted/20 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
                              <span class="truncate pr-3 font-medium flex-1 text-foreground" title={file.name}>{file.name}</span>
                              <span class="font-mono text-muted-foreground whitespace-nowrap">{formatBytes(file.length)}</span>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </div>

        <DialogFooter class="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0">
          <button class="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold py-2 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" onClick={closeHistoryModal}>
            {t('dialog.ok')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
