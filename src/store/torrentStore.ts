import { createStore, reconcile, produce } from 'solid-js/store';
import { createSignal, createMemo } from 'solid-js';
import type { Torrent } from '../types/transmission';
import { rpcCall, torrentGet } from '../api/rpc';
import { db } from './db';

/** Strip SolidJS reactive proxy so data can be stored in IndexedDB */
function toPlain<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

async function archiveTorrentToHistory(torrent: Torrent, deletedDate: number = 0) {
  const plain = toPlain(torrent);
  const filesSummary = plain.files ? plain.files.map((f: any) => ({ name: f.name, length: f.length })) : undefined;
  try {
    const existing = await db.history.where('hash_string').equals(plain.hash_string).first();
    const baseData = {
      name: plain.name,
      total_size: plain.total_size,
      download_dir: plain.download_dir,
      labels: plain.labels ?? [],
      added_date: plain.added_date,
      done_date: plain.done_date,
      deleted_date: deletedDate,
      upload_ratio: plain.upload_ratio,
      downloaded_ever: plain.downloaded_ever,
      uploaded_ever: plain.uploaded_ever,
      status: plain.status,
      error: plain.error,
      magnet_link: plain.magnet_link,
      comment: plain.comment,
      creator: plain.creator,
      files: filesSummary
    };
    if (existing?.id) {
      await db.history.update(existing.id, baseData);
    } else {
      await db.history.add({
        ...baseData,
        hash_string: plain.hash_string,
        avg_rate_download: 0,
        avg_rate_upload: 0
      });
    }
  } catch (e) {
    console.warn('Failed to archive torrent history', e);
  }
}

// Torrent status code constants
const STATUS_STOPPED = 0;
const STATUS_QUEUED_TO_CHECK = 1;
const STATUS_CHECKING = 2;
const STATUS_QUEUED_TO_DOWNLOAD = 3;
const STATUS_DOWNLOADING = 4;
const STATUS_QUEUED_TO_SEED = 5;
const STATUS_SEEDING = 6;

const TORRENT_FIELDS = [
  'id', 'name', 'hash_string', 'status', 'total_size', 'left_until_done',
  'percent_done', 'rate_download', 'rate_upload', 'peers_connected',
  'peers_sending_to_us', 'peers_getting_from_us', 'eta', 'added_date', 'done_date',
  'upload_ratio', 'labels', 'group', 'queue_position', 'is_finished',
  'is_stalled', 'error', 'error_string', 'download_dir',
  'bandwidth_priority', 'download_limit', 'download_limited', 'upload_limit',
  'upload_limited', 'peer_limit', 'seed_ratio_limit', 'seed_ratio_mode',
  'seed_idle_limit', 'seed_idle_mode', 'activity_date',
  'downloaded_ever', 'uploaded_ever', 'size_when_done',
  'recheck_progress', 'file_count', 'start_date',
  'creator', 'comment', 'is_private', 'piece_count', 'piece_size',
  'corrupt_ever', 'peers_known', 'tracker_stats', 'files', 'file_stats', 'peers',
  'seconds_downloading', 'seconds_seeding', 'source', 'torrent_file',
  'sequential_download', 'sequential_download_from_piece', 'primary_mime_type',
  'peers_from', 'magnet_link', 'pieces', 'availability',
  'desired_available', 'have_valid', 'have_unchecked',
  'webseeds_sending_to_us', 'edit_date', 'date_created',
  'tracker_list', 'metadata_percent_complete',
  'percent_complete', 'eta_idle', 'max_connected_peers', 'honors_session_limits',
  'webseeds'
];

interface TorrentState {
  items: Record<number, Torrent>;
  isInitialized: boolean;
  error: string | null;
}

const [torrentStore, setTorrentStore] = createStore<TorrentState>({
  items: {},
  isInitialized: false,
  error: null
});

export { torrentStore };

// UI Filtering & Selection Signals
export const [statusFilter, setStatusFilter] = createSignal<string>('all');
export const [trackerFilter, setTrackerFilter] = createSignal<string | null>(null);
export const [dirFilter, setDirFilter] = createSignal<string | null>(null);
export const [labelFilter, setLabelFilter] = createSignal<string | null>(null);
export const [privacyFilter, setPrivacyFilter] = createSignal<'all' | 'public' | 'private'>('all');
export const [searchQuery, setSearchQuery] = createSignal<string>('');

export const [selectedIds, setSelectedIds] = createSignal<number[]>([]);
export const [lastSelectedId, setLastSelectedId] = createSignal<number | null>(null);

export const [speedHistory, setSpeedHistory] = createSignal<{download: number[], upload: number[]}>({download: [], upload: []});

