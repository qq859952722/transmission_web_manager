import { Component, createMemo, createEffect, Show, createSignal } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes } from '../../utils/format';
import { t } from '../../utils/i18n';
import { rpcCall } from '../../api/rpc';
import { showToast } from '../../utils/toast';
import { selectedIds } from '../../store/torrentStore';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-solid';

export const PiecesTab: Component<{ torrent: Torrent }> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; pieceIndex: number } | null>(null);

  const pieceStats = createMemo(() => {
    const torrent = props.torrent;
    if (!torrent.pieces || !torrent.piece_count || torrent.piece_count <= 0) {
      return null;
    }

    try {
      const raw = atob(torrent.pieces);
      const pieceStates: boolean[] = [];
      let completed = 0;
      let bitIndex = 0;

      for (let i = 0; i < raw.length && bitIndex < torrent.piece_count; i++) {
        const byte = raw.charCodeAt(i);
        for (let bit = 7; bit >= 0 && bitIndex < torrent.piece_count; bit--) {
          const done = ((byte >> bit) & 1) === 1;
          pieceStates.push(done);
          if (done) completed++;
          bitIndex++;
        }
      }

      const percent = torrent.piece_count > 0 ? (completed / torrent.piece_count) * 100 : 0;
      return {
        states: pieceStates,
        availability: torrent.availability || [],
        completed,
        percent,
        cols: 0,
      };
    } catch (e) {
      console.error('Failed to parse pieces bitfield', e);
      return null;
    }
  });

  function getPieceColor(done: boolean, av: number | undefined, pendingColor: string): string {
    if (done || av === -1) return '#3b82f6'; // Blue
    if (av === undefined) return pendingColor; 
    if (av === 0) return '#ef4444'; // Red
    if (av === 1) return '#f59e0b'; // Amber
    if (av <= 3) return '#84cc16'; // Lime
    return '#22c55e'; // Green
  }

  let layoutInfo = { cols: 1, cellSize: 8, gap: 1, step: 9 };

  createEffect(() => {
    const stats = pieceStats();
    const canvas = canvasRef;
    if (!stats || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pieceCount = props.torrent.piece_count;
    const canvasWidth = canvas.clientWidth || 450;

    const cellSize = pieceCount > 8000 ? 5 : pieceCount > 3000 ? 6 : 8;
    const gap = 1;
    const step = cellSize + gap;
    const cols = Math.max(Math.floor(canvasWidth / step), 1);
    const rowCount = Math.ceil(pieceCount / cols);
    const canvasHeight = rowCount * step;

    layoutInfo = { cols, cellSize, gap, step };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    const styles = getComputedStyle(document.documentElement);
    const pendingColor = styles.getPropertyValue('--muted').trim() || '#27272a';

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < stats.states.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * step;
      const y = row * step;
      const av = stats.availability[i];
      ctx.fillStyle = getPieceColor(stats.states[i], av, pendingColor);
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    const fromPiece = props.torrent.sequential_download_from_piece;
    if (props.torrent.sequential_download && fromPiece > 0 && fromPiece < pieceCount) {
      const markerCol = fromPiece % cols;
      const markerRow = Math.floor(fromPiece / cols);
      const mx = markerCol * step;
      const my = markerRow * step;
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx, my + cellSize);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText(`▶ ${fromPiece}`, mx + step, my + cellSize);
    }
  });

  function handleCanvasClick(e: MouseEvent) {
    const canvas = canvasRef;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.clientWidth / rect.width;
    const scaleY = canvas.clientHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const { cols, step } = layoutInfo;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    const pieceIndex = row * cols + col;

    if (pieceIndex < 0 || pieceIndex >= props.torrent.piece_count) return;

    setContextMenu({ x: e.clientX, y: e.clientY, pieceIndex });
  }

  async function setFromPiece(pieceIndex: number) {
    const ids = selectedIds();
    if (ids.length === 0) return;
    try {
      await rpcCall('torrent_set', { ids, sequential_download: true, sequential_download_from_piece: pieceIndex });
      showToast(t('detail.pieces.from_piece_set'), 'success');
    } catch (err) {
      showToast(t('common.operation_failed'), 'error');
    }
    setContextMenu(null);
  }

  async function clearFromPiece() {
    const ids = selectedIds();
    if (ids.length === 0) return;
    try {
      await rpcCall('torrent_set', { ids, sequential_download_from_piece: 0 });
      showToast(t('detail.pieces.from_piece_cleared'), 'success');
    } catch (err) {
      showToast(t('common.operation_failed'), 'error');
    }
    setContextMenu(null);
  }

  return (
    <div class="flex flex-col gap-2.5 h-full">
      <Show
        when={pieceStats()}
        fallback={
          <div class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
            <Search size={48} stroke-width={1.5} class="opacity-50" />
            <span class="text-sm font-medium">{t('detail.pieces.no_data')}</span>
          </div>
        }
      >
        <div class="grid grid-cols-3 gap-2 bg-secondary/50 rounded-xl py-1.5 px-2 border border-border shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <span class="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">{t('detail.general.piece_size')}</span>
            <span class="font-mono text-xs text-foreground font-bold leading-none">{formatBytes(props.torrent.piece_size)}</span>
          </div>
          <div class="flex flex-col items-center justify-center border-l border-r border-border">
            <span class="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">{t('detail.general.piece_count')}</span>
            <span class="font-mono text-xs text-foreground font-bold leading-none">{props.torrent.piece_count}</span>
          </div>
          <div class="flex flex-col items-center justify-center">
            <span class="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">{t('detail.general.pieces_done')}</span>
            <span class="font-mono text-xs text-primary font-bold leading-none">{pieceStats()!.completed}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
            <div class="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: `${pieceStats()!.percent}%` }} />
          </div>
          <span class="font-mono text-xs font-medium w-12 text-right">{pieceStats()!.percent.toFixed(1)}%</span>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500" />{t('detail.pieces.completed')}</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500" />{t('detail.pieces.plentiful')}</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-lime-500" />{t('detail.pieces.moderate')}</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500" />{t('detail.pieces.rare')}</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500" />{t('detail.pieces.no_copies')}</div>
        </div>

        <div class="flex-1 min-h-0 bg-background border border-border rounded-lg overflow-auto relative">
          <canvas ref={canvasRef} class="block w-full h-auto cursor-crosshair" onClick={handleCanvasClick} />
        </div>
      </Show>

      <Show when={contextMenu()}>
        {(cm) => (
          <div class="fixed inset-0 z-[9999]" onClick={() => setContextMenu(null)}>
            <div
              class="absolute bg-popover/90 backdrop-blur-xl border border-border rounded-lg shadow-xl p-1 min-w-[200px] flex flex-col text-popover-foreground text-xs animate-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
              style={{ left: `${Math.min(cm().x, window.innerWidth - 200)}px`, top: `${Math.min(cm().y, window.innerHeight - 150)}px` }}
            >
              <div class="px-2 py-1.5 font-bold border-b border-border text-muted-foreground">
                {t('detail.pieces.piece_num').replace('{n}', String(cm().pieceIndex))}
              </div>
              <div class="px-2 py-1.5">
                <span class="text-muted-foreground">{t('detail.general.status')}: </span>
                {pieceStats()?.states[cm().pieceIndex] ? t('detail.general.pieces_done') : t('detail.general.pieces_pending')}
              </div>
              <Show when={pieceStats()?.availability[cm().pieceIndex] !== undefined}>
                <div class="px-2 py-1.5 pt-0">
                  <span class="text-muted-foreground">{t('detail.pieces.availability')}: </span>
                  {(() => {
                    const av = pieceStats()?.availability[cm().pieceIndex];
                    return av !== undefined && av < 0 ? t('detail.pieces.availability_none') : String(av);
                  })()}
                </div>
              </Show>
              <div class="h-px bg-border my-1 mx-1" />
              <div class="px-2 py-1.5 hover:bg-muted cursor-pointer rounded-sm text-primary font-medium" onClick={() => setFromPiece(cm().pieceIndex)}>
                {t('detail.pieces.set_from_piece')}
              </div>
              <div class="px-2 py-1.5 hover:bg-muted cursor-pointer rounded-sm" onClick={clearFromPiece}>
                {t('detail.pieces.clear_from_piece')}
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
