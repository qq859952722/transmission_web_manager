import { Component, Show, createEffect, onCleanup } from 'solid-js';
import { closeStatsModal, showStatsModal } from '../../store/modalStore';
import { useSession, useSessionStats, useFreeSpace } from '../../api/queries';
import { sidebarCounts, speedHistory } from '../../store/torrentStore';
import { formatBytes, formatSpeed, formatDuration, formatRatio, formatNumber } from '../../utils/format';
import { t } from '../../utils/i18n';
import { X } from 'lucide-solid';

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
        ctx.fillText(t('status.loading'), w / 2, h / 2);
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
      ctx.fillText(t('detail.speed.download'), padding.left + 14, h - 10);

      ctx.fillStyle = uploadColor;
      ctx.fillRect(padding.left + 55, h - 14, 10, 3);
      ctx.fillStyle = textColor;
      ctx.fillText(t('detail.speed.upload'), padding.left + 69, h - 10);
      
      chartAnimFrame = requestAnimationFrame(drawChart);
    };

    chartAnimFrame = requestAnimationFrame(drawChart);

    onCleanup(() => {
      cancelAnimationFrame(chartAnimFrame);
    });
  });

  return (
    <Show when={showStatsModal()}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeStatsModal}>
        <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-6xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
            <h2 class="m-0 text-base font-bold text-foreground">{t('stats.title')}</h2>
            <button class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={closeStatsModal}>
              <X size={20} />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Speed Chart and Global Speed */}
            <div class="bg-secondary/20 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm">
              <h3 class="m-0 mb-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">{t('stats.speed_title')}</h3>
              <div style={{ width: '100%', height: '180px' }}>
                <canvas ref={canvasRef} />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div class="flex justify-between text-[13px] items-center">
                  <span class="text-info font-bold">{t('detail.speed.current_download')}:</span>
                  <strong class="font-mono text-info">{formatSpeed(speedHistory().download[speedHistory().download.length - 1] || 0)}</strong>
                </div>
                <div class="flex justify-between text-[13px] items-center">
                  <span class="text-success font-bold">{t('detail.speed.current_upload')}:</span>
                  <strong class="font-mono text-success">{formatSpeed(speedHistory().upload[speedHistory().upload.length - 1] || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Torrents Status Bar */}
            <div class="bg-secondary/20 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm">
              <h3 class="m-0 mb-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">{t('stats.torrent_stats')}</h3>
              <div class="flex h-4 w-full bg-secondary/50 rounded-full overflow-hidden mt-2 border border-border/30">
                <Show when={sidebarCounts().all > 0}>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().downloading / sidebarCounts().all) * 100}%`, background: 'var(--color-primary-500)' }} title={`Downloading: ${sidebarCounts().downloading}`}>{sidebarCounts().downloading > 0 && (sidebarCounts().downloading / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().downloading : ''}</div>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().seeding / sidebarCounts().all) * 100}%`, background: 'var(--color-success-500)' }} title={`Seeding: ${sidebarCounts().seeding}`}>{sidebarCounts().seeding > 0 && (sidebarCounts().seeding / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().seeding : ''}</div>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().stopped / sidebarCounts().all) * 100}%`, background: '#6b7280' }} title={`Stopped: ${sidebarCounts().stopped}`}>{sidebarCounts().stopped > 0 && (sidebarCounts().stopped / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().stopped : ''}</div>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().checking / sidebarCounts().all) * 100}%`, background: 'var(--color-warning-500)' }} title={`Checking: ${sidebarCounts().checking}`}>{sidebarCounts().checking > 0 && (sidebarCounts().checking / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().checking : ''}</div>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().error / sidebarCounts().all) * 100}%`, background: 'var(--color-danger-500)' }} title={`Error: ${sidebarCounts().error}`}>{sidebarCounts().error > 0 && (sidebarCounts().error / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().error : ''}</div>
                  <div class="flex items-center justify-center text-[9px] font-bold text-white leading-none transition-all duration-300" style={{ width: `${(sidebarCounts().queued / sidebarCounts().all) * 100}%`, background: '#8b5cf6' }} title={`Queued: ${sidebarCounts().queued}`}>{sidebarCounts().queued > 0 && (sidebarCounts().queued / sidebarCounts().all) * 100 >= 5 ? sidebarCounts().queued : ''}</div>
                </Show>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[11px]">
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"var(--color-primary-500)"}} /><span class="text-muted-foreground">{t('status.downloading')}</span><span class="font-bold text-foreground">{sidebarCounts().downloading}</span></div>
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"var(--color-success-500)"}} /><span class="text-muted-foreground">{t('status.seeding')}</span><span class="font-bold text-foreground">{sidebarCounts().seeding}</span></div>
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"#6b7280"}} /><span class="text-muted-foreground">{t('status.stopped')}</span><span class="font-bold text-foreground">{sidebarCounts().stopped}</span></div>
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"var(--color-warning-500)"}} /><span class="text-muted-foreground">{t('status.checking')}</span><span class="font-bold text-foreground">{sidebarCounts().checking}</span></div>
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"var(--color-danger-500)"}} /><span class="text-muted-foreground">{t('filter.error')}</span><span class="font-bold text-foreground">{sidebarCounts().error}</span></div>
                <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style={{"background":"#8b5cf6"}} /><span class="text-muted-foreground">{t('status.download_wait')}</span><span class="font-bold text-foreground">{sidebarCounts().queued}</span></div>
              </div>
            </div>

            <Show when={stats.data} fallback={<div class="flex items-center justify-center h-48 text-muted-foreground text-[13px]">{t('common.loading')}</div>}>
              {/* Session Overview Section */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cumulative Stats */}
                <div class="bg-secondary/20 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm">
                  <h3 class="m-0 mb-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">{t('stats.cumulative_title')}</h3>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.general.downloaded')}:</span>
                    <strong class="font-mono">{formatBytes(stats.data!.cumulative_stats.downloaded_bytes)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.general.uploaded')}:</span>
                    <strong class="font-mono">{formatBytes(stats.data!.cumulative_stats.uploaded_bytes)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.speed.ratio')}:</span>
                    <strong class="font-mono">
                      {formatRatio(
                        stats.data!.cumulative_stats.downloaded_bytes > 0
                          ? stats.data!.cumulative_stats.uploaded_bytes / stats.data!.cumulative_stats.downloaded_bytes
                          : 0
                      )}
                    </strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('stats.file_count')}:</span>
                    <strong class="font-mono">{formatNumber(stats.data!.cumulative_stats.files_added)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.speed.download_time')}:</span>
                    <strong class="font-mono">{formatDuration(stats.data!.cumulative_stats.seconds_active)}</strong>
                  </div>
                </div>

                {/* This Session Stats */}
                <div class="bg-secondary/20 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm">
                  <h3 class="m-0 mb-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">{t('stats.current_title')}</h3>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.general.downloaded')}:</span>
                    <strong class="font-mono">{formatBytes(stats.data!.current_stats.downloaded_bytes)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.general.uploaded')}:</span>
                    <strong class="font-mono">{formatBytes(stats.data!.current_stats.uploaded_bytes)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.speed.ratio')}:</span>
                    <strong class="font-mono">
                      {formatRatio(
                        stats.data!.current_stats.downloaded_bytes > 0
                          ? stats.data!.current_stats.uploaded_bytes / stats.data!.current_stats.downloaded_bytes
                          : 0
                      )}
                    </strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('stats.file_count')}:</span>
                    <strong class="font-mono">{formatNumber(stats.data!.current_stats.files_added)}</strong>
                  </div>
                  <div class="flex justify-between text-[13px] items-center">
                    <span class="text-muted-foreground">{t('detail.speed.download_time')}:</span>
                    <strong class="font-mono">{formatDuration(stats.data!.current_stats.seconds_active)}</strong>
                  </div>
                </div>
              </div>

              {/* Core Environment Specs */}
              <div class="bg-secondary/20 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm w-full">
                <h3 class="m-0 mb-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">{t('stats.sys_info')}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.about.version')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.version || '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.rpc_semver')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.rpc_version_semver || session.data?.rpc_version || '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.config_dir')}:</span>
                    <strong class="text-foreground text-xs font-mono break-all">{session.data?.config_dir || '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.add.download_dir')}:</span>
                    <strong class="text-foreground text-xs font-mono break-all">{session.data?.download_dir || '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('stats.free_space')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{freeSpace.data !== undefined && freeSpace.data !== null ? formatBytes(freeSpace.data) : '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.listen_port')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.peer_port || '-'}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.port_forwarding')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.port_forwarding_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.dht')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.dht_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.pex')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.pex_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.lpd')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.lpd_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('dialog.settings.utp')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.utp_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                  <div class="flex flex-col gap-1.5 text-[12px]">
                    <span class="text-muted-foreground font-medium">{t('toolbar.alt_speed')}:</span>
                    <strong class="text-foreground text-[13px] font-mono">{session.data?.alt_speed_enabled ? t('dialog.settings.enabled') : t('dialog.settings.disabled')}</strong>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          <div class="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0">
            <button class="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold py-2 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" onClick={closeStatsModal}>
              {t('dialog.ok')}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