// Getters - SolidJS Store fine-grained reactivity automatically tracks
// individual field access, so no manual void t.xxx hack is needed.
export const torrentList = createMemo(() => {
  return Object.values(torrentStore.items);
});

// Helper to extract domain from tracker URL
export function getTrackerDomain(url: string): string {
  try {
    const match = url.match(/^(?:https?|udp):\/\/([^/:]+)/i);
    return match ? match[1] : url;
  } catch {
    return url;
  }
}

// Sidebar Groups Calculation
export const sidebarCounts = createMemo(() => {
  const list = torrentList();
  const counts = {
    all: list.length,
    downloading: 0,
    seeding: 0,
    stopped: 0,
    checking: 0,
    active: 0,
    error: 0,
    queued: 0,
    public: 0,
    private: 0,
    trackers: {} as Record<string, number>,
    dirs: {} as Record<string, number>,
    labels: {} as Record<string, number>
  };

  for (const t of list) {
    // Status
    if (t.status === 4) counts.downloading++;
    else if (t.status === 6) counts.seeding++;
    else if (t.status === 0) counts.stopped++;
    else if (t.status === 2 || t.status === 1) counts.checking++;
    else if (t.status === 3 || t.status === 5) counts.queued++;

    if (t.rate_download > 0 || t.rate_upload > 0) counts.active++;
    if (t.error > 0) counts.error++;

    // Privacy
    if (t.is_private) counts.private++;
    else counts.public++;

    // Trackers
    if (t.tracker_stats) {
      const domains = new Set<string>();
      for (const stat of t.tracker_stats) {
        domains.add(getTrackerDomain(stat.announce));
      }
      for (const d of domains) {
        counts.trackers[d] = (counts.trackers[d] || 0) + 1;
      }
    }

    // Directories
    if (t.download_dir) {
      counts.dirs[t.download_dir] = (counts.dirs[t.download_dir] || 0) + 1;
    }

    // Labels
    if (t.labels && t.labels.length > 0) {
      for (const l of t.labels) {
        counts.labels[l] = (counts.labels[l] || 0) + 1;
      }
    } else {
      counts.labels['_unlabeled'] = (counts.labels['_unlabeled'] || 0) + 1;
    }
  }

  return counts;
});

// Memoized Filtered Torrents
export const filteredTorrents = createMemo(() => {
  let list = torrentList();

  // Status filter
  const stat = statusFilter();
  if (stat !== 'all') {
    if (stat === 'downloading') list = list.filter(t => t.status === STATUS_DOWNLOADING);
    else if (stat === 'seeding') list = list.filter(t => t.status === STATUS_SEEDING);
    else if (stat === 'stopped') list = list.filter(t => t.status === STATUS_STOPPED);
    else if (stat === 'checking') list = list.filter(t => t.status === STATUS_CHECKING || t.status === STATUS_QUEUED_TO_CHECK);
    else if (stat === 'queued') list = list.filter(t => t.status === STATUS_QUEUED_TO_DOWNLOAD || t.status === STATUS_QUEUED_TO_SEED);
    else if (stat === 'active') list = list.filter(t => t.rate_download > 0 || t.rate_upload > 0);
    else if (stat === 'error') list = list.filter(t => t.error > 0);
  }

  // Tracker filter
  const tracker = trackerFilter();
  if (tracker) {
    list = list.filter(t => t.tracker_stats?.some(s => getTrackerDomain(s.announce) === tracker));
  }

  // Directory filter
  const dir = dirFilter();
  if (dir) {
    list = list.filter(t => t.download_dir === dir);
  }

  // Label filter
  const label = labelFilter();
  if (label) {
    if (label === '_unlabeled') {
      list = list.filter(t => !t.labels || t.labels.length === 0);
    } else {
      list = list.filter(t => t.labels?.includes(label));
    }
  }

  // Privacy filter
  const priv = privacyFilter();
  if (priv !== 'all') {
    list = list.filter(t => priv === 'private' ? t.is_private : !t.is_private);
  }

  // Search filter
  const query = searchQuery().toLowerCase().trim();
  if (query) {
    list = list.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.hash_string.toLowerCase().includes(query) ||
      t.labels?.some(l => l.toLowerCase().includes(query))
    );
  }

  return list;
});

