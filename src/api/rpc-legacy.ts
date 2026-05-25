/**
 * Legacy RPC compatibility layer for Transmission 3.x / 4.0.x
 * which use the old bespoke RPC protocol (not JSON-RPC 2.0).
 *
 * Key differences from JSON-RPC 2.0:
 * - No `jsonrpc` field in requests/responses
 * - Method names use hyphens: `torrent-get`, `session-get`, etc.
 * - Parameters go in `"arguments"` key (not `"params"`)
 * - Response data is in `"arguments"` key (not `"result"`)
 * - Field names use kebab-case/camelCase mixed format
 */

import { getSessionId, setSessionId, setLegacyProtocol, isLegacyProtocol as isLegacy } from './rpc-session';

const RPC_PATH = '/transmission/rpc';

// ---------------------------------------------------------------------------
// Method name mapping (new snake_case → old hyphenated)
// ---------------------------------------------------------------------------

export const LEGACY_METHOD_MAP: Record<string, string> = {
  torrent_get: 'torrent-get',
  session_get: 'session-get',
  session_set: 'session-set',
  torrent_start: 'torrent-start',
  torrent_start_now: 'torrent-start-now',
  torrent_stop: 'torrent-stop',
  torrent_verify: 'torrent-verify',
  torrent_reannounce: 'torrent-reannounce',
  torrent_remove: 'torrent-remove',
  torrent_set: 'torrent-set',
  torrent_set_location: 'torrent-set-location',
  torrent_rename_path: 'torrent-rename-path',
  torrent_add: 'torrent-add',
  session_stats: 'session-stats',
  port_test: 'port-test',
  blocklist_update: 'blocklist-update',
  free_space: 'free-space',
  group_get: 'group-get',
  group_set: 'group-set',
  queue_move_up: 'queue-move-up',
  queue_move_down: 'queue-move-down',
  queue_move_top: 'queue-move-top',
  queue_move_bottom: 'queue-move-bottom',
};

// ---------------------------------------------------------------------------
// Field name mapping (kebab-case / camelCase → snake_case)
// ---------------------------------------------------------------------------

