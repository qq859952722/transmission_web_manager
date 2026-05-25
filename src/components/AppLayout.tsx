import { Component, JSX } from 'solid-js';
import './AppLayout.css';

interface AppLayoutProps {
  sidebar: JSX.Element;
  toolbar: JSX.Element;
  main: JSX.Element;
  bottomPanel?: JSX.Element;
}

export const AppLayout: Component<AppLayoutProps> = (props) => {
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
          <footer class="trwm-bottom-panel">
            {props.bottomPanel}
          </footer>
        )}
      </div>
    </div>
  );
};
