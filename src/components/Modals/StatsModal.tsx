import { Component, Show, createEffect, onCleanup } from 'solid-js';
import { closeStatsModal, showStatsModal } from '../../store/modalStore';
import { useSession, useSessionStats, useFreeSpace } from '../../api/queries';
import { sidebarCounts, speedHistory } from '../../store/torrentStore';
import { formatBytes, formatSpeed, formatDuration, formatRatio, formatNumber } from '../../utils/format';
import { t } from '../../utils/i18n';
import './Modals.css';

export const StatsModal: Component = () => {
  const session = useSession();
  const stats = useSessionStats();
  const freeSpace = useFreeSpace(() => session.data?.download_dir);

  let canvasRef: HTMLCanvasElement | undefined;
  let chartAnimFrame: number;

  createEffect(() => {
    if (!showStatsModal() || !canvasRef) return;
    
    const drawChart = () => {
      const canvas = canvasRef;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container || container.clientWidth === 0) {
        chartAnimFrame = requestAnimationFrame(drawChart);
        return;
      }

      canvas.width = container.clientWidth;
      canvas.height = 180;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const padding = { top: 10, right: 10, bottom: 24, left: 60 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);

      // Assume theme by checking a known dark mode property (like a body class or just generic fallback)
      const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#a0a0b8' : '#6b7280';
      const gridColor = isDark ? '#353550' : '#e5e7eb';
      const downloadColor = isDark ? '#5b8def' : '#3b82f6';
      const uploadColor = isDark ? '#4ade80' : '#22c55e';

      const history = speedHistory();
      const dlData = history.download || [];
      const ulData = history.upload || [];
      
      if (dlData.length < 2) {
        ctx.fillStyle = textColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('status.loading') || 'Loading...', w / 2, h / 2);
        chartAnimFrame = requestAnimationFrame(drawChart);
        return;
      }

      let maxVal = 0;
      for (let i = 0; i < dlData.length; i++) {
        if (dlData[i] > maxVal) maxVal = dlData[i];
        if (ulData[i] > maxVal) maxVal = ulData[i];
      }
      maxVal = Math.max(maxVal, 1024);

      // Nice max calculation
      const magnitude = Math.pow(1024, Math.floor(Math.log(maxVal) / Math.log(1024)));
      const normalized = maxVal / magnitude;
      const nice = [1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1024];
      let niceMax = Math.pow(1024, Math.ceil(Math.log(maxVal) / Math.log(1024)));
      for (let i = 0; i < nice.length; i++) {
        if (normalized <= nice[i]) {
          niceMax = nice[i] * magnitude;
          break;
        }
      }

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let g = 0; g <= 4; g++) {
        const gy = padding.top + chartH * (1 - g / 4);
        ctx.beginPath();
        ctx.moveTo(padding.left, gy);
        ctx.lineTo(w - padding.right, gy);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatSpeed(niceMax * g / 4), padding.left - 4, gy + 3);
      }

      const drawLine = (data: number[], color: string) => {
        if (data.length < 2) return;
        const step = chartW / (data.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < data.length; i++) {
          const x = padding.left + i * step;
          const y = padding.top + chartH * (1 - data[i] / niceMax);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = color + '1a'; // 10% opacity
        ctx.moveTo(padding.left, padding.top + chartH);
        for (let j = 0; j < data.length; j++) {
          const x2 = padding.left + j * step;
          const y2 = padding.top + chartH * (1 - data[j] / niceMax);
          ctx.lineTo(x2, y2);
        }
        ctx.lineTo(padding.left + (data.length - 1) * step, padding.top + chartH);
        ctx.closePath();
        ctx.fill();
      };

      drawLine(dlData, downloadColor);
      drawLine(ulData, uploadColor);

      ctx.fillStyle = downloadColor;
      ctx.fillRect(padding.left, h - 14, 10, 3);
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(t('detail.speed.download') || 'Download', padding.left + 14, h - 10);

      ctx.fillStyle = uploadColor;
      ctx.fillRect(padding.left + 55, h - 14, 10, 3);
      ctx.fillStyle = textColor;
      ctx.fillText(t('detail.speed.upload') || 'Upload', padding.left + 69, h - 10);
      
      chartAnimFrame = requestAnimationFrame(drawChart);
    };

    chartAnimFrame = requestAnimationFrame(drawChart);

    onCleanup(() => {
      cancelAnimationFrame(chartAnimFrame);
    });
  });

  return (
    <Show when={showStatsModal()}>
      <div class="trwm-modal-overlay" onClick={closeStatsModal}>
        <div class="trwm-modal-box xwide" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>{t('stats.title')}</h2>
            <button class="close-btn" onClick={closeStatsModal}>×</button>
          </div>

          <div class="stats-dashboard">
            {/* Speed Chart and Global Speed */}
            <div class="stats-card-sec">
              <h3>{t('stats.speed_title') || 'Speed History'}</h3>
              <div style={{ width: '100%', height: '180px' }}>
                <canvas ref={canvasRef}></canvas>
              </div>
              <div class="form-grid-2col" style={{ "margin-top": "12px" }}>
                <div class="stats-group-row">
                  <span class="text-info font-bold">{t('detail.speed.current_download') || 'Current Download'}:</span>
                  <strong class="text-mono text-info">{formatSpeed(speedHistory().download[speedHistory().download.length - 1] || 0)}</strong>
                </div>
                <div class="stats-group-row">
                  <span class="text-success font-bold">{t('detail.speed.current_upload') || 'Current Upload'}:</span>
                  <strong class="text-mono text-success">{formatSpeed(speedHistory().upload[speedHistory().upload.length - 1] || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Torrents Status Bar */}
            <div class="stats-card-sec">
              <h3>{t('stats.torrent_stats') || 'Torrent Statistics'}</h3>
              <div class="status-bar-chart">
                <Show when={sidebarCounts().all > 0}>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().downloading / sidebarCounts().all) * 100}%`, background: 'var(--color-primary-500)' }} title={`Downloading: ${sidebarCounts().downloading}`}>{sidebarCounts().downloading > 0 && (sidebarCounts().downloading / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().downloading : ''}</div>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().seeding / sidebarCounts().all) * 100}%`, background: 'var(--color-success-500)' }} title={`Seeding: ${sidebarCounts().seeding}`}>{sidebarCounts().seeding > 0 && (sidebarCounts().seeding / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().seeding : ''}</div>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().stopped / sidebarCounts().all) * 100}%`, background: '#6b7280' }} title={`Stopped: ${sidebarCounts().stopped}`}>{sidebarCounts().stopped > 0 && (sidebarCounts().stopped / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().stopped : ''}</div>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().checking / sidebarCounts().all) * 100}%`, background: 'var(--color-warning-500)' }} title={`Checking: ${sidebarCounts().checking}`}>{sidebarCounts().checking > 0 && (sidebarCounts().checking / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().checking : ''}</div>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().error / sidebarCounts().all) * 100}%`, background: 'var(--color-danger-500)' }} title={`Error: ${sidebarCounts().error}`}>{sidebarCounts().error > 0 && (sidebarCounts().error / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().error : ''}</div>
                  <div class="status-bar-segment" style={{ width: `${(sidebarCounts().queued / sidebarCounts().all) * 100}%`, background: '#8b5cf6' }} title={`Queued: ${sidebarCounts().queued}`}>{sidebarCounts().queued > 0 && (sidebarCounts().queued / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().queued : ''}</div>
                </Show>
              </div>
              <div class="status-legend">
                <div class="legend-item"><div class="legend-color" style="background:var(--color-primary-500)"></div><span class="legend-label">{t('status.downloading')}</span><span class="legend-value">{sidebarCounts().downloading}</span></div>
                <div class="legend-item"><div class="legend-color" style="background:var(--color-success-500)"></div><span class="legend-label">{t('status.seeding')}</span><span class="legend-value">{sidebarCounts().seeding}</span></div>
                <div class="legend-item"><div class="legend-color" style="background:#6b7280"></div><span class="legend-label">{t('status.stopped')}</span><span class="legend-value">{sidebarCounts().stopped}</span></div>
                <div class="legend-item"><div class="legend-color" style="background:var(--color-warning-500)"></div><span class="legend-label">{t('status.checking')}</span><span class="legend-value">{sidebarCounts().checking}</span></div>
                <div class="legend-item"><div class="legend-color" style="background:var(--color-danger-500)"></div><span class="legend-label">{t('filter.error')}</span><span class="legend-value">{sidebarCounts().error}</span></div>
                <div class="legend-item"><div class="legend-color" style="background:#8b5cf6"></div><span class="legend-label">{t('status.download_wait')}</span><span class="legend-value">{sidebarCounts().queued}</span></div>
              </div>
            </div>

            <Show when={stats.data} fallback={<div class="modal-loading">{t('common.loading')}</div>}>
              {/* Session Overview Section */}
              <div class="stats-grid-cols">
                {/* Cumulative Stats */}
                <div class="stats-card-sec">
                  <h3>{t('stats.cumulative_title')}</h3>
                  <div class="stats-group-row">
                    <span>{t('detail.general.downloaded')}:</span>
                    <strong class="text-mono">{formatBytes(stats.data!.cumulative_stats.downloaded_bytes)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.general.uploaded')}:</span>
                    <strong class="text-mono">{formatBytes(stats.data!.cumulative_stats.uploaded_bytes)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.speed.ratio')}:</span>
                    <strong class="text-mono">
                      {formatRatio(
                        stats.data!.cumulative_stats.downloaded_bytes > 0
                          ? stats.data!.cumulative_stats.uploaded_bytes / stats.data!.cumulative_stats.downloaded_bytes
                          : 0
                      )}
                    </strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('stats.file_count') || 'Files Added'}:</span>
                    <strong class="text-mono">{formatNumber(stats.data!.cumulative_stats.files_added)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.speed.download_time')}:</span>
                    <strong class="text-mono">{formatDuration(stats.data!.cumulative_stats.seconds_active)}</strong>
                  </div>
                </div>

                {/* This Session Stats */}
                <div class="stats-card-sec">
                  <h3>{t('stats.current_title')}</h3>
                  <div class="stats-group-row">
                    <span>{t('detail.general.downloaded')}:</span>
                    <strong class="text-mono">{formatBytes(stats.data!.current_stats.downloaded_bytes)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.general.uploaded')}:</span>
                    <strong class="text-mono">{formatBytes(stats.data!.current_stats.uploaded_bytes)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.speed.ratio')}:</span>
                    <strong class="text-mono">
                      {formatRatio(
                        stats.data!.current_stats.downloaded_bytes > 0
                          ? stats.data!.current_stats.uploaded_bytes / stats.data!.current_stats.downloaded_bytes
                          : 0
                      )}
                    </strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('stats.file_count') || 'Files Added'}:</span>
                    <strong class="text-mono">{formatNumber(stats.data!.current_stats.files_added)}</strong>
                  </div>
                  <div class="stats-group-row">
                    <span>{t('detail.speed.download_time')}:</span>
                    <strong class="text-mono">{formatDuration(stats.data!.current_stats.seconds_active)}</strong>
                  </div>
                </div>
              </div>

              {/* Core Environment Specs */}
              <div class="stats-card-sec full-width">
                <h3>{t('stats.sys_info')}</h3>
                <div class="sys-info-grid">
                  <div class="sys-info-item">
                    <span>{t('dialog.about.version')}:</span>
                    <strong class="text-mono">{session.data?.version || '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.rpc_semver')}:</span>
                    <strong class="text-mono">{session.data?.rpc_version_semver || session.data?.rpc_version || '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.config_dir') || 'Config Dir'}:</span>
                    <strong class="text-xs text-mono selectable-text">{session.data?.config_dir || '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.add.download_dir')}:</span>
                    <strong class="text-xs text-mono selectable-text">{session.data?.download_dir || '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('stats.free_space') || 'Free Space'}:</span>
                    <strong class="text-mono">{freeSpace.data !== undefined && freeSpace.data !== null ? formatBytes(freeSpace.data) : '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.listen_port') || 'Peer Port'}:</span>
                    <strong class="text-mono">{session.data?.peer_port || '-'}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.port_forwarding') || 'Port Forwarding'}:</span>
                    <strong class="text-mono">{session.data?.port_forwarding_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.dht') || 'DHT'}:</span>
                    <strong class="text-mono">{session.data?.dht_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.pex') || 'PEX'}:</span>
                    <strong class="text-mono">{session.data?.pex_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.lpd') || 'LPD'}:</span>
                    <strong class="text-mono">{session.data?.lpd_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('dialog.settings.utp') || 'uTP'}:</span>
                    <strong class="text-mono">{session.data?.utp_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="sys-info-item">
                    <span>{t('toolbar.alt_speed') || 'Alt Speed'}:</span>
                    <strong class="text-mono">{session.data?.alt_speed_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          <div class="modal-footer">
            <button class="trwm-btn primary" onClick={closeStatsModal}>
              {t('dialog.ok')}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
