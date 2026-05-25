import { Component, createSignal, Show, onMount, onCleanup, lazy } from 'solid-js';
import { createPersistedSignal } from './utils/persist';
import { AppLayout } from './components/AppLayout';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { TorrentTable } from './components/TorrentTable/TorrentTable';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { ToastContainer } from './components/ToastContainer';
import { ContextMenu } from './components/ContextMenu';
import { LabelDialog } from './components/LabelDialog';
import './components/Toast.css';
import './App.css';
import * as geoip from './utils/geoip';

// Modals - eagerly loaded (small or always needed)
import { AddTorrentModal } from './components/Modals/AddTorrentModal';
import { DeleteTorrentModal } from './components/Modals/DeleteTorrentModal';
import { PromptModal } from './components/Modals/PromptModal';

// Modals - lazy loaded (large, only needed when opened)
const StatsModal = lazy(() => import('./components/Modals/StatsModal').then(m => ({ default: m.StatsModal })));
const HistoryModal = lazy(() => import('./components/Modals/HistoryModal').then(m => ({ default: m.HistoryModal })));
const GlobalConfigModal = lazy(() => import('./components/Modals/GlobalConfigModal').then(m => ({ default: m.GlobalConfigModal })));

// State & Actions
import {
  startPolling,
  stopPolling,
  selectedIds,
  fetchTorrents,
  selectAll,
  clearSelection
} from './store/torrentStore';
import { 
  openDeleteModal, openAddModal, setDroppedFile, openSettingsModal,
  showSettingsModal, showDeleteModal, showHistoryModal, showStatsModal, showAddModal
} from './store/modalStore';
import { t } from './utils/i18n';
import { showToast } from './utils/toast';

const App: Component = () => {
  // UI Panels states (persisted to localStorage)
  const [sidebarOpen, setSidebarOpen] = createPersistedSignal('trwm-sidebar-open', true);
  const [detailOpen, setDetailOpen] = createPersistedSignal('trwm-detail-open', false);

  // Custom Context Menu state
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });

  // Label dialog state
  const [showLabelDialog, setShowLabelDialog] = createSignal(false);

  // Prompt modal state
  type PromptCfg = {
    open: boolean;
    title: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: 'text' | 'number';
    onConfirm: (value: string) => void;
  };
  const [promptConfig, setPromptConfig] = createSignal<PromptCfg>({ open: false, title: '', onConfirm: () => {} });

  const openPrompt = (cfg: Omit<PromptCfg, 'open'>) => {
    setPromptConfig({ ...cfg, open: true });
  };
  const closePrompt = () => {
    setPromptConfig((prev) => ({ ...prev, open: false }));
  };

  onMount(() => {
    geoip.init(() => {});
    startPolling(2000); // Polling every 2s

    // Close context menu on any document click
    const closeMenu = () => setShowContextMenu(false);
    window.addEventListener('click', closeMenu);

    // Global keyboard shortcuts
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'F5') {
        e.preventDefault();
        fetchTorrents(true);
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openAddModal();
      } else if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openSettingsModal();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Escape') {
        clearSelection();
        setShowContextMenu(false);
      } else if (e.key === 'Delete') {
        const ids = selectedIds();
        if (ids.length > 0) {
          openDeleteModal();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Global drag and drop listeners
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if any modal is open to prevent drop zone conflicts
      if (showSettingsModal() || showDeleteModal() || showHistoryModal() || showStatsModal() || showAddModal() || showLabelDialog() || promptConfig().open) {
        return;
      }

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      let torrentFile: File | null = null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.torrent')) {
          torrentFile = file;
          break;
        }
      }

      if (torrentFile) {
        setDroppedFile(torrentFile);
        openAddModal();
      } else {
        showToast(t('dialog.add.no_torrent_file'), 'warning');
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    onCleanup(() => {
      stopPolling();
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    });
  });

  const handleRowSelect = (id: number) => {
    // Automatically open detail panel when user selects a torrent if it's closed
    if (selectedIds().length > 0) {
      setDetailOpen(true);
    }
  };

  const handleContextMenu = (e: MouseEvent, ids: number[]) => {
    e.preventDefault();
    // Calculate position to prevent menu from going off-screen
    const menuWidth = 180;
    const menuHeight = 500; // approximate max height
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;
    if (x < 0) x = 8;
    if (y < 0) y = 8;
    setContextMenuPos({ x, y });
    setShowContextMenu(true);
  };

  const openLabelDialog = () => {
    setShowLabelDialog(true);
  };

  return (
    <div class="trwm-app-root">
      {/* App Skeleton Layout */}
      <AppLayout
        sidebar={
          <Show when={sidebarOpen()}>
            <Sidebar />
          </Show>
        }
        toolbar={
          <Toolbar
            sidebarOpen={sidebarOpen()}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen())}
            detailOpen={detailOpen()}
            onToggleDetail={() => setDetailOpen(!detailOpen())}
          />
        }
        main={
          <TorrentTable
            onSelect={handleRowSelect}
            onContextMenu={handleContextMenu}
          />
        }
        bottomPanel={
          <Show when={detailOpen()}>
            <DetailPanel onClose={() => setDetailOpen(false)} />
          </Show>
        }
      />

      {/* Bottom Status bar */}
      <div class="trwm-statusbar-container">
        <StatusBar />
      </div>

      {/* Mounting all modals */}
      <ToastContainer />
      <AddTorrentModal />
      <DeleteTorrentModal />
      <StatsModal />
      <HistoryModal />
      <GlobalConfigModal />
      <PromptModal
        open={promptConfig().open}
        title={promptConfig().title}
        label={promptConfig().label}
        placeholder={promptConfig().placeholder}
        defaultValue={promptConfig().defaultValue}
        inputType={promptConfig().inputType}
        onConfirm={promptConfig().onConfirm}
        onCancel={closePrompt}
      />

      {/* Context Menu */}
      <Show when={showContextMenu()}>
        <ContextMenu
          x={contextMenuPos().x}
          y={contextMenuPos().y}
          onClose={() => setShowContextMenu(false)}
          onOpenLabelDialog={openLabelDialog}
          onPrompt={openPrompt}
        />
      </Show>

      {/* Label Dialog */}
      <LabelDialog
        open={showLabelDialog()}
        onClose={() => setShowLabelDialog(false)}
      />

    </div>
  );
};

export default App;
