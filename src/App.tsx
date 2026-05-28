import { Component, createSignal, Show, onMount, onCleanup, lazy, ErrorBoundary } from 'solid-js';
import { createPersistedSignal } from './utils/persist';
import { UploadCloud } from 'lucide-solid';
import { AppLayout } from './components/AppLayout';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { TorrentTable } from './components/TorrentTable/TorrentTable';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { ToastContainer } from './components/ToastContainer';
import { ContextMenu } from './components/ContextMenu';
import { LabelDialog } from './components/LabelDialog';
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
  openDeleteModal, openAddModal, setDroppedFiles, openSettingsModal,
  showSettingsModal, showDeleteModal, showHistoryModal, showStatsModal, showAddModal
} from './store/modalStore';
import { t } from './utils/i18n';
import { showToast } from './utils/toast';

const App: Component = () => {
  // UI Panels states (persisted to localStorage)
  const [sidebarOpen, setSidebarOpen] = createPersistedSignal('trwm-sidebar-open', true);
  const [detailOpen, setDetailOpen] = createPersistedSignal('trwm-detail-open', false);

  // Label dialog state
  const [showLabelDialog, setShowLabelDialog] = createSignal(false);

  // Drag-and-drop visual feedback
  const [dragOver, setDragOver] = createSignal(false);
  let dragCounter = 0;

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
    geoip.init((success) => { if (!success) console.warn('GeoIP initialization failed'); });
    startPolling(2000, () => detailOpen()); // Polling every 2s, full fields when detail open

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
      dragCounter++;
      setDragOver(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) setDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setDragOver(false);

      // Reject drop when any modal is open
      if (showSettingsModal() || showDeleteModal() || showHistoryModal() || showStatsModal() || showAddModal() || showLabelDialog() || promptConfig().open) {
        return;
      }

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const torrentFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.torrent')) {
          torrentFiles.push(file);
        }
      }

      if (torrentFiles.length > 0) {
        setDroppedFiles(torrentFiles);
        if (!showAddModal()) openAddModal();
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

  const openLabelDialog = () => {
    setShowLabelDialog(true);
  };

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Drag-and-drop visual overlay */}
      <Show when={dragOver()}>
        <div class="fixed inset-0 z-[9999] pointer-events-none bg-primary/10 border-4 border-dashed border-primary/40 flex items-center justify-center backdrop-blur-sm">
          <div class="bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl">
            <UploadCloud size={32} class="inline-block mr-3 -mt-1" />
            {t('dialog.add.title')}
          </div>
        </div>
      </Show>
      <ErrorBoundary fallback={(err) => (
        <div class="flex items-center justify-center h-full">
          <div class="text-center p-8">
            <p class="text-destructive text-lg font-medium">Something went wrong</p>
            <p class="text-muted-foreground text-sm mt-2">{err.message}</p>
            <button class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      )}>
      {/* App Skeleton Layout */}
      <AppLayout
        sidebarOpen={sidebarOpen()}
        sidebar={<Sidebar />}
        toolbar={
          <Toolbar
            sidebarOpen={sidebarOpen()}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen())}
            detailOpen={detailOpen()}
            onToggleDetail={() => setDetailOpen(!detailOpen())}
          />
        }
        main={
          <ContextMenu
            onOpenLabelDialog={openLabelDialog}
            onPrompt={openPrompt}
          >
            <TorrentTable
              onSelect={handleRowSelect}
              onContextMenu={() => {}}
            />
          </ContextMenu>
        }
        bottomPanel={
          <Show when={detailOpen()}>
            <DetailPanel onClose={() => setDetailOpen(false)} />
          </Show>
        }
      />

      {/* Bottom Status bar */}
      <div class="h-7 shrink-0">
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

      {/* Label Dialog */}
      <LabelDialog
        open={showLabelDialog()}
        onClose={() => setShowLabelDialog(false)}
      />

      </ErrorBoundary>
    </div>
  );
};

export default App;
