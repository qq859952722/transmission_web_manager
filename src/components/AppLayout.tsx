import { Component, JSX, createSignal, onCleanup } from 'solid-js';
import './AppLayout.css';

interface AppLayoutProps {
  sidebar: JSX.Element;
  toolbar: JSX.Element;
  main: JSX.Element;
  bottomPanel?: JSX.Element;
}

export const AppLayout: Component<AppLayoutProps> = (props) => {
  const [panelHeight, setPanelHeight] = createSignal(280);
  const [isDragging, setIsDragging] = createSignal(false);

  const MIN_HEIGHT = 120;
  const MAX_HEIGHT = 600;

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startY = e.clientY;
    const startHeight = panelHeight();

    const handleMouseMove = (ev: MouseEvent) => {
      // Dragging down = panel grows (startY - ev.clientY is negative when moving down)
      const delta = startY - ev.clientY;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div class="trwm-app-layout">
      <aside class="trwm-sidebar">
        {props.sidebar}
      </aside>
      <div class="trwm-content">
        <header class="trwm-toolbar">
          {props.toolbar}
        </header>
        <main class="trwm-main">
          {props.main}
        </main>
        {props.bottomPanel && (
          <>
            <div
              class={`trwm-resize-handle ${isDragging() ? 'active' : ''}`}
              onMouseDown={handleMouseDown}
            />
            <footer
              class="trwm-bottom-panel"
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
