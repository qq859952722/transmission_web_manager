export interface Torrent {
  id: number;
  name: string;
  hash_string: string;
  status: number;
  total_size: number;
  left_until_done: number;
  percent_done: number;
  rate_download: number;
  rate_upload: number;
  peers_connected: number;
  peers_sending_to_us: number;
  peers_getting_from_us: number;
  eta: number;
  added_date: number;
  done_date: number;
  upload_ratio: number;
  labels: string[];
  group: string;
  queue_position: number;
  is_finished: boolean;
  is_stalled: boolean;
  error: number;
  error_string: string;
  download_dir: string;
  creator: string;
  comment: string;
  is_private: boolean;
  piece_count: number;
  piece_size: number;
  downloaded_ever: number;
  uploaded_ever: number;
  corrupt_ever: number;
  peers_known: number;
  tracker_stats: TrackerStat[];
  files: TorrentFile[];
  file_stats: TorrentFileStat[];
  peers: Peer[];
  pieces: string; // Base64 bitfield
  availability?: number[]; // Per-piece availability count
  bandwidth_priority: number;
  download_limit: number;
  download_limited: boolean;
  upload_limit: number;
  upload_limited: boolean;
  peer_limit: number;
  seed_ratio_limit: number;
  seed_ratio_mode: number;
  seed_idle_limit: number;
  seed_idle_mode: number;
  activity_date: number;
  seconds_downloading: number;
  seconds_seeding: number;
  source: string;
  torrent_file: string;
  file_count: number;
  sequential_download: boolean;
  sequential_download_from_piece: number;
  primary_mime_type: string;
  peers_from?: PeerSources;
  magnet_link?: string;
  size_when_done?: number;
  desired_available?: number;
  have_valid?: number;
  have_unchecked?: number;
  recheck_progress?: number;
  webseeds_sending_to_us?: number;
  edit_date?: number;
  start_date?: number;
  date_created?: number;
  tracker_list?: string;
  metadata_percent_complete?: number;
}

export interface PeerSources {
  from_cache: number;
  from_dht: number;
  from_incoming: number;
  from_lpd: number;
  from_ltep: number;
  from_pex: number;
  from_tracker: number;
}

export interface TrackerStat {
  id: number;
  announce: string;
  scrape: string;
  tier: number;
  is_backup: boolean;
  announce_state: number;
  scrape_state: number;
  has_announced: boolean;
  has_scraped: boolean;
  host?: string;
  sitename?: string;
  last_announce_time: number;
  last_announce_start_time?: number;
  last_announce_succeeded: boolean;
  last_announce_result: string;
  last_announce_timed_out?: boolean;
  last_announce_peer_count: number;
  next_announce_time: number;
  last_scrape_time: number;
  last_scrape_start_time?: number;
  last_scrape_succeeded: boolean;
  last_scrape_result: string;
  last_scrape_timed_out?: boolean;
  next_scrape_time: number;
  seeder_count: number;
  leecher_count: number;
  download_count: number;
  downloader_count?: number;
}

export interface TorrentFile {
  bytes_completed: number;
  length: number;
  name: string;
  begin_piece?: number;
  end_piece?: number;
}

export interface TorrentFileStat {
  bytes_completed: number;
  wanted: boolean;
  priority: number;
}

export interface Peer {
  address: string;
  client_name: string;
  client_is_choked: boolean;
  client_is_interested: boolean;
  flag_str: string;
  is_downloading_from: boolean;
  is_encrypted: boolean;
  is_incoming: boolean;
  is_uploading_to: boolean;
  is_utp: boolean;
  peer_is_choked: boolean;
  peer_is_interested: boolean;
  port: number;
  progress: number;
  rate_to_client: number;
  rate_to_peer: number;
  bytes_to_client?: number;
  bytes_to_peer?: number;
  peer_id?: string;
}

export interface BandwidthGroup {
  name: string;
  honors_session_limits?: boolean;
  speed_limit_down_enabled?: boolean;
  speed_limit_down?: number;
  speed_limit_up_enabled?: boolean;
  speed_limit_up?: number;
}

export interface Session {
  alt_speed_down: number;
  alt_speed_enabled: boolean;
  alt_speed_time_begin: number;
  alt_speed_time_day: number;
  alt_speed_time_enabled: boolean;
  alt_speed_time_end: number;
  alt_speed_up: number;
  blocklist_enabled: boolean;
  blocklist_size: number;
  blocklist_url: string;
  cache_size_mb: number;
  cache_size_mib?: number;
  config_dir: string;
  default_trackers: string;
  dht_enabled: boolean;
  download_dir: string;
  download_queue_enabled: boolean;
  download_queue_size: number;
  encryption: string;
  idle_seeding_limit: number;
  idle_seeding_limit_enabled: boolean;
  incomplete_dir: string;
  incomplete_dir_enabled: boolean;
  lpd_enabled: boolean;
  peer_limit_global: number;
  peer_limit_per_torrent: number;
  peer_port: number;
  peer_port_random_on_start: boolean;
  pex_enabled: boolean;
  port_forwarding_enabled: boolean;
  queue_stalled_enabled: boolean;
  queue_stalled_minutes: number;
  rename_partial_files: boolean;
  rpc_version: number;
  rpc_version_minimum: number;
  rpc_version_semver: string;
  script_torrent_added_enabled: boolean;
  script_torrent_added_filename: string;
  script_torrent_done_enabled: boolean;
  script_torrent_done_filename: string;
  script_torrent_done_seeding_enabled: boolean;
  script_torrent_done_seeding_filename: string;
  seed_queue_enabled: boolean;
  seed_queue_size: number;
  seed_ratio_limit: number;
  seed_ratio_limited: boolean;
  session_id: string;
  speed_limit_down: number;
  speed_limit_down_enabled: boolean;
  speed_limit_up: number;
  speed_limit_up_enabled: boolean;
  start_added_torrents: boolean;
  trash_original_torrent_files: boolean;
  utp_enabled: boolean;
  version: string;
  anti_brute_force_enabled?: boolean;
  anti_brute_force_threshold?: number;
  preferred_transports?: string;
  scrape_paused_torrents_enabled?: boolean;
  sequential_download?: boolean;
}

export interface SessionStats {
  active_torrent_count: number;
  download_speed: number;
  paused_torrent_count: number;
  torrent_count: number;
  upload_speed: number;
  cumulative_stats: {
    uploaded_bytes: number;
    downloaded_bytes: number;
    files_added: number;
    session_count: number;
    seconds_active: number;
  };
  current_stats: {
    uploaded_bytes: number;
    downloaded_bytes: number;
    files_added: number;
    session_count: number;
    seconds_active: number;
  };
}
