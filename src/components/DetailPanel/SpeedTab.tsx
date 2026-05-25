import { Component, createSignal, createEffect } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes, formatSpeed, formatRatio, getRatioClass } from '../../utils/format';
import { t } from '../../utils/i18n';
import './SpeedTab.css';

export const SpeedTab: Component<{ torrent: Torrent }> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;

  // Keep a rolling history of rates inside the active tab
  const [dlHistory, setDlHistory] = createSignal<number[]>(Array(30).fill(0));
  const [ulHistory, setUlHistory] = createSignal<number[]>(Array(30).fill(0));

  // Update history arrays reactively when torrent updates
  createEffect(() => {
    const dl = props.torrent.rate_download || 0;
    const ul = props.torrent.rate_upload || 0;
    
    setDlHistory((prev) => {
      const next = [...prev.slice(1), dl];
      return next;
    });
    setUlHistory((prev) => {
      const next = [...prev.slice(1), ul];
      return next;
    });
  });

  // Handle speed chart drawing reactively
  createEffect(() => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dl = dlHistory();
    const ul = ulHistory();

    const container = canvas.parentElement;
    if (!container) return;

    const w = container.clientWidth || 450;
    const h = 180;

    // Adjust resolution for HD displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 15, right: 15, bottom: 25, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // Color theme variables
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#a1a1aa' : '#52525b';
    const gridColor = isDark ? '#3f3f46' : '#e4e4e7';
    const downloadColor = '#3b82f6';
    const uploadColor = '#22c55e';

    // Find max value in history to scale graph y-axis
    let maxVal = 0;
    for (let i = 0; i < dl.length; i++) {
      if (dl[i] > maxVal) maxVal = dl[i];
      if (ul[i] > maxVal) maxVal = ul[i];
    }
    // Set a minimum threshold to avoid extremely small y-axis labels
    maxVal = Math.max(maxVal, 1024 * 10); // 10 KB/s min max
    maxVal = Math.ceil(maxVal / 1024) * 1024; // Align to KB

    // Draw Grid Lines & Y-axis speed labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';

    const gridLines = 4;
    for (let g = 0; g <= gridLines; g++) {
      const gy = padding.top + chartH * (1 - g / gridLines);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, gy);
      ctx.lineTo(w - padding.right, gy);
      ctx.stroke();

      const labelVal = (maxVal * g) / gridLines;
      ctx.fillText(formatSpeed(labelVal, 0), padding.left - 8, gy + 4);
    }

    // Function to draw line & smooth gradient area
    const drawLine = (data: number[], color: string, gradientColor: string) => {
      if (data.length < 2) return;
      const step = chartW / (data.length - 1);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * step;
        const y = padding.top + chartH * (1 - data[i] / maxVal);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Create beautiful smooth fill under line
      ctx.lineTo(padding.left + (data.length - 1) * step, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, gradientColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    // Draw Download Area & Line
    drawLine(dl, downloadColor, 'rgba(59, 130, 246, 0.15)');

    // Draw Upload Area & Line
    drawLine(ul, uploadColor, 'rgba(34, 197, 94, 0.15)');
  });

  return (
    <div class="trwm-speed-tab">
      <div class="speed-tab-layout">
        <div class="chart-container">
          <canvas ref={canvasRef} style={{ width: '100%', height: '180px', display: 'block' }} />
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-dot download-dot" />
              <span>{t('detail.speed.download')}</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot upload-dot" />
              <span>{t('detail.speed.upload')}</span>
            </div>
          </div>
        </div>

        <div class="speed-stats-grid">
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.speed.current_download')}</span>
            <span class="stat-val active-download">{formatSpeed(props.torrent.rate_download)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.speed.current_upload')}</span>
            <span class="stat-val active-upload">{formatSpeed(props.torrent.rate_upload)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.speed.total_download')}</span>
            <span class="stat-val">{formatBytes(props.torrent.downloaded_ever)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.speed.total_upload')}</span>
            <span class="stat-val">{formatBytes(props.torrent.uploaded_ever)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.speed.ratio')}</span>
            <span class={`stat-val ${getRatioClass(props.torrent.upload_ratio)}`}>
              {formatRatio(props.torrent.upload_ratio)}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-lbl">{t('detail.general.hash')}</span>
            <span class="stat-val text-mono text-xs">{props.torrent.hash_string.substring(0, 8)}...</span>
          </div>
        </div>
      </div>


    </div>
  );
};