const FIELD_MAP: Record<string, string> = {
  // Torrent fields
  hashString: 'hash_string',
  'hash-string': 'hash_string',
  totalSize: 'total_size',
  'total-size': 'total_size',
  percentDone: 'percent_done',
  'percent-done': 'percent_done',
  rateDownload: 'rate_download',
  'rate-download': 'rate_download',
  rateUpload: 'rate_upload',
  'rate-upload': 'rate_upload',
  peersConnected: 'peers_connected',
  'peers-connected': 'peers_connected',
  peersSendingToUs: 'peers_sending_to_us',
  'peers-sending-to-us': 'peers_sending_to_us',
  peersGettingFromUs: 'peers_getting_from_us',
  'peers-getting-from-us': 'peers_getting_from_us',
  addedDate: 'added_date',
  'added-date': 'added_date',
  doneDate: 'done_date',
  'done-date': 'done_date',
  uploadRatio: 'upload_ratio',
  'upload-ratio': 'upload_ratio',
  downloadDir: 'download_dir',
  'download-dir': 'download_dir',
  isStalled: 'is_stalled',
  'is-stalled': 'is_stalled',
  isFinished: 'is_finished',
  'is-finished': 'is_finished',
  errorString: 'error_string',
  'error-string': 'error_string',
  isPrivate: 'is_private',
  'is-private': 'is_private',
  pieceCount: 'piece_count',
  'piece-count': 'piece_count',
  pieceSize: 'piece_size',
  'piece-size': 'piece_size',
  downloadedEver: 'downloaded_ever',
  'downloaded-ever': 'downloaded_ever',
  uploadedEver: 'uploaded_ever',
  'uploaded-ever': 'uploaded_ever',
  corruptEver: 'corrupt_ever',
  'corrupt-ever': 'corrupt_ever',
  peersKnown: 'peers_known',
  'peers-known': 'peers_known',
  trackerStats: 'tracker_stats',
  'tracker-stats': 'tracker_stats',
  fileStats: 'file_stats',
  'file-stats': 'file_stats',
  bandwidthPriority: 'bandwidth_priority',
  'bandwidth-priority': 'bandwidth_priority',
  downloadLimit: 'download_limit',
  'download-limit': 'download_limit',
  downloadLimited: 'download_limited',
  'download-limited': 'download_limited',
  uploadLimit: 'upload_limit',
  'upload-limit': 'upload_limit',
  uploadLimited: 'upload_limited',
  'upload-limited': 'upload_limited',
  peerLimit: 'peer_limit',
  'peer-limit': 'peer_limit',
  seedRatioLimit: 'seed_ratio_limit',
  'seed-ratio-limit': 'seed_ratio_limit',
  seedRatioMode: 'seed_ratio_mode',
  'seed-ratio-mode': 'seed_ratio_mode',
  seedIdleLimit: 'seed_idle_limit',
  'seed-idle-limit': 'seed_idle_limit',
  seedIdleMode: 'seed_idle_mode',
  'seed-idle-mode': 'seed_idle_mode',
  activityDate: 'activity_date',
  'activity-date': 'activity_date',
  secondsDownloading: 'seconds_downloading',
  'seconds-downloading': 'seconds_downloading',
  secondsSeeding: 'seconds_seeding',
  'seconds-seeding': 'seconds_seeding',
  torrentFile: 'torrent_file',
  'torrent-file': 'torrent_file',
  fileCount: 'file_count',
  'file-count': 'file_count',
  sequentialDownload: 'sequential_download',
  'sequential-download': 'sequential_download',
  sequentialDownloadFromPiece: 'sequential_download_from_piece',
  'sequential-download-from-piece': 'sequential_download_from_piece',
  primaryMimeType: 'primary_mime_type',
  'primary-mime-type': 'primary_mime_type',
  peersFrom: 'peers_from',
  'peers-from': 'peers_from',
  magnetLink: 'magnet_link',
  'magnet-link': 'magnet_link',
  leftUntilDone: 'left_until_done',
  'left-until-done': 'left_until_done',
  queuePosition: 'queue_position',
  'queue-position': 'queue_position',
  sizeWhenDone: 'size_when_done',
  'size-when-done': 'size_when_done',

  // Tracker fields
  hasAnnounced: 'has_announced',
  'has-announced': 'has_announced',
  lastAnnounceSucceeded: 'last_announce_succeeded',
  'last-announce-succeeded': 'last_announce_succeeded',
  lastAnnounceResult: 'last_announce_result',
  'last-announce-result': 'last_announce_result',
  lastAnnouncePeerCount: 'last_announce_peer_count',
  'last-announce-peer-count': 'last_announce_peer_count',
  seederCount: 'seeder_count',
  'seeder-count': 'seeder_count',
  leecherCount: 'leecher_count',
  'leecher-count': 'leecher_count',
  announceState: 'announce_state',
  'announce-state': 'announce_state',
  nextAnnounceTime: 'next_announce_time',
  'next-announce-time': 'next_announce_time',
  lastAnnounceTime: 'last_announce_time',
  'last-announce-time': 'last_announce_time',

  // Peer fields
  bytesCompleted: 'bytes_completed',
  'bytes-completed': 'bytes_completed',
  clientName: 'client_name',
  'client-name': 'client_name',
  flagStr: 'flag_str',
  'flag-str': 'flag_str',
  isDownloadingFrom: 'is_downloading_from',
  'is-downloading-from': 'is_downloading_from',
  isUploadingTo: 'is_uploading_to',
  'is-uploading-to': 'is_uploading_to',
  isEncrypted: 'is_encrypted',
  'is-encrypted': 'is_encrypted',
  isIncoming: 'is_incoming',
  'is-incoming': 'is_incoming',
  isUTP: 'is_utp',
  'is-utp': 'is_utp',
  rateToClient: 'rate_to_client',
  'rate-to-client': 'rate_to_client',
  rateToPeer: 'rate_to_peer',
  'rate-to-peer': 'rate_to_peer',
  peerIsChoked: 'peer_is_choked',
  'peer-is-choked': 'peer_is_choked',
  peerIsInterested: 'peer_is_interested',
  'peer-is-interested': 'peer_is_interested',
  clientIsChoked: 'client_is_choked',
  'client-is-choked': 'client_is_choked',
  clientIsInterested: 'client_is_interested',
  'client-is-interested': 'client_is_interested',

  // Peer source fields
  fromCache: 'from_cache',
  'from-cache': 'from_cache',
  fromDht: 'from_dht',
  'from-dht': 'from_dht',
  fromIncoming: 'from_incoming',
  'from-incoming': 'from_incoming',
  fromLpd: 'from_lpd',
  'from-lpd': 'from_lpd',
  fromLtep: 'from_ltep',
  'from-ltep': 'from_ltep',
  fromPex: 'from_pex',
  'from-pex': 'from_pex',
  fromTracker: 'from_tracker',
  'from-tracker': 'from_tracker',

  // Session fields
  altSpeedEnabled: 'alt_speed_enabled',
  'alt-speed-enabled': 'alt_speed_enabled',
  altSpeedDown: 'alt_speed_down',
  'alt-speed-down': 'alt_speed_down',
  altSpeedUp: 'alt_speed_up',
  'alt-speed-up': 'alt_speed_up',
  speedLimitDown: 'speed_limit_down',
  'speed-limit-down': 'speed_limit_down',
  speedLimitDownEnabled: 'speed_limit_down_enabled',
  'speed-limit-down-enabled': 'speed_limit_down_enabled',
  speedLimitUp: 'speed_limit_up',
  'speed-limit-up': 'speed_limit_up',
  speedLimitUpEnabled: 'speed_limit_up_enabled',
  'speed-limit-up-enabled': 'speed_limit_up_enabled',
  peerPort: 'peer_port',
  'peer-port': 'peer_port',
  peerPortRandomOnStart: 'peer_port_random_on_start',
  'peer-port-random-on-start': 'peer_port_random_on_start',
  portForwardingEnabled: 'port_forwarding_enabled',
  'port-forwarding-enabled': 'port_forwarding_enabled',
  dhtEnabled: 'dht_enabled',
  'dht-enabled': 'dht_enabled',
  pexEnabled: 'pex_enabled',
  'pex-enabled': 'pex_enabled',
  lpdEnabled: 'lpd_enabled',
  'lpd-enabled': 'lpd_enabled',
  utpEnabled: 'utp_enabled',
  'utp-enabled': 'utp_enabled',
  blocklistEnabled: 'blocklist_enabled',
  'blocklist-enabled': 'blocklist_enabled',
  blocklistUrl: 'blocklist_url',
  'blocklist-url': 'blocklist_url',
  blocklistSize: 'blocklist_size',
  'blocklist-size': 'blocklist_size',
  downloadQueueEnabled: 'download_queue_enabled',
  'download-queue-enabled': 'download_queue_enabled',
  downloadQueueSize: 'download_queue_size',
  'download-queue-size': 'download_queue_size',
  seedQueueEnabled: 'seed_queue_enabled',
  'seed-queue-enabled': 'seed_queue_enabled',
  seedQueueSize: 'seed_queue_size',
  'seed-queue-size': 'seed_queue_size',
  idleSeedingLimit: 'idle_seeding_limit',
  'idle-seeding-limit': 'idle_seeding_limit',
  idleSeedingLimitEnabled: 'idle_seeding_limit_enabled',
  'idle-seeding-limit-enabled': 'idle_seeding_limit_enabled',
  queueStalledEnabled: 'queue_stalled_enabled',
  'queue-stalled-enabled': 'queue_stalled_enabled',
  queueStalledMinutes: 'queue_stalled_minutes',
  'queue-stalled-minutes': 'queue_stalled_minutes',
  renamePartialFiles: 'rename_partial_files',
  'rename-partial-files': 'rename_partial_files',
  startAddedTorrents: 'start_added_torrents',
  'start-added-torrents': 'start_added_torrents',
  trashOriginalTorrentFiles: 'trash_original_torrent_files',
  'trash-original-torrent-files': 'trash_original_torrent_files',
  scriptTorrentAddedEnabled: 'script_torrent_added_enabled',
  'script-torrent-added-enabled': 'script_torrent_added_enabled',
  scriptTorrentAddedFilename: 'script_torrent_added_filename',
  'script-torrent-added-filename': 'script_torrent_added_filename',
  scriptTorrentDoneEnabled: 'script_torrent_done_enabled',
  'script-torrent-done-enabled': 'script_torrent_done_enabled',
  scriptTorrentDoneFilename: 'script_torrent_done_filename',
  'script-torrent-done-filename': 'script_torrent_done_filename',
  scriptTorrentDoneSeedingEnabled: 'script_torrent_done_seeding_enabled',
  'script-torrent-done-seeding-enabled': 'script_torrent_done_seeding_enabled',
  scriptTorrentDoneSeedingFilename: 'script_torrent_done_seeding_filename',
  'script-torrent-done-seeding-filename': 'script_torrent_done_seeding_filename',
  incompleteDir: 'incomplete_dir',
  'incomplete-dir': 'incomplete_dir',
  incompleteDirEnabled: 'incomplete_dir_enabled',
  'incomplete-dir-enabled': 'incomplete_dir_enabled',
  cacheSizeMb: 'cache_size_mb',
  'cache-size-mb': 'cache_size_mb',
  rpcVersion: 'rpc_version',
  'rpc-version': 'rpc_version',
  rpcVersionMinimum: 'rpc_version_minimum',
  'rpc-version-minimum': 'rpc_version_minimum',
  rpcVersionSemver: 'rpc_version_semver',
  'rpc-version-semver': 'rpc_version_semver',
  sessionId: 'session_id',
  'session-id': 'session_id',
  configDir: 'config_dir',
  'config-dir': 'config_dir',
  defaultTrackers: 'default_trackers',
  'default-trackers': 'default_trackers',
  antiBruteForceEnabled: 'anti_brute_force_enabled',
  'anti-brute-force-enabled': 'anti_brute_force_enabled',
  antiBruteForceThreshold: 'anti_brute_force_threshold',
  'anti-brute-force-threshold': 'anti_brute_force_threshold',
  scrapePausedTorrentsEnabled: 'scrape_paused_torrents_enabled',
  'scrape-paused-torrents-enabled': 'scrape_paused_torrents_enabled',
  honorsSessionLimits: 'honors_session_limits',
  'honors-session-limits': 'honors_session_limits',
  seedRatioLimited: 'seed_ratio_limited',
  'seed-ratio-limited': 'seed_ratio_limited',

  // Request / action fields
  sizeBytes: 'size_bytes',
  'size-bytes': 'size_bytes',
  torrentAdded: 'torrent_added',
  'torrent-added': 'torrent_added',
  torrentDuplicate: 'torrent_duplicate',
  'torrent-duplicate': 'torrent_duplicate',
  deleteLocalData: 'delete_local_data',
  'delete-local-data': 'delete_local_data',
  filesWanted: 'files_wanted',
  'files-wanted': 'files_wanted',
  filesUnwanted: 'files_unwanted',
  'files-unwanted': 'files_unwanted',
  priorityHigh: 'priority_high',
  'priority-high': 'priority_high',
  priorityLow: 'priority_low',
  'priority-low': 'priority_low',
  priorityNormal: 'priority_normal',
  'priority-normal': 'priority_normal',
  trackerAdd: 'tracker_add',
  'tracker-add': 'tracker_add',
  trackerRemove: 'tracker_remove',
  'tracker-remove': 'tracker_remove',
  ipProtocol: 'ip_protocol',
  'ip-protocol': 'ip_protocol',
  portIsOpen: 'port_is_open',
  'port-is-open': 'port_is_open',

  // Stats fields
  activeTorrentCount: 'active_torrent_count',
  'active-torrent-count': 'active_torrent_count',
  pausedTorrentCount: 'paused_torrent_count',
  'paused-torrent-count': 'paused_torrent_count',
  downloadSpeed: 'download_speed',
  'download-speed': 'download_speed',
  uploadSpeed: 'upload_speed',
  'upload-speed': 'upload_speed',
  cumulativeStats: 'cumulative_stats',
  'cumulative-stats': 'cumulative_stats',
  currentStats: 'current_stats',
  'current-stats': 'current_stats',
  uploadedBytes: 'uploaded_bytes',
  'uploaded-bytes': 'uploaded_bytes',
  downloadedBytes: 'downloaded_bytes',
  'downloaded-bytes': 'downloaded_bytes',
  filesAdded: 'files_added',
  'files-added': 'files_added',
  sessionCount: 'session_count',
  'session-count': 'session_count',
  secondsActive: 'seconds_active',
  'seconds-active': 'seconds_active',
  altSpeedTimeEnabled: 'alt_speed_time_enabled',
  'alt-speed-time-enabled': 'alt_speed_time_enabled',
  altSpeedTimeBegin: 'alt_speed_time_begin',
  'alt-speed-time-begin': 'alt_speed_time_begin',
  altSpeedTimeEnd: 'alt_speed_time_end',
  'alt-speed-time-end': 'alt_speed_time_end',
  altSpeedTimeDay: 'alt_speed_time_day',
  'alt-speed-time-day': 'alt_speed_time_day',
  peerLimitGlobal: 'peer_limit_global',
  'peer-limit-global': 'peer_limit_global',
  peerLimitPerTorrent: 'peer_limit_per_torrent',
  'peer-limit-per-torrent': 'peer_limit_per_torrent',
  maxConnectedPeers: 'max_connected_peers',
  'max-connected-peers': 'max_connected_peers',
  metadataPercentComplete: 'metadata_percent_complete',
  'metadata-percent-complete': 'metadata_percent_complete',
  desiredAvailable: 'desired_available',
  'desired-available': 'desired_available',
  haveValid: 'have_valid',
  'have-valid': 'have_valid',
  haveUnchecked: 'have_unchecked',
  'have-unchecked': 'have_unchecked',
  recheckProgress: 'recheck_progress',
  'recheck-progress': 'recheck_progress',
  etaIdle: 'eta_idle',
  'eta-idle': 'eta_idle',
  webseedsSendingToUs: 'webseeds_sending_to_us',
  'webseeds-sending-to-us': 'webseeds_sending_to_us',
  trackerList: 'tracker_list',
  'tracker-list': 'tracker_list',
  editDate: 'edit_date',
  'edit-date': 'edit_date',
  startDate: 'start_date',
  'start-date': 'start_date',
  dateCreated: 'date_created',
  'date-created': 'date_created',
  manualAnnounceTime: 'manual_announce_time',
  'manual-announce-time': 'manual_announce_time',
};

