import { Component, JSX, Show, createSignal, onCleanup } from 'solid-js';
import { cn } from '../lib/utils';

interface AppLayoutProps {
  sidebar: JSX.Element;
  sidebarOpen: boolean;
  toolbar: JSX.Element;
  main: JSX.Element;
  bottomPanel?: JSX.Element;
}

export const AppLayout: Component<AppLayoutProps> = (props) => {
  const [panelHeight, setPanelHeight] = createSignal(280);
  const [isDragging, setIsDragging] = createSignal(false);

  const MIN_HEIGHT = 120;
  const MAX_HEIGHT = 600;

  let currentMouseMove: ((ev: MouseEvent) => void) | null = null;
  let currentMouseUp: (() => void) | null = null;

  onCleanup(() => {
    if (currentMouseMove) document.removeEventListener('mousemove', currentMouseMove);
    if (currentMouseUp) document.removeEventListener('mouseup', currentMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startY = e.clientY;
    const startHeight = panelHeight();

    const handleMouseMove = (ev: MouseEvent) => {
      // Dragging up = panel grows (delta = startY - ev.clientY is positive when moving up)
      const delta = startY - ev.clientY;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      currentMouseMove = null;
      currentMouseUp = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    currentMouseMove = handleMouseMove;
    currentMouseUp = handleMouseUp;

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div class="flex h-screen w-screen overflow-hidden">
      <Show when={props.sidebarOpen}>
        <aside class="flex flex-col shrink-0 w-60 bg-secondary/20 border-r border-border/50">
          {props.sidebar}
        </aside>
      </Show>
      <div class="flex flex-1 flex-col min-w-0">
        <header class="flex shrink-0 items-center h-12 bg-background border-b border-border/50 px-4">
          {props.toolbar}
        </header>
        <main class="flex-1 relative overflow-hidden bg-background">
          {props.main}
        </main>
        {props.bottomPanel && (
          <>
            <div
              class={cn(
                "relative shrink-0 h-1.5 cursor-ns-resize bg-transparent transition-colors group",
                isDragging() ? "bg-primary/10" : "hover:bg-primary/5"
              )}
              onMouseDown={handleMouseDown}
            >
              <div class={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[3px] rounded-sm transition-all duration-200",
                isDragging() ? "bg-primary opacity-100" : "bg-border/80 opacity-0 group-hover:opacity-100"
              )} />
            </div>
            <footer
              class="flex flex-col shrink-0 overflow-hidden bg-background border-t border-border/50"
              style={{ height: `${panelHeight()}px` }}
            >
              {props.bottomPanel}
            </footer>
          </>
        )}
      </div>
    </div>
  );
};
