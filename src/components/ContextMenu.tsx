import { Component, Show, createSignal } from 'solid-js';
import {
  Play,
  FastForward,
  Pause,
  ShieldCheck,
  Globe,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Hash,
  Magnet,
  Tag,
  Zap,
  ArrowDown,
  ArrowUp,
  Users,
  FolderOpen,
  ListOrdered,
  X,
  Trash2,
  ChevronRight,
} from 'lucide-solid';
import { t } from '../utils/i18n';
import { showToast } from '../utils/toast';
import {
  selectedIds,
  torrentStore,
  startTorrents,
  startNowTorrents,
  pauseTorrents,
  reannounceTorrents,
  verifyTorrents,
  moveQueueUp,
  moveQueueDown,
  moveQueueTop,
  moveQueueBottom,
  fetchTorrents,
  removeTorrents,
} from '../store/torrentStore';
import { rpcCall } from '../api/rpc';
import { openDeleteModal } from '../store/modalStore';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenLabelDialog: () => void;
  onPrompt: (cfg: { title: string; inputType?: 'text' | 'number'; placeholder?: string; defaultValue?: string; onConfirm: (value: string) => void }) => void;
}

export const ContextMenu: Component<ContextMenuProps> = (props) => {
  const [showPrioritySubmenu, setShowPrioritySubmenu] = createSignal(false);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  };

  const copyHash = () => {
    const hashes = selectedIds()
      .map((id) => torrentStore.items[id]?.hash_string)
      .filter(Boolean) as string[];
    if (hashes.length > 0) {
      copyToClipboard(hashes.join('\n'));
      showToast(t('status.copied'), 'success');
    }
  };

  const copyMagnet = () => {
    const magnets = selectedIds()
      .map((id) => {
        const torrent = torrentStore.items[id];
        return torrent ? `magnet:?xt=urn:btih:${torrent.hash_string}&dn=${encodeURIComponent(torrent.name)}` : '';
      })
      .filter(Boolean) as string[];
    if (magnets.length > 0) {
      copyToClipboard(magnets.join('\n'));
      showToast(t('status.copied'), 'success');
    }
  };

  const setBandwidthPriority = async (priority: number) => {
    await rpcCall('torrent_set', { ids: selectedIds(), bandwidth_priority: priority });
    fetchTorrents(true);
  };

  const setDownloadLimit = () => {
    const ids = selectedIds();
    props.onPrompt({
      title: t('context.speed_limit_prompt'),
      inputType: 'number',
      placeholder: 'KB/s',
      onConfirm: (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          rpcCall('torrent_set', { ids, download_limited: true, download_limit: num });
          fetchTorrents(true);
        }
      },
    });
  };

  const setUploadLimit = () => {
    const ids = selectedIds();
    props.onPrompt({
      title: t('context.speed_limit_prompt'),
      inputType: 'number',
      placeholder: 'KB/s',
      onConfirm: (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          rpcCall('torrent_set', { ids, upload_limited: true, upload_limit: num });
          fetchTorrents(true);
        }
      },
    });
  };

  const setPeerLimit = () => {
    const ids = selectedIds();
    props.onPrompt({
      title: t('context.peer_limit_prompt'),
      inputType: 'number',
      onConfirm: (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          rpcCall('torrent_set', { ids, peer_limit: num });
          fetchTorrents(true);
        }
      },
    });
  };

  const changeDownloadDir = () => {
    const ids = selectedIds();
    const first = ids.length > 0 ? torrentStore.items[ids[0]] : null;
    props.onPrompt({
      title: t('context.dir_prompt'),
      defaultValue: first?.download_dir || '',
      onConfirm: (val) => {
        if (val.trim().length > 0) {
          rpcCall('torrent_set_location', { ids, location: val.trim(), move: true });
          fetchTorrents(true);
        }
      },
    });
  };

  const toggleSequentialDownload = async () => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    const first = torrentStore.items[ids[0]];
    const current = first?.sequential_download ?? false;
    await rpcCall('torrent_set', { ids, sequential_download: !current });
    fetchTorrents(true);
  };

  const handleRemoveWithData = async () => {
    await removeTorrents(selectedIds(), true);
  };

  return (
    <div
      class="trwm-context-menu fixed"
      style={{
        left: `${props.x}px`,
        top: `${props.y}px`,
        'z-index': 99999,
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Auto-close menu when any item is clicked (except items with submenus)
        const target = e.target as HTMLElement;
        if (!target.closest('.cm-has-submenu')) {
          props.onClose();
        }
      }}
    >
      <div class="cm-item" onClick={() => startTorrents()}>
        <Play size={14} class="cm-icon text-success" />
        <span>{t('context.start')}</span>
      </div>
      <div class="cm-item" onClick={() => startNowTorrents()}>
        <FastForward size={14} class="cm-icon text-success" />
        <span>{t('context.start_now')}</span>
      </div>
      <div class="cm-item" onClick={() => pauseTorrents()}>
        <Pause size={14} class="cm-icon text-warning" />
        <span>{t('context.pause')}</span>
      </div>
      <div class="cm-item" onClick={() => verifyTorrents()}>
        <ShieldCheck size={14} class="cm-icon text-primary" />
        <span>{t('context.verify')}</span>
      </div>
      <div class="cm-item" onClick={() => reannounceTorrents()}>
        <Globe size={14} class="cm-icon text-primary" />
        <span>{t('context.reannounce')}</span>
      </div>

      <div class="cm-divider" />

      <div class="cm-item" onClick={() => moveQueueUp()}>
        <ChevronUp size={14} />
        <span>{t('context.queue_up')}</span>
      </div>
      <div class="cm-item" onClick={() => moveQueueDown()}>
        <ChevronDown size={14} />
        <span>{t('context.queue_down')}</span>
      </div>
      <div class="cm-item" onClick={() => moveQueueTop()}>
        <ChevronsUp size={14} />
        <span>{t('context.queue_top')}</span>
      </div>
      <div class="cm-item" onClick={() => moveQueueBottom()}>
        <ChevronsDown size={14} />
        <span>{t('context.queue_bottom')}</span>
      </div>

      <div class="cm-divider" />

      <div class="cm-item" onClick={copyHash}>
        <Hash size={14} />
        <span>{t('context.copy_hash')}</span>
      </div>
      <div class="cm-item" onClick={copyMagnet}>
        <Magnet size={14} />
        <span>{t('context.copy_magnet')}</span>
      </div>

      <div class="cm-divider" />

      <div class="cm-item" onClick={props.onOpenLabelDialog}>
        <Tag size={14} />
        <span>{t('context.set_labels')}</span>
      </div>

      <div
        class="cm-item cm-has-submenu"
        onMouseEnter={() => setShowPrioritySubmenu(true)}
        onMouseLeave={() => setShowPrioritySubmenu(false)}
      >
        <Zap size={14} />
        <span>{t('context.bandwidth_priority')}</span>
        <ChevronRight size={12} class="ml-auto" />
        <Show when={showPrioritySubmenu()}>
          <div class="cm-submenu">
            <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(1); props.onClose(); }}>
              <ChevronUp size={14} class="text-success" />
              <span>{t('context.priority_high')}</span>
            </div>
            <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(0); props.onClose(); }}>
              <span class="text-[10px]">●</span>
              <span>{t('context.priority_normal')}</span>
            </div>
            <div class="cm-item" onClick={(e) => { e.stopPropagation(); setBandwidthPriority(-1); props.onClose(); }}>
              <ChevronDown size={14} class="text-danger" />
              <span>{t('context.priority_low')}</span>
            </div>
          </div>
        </Show>
      </div>

      <div class="cm-item" onClick={setDownloadLimit}>
        <ArrowDown size={14} />
        <span>{t('context.download_limit')}</span>
      </div>
      <div class="cm-item" onClick={setUploadLimit}>
        <ArrowUp size={14} />
        <span>{t('context.upload_limit')}</span>
      </div>
      <div class="cm-item" onClick={setPeerLimit}>
        <Users size={14} />
        <span>{t('context.peer_limit')}</span>
      </div>
      <div class="cm-item" onClick={changeDownloadDir}>
        <FolderOpen size={14} />
        <span>{t('context.change_dir')}</span>
      </div>
      <div class="cm-item" onClick={toggleSequentialDownload}>
        <ListOrdered size={14} />
        <span>{t('context.sequential_download')}</span>
      </div>

      <div class="cm-divider" />

      <div class="cm-item text-danger" onClick={openDeleteModal}>
        <X size={14} class="cm-icon text-danger" />
        <span>{t('context.remove')}</span>
      </div>
      <div class="cm-item text-danger" onClick={handleRemoveWithData}>
        <Trash2 size={14} class="cm-icon text-danger" />
        <span>{t('context.remove_data')}</span>
      </div>
    </div>
  );
};
