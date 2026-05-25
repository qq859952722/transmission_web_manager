import { Component, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { AppLayout } from './components/AppLayout';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { TorrentTable } from './components/TorrentTable/TorrentTable';
import { DetailPanel } from './components/DetailPanel/DetailPanel';
import { ToastContainer } from './components/ToastContainer';
import './components/Toast.css';
import * as geoip from './utils/geoip';

// Modals
import { AddTorrentModal } from './components/Modals/AddTorrentModal';
import { DeleteTorrentModal } from './components/Modals/DeleteTorrentModal';
import { StatsModal } from './components/Modals/StatsModal';
import { HistoryModal } from './components/Modals/HistoryModal';
import { GlobalConfigModal } from './components/Modals/GlobalConfigModal';

// State & Actions
import {
  startPolling,
  stopPolling,
  selectedIds,
  torrentStore,
  startTorrents,
  startNowTorrents,
  pauseTorrents,
  reannounceTorrents,
  verifyTorrents,
  removeTorrents,
  moveQueueUp,
  moveQueueDown,
  moveQueueTop,
  moveQueueBottom,
  fetchTorrents,
  selectAll,
  clearSelection
} from './store/torrentStore';
import { rpcCall } from './api/rpc';
import { openDeleteModal, openAddModal, setDroppedFile, openSettingsModal } from './store/modalStore';
import { t } from './utils/i18n';
import { showToast } from './utils/toast';

const App: Component = () => {
  // UI Panels states
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [detailOpen, setDetailOpen] = createSignal(false);

  // Custom Context Menu state
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });

  // Label dialog state
  const [showLabelDialog, setShowLabelDialog] = createSignal(false);
  const [labelInput, setLabelInput] = createSignal('');

  // Priority submenu state
  const [showPrioritySubmenu, setShowPrioritySubmenu] = createSignal(false);

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

  // Context Menu operations
  const handleRemoveWithData = async () => {
    await removeTorrents(selectedIds(), true);
  };

  const copyHash = () => {
    const hashes = selectedIds()
      .map((id) => torrentStore.items[id]?.hash_string)
      .filter(Boolean);
    if (hashes.length > 0) {
      navigator.clipboard.writeText(hashes.join('\n'));
      showToast(t('status.copied'), 'success');
    }
  };

  const copyMagnet = () => {
    const magnets = selectedIds()
      .map((id) => {
        const t = torrentStore.items[id];
        return t ? `magnet:?xt=urn:btih:${t.hash_string}&dn=${encodeURIComponent(t.name)}` : '';
      })
      .filter(Boolean);
    if (magnets.length > 0) {
      navigator.clipboard.writeText(magnets.join('\n'));
      showToast(t('status.copied'), 'success');
    }
  };

  // Set Labels
  const openLabelDialog = () => {
    const ids = selectedIds();
    if (ids.length > 0) {
      const first = torrentStore.items[ids[0]];
      const labels = first?.labels || [];
      setLabelInput(labels.join(', '));
    } else {
      setLabelInput('');
    }
    setShowLabelDialog(true);
  };

  const confirmLabels = async () => {
    const ids = selectedIds();
    const labels = labelInput()
      .split(',')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    await rpcCall('torrent-set', { ids, labels });
    setShowLabelDialog(false);
    fetchTorrents(true);
  };

  // Set Bandwidth Priority
  const setBandwidthPriority = async (priority: number) => {
    const ids = selectedIds();
    await rpcCall('torrent-set', { ids, bandwidthPriority: priority });
    fetchTorrents(true);
  };

  // Set Download Limit
  const setDownloadLimit = () => {
    const ids = selectedIds();
    const val = prompt(t('context.speed_limit_prompt'));
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        rpcCall('torrent-set', { ids, downloadLimited: true, downloadLimit: num });
        fetchTorrents(true);
      }
    }
  };

  // Set Upload Limit
  const setUploadLimit = () => {
    const ids = selectedIds();
    const val = prompt(t('context.speed_limit_prompt'));
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        rpcCall('torrent-set', { ids, uploadLimited: true, uploadLimit: num });
        fetchTorrents(true);
      }
    }
  };

  // Set Peer Limit
  const setPeerLimit = () => {
    const ids = selectedIds();
    const val = prompt(t('context.peer_limit_prompt'));
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        rpcCall('torrent-set', { ids, peerLimit: num });
        fetchTorrents(true);
      }
    }
  };

  // Change Download Directory
  const changeDownloadDir = () => {
    const ids = selectedIds();
    const first = ids.length > 0 ? torrentStore.items[ids[0]] : null;
    const currentDir = first?.download_dir || '';
    const val = prompt(t('context.dir_prompt'), currentDir);
    if (val !== null && val.trim().length > 0) {
      rpcCall('torrent-set-location', { ids, location: val.trim(), move: true });
      fetchTorrents(true);
    }
  };

  // Sequential Download toggle
  const toggleSequentialDownload = async () => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    const first = torrentStore.items[ids[0]];
    const current = first?.sequential_download ?? false;
    await rpcCall('torrent-set', { ids, sequentialDownload: !current });
    fetchTorrents(true);
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

      {/* Sleek Custom Context Menu */}
      <Show when={showContextMenu()}>
        <div
          class="trwm-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenuPos().x}px`,
            top: `${contextMenuPos().y}px`,
            'z-index': 99999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="cm-item" onClick={() => startTorrents()}>
            <span class="cm-icon text-success">▶</span>
            <span>{t('context.start')}</span>
          </div>
          <div class="cm-item" onClick={() => startNowTorrents()}>
            <span class="cm-icon text-success">⏩</span>
            <span>{t('context.start_now')}</span>
          </div>
          <div class="cm-item" onClick={() => pauseTorrents()}>
            <span class="cm-icon text-warning">⏸</span>
            <span>{t('context.pause')}</span>
          </div>
          <div class="cm-item" onClick={() => verifyTorrents()}>
            <span class="cm-icon text-primary">✓</span>
            <span>{t('context.verify')}</span>
          </div>
          <div class="cm-item" onClick={() => reannounceTorrents()}>
            <span class="cm-icon text-primary">🌐</span>
            <span>{t('context.reannounce')}</span>
          </div>

          <div class="cm-divider" />

          <div class="cm-item" onClick={() => moveQueueUp()}>
            <span>▲</span>
            <span>{t('context.queue_up')}</span>
          </div>
          <div class="cm-item" onClick={() => moveQueueDown()}>
            <span>▼</span>
            <span>{t('context.queue_down')}</span>
          </div>
          <div class="cm-item" onClick={() => moveQueueTop()}>
            <span>⤒</span>
            <span>{t('context.queue_top')}</span>
          </div>
          <div class="cm-item" onClick={() => moveQueueBottom()}>
            <span>⤓</span>
            <span>{t('context.queue_bottom')}</span>
          </div>

          <div class="cm-divider" />

          <div class="cm-item" onClick={copyHash}>
            <span>#</span>
            <span>{t('context.copy_hash')}</span>
          </div>
          <div class="cm-item" onClick={copyMagnet}>
            <span>🧲</span>
            <span>{t('context.copy_magnet')}</span>
          </div>

          <div class="cm-divider" />

          <div class="cm-item" onClick={openLabelDialog}>
            <span>🏷</span>
            <span>{t('context.set_labels')}</span>
          </div>

          <div
            class="cm-item cm-has-submenu"
            onMouseEnter={() => setShowPrioritySubmenu(true)}
            onMouseLeave={() => setShowPrioritySubmenu(false)}
          >
            <span>⚡</span>
            <span>{t('context.bandwidth_priority')}</span>
            <span style={{ 'margin-left': 'auto', 'font-size': '10px' }}>▸</span>
            <Show when={showPrioritySubmenu()}>
              <div class="cm-submenu">
                <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(1); }}>
                  <span class="text-success">▲</span>
                  <span>{t('context.priority_high')}</span>
                </div>
                <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(0); }}>
                  <span>●</span>
                  <span>{t('context.priority_normal')}</span>
                </div>
                <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(-1); }}>
                  <span class="text-danger">▼</span>
                  <span>{t('context.priority_low')}</span>
                </div>
              </div>
            </Show>
          </div>

          <div class="cm-item" onClick={setDownloadLimit}>
            <span>⬇</span>
            <span>{t('context.download_limit')}</span>
          </div>
          <div class="cm-item" onClick={setUploadLimit}>
            <span>⬆</span>
            <span>{t('context.upload_limit')}</span>
          </div>
          <div class="cm-item" onClick={setPeerLimit}>
            <span>👥</span>
            <span>{t('context.peer_limit')}</span>
          </div>
          <div class="cm-item" onClick={changeDownloadDir}>
            <span>📁</span>
            <span>{t('context.change_dir')}</span>
          </div>
          <div class="cm-item" onClick={toggleSequentialDownload}>
            <span>🔢</span>
            <span>{t('context.sequential_download')}</span>
          </div>

          <div class="cm-divider" />

          <div class="cm-item text-danger" onClick={openDeleteModal}>
            <span class="cm-icon text-danger">×</span>
            <span>{t('context.remove')}</span>
          </div>
          <div class="cm-item text-danger" onClick={handleRemoveWithData}>
            <span class="cm-icon text-danger">🗑</span>
            <span>{t('context.remove_data')}</span>
          </div>
        </div>
      </Show>

      {/* Label Dialog */}
      <Show when={showLabelDialog()}>
        <div
          class="trwm-label-dialog-overlay"
          onClick={() => setShowLabelDialog(false)}
        >
          <div class="trwm-label-dialog" onClick={(e) => e.stopPropagation()}>
            <div class="trwm-label-dialog-title">{t('context.set_labels')}</div>
            <input
              type="text"
              class="trwm-label-dialog-input"
              value={labelInput()}
              onInput={(e) => setLabelInput(e.currentTarget.value)}
              placeholder={t('context.set_labels_hint')}
            />
            <div class="trwm-label-dialog-actions">
              <button class="trwm-label-dialog-btn" onClick={confirmLabels}>{t('dialog.ok')}</button>
              <button class="trwm-label-dialog-btn" onClick={() => setShowLabelDialog(false)}>{t('dialog.cancel')}</button>
            </div>
          </div>
        </div>
      </Show>
      <style>{`
        .trwm-app-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-primary);
        }
        .trwm-statusbar-container {
          height: 28px;
          flex-shrink: 0;
        }
        
        /* Sleek Context Menu */
        .trwm-context-menu {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 4px 2px;
          min-width: 150px;
          max-height: calc(100vh - 16px);
          overflow-y: auto;
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .cm-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--text-primary);
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.15s ease;
          white-space: nowrap;
        }
        .cm-item:hover {
          background-color: var(--bg-hover);
        }
        .cm-icon {
          font-weight: 700;
          font-size: 12px;
          width: 14px;
          text-align: center;
        }
        .cm-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 2px 4px;
        }
        .text-success {
          color: var(--color-success-500);
        }
        .text-warning {
          color: var(--color-warning-500);
        }
        .text-primary {
          color: var(--color-primary-500);
        }
        .text-danger {
          color: var(--color-danger-500);
        }

        /* Submenu */
        .cm-has-submenu {
          position: relative;
        }
        .cm-submenu {
          position: absolute;
          left: 100%;
          top: -4px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 4px 2px;
          min-width: 130px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        /* Label Dialog */
        .trwm-label-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
        }
        .trwm-label-dialog {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          min-width: 320px;
          box-shadow: var(--shadow-lg);
        }
        .trwm-label-dialog-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        .trwm-label-dialog-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }
        .trwm-label-dialog-input:focus {
          border-color: var(--color-primary-500);
        }
        .trwm-label-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
        }
        .trwm-label-dialog-btn {
          padding: 6px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .trwm-label-dialog-btn:hover {
          background-color: var(--bg-hover);
        }
        .trwm-label-dialog-btn:first-child {
          background-color: var(--color-primary-500);
          color: #fff;
          border-color: var(--color-primary-500);
        }
        .trwm-label-dialog-btn:first-child:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default App;
