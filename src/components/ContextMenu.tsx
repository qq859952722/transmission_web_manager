import { Component, JSX } from 'solid-js';
import { ContextMenu as KContextMenu } from '@kobalte/core/context-menu';
import {
  Play, FastForward, Pause, ShieldCheck, Globe, ChevronUp, ChevronDown, ChevronsUp,
  ChevronsDown, Hash, Magnet, Tag, Zap, ArrowDown, ArrowUp, Users, FolderOpen,
  ListOrdered, X, Trash2, ChevronRight, Circle
} from 'lucide-solid';
import { t } from '../utils/i18n';
import { showToast } from '../utils/toast';
import { cn } from '../lib/utils';
import { fallbackCopy } from '../utils/clipboard';
import {
  selectedIds, torrentStore, startTorrents, startNowTorrents, pauseTorrents,
  reannounceTorrents, verifyTorrents, moveQueueUp, moveQueueDown, moveQueueTop,
  moveQueueBottom, fetchTorrents, removeTorrents,
} from '../store/torrentStore';
import { rpcCall } from '../api/rpc';
import { openDeleteModal } from '../store/modalStore';

interface ContextMenuProps {
  children?: JSX.Element;
  onOpenLabelDialog: () => void;
  onPrompt: (cfg: { title: string; inputType?: 'text' | 'number'; placeholder?: string; defaultValue?: string; onConfirm: (value: string) => void }) => void;
}

interface ContextMenuItemProps {
  class?: string;
  onClick?: (e: MouseEvent) => void;
  children?: JSX.Element;
}

const Item: Component<ContextMenuItemProps> = (props) => (
  <KContextMenu.Item
    class={cn("flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm cursor-pointer text-xs font-medium transition-colors hover:bg-muted text-foreground outline-none focus:bg-muted data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed", props.class)}
    onClick={props.onClick}
  >
    {props.children}
  </KContextMenu.Item>
);

const Divider: Component = () => <KContextMenu.Separator class="h-px bg-border my-1 mx-1" />;

export const ContextMenu: Component<ContextMenuProps> = (props) => {
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
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
        if (!torrent) return '';
        if (torrent.magnet_link) return torrent.magnet_link;
        return `magnet:?xt=urn:btih:${torrent.hash_string}&dn=${encodeURIComponent(torrent.name)}`;
      })
      .filter(Boolean) as string[];
    if (magnets.length > 0) {
      copyToClipboard(magnets.join('\n'));
      showToast(t('status.copied'), 'success');
    }
  };

  const setBandwidthPriority = async (priority: number) => {
    try {
      await rpcCall('torrent_set', { ids: selectedIds(), bandwidth_priority: priority });
      fetchTorrents(true);
    } catch (err) {
      showToast(t('status.request_failed'), 'error');
    }
  };

  const setDownloadLimit = () => {
    const ids = selectedIds();
    props.onPrompt({
      title: t('context.speed_limit_prompt'),
      inputType: 'number',
      placeholder: 'KB/s',
      onConfirm: async (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          try {
            await rpcCall('torrent_set', { ids, download_limited: true, download_limit: num });
            fetchTorrents(true);
          } catch (err) {
            showToast(t('status.request_failed'), 'error');
          }
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
      onConfirm: async (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          try {
            await rpcCall('torrent_set', { ids, upload_limited: true, upload_limit: num });
            fetchTorrents(true);
          } catch (err) {
            showToast(t('status.request_failed'), 'error');
          }
        }
      },
    });
  };

  const setPeerLimit = () => {
    const ids = selectedIds();
    props.onPrompt({
      title: t('context.peer_limit_prompt'),
      inputType: 'number',
      onConfirm: async (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          try {
            await rpcCall('torrent_set', { ids, peer_limit: num });
            fetchTorrents(true);
          } catch (err) {
            showToast(t('status.request_failed'), 'error');
          }
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
      onConfirm: async (val) => {
        if (val.trim().length > 0) {
          try {
            await rpcCall('torrent_set_location', { ids, location: val.trim(), move: true });
            fetchTorrents(true);
          } catch (err) {
            showToast(t('status.request_failed'), 'error');
          }
        }
      },
    });
  };

  const toggleSequentialDownload = async () => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    const first = torrentStore.items[ids[0]];
    const current = first?.sequential_download ?? false;
    try {
      await rpcCall('torrent_set', { ids, sequential_download: !current });
      fetchTorrents(true);
    } catch (err) {
      showToast(t('status.request_failed'), 'error');
    }
  };

  const handleRemoveWithData = () => {
    openDeleteModal();
  };

  return (
    <KContextMenu>
      <KContextMenu.Trigger class="contents">
        {props.children}
      </KContextMenu.Trigger>
      
      <KContextMenu.Portal>
        <KContextMenu.Content class="z-[99999] bg-popover/80 backdrop-blur-xl border border-border rounded-lg shadow-xl min-w-[220px] p-1 flex flex-col text-popover-foreground animate-in fade-in zoom-in-95 duration-100 outline-none">
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

          <KContextMenu.Sub>
            <KContextMenu.SubTrigger class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm cursor-pointer text-xs font-medium transition-colors hover:bg-muted text-foreground outline-none focus:bg-muted data-[expanded]:bg-muted">
              <Zap size={14} class="text-warning" />
              <span>{t('context.bandwidth_priority')}</span>
              <ChevronRight size={12} class="ml-auto text-muted-foreground" />
            </KContextMenu.SubTrigger>
            <KContextMenu.Portal>
              <KContextMenu.SubContent class="z-[99999] bg-popover/90 backdrop-blur-xl border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-left-1 duration-150 outline-none p-1">
                <Item onClick={() => setBandwidthPriority(1)}>
                  <ChevronUp size={14} class="text-success" />
                  <span>{t('context.priority_high')}</span>
                </Item>
                <Item onClick={() => setBandwidthPriority(0)}>
                  <Circle size={10} class="text-muted-foreground ml-0.5 mr-[2px]" />
                  <span>{t('context.priority_normal')}</span>
                </Item>
                <Item onClick={() => setBandwidthPriority(-1)}>
                  <ChevronDown size={14} class="text-danger" />
                  <span>{t('context.priority_low')}</span>
                </Item>
              </KContextMenu.SubContent>
            </KContextMenu.Portal>
          </KContextMenu.Sub>

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

          <Item class="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={openDeleteModal}>
            <X size={14} class="text-destructive" />
            <span>{t('context.remove')}</span>
          </Item>
          <Item class="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleRemoveWithData}>
            <Trash2 size={14} class="text-destructive" />
            <span>{t('context.remove_data')}</span>
          </Item>
        </KContextMenu.Content>
      </KContextMenu.Portal>
    </KContextMenu>
  );
};
