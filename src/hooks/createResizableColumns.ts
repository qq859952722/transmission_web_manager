import { createSignal, onCleanup } from 'solid-js';
import { createPersistedSignal } from '../utils/persist';

export interface ColumnWidth {
  id: string;
  width: number;
}

export function createResizableColumns(
  persistKey: string,
  defaultWidths: ColumnWidth[],
  minWidth = 30
) {
  const [widths, setWidths] = createPersistedSignal<Record<string, number>>(
    persistKey,
    defaultWidths.reduce((acc, col) => ({ ...acc, [col.id]: col.width }), {} as Record<string, number>)
  );

  const [resizingCol, setResizingCol] = createSignal<string | null>(null);
  let startX = 0;
  let startWidth = 0;

  const handleMouseDown = (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setResizingCol(id);
    startX = e.clientX;
    startWidth = widths()[id] || defaultWidths.find(c => c.id === id)?.width || minWidth;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    const colId = resizingCol();
    if (!colId) return;

    requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;
      if (newWidth < minWidth) newWidth = minWidth;

      setWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    });
  };

  const handleMouseUp = () => {
    setResizingCol(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  return { widths, setWidths, handleMouseDown, resizingCol };
}