// Selection Helpers
export function toggleSelect(id: number, ctrlKey = false, shiftKey = false) {
  const current = selectedIds();
  const list = filteredTorrents();

  if (shiftKey && lastSelectedId() !== null) {
    const fromIdx = list.findIndex(t => t.id === lastSelectedId());
    const toIdx = list.findIndex(t => t.id === id);
    if (fromIdx !== -1 && toIdx !== -1) {
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const sliceIds = list.slice(start, end + 1).map(t => t.id);
      if (ctrlKey) {
        setSelectedIds(Array.from(new Set([...current, ...sliceIds])));
      } else {
        setSelectedIds(sliceIds);
      }
      return;
    }
  }

  setLastSelectedId(id);

  if (ctrlKey) {
    if (current.includes(id)) {
      setSelectedIds(current.filter(x => x !== id));
    } else {
      setSelectedIds([...current, id]);
    }
  } else {
    if (current.length === 1 && current[0] === id) {
      setSelectedIds([]);
    } else {
      setSelectedIds([id]);
    }
  }
}

export function selectAll() {
  setSelectedIds(filteredTorrents().map(t => t.id));
}

export function clearSelection() {
  setSelectedIds([]);
  setLastSelectedId(null);
}

// Fetch Logic
let isFetching = false;
let lastSnapshotTime = 0;

export async function fetchTorrents(forceFull = false) {
  if (isFetching) return;
  isFetching = true;
  let stale = false;
  const fetchTimeout = setTimeout(() => { stale = true; isFetching = false; }, 10000);

  try {
    // Always fetch all torrents from backend (full data)
    const fields = TORRENT_FIELDS;
    const data = await torrentGet(fields);
    if (stale) return;
    setTorrentStore('error', null);

    if (!torrentStore.isInitialized) {
      // First time initialization: batch set all items
      const newItems: Record<number, Torrent> = {};
      for (const t of data.torrents) {
        newItems[t.id] = t as Torrent;
      }
      setTorrentStore('items', reconcile(newItems));
      setTorrentStore('isInitialized', true);
    } else {
      // Differential update: per-torrent reconcile so only changed fields trigger UI updates.
      // This avoids replacing the entire items object, which would cause all downstream
      // memos and effects to recompute even when nothing changed.
      const incomingIds = new Set<number>();

      for (const t of data.torrents) {
        const id = t.id as number;
        incomingIds.add(id);
        // reconcile per-torrent: deep diff only this one item, not the entire store
        setTorrentStore('items', id, reconcile(t as Torrent));
      }

      // Remove torrents that no longer exist in the backend response
      const currentIds = Object.keys(torrentStore.items).map(Number);
      const removedIds = currentIds.filter(id => !incomingIds.has(id));

      if (removedIds.length > 0) {
        const nowTime = Math.floor(Date.now() / 1000);
        for (const id of removedIds) {
          const existing = torrentStore.items[id];
          if (existing) {
            archiveTorrentToHistory(existing, nowTime);
          }
          setTorrentStore('items', id, undefined as any);
        }
      }
    }

    // Update global speed history
    const allItems = Object.values(torrentStore.items);
    let currentDl = 0, currentUl = 0;
    for (const t of allItems) {
      if (t.rate_download > 0) currentDl += t.rate_download;
      if (t.rate_upload > 0) currentUl += t.rate_upload;
    }
    setSpeedHistory(prev => ({
      download: [...prev.download, currentDl].slice(-60), // Keep 60 points
      upload: [...prev.upload, currentUl].slice(-60)
    }));

    // Periodic throttled syncing to history (every 60s)
    // History data changes infrequently, so 60s is sufficient to avoid
    // excessive IndexedDB reads while still keeping records reasonably fresh
    const now = Math.floor(Date.now() / 1000);
    if (now - lastSnapshotTime >= 60) {
      lastSnapshotTime = now;
      const allItems = Object.values(torrentStore.items);
      const hashMap = new Map<string, any>();
      for (const t of allItems) {
        hashMap.set(t.hash_string, toPlain(t));
      }
      
      const hashes = [...hashMap.keys()];
      db.history.where('hash_string').anyOf(hashes).toArray().then(records => {
        const toPut: any[] = [];
        for (const record of records) {
          const plain = hashMap.get(record.hash_string);
          if (plain) {
            let dlAvg = record.avg_rate_download || 0;
            let ulAvg = record.avg_rate_upload || 0;
            if (plain.rate_download > 0) {
              dlAvg = dlAvg === 0 ? plain.rate_download : (dlAvg * 0.8 + plain.rate_download * 0.2);
            } else if (dlAvg > 0) {
              dlAvg = dlAvg * 0.9;
              if (dlAvg < 1) dlAvg = 0;
            }
            if (plain.rate_upload > 0) {
              ulAvg = ulAvg === 0 ? plain.rate_upload : (ulAvg * 0.8 + plain.rate_upload * 0.2);
            } else if (ulAvg > 0) {
              ulAvg = ulAvg * 0.9;
              if (ulAvg < 1) ulAvg = 0;
            }

            toPut.push({
              ...record,
              avg_rate_download: dlAvg,
              avg_rate_upload: ulAvg,
              upload_ratio: plain.upload_ratio !== undefined ? plain.upload_ratio : record.upload_ratio,
              downloaded_ever: plain.downloaded_ever !== undefined ? plain.downloaded_ever : record.downloaded_ever,
              uploaded_ever: plain.uploaded_ever !== undefined ? plain.uploaded_ever : record.uploaded_ever,
              done_date: plain.done_date !== undefined ? plain.done_date : record.done_date,
              name: plain.name ?? record.name,
              magnet_link: plain.magnet_link ?? record.magnet_link,
              comment: plain.comment ?? record.comment,
              creator: plain.creator ?? record.creator,
              files: plain.files ? plain.files.map((f: any) => ({ name: f.name, length: f.length })) : record.files,
              total_size: plain.total_size ?? record.total_size,
              download_dir: plain.download_dir ?? record.download_dir,
              labels: plain.labels ?? record.labels,
              deleted_date: 0 // Reset deleted_date if it somehow came back
            });
            hashMap.delete(plain.hash_string);
          }
        }
        
        for (const plain of hashMap.values()) {
          toPut.push({
            hash_string: plain.hash_string,
            name: plain.name ?? 'Unknown',
            total_size: plain.total_size ?? 0,
            download_dir: plain.download_dir ?? '',
            labels: plain.labels ?? [],
            added_date: plain.added_date ?? now,
            done_date: plain.done_date ?? 0,
            deleted_date: 0,
            upload_ratio: plain.upload_ratio ?? 0,
            downloaded_ever: plain.downloaded_ever ?? 0,
            uploaded_ever: plain.uploaded_ever ?? 0,
            avg_rate_download: plain.rate_download ?? 0,
            avg_rate_upload: plain.rate_upload ?? 0,
            status: plain.status ?? 0,
            error: plain.error ?? 0,
            magnet_link: plain.magnet_link,
            comment: plain.comment,
            creator: plain.creator,
            files: plain.files ? plain.files.map((f: any) => ({ name: f.name, length: f.length })) : undefined
          });
        }
        
        if (toPut.length > 0) {
          db.history.bulkPut(toPut).catch(e => console.warn('Failed to bulk sync history', e));
        }
      });
    }
  } catch (err: any) {
    console.error('Failed to fetch torrents', err);
    setTorrentStore('error', err.message || 'Connection Error');
  } finally {
    clearTimeout(fetchTimeout);
    isFetching = false;
  }
}

