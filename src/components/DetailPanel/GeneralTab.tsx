import { Component, Show, createMemo } from 'solid-js';
import { Torrent } from '../../types/transmission';
import {
  formatBytes,
  formatETA,
  formatPercent,
  formatRatio,
  getStatusText,
  formatTimestamp,
  formatDuration,
  getRatioClass,
  formatSpeed
} from '../../utils/format';
import { t } from '../../utils/i18n';
import './GeneralTab.css';

export const GeneralTab: Component<{ torrents: Torrent[] }> = (props) => {
  const isMulti = () => props.torrents.length > 1;
  const single = () => props.torrents[0];

  // Calculated combined fields for multiple selection
  const multiStats = createMemo(() => {
    if (!isMulti()) return null;
    let total_size = 0;
    let downloaded = 0;
    let rate_download = 0;
    let rate_upload = 0;
    let peers_connected = 0;

    for (const t of props.torrents) {
      total_size += t.total_size;
      downloaded += t.total_size - t.left_until_done;
      rate_download += t.rate_download;
      rate_upload += t.rate_upload;
      peers_connected += t.peers_connected;
    }

    return {
      total_size,
      progress: total_size > 0 ? downloaded / total_size : 0,
      rate_download,
      rate_upload,
      peers_connected,
    };
  });

  return (
    <div class="trwm-general-tab">
      <Show
        when={isMulti()}
        fallback={
          // Single Torrent General View
          <div class="general-grid">
            <div class="info-section">
              <h3>{t('detail.general.pieces_progress')}</h3>
              <div class="info-group">
                <span class="info-label">{t('detail.general.name')}:</span>
                <span class="info-val selectable-text">{single().name}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.hash')}:</span>
                <span class="info-val selectable-text code-font">{single().hash_string}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.id')}:</span>
                <span class="info-val text-mono">{single().id}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.status')}:</span>
                <span class="info-val font-semibold">{getStatusText(single().status)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.progress')}:</span>
                <span class="info-val text-mono">{formatPercent(single().percent_done)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.download_dir')}:</span>
                <span class="info-val selectable-text">{single().download_dir}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.torrent_file')}:</span>
                <span class="info-val selectable-text">{single().torrent_file || '-'}</span>
              </div>
              <Show when={single().primary_mime_type}>
                <div class="info-group">
                  <span class="info-label">{t('detail.general.mime')}:</span>
                  <span class="info-val text-mono">{single().primary_mime_type}</span>
                </div>
              </Show>
              <Show when={single().error_string}>
                <div class="info-group error-text">
                  <span class="info-label">{t('filter.error')}:</span>
                  <span class="info-val selectable-text">{single().error_string}</span>
                </div>
              </Show>
            </div>

            <div class="info-section">
              <h3>{t('stats.title')}</h3>
              <div class="info-group">
                <span class="info-label">{t('detail.general.size')}:</span>
                <span class="info-val text-mono">{formatBytes(single().total_size)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.left')}:</span>
                <span class="info-val text-mono">{formatBytes(single().left_until_done)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.downloaded')}:</span>
                <span class="info-val text-mono">{formatBytes(single().downloaded_ever)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.uploaded')}:</span>
                <span class="info-val text-mono">{formatBytes(single().uploaded_ever)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.ratio')}:</span>
                <span class={`info-val text-mono ${getRatioClass(single().upload_ratio)}`}>
                  {formatRatio(single().upload_ratio)}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.corrupt')}:</span>
                <span class="info-val text-mono">{formatBytes(single().corrupt_ever)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.eta')}:</span>
                <span class="info-val text-mono">{formatETA(single().eta)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.download_time')}:</span>
                <span class="info-val text-mono">{formatDuration(single().seconds_downloading)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.upload_time')}:</span>
                <span class="info-val text-mono">{formatDuration(single().seconds_seeding)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.activity')}:</span>
                <span class="info-val text-mono">{single().activity_date ? formatTimestamp(single().activity_date) : '-'}</span>
              </div>
            </div>

            <div class="info-section">
              <h3>{t('sidebar.status')}</h3>
              <div class="info-group">
                <span class="info-label">{t('detail.general.added_date')}:</span>
                <span class="info-val text-mono">{formatTimestamp(single().added_date)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.done_date')}:</span>
                <span class="info-val text-mono">
                  {single().done_date ? formatTimestamp(single().done_date) : '-'}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.creator')}:</span>
                <span class="info-val selectable-text">{single().creator || '-'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.source')}:</span>
                <span class="info-val selectable-text">{single().source || '-'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.comment')}:</span>
                <span class="info-val selectable-text">{single().comment || '-'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.private')}:</span>
                <span class="info-val">
                  {single().is_private ? t('common.yes') : t('common.no')}
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.piece_count')}:</span>
                <span class="info-val text-mono">{single().piece_count}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.piece_size')}:</span>
                <span class="info-val text-mono">{formatBytes(single().piece_size)}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.file_count')}:</span>
                <span class="info-val text-mono">{single().files?.length ?? single().file_count ?? 0}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('detail.general.sequential')}:</span>
                <span class="info-val">
                  {single().sequential_download ? t('common.yes') : t('common.no')}
                  <Show when={single().sequential_download && single().sequential_download_from_piece > 0}>
                    <span class="text-mono" style={{ "margin-left": "4px", color: "var(--text-muted)" }}>
                      {t('detail.general.sequential_from', { piece: single().sequential_download_from_piece })}
                    </span>
                  </Show>
                </span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('columns.labels')}:</span>
                <span class="info-val selectable-text">{single().labels?.join(', ') || '-'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">{t('dialog.settings.group')}:</span>
                <span class="info-val selectable-text">{single().group || '-'}</span>
              </div>
            </div>
          </div>
        }
      >
        {/* Multi Torrent Summary Grid */}
        <div class="general-grid">
          <div class="info-section">
            <h3>{t('stats.title')}</h3>
            <div class="info-group">
              <span class="info-label">{t('detail.general.size')}:</span>
              <span class="info-val text-mono">{formatBytes(multiStats()!.total_size)}</span>
            </div>
            <div class="info-group">
              <span class="info-label">{t('detail.general.progress')}:</span>
              <span class="info-val text-mono">{formatPercent(multiStats()!.progress)}</span>
            </div>
            <div class="info-group">
              <span class="info-label">{t('detail.general.rate_dl')}:</span>
              <span class="info-val text-mono active-download">
                {formatSpeed(multiStats()!.rate_download)}
              </span>
            </div>
            <div class="info-group">
              <span class="info-label">{t('detail.general.rate_ul')}:</span>
              <span class="info-val text-mono active-upload">
                {formatSpeed(multiStats()!.rate_upload)}
              </span>
            </div>
            <div class="info-group">
              <span class="info-label">{t('detail.peers.title')}:</span>
              <span class="info-val text-mono">{multiStats()!.peers_connected}</span>
            </div>
          </div>
        </div>
      </Show>


    </div>
  );
};
