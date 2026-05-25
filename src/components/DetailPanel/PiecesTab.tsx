import { Component, createMemo, createEffect, Show, createSignal } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes } from '../../utils/format';
import { t } from '../../utils/i18n';
import { rpcCall } from '../../api/rpc';
import { showToast } from '../../utils/toast';
import { selectedIds } from '../../store/torrentStore';

export const PiecesTab: Component<{ torrent: Torrent }> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; pieceIndex: number } | null>(null);

  // Calculate piece stats with availability
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
        cols: 0, // will be set in createEffect
      };
    } catch (e) {
      console.error('Failed to parse pieces bitfield', e);
      return null;
    }
  });

  // Get piece color based on state and availability
  // availability: -1 = we have this piece, 0 = no peer has it, >0 = N peers have it
  function getPieceColor(done: boolean, av: number | undefined, pendingColor: string): string {
    if (done || av === -1) return '#3b82f6'; // Blue - completed (we have it)
    if (av === undefined) return pendingColor; // Unknown / not yet requested
    if (av === 0) return '#ef4444'; // Red - no copies available from peers
    if (av === 1) return '#f59e0b'; // Amber - rare
    if (av <= 3) return '#84cc16'; // Lime - moderate
    return '#22c55e'; // Green - plentiful
  }

  // Store current layout info for click detection
  let layoutInfo = { cols: 1, cellSize: 8, gap: 1, step: 9 };

  // Handle canvas drawing reactively
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

    // Store for click detection
    layoutInfo = { cols, cellSize, gap, step };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    const styles = getComputedStyle(document.documentElement);
    const pendingColor = styles.getPropertyValue('--bg-tertiary').trim() || '#e4e4e7';

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw each piece with availability coloring
    for (let i = 0; i < stats.states.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * step;
      const y = row * step;
      const av = stats.availability[i];
      ctx.fillStyle = getPieceColor(stats.states[i], av, pendingColor);
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    // Draw sequential download marker line
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

      // Label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText(`▶ ${fromPiece}`, mx + step, my + cellSize);
    }
  });

  // Handle canvas click - show context menu for piece
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

    // Close any existing menu
    setContextMenu({ x: e.clientX, y: e.clientY, pieceIndex });
  }

  // Set sequential download from piece
  async function setFromPiece(pieceIndex: number) {
    const ids = selectedIds();
    if (ids.length === 0) return;
    try {
      await rpcCall('torrent_set', {
        ids,
        sequential_download: true,
        sequential_download_from_piece: pieceIndex,
      });
      showToast(t('detail.pieces.from_piece_set'), 'success');
    } catch (err) {
      showToast(t('common.operation_failed'), 'error');
    }
    setContextMenu(null);
  }

  // Clear sequential download from piece
  async function clearFromPiece() {
    const ids = selectedIds();
    if (ids.length === 0) return;
    try {
      await rpcCall('torrent_set', {
        ids,
        sequential_download_from_piece: 0,
      });
      showToast(t('detail.pieces.from_piece_cleared'), 'success');
    } catch (err) {
      showToast(t('common.operation_failed'), 'error');
    }
    setContextMenu(null);
  }

  // Close context menu on outside click
  function handleOverlayClick() {
    setContextMenu(null);
  }

  return (
    <div class="trwm-pieces-tab">
      <Show
        when={pieceStats()}
        fallback={
          <div class="empty-pieces">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t('detail.pieces.no_data')}</span>
          </div>
        }
      >
        <div class="pieces-stats-row">
          <span>
            {t('detail.general.piece_size')}:{' '}
            <strong>{formatBytes(props.torrent.piece_size)}</strong>
          </span>
          <span>
            {t('detail.general.piece_count')}:{' '}
            <strong>{props.torrent.piece_count}</strong>
          </span>
          <span>
            {t('detail.general.pieces_done')}:{' '}
            <strong>{pieceStats()!.completed}</strong>
          </span>
        </div>

        <div class="pieces-progress-row">
          <div class="pieces-progress-track">
            <div
              class="pieces-progress-fill"
              style={{ width: `${pieceStats()!.percent}%` }}
            />
          </div>
          <span class="pieces-progress-pct text-mono">
            {pieceStats()!.percent.toFixed(1)}%
          </span>
        </div>

        {/* Availability color legend */}
        <div class="pieces-legend">
          <div class="pieces-legend-item">
            <span class="pieces-legend-dot" style={{ background: '#3b82f6' }} />
            <span>{t('detail.pieces.completed')}</span>
          </div>
          <div class="pieces-legend-item">
            <span class="pieces-legend-dot" style={{ background: '#22c55e' }} />
            <span>{t('detail.pieces.plentiful')}</span>
          </div>
          <div class="pieces-legend-item">
            <span class="pieces-legend-dot" style={{ background: '#84cc16' }} />
            <span>{t('detail.pieces.moderate')}</span>
          </div>
          <div class="pieces-legend-item">
            <span class="pieces-legend-dot" style={{ background: '#f59e0b' }} />
            <span>{t('detail.pieces.rare')}</span>
          </div>
          <div class="pieces-legend-item">
            <span class="pieces-legend-dot" style={{ background: '#ef4444' }} />
            <span>{t('detail.pieces.no_copies')}</span>
          </div>
        </div>

        <div class="pieces-canvas-frame">
          <canvas
            ref={canvasRef}
            class="pieces-canvas"
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
            onClick={handleCanvasClick}
          />
        </div>
      </Show>

      {/* Context menu for piece interaction */}
      <Show when={contextMenu()}>
        {(cm) => (
          <div class="piece-menu-overlay" onClick={handleOverlayClick}>
            <div
              class="piece-context-menu"
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${Math.min(cm().x, window.innerWidth - 200)}px`,
                top: `${Math.min(cm().y, window.innerHeight - 150)}px`,
              }}
            >
              <div class="piece-menu-header">
                {t('detail.pieces.piece_num').replace('{n}', String(cm().pieceIndex))}
              </div>
              <div class="piece-menu-info">
                {t('detail.general.status')}:{' '}
                {pieceStats()?.states[cm().pieceIndex]
                  ? t('detail.general.pieces_done')
                  : t('detail.general.pieces_pending')}
              </div>
              <Show when={pieceStats()?.availability[cm().pieceIndex] !== undefined}>
                <div class="piece-menu-info">
                  {t('detail.pieces.availability')}:{' '}
                  {(() => {
                    const av = pieceStats()?.availability[cm().pieceIndex];
                    return av !== undefined && av < 0 ? t('detail.pieces.availability_none') : String(av);
                  })()}
                </div>
              </Show>
              <div class="piece-menu-divider" />
              <div class="piece-menu-item primary" onClick={() => setFromPiece(cm().pieceIndex)}>
                {t('detail.pieces.set_from_piece')}
              </div>
              <div class="piece-menu-item" onClick={clearFromPiece}>
                {t('detail.pieces.clear_from_piece')}
              </div>
            </div>
          </div>
        )}
      </Show>

      <style>{`
        .trwm-pieces-tab {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
        }
        .empty-pieces {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          gap: 12px;
          padding: 24px;
        }
        .empty-pieces .empty-icon {
          width: 48px;
          height: 48px;
        }
        .pieces-stats-row {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .pieces-stats-row strong {
          color: var(--text-primary);
        }
        .pieces-progress-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .pieces-progress-track {
          flex: 1;
          height: 12px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .pieces-progress-fill {
          height: 100%;
          background-color: var(--color-primary-500);
          border-radius: var(--radius-sm);
          transition: width 0.3s ease;
        }
        .pieces-progress-pct {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 45px;
          text-align: right;
        }
        .pieces-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .pieces-legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pieces-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .pieces-canvas-frame {
          flex: 1;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          overflow-y: auto;
          min-height: 150px;
        }
        .pieces-canvas {
          image-rendering: pixelated;
        }
        /* Context menu */
        .piece-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
        }
        .piece-context-menu {
          position: fixed;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 4px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          font-size: 12px;
          min-width: 180px;
          z-index: 10000;
        }
        .piece-menu-header {
          padding: 4px 12px;
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 4px;
        }
        .piece-menu-info {
          padding: 3px 12px;
          color: var(--text-secondary);
        }
        .piece-menu-divider {
          border-top: 1px solid var(--border-color);
          margin: 4px 0;
        }
        .piece-menu-item {
          padding: 6px 12px;
          cursor: pointer;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .piece-menu-item:hover {
          background: var(--bg-tertiary);
        }
        .piece-menu-item.primary {
          color: var(--color-primary-500);
        }
      `}</style>
    </div>
  );
};