// RPC Operation Commands
export async function torrentOp(method: string, ids?: number[], extraArgs?: Record<string, any>) {
  const targetIds = ids || selectedIds();
  if (targetIds.length === 0 && method !== 'torrent_add') return;

  const args: Record<string, any> = extraArgs || {};
  if (targetIds.length > 0) {
    args.ids = targetIds;
  }

  await rpcCall(method, args);
  // Trigger quick fetch after operations to update state instantly
  fetchTorrents(true);
}

export const startTorrents = (ids?: number[]) => torrentOp('torrent_start', ids);
export const startNowTorrents = (ids?: number[]) => torrentOp('torrent_start_now', ids);
export const pauseTorrents = (ids?: number[]) => torrentOp('torrent_stop', ids);
export const verifyTorrents = (ids?: number[]) => torrentOp('torrent_verify', ids);
export const reannounceTorrents = (ids?: number[]) => torrentOp('torrent_reannounce', ids);

export async function removeTorrents(ids?: number[], deleteData = false) {
  const targetIds = ids || selectedIds();

  const nowTime = Math.floor(Date.now() / 1000);
  for (const id of targetIds) {
    const torrent = torrentStore.items[id];
    if (torrent) {
      await archiveTorrentToHistory(torrent, nowTime);
    }
  }

  await torrentOp('torrent_remove', targetIds, { delete_local_data: deleteData });
  setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
}

export const moveQueueUp = (ids?: number[]) => torrentOp('queue_move_up', ids);
export const moveQueueDown = (ids?: number[]) => torrentOp('queue_move_down', ids);
export const moveQueueTop = (ids?: number[]) => torrentOp('queue_move_top', ids);
export const moveQueueBottom = (ids?: number[]) => torrentOp('queue_move_bottom', ids);

// Polling Lifecycle
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startPolling(intervalMs = 2000, getForceFull?: () => boolean) {
  if (pollInterval) clearInterval(pollInterval);
  fetchTorrents(true); // Initial full fetch
  pollInterval = setInterval(() => {
    const forceFull = getForceFull ? getForceFull() : false;
    fetchTorrents(forceFull); // Delta updates or full when detail is open
  }, intervalMs);
}

export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
