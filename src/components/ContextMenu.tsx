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
  Circle
} from 'lucide-solid';
import { t } from '../utils/i18n';
import { showToast } from '../utils/toast';
import { cn } from '../lib/utils';
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

  const Item = (props: any) => (
    <div
      class={cn("flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm cursor-pointer text-xs font-medium transition-colors hover:bg-muted text-foreground", props.class)}
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {props.children}
    </div>
  );

  const Divider = () => <div class="h-px bg-border my-1 mx-1" />;

  return (
    <div
      class="fixed z-[99999] bg-popover/80 backdrop-blur-xl border border-border rounded-lg shadow-xl min-w-[220px] py-1 flex flex-col text-popover-foreground animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${props.x}px`,
        top: `${props.y}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!(e.target as HTMLElement).closest('.cm-has-submenu')) {
          props.onClose();
        }
      }}
    >
      <Item onClick={() => startTorrents()}>
        <Play size={14} class="text-success" />
        <span>{t('context.start')}</span>
      </Item>
      <Item onClick={() => startNowTorrents()}>
        <FastForward size={14} class="text-success" />
        <span>{t('context.start_now')}</span>
      </Item>
      <Item onClick={() => pauseTorrents()}>
        <Pause size={14} class="text-warning" />
        <span>{t('context.pause')}</span>
      </Item>
      <Item onClick={() => verifyTorrents()}>
        <ShieldCheck size={14} class="text-primary" />
        <span>{t('context.verify')}</span>
      </Item>
      <Item onClick={() => reannounceTorrents()}>
        <Globe size={14} class="text-primary" />
        <span>{t('context.reannounce')}</span>
      </Item>

      <Divider />

      <Item onClick={() => moveQueueUp()}>
        <ChevronUp size={14} class="text-muted-foreground" />
        <span>{t('context.queue_up')}</span>
      </Item>
      <Item onClick={() => moveQueueDown()}>
        <ChevronDown size={14} class="text-muted-foreground" />
        <span>{t('context.queue_down')}</span>
      </Item>
      <Item onClick={() => moveQueueTop()}>
        <ChevronsUp size={14} class="text-muted-foreground" />
        <span>{t('context.queue_top')}</span>
      </Item>
      <Item onClick={() => moveQueueBottom()}>
        <ChevronsDown size={14} class="text-muted-foreground" />
        <span>{t('context.queue_bottom')}</span>
      </Item>

      <Divider />

      <Item onClick={copyHash}>
        <Hash size={14} class="text-muted-foreground" />
        <span>{t('context.copy_hash')}</span>
      </Item>
      <Item onClick={copyMagnet}>
        <Magnet size={14} class="text-muted-foreground" />
        <span>{t('context.copy_magnet')}</span>
      </Item>

      <Divider />

      <Item onClick={props.onOpenLabelDialog}>
        <Tag size={14} class="text-primary" />
        <span>{t('context.set_labels')}</span>
      </Item>

      <div class="relative cm-has-submenu">
        <Item
          onMouseEnter={() => setShowPrioritySubmenu(true)}
          onMouseLeave={() => setShowPrioritySubmenu(false)}
        >
          <Zap size={14} class="text-warning" />
          <span>{t('context.bandwidth_priority')}</span>
          <ChevronRight size={12} class="ml-auto text-muted-foreground" />
        </Item>
        <Show when={showPrioritySubmenu()}>
          <div
            class="absolute top-0 left-full ml-1 bg-popover/90 backdrop-blur-xl border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-left-1 duration-150"
            onMouseEnter={() => setShowPrioritySubmenu(true)}
            onMouseLeave={() => setShowPrioritySubmenu(false)}
          >
            <Item onClick={(e: any) => { e.stopPropagation(); setBandwidthPriority(1); props.onClose(); }}>
              <ChevronUp size={14} class="text-success" />
              <span>{t('context.priority_high')}</span>
            </Item>
            <Item onClick={(e: any) => { e.stopPropagation(); setBandwidthPriority(0); props.onClose(); }}>
              <Circle size={10} class="text-muted-foreground ml-0.5 mr-[2px]" />
              <span>{t('context.priority_normal')}</span>
            </Item>
            <Item onClick={(e: any) => { e.stopPropagation(); setBandwidthPriority(-1); props.onClose(); }}>
              <ChevronDown size={14} class="text-danger" />
              <span>{t('context.priority_low')}</span>
            </Item>
          </div>
        </Show>
      </div>

      <Item onClick={setDownloadLimit}>
        <ArrowDown size={14} class="text-muted-foreground" />
        <span>{t('context.download_limit')}</span>
      </Item>
      <Item onClick={setUploadLimit}>
        <ArrowUp size={14} class="text-muted-foreground" />
        <span>{t('context.upload_limit')}</span>
      </Item>
      <Item onClick={setPeerLimit}>
        <Users size={14} class="text-muted-foreground" />
        <span>{t('context.peer_limit')}</span>
      </Item>
      <Item onClick={changeDownloadDir}>
        <FolderOpen size={14} class="text-muted-foreground" />
        <span>{t('context.change_dir')}</span>
      </Item>
      <Item onClick={toggleSequentialDownload}>
        <ListOrdered size={14} class="text-muted-foreground" />
        <span>{t('context.sequential_download')}</span>
      </Item>

      <Divider />

      <Item class="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={openDeleteModal}>
        <X size={14} class="text-destructive" />
        <span>{t('context.remove')}</span>
      </Item>
      <Item class="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRemoveWithData}>
        <Trash2 size={14} class="text-destructive" />
        <span>{t('context.remove_data')}</span>
      </Item>
    </div>
  );
};