// ---------------------------------------------------------------------------
// Reverse mapping: snake_case → camelCase (for request conversion)
// ---------------------------------------------------------------------------

const SNAKE_TO_CAMEL_MAP: Record<string, string> = {};
for (const [legacyKey, snakeKey] of Object.entries(FIELD_MAP)) {
  // Prefer the camelCase variant over the kebab-case variant
  if (legacyKey.includes('-') && !legacyKey.match(/^[a-z]/)) continue; // skip kebab if camel exists
  if (!(snakeKey in SNAKE_TO_CAMEL_MAP) || !legacyKey.includes('-')) {
    SNAKE_TO_CAMEL_MAP[snakeKey] = legacyKey.includes('-')
      ? legacyKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      : legacyKey;
  }
}

// ---------------------------------------------------------------------------
// Protocol detection
// ---------------------------------------------------------------------------

/**
 * Detect whether the Transmission RPC endpoint speaks JSON-RPC 2.0 or the
 * old bespoke protocol.  Tries JSON-RPC 2.0 first; if the response lacks the
 * `jsonrpc` field it falls back to legacy mode.
 */
export async function detectProtocol(): Promise<boolean> {
  try {
    const id = Date.now();
    const payload = {
      jsonrpc: '2.0',
      method: 'session_get',  // Use underscore format for JSON-RPC 2.0
      params: {},
      id,
    };

    const response = await fetch(RPC_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Transmission-Session-Id': getSessionId(),
      },
      body: JSON.stringify(payload),
    });

    // Handle CSRF 409 — retry with the new session ID
    if (response.status === 409) {
      const newId = response.headers.get('X-Transmission-Session-Id') || '';
      setSessionId(newId);
      if (!newId) { setLegacyProtocol(false); return false; }
      return detectProtocol();
    }

    if (!response.ok) {
      setLegacyProtocol(false);
      return false;
    }

    const json = await response.json();

    // JSON-RPC 2.0 responses always include the `jsonrpc` field
    if (json.jsonrpc === '2.0') {
      setLegacyProtocol(false);
    } else {
      setLegacyProtocol(true);
    }
  } catch {
    setLegacyProtocol(false);
  }

  return isLegacy();
}

