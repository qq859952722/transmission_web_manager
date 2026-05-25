import { type Component, Show, createSignal, createEffect, For } from 'solid-js';
import { closeHistoryModal, showHistoryModal } from '../../store/modalStore';
import { db, type HistoryRecord } from '../../store/db';
import { formatBytes, formatTimestamp, formatRatio, formatSpeed, formatPercent } from '../../utils/format';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './Modals.css';

export const HistoryModal: Component = () => {
  const [records, setRecords] = createSignal<HistoryRecord[]>([]);
  const [search, setSearch] = createSignal('');
  const [selectedRecord, setSelectedRecord] = createSignal<HistoryRecord | null>(null);

  // Load records from Dexie reactively
  const loadRecords = async () => {
    try {
      let list = await db.history.reverse().sortBy('deleted_date');
      // Filter out active, pre-archived torrents (deleted_date is 0)
      list = list.filter((r) => r.deleted_date > 0);
      const query = search().trim().toLowerCase();
      
      if (query) {
        list = list.filter((r) =>
          r.name.toLowerCase().includes(query) ||
          r.hash_string.toLowerCase().includes(query) ||
          r.labels.some((l) => l.toLowerCase().includes(query))
        );
      }
      setRecords(list);
    } catch (e) {
      console.error('Failed to load history records', e);
    }
  };

  // Reload when modal opens or search query changes
  createEffect(() => {
    if (showHistoryModal() || search()) {
      loadRecords();
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
      <div class="trwm-modal-overlay" onClick={closeHistoryModal}>
        <div class="trwm-modal-box xwide" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>{t('history.title')}</h2>
            <button class="close-btn" onClick={closeHistoryModal}>×</button>
          </div>

          <div class="history-dashboard">
            {/* History Table Column */}
            <div class="history-main-panel">
              <div class="history-toolbar">
                <input
                  type="text"
                  class="history-search"
                  placeholder={t('history.search_placeholder')}
                  value={search()}
                  onInput={(e) => setSearch(e.currentTarget.value)}
                />
                <button class="trwm-btn" onClick={exportJSON}>
                  {t('history.export_json')}
                </button>
                <button class="trwm-btn" onClick={exportCSV}>
                  {t('history.export_csv')}
                </button>
                <button class="trwm-btn danger" onClick={handleClearAll}>
                  {t('history.clear_all')}
                </button>
              </div>

              <div class="history-table-container">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>{t('columns.name')}</th>
                      <th width="85">{t('columns.size')}</th>
                      <th width="130">{t('history.deleted_at')}</th>
                      <th width="65">{t('columns.ratio')}</th>
                      <th width="100">{t('history.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Show
                      when={records().length > 0}
                      fallback={
                        <tr>
                          <td colspan="5" class="empty-row">
                            {t('history.empty')}
                          </td>
                        </tr>
                      }
                    >
                      <For each={records()}>
                        {(rec) => (
                          <tr
                            class={selectedRecord()?.id === rec.id ? 'active-row' : ''}
                            onClick={() => setSelectedRecord(rec)}
                          >
                            <td class="selectable-text text-truncate" title={rec.name}>
                              {rec.name}
                            </td>
                            <td class="text-mono text-right">{formatBytes(rec.total_size)}</td>
                            <td class="text-mono text-center">{formatTimestamp(rec.deleted_date)}</td>
                            <td class="text-mono text-right">{formatRatio(rec.upload_ratio)}</td>
                            <td>
                              <div class="actions-cell">
                                <button
                                  class="trwm-btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecord(rec);
                                  }}
                                >
                                  {t('history.view_detail')}
                                </button>
                                <button
                                  class="trwm-btn-sm danger"
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
                        )}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time slice snapshots details column */}
            <div class="history-detail-panel">
              <Show
                when={selectedRecord()}
                fallback={<div class="detail-empty">{t('detail.empty_msg')}</div>}
              >
                {(rec) => (
                  <div class="history-detail-inner">
                    <h3>{t('history.detail_info')}</h3>
                    <div class="detail-group">
                      <span class="lbl">{t('detail.general.name')}:</span>
                      <span class="val selectable-text">{rec().name}</span>
                    </div>
                    <div class="detail-group">
                      <span class="lbl">{t('detail.general.hash')}:</span>
                      <span class="val text-mono text-xs selectable-text">{rec().hash_string}</span>
                    </div>
                    <div class="detail-group">
                      <span class="lbl">{t('detail.general.download_dir')}:</span>
                      <span class="val selectable-text">{rec().download_dir}</span>
                    </div>
                    <div class="detail-group">
                      <span class="lbl">{t('detail.general.downloaded')}:</span>
                      <span class="val text-mono">{formatBytes(rec().downloaded_ever)}</span>
                    </div>
                    <div class="detail-group">
                      <span class="lbl">{t('detail.general.uploaded')}:</span>
                      <span class="val text-mono">{formatBytes(rec().uploaded_ever)}</span>
                    </div>

                    <Show when={rec().creator}>
                      <div class="detail-group">
                        <span class="lbl">{t('detail.general.creator')}:</span>
                        <span class="val selectable-text">{rec().creator}</span>
                      </div>
                    </Show>
                    <Show when={rec().comment}>
                      <div class="detail-group">
                        <span class="lbl">{t('detail.general.comment')}:</span>
                        <span class="val selectable-text">{rec().comment}</span>
                      </div>
                    </Show>
                    <Show when={rec().magnet_link}>
                      <div class="detail-group" style={{ "flex-direction": "column", "align-items": "stretch" }}>
                        <span class="lbl">{t('dialog.add.magnet_link')}:</span>
                        <span class="val text-xs text-mono selectable-text" style={{ "word-break": "break-all", "background": "var(--bg-tertiary)", "padding": "6px", "border-radius": "4px", "max-height": "80px", "overflow-y": "auto", "margin-top": "4px" }}>{rec().magnet_link}</span>
                      </div>
                    </Show>

                    <Show when={rec().snapshots && rec().snapshots.length > 0}>
                      <h4 class="mt-4">{t('history.snapshots')}</h4>
                      <div class="snapshots-container">
                        <table class="snapshots-table">
                          <thead>
                            <tr>
                              <th>{t('history.snapshot_time')}</th>
                              <th width="60">%</th>
                              <th width="80">{t('columns.rate_dl')}</th>
                              <th width="80">{t('columns.rate_ul')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={rec().snapshots}>
                              {(snap) => (
                                <tr>
                                  <td class="text-mono text-xs">
                                    {formatTimestamp(snap.timestamp).substring(11)}
                                  </td>
                                  <td class="text-mono text-right">{formatPercent(snap.percent_done)}</td>
                                  <td class="text-mono text-right active-download">
                                    {snap.rate_download > 0 ? formatSpeed(snap.rate_download) : '-'}
                                  </td>
                                  <td class="text-mono text-right active-upload">
                                    {snap.rate_upload > 0 ? formatSpeed(snap.rate_upload) : '-'}
                                  </td>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>

          <div class="modal-footer">
            <button class="trwm-btn primary" onClick={closeHistoryModal}>
              {t('dialog.ok')}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
