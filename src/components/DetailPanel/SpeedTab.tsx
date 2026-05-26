import { Component, createSignal, createEffect } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes, formatSpeed, formatRatio, getRatioClass } from '../../utils/format';
import { t } from '../../utils/i18n';
import { cn } from '../../lib/utils';

export const SpeedTab: Component<{ torrent: Torrent }> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;

  const [dlHistory, setDlHistory] = createSignal<number[]>(Array(30).fill(0));
  const [ulHistory, setUlHistory] = createSignal<number[]>(Array(30).fill(0));

  createEffect(() => {
    const dl = props.torrent.rate_download || 0;
    const ul = props.torrent.rate_upload || 0;
    
    setDlHistory((prev) => [...prev.slice(1), dl]);
    setUlHistory((prev) => [...prev.slice(1), ul]);
  });

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

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 15, right: 15, bottom: 25, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#a1a1aa' : '#52525b';
    const gridColor = isDark ? '#3f3f46' : '#e4e4e7';
    const downloadColor = '#3b82f6';
    const uploadColor = '#22c55e';

    let maxVal = 0;
    for (let i = 0; i < dl.length; i++) {
      if (dl[i] > maxVal) maxVal = dl[i];
      if (ul[i] > maxVal) maxVal = ul[i];
    }
    maxVal = Math.max(maxVal, 1024 * 10);
    maxVal = Math.ceil(maxVal / 1024) * 1024;

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

      ctx.lineTo(padding.left + (data.length - 1) * step, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, gradientColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    drawLine(dl, downloadColor, 'rgba(59, 130, 246, 0.15)');
    drawLine(ul, uploadColor, 'rgba(34, 197, 94, 0.15)');
  });

  const StatCard = (props: { label: string; value: string; valueClass?: string }) => (
    <div class="flex flex-col gap-0.5 p-3 bg-secondary/50 border border-border rounded-xl shadow-sm text-center">
      <span class="text-[10px] font-bold text-muted-foreground uppercase">{props.label}</span>
      <span class={cn("font-mono font-bold text-foreground", props.valueClass)}>{props.value}</span>
    </div>
  );

  return (
    <div class="flex flex-col gap-4 h-full">
      <div class="flex flex-col gap-3 bg-secondary/50 border border-border rounded-xl p-3 shadow-sm w-full relative">
        <canvas ref={canvasRef} class="block w-full h-[180px]" />
        <div class="absolute top-3 right-3 flex gap-3 text-xs font-medium">
          <div class="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>{t('detail.speed.download')}</span>
          </div>
          <div class="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>{t('detail.speed.upload')}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label={t('detail.speed.current_download')} value={formatSpeed(props.torrent.rate_download)} valueClass="text-primary" />
        <StatCard label={t('detail.speed.current_upload')} value={formatSpeed(props.torrent.rate_upload)} valueClass="text-success" />
        <StatCard label={t('detail.speed.total_download')} value={formatBytes(props.torrent.downloaded_ever)} />
        <StatCard label={t('detail.speed.total_upload')} value={formatBytes(props.torrent.uploaded_ever)} />
        <StatCard label={t('detail.speed.ratio')} value={formatRatio(props.torrent.upload_ratio)} valueClass={getRatioClass(props.torrent.upload_ratio)} />
        <StatCard label={t('detail.general.hash')} value={`${props.torrent.hash_string.substring(0, 8)}...`} valueClass="text-xs text-muted-foreground" />
      </div>
    </div>
  );
};