/** Returns whether the legacy protocol has been detected. */
export function isLegacyProtocol(): boolean {
  return isLegacy();
}

// ---------------------------------------------------------------------------
// Legacy RPC call
// ---------------------------------------------------------------------------

let _requestId = 0;

/**
 * Send an RPC request using the old Transmission protocol format.
 */
export async function legacyRpcCall<T = any>(
  method: string,
  params?: Record<string, any>,
): Promise<T> {
  // Map method name to legacy hyphenated format
  const legacyMethod = LEGACY_METHOD_MAP[method] || method;

  // Convert snake_case params to camelCase for legacy protocol
  const legacyParams = params ? convertRequestFromSnakeCase(params) : {};

  const payload: Record<string, any> = {
    method: legacyMethod,
    arguments: legacyParams,
  };

  const response = await fetch(RPC_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Transmission-Session-Id': getSessionId(),
    },
    body: JSON.stringify(payload),
  });

  // Handle CSRF 409
  if (response.status === 409) {
    const newId = response.headers.get('X-Transmission-Session-Id') || '';
    setSessionId(newId);
    if (!newId) throw new Error('Failed to get session ID');
    return legacyRpcCall<T>(method, params);
  }

  if (!response.ok) {
    throw new Error(`RPC call failed with status ${response.status}`);
  }

  const json = await response.json();

  // Legacy protocol: `"result": "success"` means OK, data in `"arguments"`
  if (json.result && json.result !== 'success') {
    throw new Error(json.result);
  }

  // Convert response field names to snake_case
  const data = json.arguments ?? {};
  return convertResponseToSnakeCase(data) as T;
}

// ---------------------------------------------------------------------------
// Response key conversion (kebab-case / camelCase → snake_case)
// ---------------------------------------------------------------------------

/**
 * Recursively convert all object keys from legacy kebab-case / camelCase to
 * snake_case using the known field mapping.  Handles nested objects and arrays
 * of objects.
 */
export function convertResponseToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertResponseToSnakeCase);
  if (typeof obj !== 'object') return obj;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = FIELD_MAP[key] ?? key;
    result[mappedKey] = convertResponseToSnakeCase(value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Request key conversion (snake_case → camelCase for legacy protocol)
// ---------------------------------------------------------------------------

/**
 * Convert snake_case request parameter names to the camelCase format expected
 * by the old Transmission protocol.  Used when sending requests to legacy
 * Transmission versions.
 */
export function convertRequestFromSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertRequestFromSnakeCase);
  if (typeof obj !== 'object') return obj;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = SNAKE_TO_CAMEL_MAP[key] ?? key;
    result[mappedKey] = convertRequestFromSnakeCase(value);
  }
  return result;
}
