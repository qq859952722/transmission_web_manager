import { createSignal, onCleanup } from 'solid-js';
import { createPersistedSignal } from '../utils/persist';

export interface ColumnWidth {
  id: string;
  width: number;
}

export function createResizableColumns(
  persistKey: string,
  defaultWidths: ColumnWidth[],
  minWidth = 30,
  maxWidth = 500
) {
  const [persistedWidths, setPersistedWidths] = createPersistedSignal<Record<string, number>>(
    persistKey,
    defaultWidths.reduce((acc, col) => ({ ...acc, [col.id]: col.width }), {} as Record<string, number>)
  );

  // In-memory widths for fast updates during drag; synced to persisted on mouseup
  const [widths, setWidths] = createSignal<Record<string, number>>(persistedWidths());

  const [resizingCol, setResizingCol] = createSignal<string | null>(null);
  let startX = 0;
  let startWidth = 0;

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      return e.touches.length > 0 ? e.touches[0].clientX : (e as TouchEvent).changedTouches[0].clientX;
    }
    return (e as MouseEvent).clientX;
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    const colId = resizingCol();
    if (!colId) return;

    requestAnimationFrame(() => {
      const deltaX = getClientX(e) - startX;
      let newWidth = startWidth + deltaX;
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;

      setWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    });
  };

  const handleResizeEnd = () => {
    setResizingCol(null);
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    window.removeEventListener('touchmove', handleResizeMove);
    window.removeEventListener('touchend', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    // Persist widths only on mouseup/touchend (debounced from every frame)
    setPersistedWidths(widths());
  };

  const handleMouseDown = (e: MouseEvent | TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setResizingCol(id);
    startX = getClientX(e);
    startWidth = widths()[id] || defaultWidths.find(c => c.id === id)?.width || minWidth;

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, { passive: false });
    window.addEventListener('touchend', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDoubleClick = (id: string) => {
    const defaultWidth = defaultWidths.find(c => c.id === id)?.width ?? 150;
    setWidths(prev => ({ ...prev, [id]: defaultWidth }));
    setPersistedWidths(prev => ({ ...prev, [id]: defaultWidth }));
  };

  onCleanup(() => {
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    window.removeEventListener('touchmove', handleResizeMove);
    window.removeEventListener('touchend', handleResizeEnd);
  });

  return { widths, setWidths, handleMouseDown, handleDoubleClick, resizingCol };
}
