import { Component, Show, createSignal, createEffect, For } from 'solid-js';
import { closeSettingsModal, showSettingsModal } from '../../store/modalStore';
import { useSession } from '../../api/queries';
import { rpcCall } from '../../api/rpc';
import { torrentStore } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './Modals.css';

// Helper to convert time (HH:MM) to minutes in day
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper to convert minutes in day to time (HH:MM)
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const GlobalConfigModal: Component = () => {
  const session = useSession();

  const [activeTab, setActiveTab] = createSignal<
    | 'download'
    | 'speed'
    | 'groups'
    | 'network'
    | 'peer'
    | 'seeding'
    | 'queue'
    | 'labels'
    | 'blocklist'
    | 'rpc'
    | 'script'
    | 'advanced'
  >('download');

  const [saving, setSaving] = createSignal(false);

  // --- 1. Download settings ---
  const [downloadDir, setDownloadDir] = createSignal('');
  const [incompleteDirEnabled, setIncompleteDirEnabled] = createSignal(false);
  const [incompleteDir, setIncompleteDir] = createSignal('');
  const [startAddedTorrents, setStartAddedTorrents] = createSignal(true);
  const [renamePartialFiles, setRenamePartialFiles] = createSignal(true);
  const [trashOriginalTorrentFiles, setTrashOriginalTorrentFiles] = createSignal(false);

  // --- 2. Speed settings ---
  const [speedLimitDownEnabled, setSpeedLimitDownEnabled] = createSignal(false);
  const [speedLimitDown, setSpeedLimitDown] = createSignal(100);
  const [speedLimitUpEnabled, setSpeedLimitUpEnabled] = createSignal(false);
  const [speedLimitUp, setSpeedLimitUp] = createSignal(100);
  const [altSpeedEnabled, setAltSpeedEnabled] = createSignal(false);
  const [altSpeedDown, setAltSpeedDown] = createSignal(50);
  const [altSpeedUp, setAltSpeedUp] = createSignal(50);
  const [altSpeedTimeEnabled, setAltSpeedTimeEnabled] = createSignal(false);
  const [altSpeedTimeBegin, setAltSpeedTimeBegin] = createSignal('09:00');
  const [altSpeedTimeEnd, setAltSpeedTimeEnd] = createSignal('17:00');
  const [altSpeedTimeDay, setAltSpeedTimeDay] = createSignal(127); // 127 = every day

  // --- 3. Bandwidth Groups settings ---
  const [bandwidthGroups, setBandwidthGroups] = createSignal<any[]>([]);
  const [loadingGroups, setLoadingGroups] = createSignal(false);
  const [editingGroup, setEditingGroup] = createSignal<any | null>(null);
  const [groupName, setGroupName] = createSignal('');
  const [groupDlEnabled, setGroupDlEnabled] = createSignal(false);
  const [groupDlLimit, setGroupDlLimit] = createSignal(0);
  const [groupUlEnabled, setGroupUlEnabled] = createSignal(false);
  const [groupUlLimit, setGroupUlLimit] = createSignal(0);
  const [groupHonors, setGroupHonors] = createSignal(true);

  // --- 4. Network settings ---
  const [peerPort, setPeerPort] = createSignal(51413);
  const [peerPortRandomOnStart, setPeerPortRandomOnStart] = createSignal(false);
  const [portForwardingEnabled, setPortForwardingEnabled] = createSignal(false);
  const [dhtEnabled, setDhtEnabled] = createSignal(true);
  const [pexEnabled, setPexEnabled] = createSignal(true);
  const [lpdEnabled, setLpdEnabled] = createSignal(false);
  const [utpEnabled, setUtpEnabled] = createSignal(true);
  const [encryption, setEncryption] = createSignal('preferred');
  const [antiBruteForceEnabled, setAntiBruteForceEnabled] = createSignal(false);
  const [antiBruteForceThreshold, setAntiBruteForceThreshold] = createSignal(10);
  const [preferredTransports, setPreferredTransports] = createSignal('utp,tcp');
  const [sequentialDownload, setSequentialDownload] = createSignal(false);

  // --- 5. Connection (Peer) limits ---
  const [peerLimitGlobal, setPeerLimitGlobal] = createSignal(200);
  const [peerLimitPerTorrent, setPeerLimitPerTorrent] = createSignal(50);

  // --- 6. Seeding limits ---
  const [seedRatioLimited, setSeedRatioLimited] = createSignal(false);
  const [seedRatioLimit, setSeedRatioLimit] = createSignal(2.0);
  const [idleSeedingLimitEnabled, setIdleSeedingLimitEnabled] = createSignal(false);
  const [idleSeedingLimit, setIdleSeedingLimit] = createSignal(30);

  // --- 7. Queue limits ---
  const [downloadQueueSize, setDownloadQueueSize] = createSignal(5);
  const [downloadQueueEnabled, setDownloadQueueEnabled] = createSignal(true);
  const [seedQueueSize, setSeedQueueSize] = createSignal(5);
  const [seedQueueEnabled, setSeedQueueEnabled] = createSignal(true);
  const [queueStalledEnabled, setQueueStalledEnabled] = createSignal(false);
  const [queueStalledMinutes, setQueueStalledMinutes] = createSignal(30);

  // --- 8. Custom Labels library ---
  const [savedLabels, setSavedLabels] = createSignal<string[]>([]);
  const [torrentLabels, setTorrentLabels] = createSignal<string[]>([]);
  const [newLabelText, setNewLabelText] = createSignal('');

  // --- 9. Blocklist & Port test ---
  const [blocklistEnabled, setBlocklistEnabled] = createSignal(false);
  const [blocklistUrl, setBlocklistUrl] = createSignal('');
  const [blocklistSize, setBlocklistSize] = createSignal(0);
  const [portTestResult, setPortTestResult] = createSignal('');
  const [portTestClass, setPortTestClass] = createSignal('stat-port-unknown');
  const [portTesting, setPortTesting] = createSignal(false);
  const [ipProtocol, setIpProtocol] = createSignal('');

  // --- 10. RPC Information ---
  const [rpcVersion, setRpcVersion] = createSignal(0);
  const [rpcVersionSemver, setRpcVersionSemver] = createSignal('');
  const [rpcVersionMinimum, setRpcVersionMinimum] = createSignal(0);
  const [sessionId, setSessionId] = createSignal('');

  // --- 11. Script Linkages ---
  const [scriptTorrentAddedEnabled, setScriptTorrentAddedEnabled] = createSignal(false);
  const [scriptTorrentAddedFilename, setScriptTorrentAddedFilename] = createSignal('');
  const [scriptTorrentDoneEnabled, setScriptTorrentDoneEnabled] = createSignal(false);
  const [scriptTorrentDoneFilename, setScriptTorrentDoneFilename] = createSignal('');
  const [scriptTorrentDoneSeedingEnabled, setScriptTorrentDoneSeedingEnabled] = createSignal(false);
  const [scriptTorrentDoneSeedingFilename, setScriptTorrentDoneSeedingFilename] = createSignal('');

  // --- 12. Advanced ---
  const [cacheSizeMb, setCacheSizeMb] = createSignal(4);
  const [cacheSizeMib, setCacheSizeMib] = createSignal(4);
  const [defaultTrackers, setDefaultTrackers] = createSignal('');

  // Load Bandwidth Groups from Daemon
  const loadBandwidthGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await rpcCall<any>('group_get', {});
      const list = res.group || res.groups || [];
      setBandwidthGroups(list);
    } catch (e) {
      console.warn('Failed to load bandwidth groups', e);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Sync settings when session query returns data
  createEffect(() => {
    const s = session.data;
    if (!s) return;

    setDownloadDir(s.download_dir || '');
    setIncompleteDirEnabled(s.incomplete_dir_enabled || false);
    setIncompleteDir(s.incomplete_dir || '');
    setStartAddedTorrents(s.start_added_torrents ?? true);
    setRenamePartialFiles(s.rename_partial_files ?? true);
    setTrashOriginalTorrentFiles(s.trash_original_torrent_files || false);

    setSpeedLimitDownEnabled(s.speed_limit_down_enabled || false);
    setSpeedLimitDown(s.speed_limit_down || 100);
    setSpeedLimitUpEnabled(s.speed_limit_up_enabled || false);
    setSpeedLimitUp(s.speed_limit_up || 100);
    setAltSpeedEnabled(s.alt_speed_enabled || false);
    setAltSpeedDown(s.alt_speed_down || 50);
    setAltSpeedUp(s.alt_speed_up || 50);
    setAltSpeedTimeEnabled(s.alt_speed_time_enabled || false);
    setAltSpeedTimeBegin(minutesToTime(s.alt_speed_time_begin || 540));
    setAltSpeedTimeEnd(minutesToTime(s.alt_speed_time_end || 1020));
    setAltSpeedTimeDay(s.alt_speed_time_day ?? 127);

    setPeerPort(s.peer_port || 51413);
    setPeerPortRandomOnStart(s.peer_port_random_on_start || false);
    setPortForwardingEnabled(s.port_forwarding_enabled || false);
    setDhtEnabled(s.dht_enabled ?? true);
    setPexEnabled(s.pex_enabled ?? true);
    setLpdEnabled(s.lpd_enabled || false);
    setUtpEnabled(s.utp_enabled ?? true);
    setEncryption(s.encryption || 'preferred');
    setAntiBruteForceEnabled(s.anti_brute_force_enabled || false);
    setAntiBruteForceThreshold(s.anti_brute_force_threshold || 10);
    setPreferredTransports(s.preferred_transports || 'utp,tcp');
    setSequentialDownload(s.sequential_download || false);

    setPeerLimitGlobal(s.peer_limit_global || 200);
    setPeerLimitPerTorrent(s.peer_limit_per_torrent || 50);

    setSeedRatioLimited(s.seed_ratio_limited || false);
    setSeedRatioLimit(s.seed_ratio_limit || 2.0);
    setIdleSeedingLimitEnabled(s.idle_seeding_limit_enabled || false);
    setIdleSeedingLimit(s.idle_seeding_limit || 30);

    setDownloadQueueSize(s.download_queue_size || 5);
    setDownloadQueueEnabled(s.download_queue_enabled ?? true);
    setSeedQueueSize(s.seed_queue_size || 5);
    setSeedQueueEnabled(s.seed_queue_enabled ?? true);
    setQueueStalledEnabled(s.queue_stalled_enabled || false);
    setQueueStalledMinutes(s.queue_stalled_minutes || 30);

    setBlocklistEnabled(s.blocklist_enabled || false);
    setBlocklistUrl(s.blocklist_url || '');
    setBlocklistSize(s.blocklist_size || 0);

    setRpcVersion(s.rpc_version || 0);
    setRpcVersionSemver(s.rpc_version_semver || '');
    setRpcVersionMinimum(s.rpc_version_minimum || 0);
    setSessionId(s.session_id || '');

    setScriptTorrentAddedEnabled(s.script_torrent_added_enabled || false);
    setScriptTorrentAddedFilename(s.script_torrent_added_filename || '');
    setScriptTorrentDoneEnabled(s.script_torrent_done_enabled || false);
    setScriptTorrentDoneFilename(s.script_torrent_done_filename || '');
    setScriptTorrentDoneSeedingEnabled(s.script_torrent_done_seeding_enabled || false);
    setScriptTorrentDoneSeedingFilename(s.script_torrent_done_seeding_filename || '');

    setCacheSizeMb(s.cache_size_mb || 4);
    setCacheSizeMib(s.cache_size_mib || s.cache_size_mb || 4);
    setDefaultTrackers(s.default_trackers || '');
  });

  // Load bandwidth groups and labels when modal is open and specific tabs are clicked
  createEffect(() => {
    if (showSettingsModal()) {
      if (activeTab() === 'groups') {
        loadBandwidthGroups();
      }
      if (activeTab() === 'labels') {
        const list = JSON.parse(localStorage.getItem('twc-label-library') || '[]');
        setSavedLabels(list);
        // Collect all labels from torrents
        const tLabels = new Set<string>();
        for (const t of Object.values(torrentStore.items)) {
          if (t.labels) {
            for (const lbl of t.labels) tLabels.add(lbl);
          }
        }
        setTorrentLabels([...tLabels].sort());
      }
    }
  });

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setSaving(true);

    const args: Record<string, any> = {
      download_dir: downloadDir(),
      incomplete_dir_enabled: incompleteDirEnabled(),
      incomplete_dir: incompleteDir(),
      start_added_torrents: startAddedTorrents(),
      rename_partial_files: renamePartialFiles(),
      trash_original_torrent_files: trashOriginalTorrentFiles(),

      speed_limit_down_enabled: speedLimitDownEnabled(),
      speed_limit_down: Number(speedLimitDown()),
      speed_limit_up_enabled: speedLimitUpEnabled(),
      speed_limit_up: Number(speedLimitUp()),
      alt_speed_enabled: altSpeedEnabled(),
      alt_speed_down: Number(altSpeedDown()),
      alt_speed_up: Number(altSpeedUp()),
      alt_speed_time_enabled: altSpeedTimeEnabled(),
      alt_speed_time_begin: timeToMinutes(altSpeedTimeBegin()),
      alt_speed_time_end: timeToMinutes(altSpeedTimeEnd()),
      alt_speed_time_day: Number(altSpeedTimeDay()),

      peer_port: Number(peerPort()),
      peer_port_random_on_start: peerPortRandomOnStart(),
      port_forwarding_enabled: portForwardingEnabled(),
      dht_enabled: dhtEnabled(),
      pex_enabled: pexEnabled(),
      lpd_enabled: lpdEnabled(),
      utp_enabled: utpEnabled(),
      encryption: encryption(),
      anti_brute_force_enabled: antiBruteForceEnabled(),
      anti_brute_force_threshold: Number(antiBruteForceThreshold()),
      preferred_transports: preferredTransports(),
      sequential_download: sequentialDownload(),

      peer_limit_global: Number(peerLimitGlobal()),
      peer_limit_per_torrent: Number(peerLimitPerTorrent()),

      seed_ratio_limited: seedRatioLimited(),
      seed_ratio_limit: Number(seedRatioLimit()),
      idle_seeding_limit_enabled: idleSeedingLimitEnabled(),
      idle_seeding_limit: Number(idleSeedingLimit()),

      download_queue_size: Number(downloadQueueSize()),
      download_queue_enabled: downloadQueueEnabled(),
      seed_queue_size: Number(seedQueueSize()),
      seed_queue_enabled: seedQueueEnabled(),
      queue_stalled_enabled: queueStalledEnabled(),
      queue_stalled_minutes: Number(queueStalledMinutes()),

      blocklist_enabled: blocklistEnabled(),
      blocklist_url: blocklistUrl(),

      script_torrent_added_enabled: scriptTorrentAddedEnabled(),
      script_torrent_added_filename: scriptTorrentAddedFilename(),
      script_torrent_done_enabled: scriptTorrentDoneEnabled(),
      script_torrent_done_filename: scriptTorrentDoneFilename(),
      script_torrent_done_seeding_enabled: scriptTorrentDoneSeedingEnabled(),
      script_torrent_done_seeding_filename: scriptTorrentDoneSeedingFilename(),

      default_trackers: defaultTrackers(),
    };

    // Use appropriate cache field based on RPC version
    if (rpcVersion() >= 17) {
      args.cache_size_mib = Number(cacheSizeMib());
    } else {
      args.cache_size_mb = Number(cacheSizeMb());
    }

    try {
      await rpcCall('session_set', args);
      showToast(t('dialog.settings.save_success'), 'success');
      session.refetch();
      closeSettingsModal();
    } catch (err) {
      console.error('Failed to update session settings', err);
      showToast(t('dialog.settings.save_failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Bandwidth Group actions ---
  const handleEditGroup = (g: any) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupDlEnabled(g.speed_limit_down_enabled || false);
    setGroupDlLimit(g.speed_limit_down || 0);
    setGroupUlEnabled(g.speed_limit_up_enabled || false);
    setGroupUlLimit(g.speed_limit_up || 0);
    setGroupHonors(g.honors_session_limits !== false);
  };

  const handleCreateGroup = () => {
    setEditingGroup({ isNew: true });
    setGroupName('');
    setGroupDlEnabled(false);
    setGroupDlLimit(100);
    setGroupUlEnabled(false);
    setGroupUlLimit(100);
    setGroupHonors(true);
  };

  const handleSaveGroup = async (e: Event) => {
    e.preventDefault();
    if (!groupName().trim()) return;

    try {
      await rpcCall('group_set', {
        name: groupName().trim(),
        speed_limit_down_enabled: groupDlEnabled(),
        speed_limit_down: Number(groupDlLimit()),
        speed_limit_up_enabled: groupUlEnabled(),
        speed_limit_up: Number(groupUlLimit()),
        honors_session_limits: groupHonors(),
      });
      showToast(t('dialog.settings.group_save_success'), 'success');
      setEditingGroup(null);
      loadBandwidthGroups();
    } catch (err) {
      showToast(t('dialog.settings.group_save_failed'), 'error');
    }
  };

  const handleDeleteGroup = async (name: string) => {
    try {
      // Clearing group controls deletes/resets it in Transmission
      await rpcCall('group_set', {
        name,
        speed_limit_down_enabled: false,
        speed_limit_up_enabled: false,
        speed_limit_down: 0,
        speed_limit_up: 0,
        honors_session_limits: true,
      });
      showToast(t('dialog.settings.group_delete_success', { name }), 'success');
      loadBandwidthGroups();
    } catch (e) {
      showToast(t('dialog.settings.group_delete_failed'), 'error');
    }
  };

  // --- Custom Labels actions ---
  const handleAddLabel = (e: Event) => {
    e.preventDefault();
    const name = newLabelText().trim();
    if (!name) return;

    if (savedLabels().includes(name)) {
      showToast(t('dialog.label.exists_warn'), 'warning');
      return;
    }

    const updated = [...savedLabels(), name].sort();
    setSavedLabels(updated);
    localStorage.setItem('twc-label-library', JSON.stringify(updated));
    setNewLabelText('');
  };

  const handleDeleteLabel = (name: string) => {
    const updated = savedLabels().filter((l) => l !== name);
    setSavedLabels(updated);
    localStorage.setItem('twc-label-library', JSON.stringify(updated));
  };

  // --- Blocklist & Port actions ---
  const handleUpdateBlocklist = async () => {
    try {
      const res = await rpcCall<any>('blocklist_update', {});
      const size = res.blocklist_size || 0;
      setBlocklistSize(size);
      showToast(t('dialog.settings.blocklist_updated', { n: size }), 'success');
      session.refetch();
    } catch (e) {
      showToast(t('dialog.settings.update_failed'), 'error');
    }
  };

  const handleTestPort = async () => {
    setPortTesting(true);
    setPortTestResult(t('dialog.settings.testing'));
    setPortTestClass('stat-port-unknown');

    const tryPortTest = async (protocol?: string): Promise<{ open: boolean; protocol: string }> => {
      const args: Record<string, any> = {};
      if (protocol && rpcVersion() >= 19) {
        args.ip_protocol = protocol;
      }
      const res = await rpcCall<any>('port_test', args);
      const usedProtocol = res.ip_protocol || protocol || 'unknown';
      return { open: !!res.port_is_open, protocol: usedProtocol };
    };

    try {
      const selectedProtocol = ipProtocol();
      let result;

      if (selectedProtocol) {
        // User explicitly chose a protocol
        result = await tryPortTest(selectedProtocol);
      } else {
        // Auto: try IPv4 first, then IPv6 if IPv4 fails
        try {
          result = await tryPortTest('ipv4');
        } catch {
          try {
            result = await tryPortTest('ipv6');
          } catch {
            result = { open: false, protocol: 'unknown' };
          }
        }
      }

      if (result.open) {
        setPortTestResult(`✓ ${t('dialog.settings.port_open')} (${result.protocol.toUpperCase()})`);
        setPortTestClass('stat-port-open');
      } else {
        setPortTestResult(`✗ ${t('dialog.settings.port_closed')} (${result.protocol.toUpperCase()})`);
        setPortTestClass('stat-port-closed');
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('No Response') || msg.includes('Couldn')) {
        setPortTestResult(`✗ ${t('dialog.settings.port_closed')} - No Response`);
      } else {
        setPortTestResult(`✗ ${t('dialog.settings.test_failed')}`);
      }
      setPortTestClass('stat-port-closed');
    } finally {
      setPortTesting(false);
    }
  };

  // --- Alternate Speed daymask bitwise toggles ---
  const isDayActive = (day: number) => (altSpeedTimeDay() & day) !== 0;
  const toggleDay = (day: number) => {
    if (isDayActive(day)) {
      setAltSpeedTimeDay(altSpeedTimeDay() & ~day);
    } else {
      setAltSpeedTimeDay(altSpeedTimeDay() | day);
    }
  };

  const tabs = [
    { id: 'download', label: t('dialog.settings.tab_download') },
    { id: 'speed', label: t('dialog.settings.tab_speed') },
    { id: 'groups', label: t('dialog.settings.bandwidth_groups') },
    { id: 'network', label: t('dialog.settings.tab_network') },
    { id: 'peer', label: t('dialog.settings.conn_limits') },
    { id: 'seeding', label: t('dialog.settings.tab_seeding') },
    { id: 'queue', label: t('dialog.settings.tab_queue') },
    { id: 'labels', label: t('sidebar.labels') },
    { id: 'blocklist', label: t('dialog.settings.blocklist') },
    { id: 'rpc', label: 'RPC' },
    { id: 'script', label: t('dialog.settings.script') },
    { id: 'advanced', label: t('dialog.settings.advanced') },
  ];

  return (
    <Show when={showSettingsModal()}>
      <div class="trwm-modal-overlay" onClick={closeSettingsModal}>
        <div class="trwm-modal-box wide xwide" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>{t('dialog.settings.title')}</h2>
            <button class="close-btn" onClick={closeSettingsModal}>×</button>
          </div>

          <form onSubmit={handleSave} class="modal-form">
            <div class="settings-tabs-container">
              {/* Left Tabs Scroller */}
              <div class="settings-tabs-sidebar">
                <For each={tabs}>
                  {(tab) => (
                    <button
                      type="button"
                      class={`tab-btn ${activeTab() === tab.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setEditingGroup(null); // Clear group editor state
                      }}
                    >
                      {tab.label}
                    </button>
                  )}
                </For>
              </div>

              {/* Right Settings panel */}
              <div class="settings-tabs-content">
                {/* 1. Download settings */}
                <Show when={activeTab() === 'download'}>
                  <div class="settings-group">
                    <div class="form-group">
                      <label>{t('dialog.settings.download_dir')}</label>
                      <input
                        type="text"
                        value={downloadDir()}
                        onInput={(e) => setDownloadDir(e.currentTarget.value)}
                      />
                    </div>

                    <div class="form-group">
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          checked={incompleteDirEnabled()}
                          onChange={(e) => setIncompleteDirEnabled(e.currentTarget.checked)}
                        />
                        <span>{t('dialog.settings.incomplete_enabled')}</span>
                      </label>
                      <Show when={incompleteDirEnabled()}>
                        <input
                          type="text"
                          placeholder={t('dialog.settings.incomplete_dir_hint')}
                          value={incompleteDir()}
                          onInput={(e) => setIncompleteDir(e.currentTarget.value)}
                          style={{ 'margin-top': '6px' }}
                        />
                      </Show>
                    </div>

                    <div class="form-divider" />

                    <div class="settings-section">
                      <h4>{t('dialog.settings.add_behavior')}</h4>
                      <div class="checkbox-stack">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={startAddedTorrents()}
                            onChange={(e) => setStartAddedTorrents(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.start_added')}</span>
                        </label>

                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={renamePartialFiles()}
                            onChange={(e) => setRenamePartialFiles(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.rename_partial')}</span>
                        </label>

                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={trashOriginalTorrentFiles()}
                            onChange={(e) => setTrashOriginalTorrentFiles(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.trash_torrent')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 2. Speed settings */}
                <Show when={activeTab() === 'speed'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('dialog.settings.global_speed')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={speedLimitDownEnabled()}
                            onChange={(e) => setSpeedLimitDownEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.dl_limit_enabled')} (KB/s):</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!speedLimitDownEnabled()}
                          value={speedLimitDown()}
                          onInput={(e) => setSpeedLimitDown(Number(e.currentTarget.value))}
                        />
                      </div>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={speedLimitUpEnabled()}
                            onChange={(e) => setSpeedLimitUpEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.ul_limit_enabled')} (KB/s):</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!speedLimitUpEnabled()}
                          value={speedLimitUp()}
                          onInput={(e) => setSpeedLimitUp(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('toolbar.alt_speed')}</h4>
                      <div class="form-row">
                        <span class="flex-1 text-sm">{t('dialog.settings.download_limit')} (KB/s):</span>
                        <input
                          type="number"
                          class="w-24 text-right"
                          value={altSpeedDown()}
                          onInput={(e) => setAltSpeedDown(Number(e.currentTarget.value))}
                        />
                      </div>
                      <div class="form-row">
                        <span class="flex-1 text-sm">{t('dialog.settings.upload_limit')} (KB/s):</span>
                        <input
                          type="number"
                          class="w-24 text-right"
                          value={altSpeedUp()}
                          onInput={(e) => setAltSpeedUp(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>

                    <div class="settings-section">
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={altSpeedTimeEnabled()}
                            onChange={(e) => setAltSpeedTimeEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.alt_speed_time')}</span>
                        </label>
                      </div>

                      <Show when={altSpeedTimeEnabled()}>
                        <div class="form-grid">
                          <div class="form-group">
                            <label>{t('dialog.settings.start_time')}</label>
                            <input
                              type="time"
                              value={altSpeedTimeBegin()}
                              onInput={(e) => setAltSpeedTimeBegin(e.currentTarget.value)}
                            />
                          </div>
                          <div class="form-group">
                            <label>{t('dialog.settings.end_time')}</label>
                            <input
                              type="time"
                              value={altSpeedTimeEnd()}
                              onInput={(e) => setAltSpeedTimeEnd(e.currentTarget.value)}
                            />
                          </div>
                        </div>

                        <div class="form-group">
                          <label>{t('dialog.settings.days')}</label>
                          <div class="daymask-presets flex-row gap-2 mb-2">
                            <button
                              type="button"
                              class="trwm-btn-sm"
                              onClick={() => setAltSpeedTimeDay(127)}
                            >
                              {t('days.every')}
                            </button>
                            <button
                              type="button"
                              class="trwm-btn-sm"
                              onClick={() => setAltSpeedTimeDay(62)}
                            >
                              {t('days.work')}
                            </button>
                            <button
                              type="button"
                              class="trwm-btn-sm"
                              onClick={() => setAltSpeedTimeDay(65)}
                            >
                              {t('days.weekend')}
                            </button>
                          </div>
                          <div class="daymask-checkboxes" style={{ "display": "flex", "flex-direction": "row", "gap": "6px", "flex-wrap": "nowrap", "overflow-x": "auto" }}>
                            <For
                              each={[
                                { bit: 1, label: t('days.sun') },
                                { bit: 2, label: t('days.mon') },
                                { bit: 4, label: t('days.tue') },
                                { bit: 8, label: t('days.wed') },
                                { bit: 16, label: t('days.thu') },
                                { bit: 32, label: t('days.fri') },
                                { bit: 64, label: t('days.sat') },
                              ]}
                            >
                              {(day) => (
                                <label class="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={isDayActive(day.bit)}
                                    onChange={() => toggleDay(day.bit)}
                                  />
                                  <span>{day.label}</span>
                                </label>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* 3. Bandwidth Groups */}
                <Show when={activeTab() === 'groups'}>
                  <div class="settings-group">
                    <Show
                      when={editingGroup()}
                      fallback={
                        <div class="groups-manager-list">
                          <div class="groups-header">
                            <span class="groups-hint-text">{t('dialog.settings.groups_hint')}</span>
                            <button
                              type="button"
                              class="trwm-btn primary"
                              onClick={handleCreateGroup}
                            >
                              {t('dialog.settings.group_add')}
                            </button>
                          </div>

                          <Show when={loadingGroups()}>
                            <div class="text-center text-secondary py-6">{t('common.loading')}</div>
                          </Show>

                          <Show
                            when={!loadingGroups() && bandwidthGroups().length > 0}
                            fallback={
                              <Show when={!loadingGroups()}>
                                <div class="empty-list-note">{t('dialog.settings.no_groups')}</div>
                              </Show>
                            }
                          >
                            <div class="groups-cards-grid">
                              <For each={bandwidthGroups()}>
                                {(g) => (
                                  <div class="group-card">
                                    <div class="group-card-header flex-row justify-between align-center">
                                      <span class="group-card-title">{g.name}</span>
                                      <div class="group-card-actions flex-row gap-2">
                                        <button
                                          type="button"
                                          class="trwm-btn-sm"
                                          onClick={() => handleEditGroup(g)}
                                        >
                                          {t('dialog.settings.group_edit')}
                                        </button>
                                        <button
                                          type="button"
                                          class="trwm-btn-sm danger"
                                          onClick={() => handleDeleteGroup(g.name)}
                                        >
                                          {t('dialog.settings.group_delete')}
                                        </button>
                                      </div>
                                    </div>
                                    <div class="group-card-body">
                                      <div class="group-info-row">
                                        <span>{t('dialog.settings.group_download_limit')}:</span>
                                        <span class="text-mono">
                                          {g.speed_limit_down_enabled
                                            ? `${g.speed_limit_down} KB/s`
                                            : t('dialog.settings.group_no_limit')}
                                        </span>
                                      </div>
                                      <div class="group-info-row">
                                        <span>{t('dialog.settings.group_upload_limit')}:</span>
                                        <span class="text-mono">
                                          {g.speed_limit_up_enabled
                                            ? `${g.speed_limit_up} KB/s`
                                            : t('dialog.settings.group_no_limit')}
                                        </span>
                                      </div>
                                      <div class="group-info-row">
                                        <span>{t('dialog.settings.group_honors_session')}:</span>
                                        <span>{g.honors_session_limits ? '✓' : '✗'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      }
                    >
                      {/* Editor Sub-panel */}
                      <div class="group-editor-panel">
                        <h4>
                          {editingGroup()?.isNew
                            ? t('dialog.settings.group_add_title')
                            : t('dialog.settings.group_edit_title', { name: editingGroup()?.name })}
                        </h4>
                        <div class="form-group">
                          <label>{t('dialog.settings.group_name')}</label>
                          <input
                            type="text"
                            class={editingGroup()?.isNew ? '' : 'readonly-input'}
                            value={groupName()}
                            onInput={(e) => setGroupName(e.currentTarget.value)}
                            readOnly={!editingGroup()?.isNew}
                          />
                        </div>

                        <div class="form-group mt-4">
                          <label>{t('dialog.settings.group_download_limit')}</label>
                          <div class="flex-row align-center gap-4">
                            <input
                              type="checkbox"
                              id="grp-dl-en"
                              checked={groupDlEnabled()}
                              onChange={(e) => setGroupDlEnabled(e.currentTarget.checked)}
                            />
                            <label for="grp-dl-en">{t('dialog.settings.dl_limit_enabled')}</label>
                            <input
                              type="number"
                              class="w-32 text-right ml-auto"
                              value={groupDlLimit()}
                              disabled={!groupDlEnabled()}
                              onInput={(e) => setGroupDlLimit(Number(e.currentTarget.value))}
                            />
                            <span>KB/s</span>
                          </div>
                        </div>

                        <div class="form-group mt-4">
                          <label>{t('dialog.settings.group_upload_limit')}</label>
                          <div class="flex-row align-center gap-4">
                            <input
                              type="checkbox"
                              id="grp-ul-en"
                              checked={groupUlEnabled()}
                              onChange={(e) => setGroupUlEnabled(e.currentTarget.checked)}
                            />
                            <label for="grp-ul-en">{t('dialog.settings.ul_limit_enabled')}</label>
                            <input
                              type="number"
                              class="w-32 text-right ml-auto"
                              value={groupUlLimit()}
                              disabled={!groupUlEnabled()}
                              onInput={(e) => setGroupUlLimit(Number(e.currentTarget.value))}
                            />
                            <span>KB/s</span>
                          </div>
                        </div>

                        <div class="form-group flex-row align-center mt-4">
                          <input
                            type="checkbox"
                            id="grp-honors"
                            checked={groupHonors()}
                            onChange={(e) => setGroupHonors(e.currentTarget.checked)}
                          />
                          <label for="grp-honors">{t('dialog.settings.group_honors_session')}</label>
                        </div>

                        <div class="flex-row gap-2 mt-6">
                          <button
                            type="button"
                            class="trwm-btn primary"
                            onClick={handleSaveGroup}
                            disabled={!groupName().trim()}
                          >
                            {t('dialog.settings.save')}
                          </button>
                          <button
                            type="button"
                            class="trwm-btn"
                            onClick={() => setEditingGroup(null)}
                          >
                            {t('dialog.cancel')}
                          </button>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* 4. Network settings */}
                <Show when={activeTab() === 'network'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('dialog.settings.port_settings')}</h4>
                      <div class="form-row">
                        <div class="form-group" style={{ flex: '1', 'min-width': '120px' }}>
                          <label>{t('dialog.settings.listen_port')}</label>
                          <input
                            type="number"
                            value={peerPort()}
                            onInput={(e) => setPeerPort(Number(e.currentTarget.value))}
                          />
                        </div>
                        <label class="checkbox-label" style={{ 'margin-top': '20px' }}>
                          <input
                            type="checkbox"
                            id="rand-port"
                            checked={peerPortRandomOnStart()}
                            onChange={(e) => setPeerPortRandomOnStart(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.random_port')}</span>
                        </label>
                      </div>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="port-fwd"
                            checked={portForwardingEnabled()}
                            onChange={(e) => setPortForwardingEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.port_forwarding')}</span>
                        </label>
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.protocols')}</h4>
                      <div class="checkbox-grid-2x2">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={dhtEnabled()}
                            onChange={(e) => setDhtEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.dht')}</span>
                        </label>
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={pexEnabled()}
                            onChange={(e) => setPexEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.pex')}</span>
                        </label>
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={lpdEnabled()}
                            onChange={(e) => setLpdEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.lpd')}</span>
                        </label>
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={utpEnabled()}
                            onChange={(e) => setUtpEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.utp')}</span>
                        </label>
                      </div>

                      <div class="form-group">
                        <label>{t('detail.peers.encryption')}</label>
                        <select
                          value={encryption()}
                          onChange={(e) => setEncryption(e.currentTarget.value)}
                        >
                          <option value="required">{t('dialog.settings.enc_required')}</option>
                          <option value="preferred">{t('dialog.settings.enc_preferred')}</option>
                          <option value="tolerated">{t('dialog.settings.enc_tolerated')}</option>
                        </select>
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.security')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="brute-en"
                            checked={antiBruteForceEnabled()}
                            onChange={(e) => setAntiBruteForceEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.anti_brute')}</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!antiBruteForceEnabled()}
                          value={antiBruteForceThreshold()}
                          onInput={(e) => setAntiBruteForceThreshold(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.transport_pref')}</h4>
                      <div class="form-group">
                        <label>{t('dialog.settings.pref_transports')}</label>
                        <select
                          value={preferredTransports()}
                          onChange={(e) => setPreferredTransports(e.currentTarget.value)}
                        >
                          <option value="utp,tcp">{t('dialog.settings.pref_utp_tcp')}</option>
                          <option value="tcp,utp">{t('dialog.settings.pref_tcp_utp')}</option>
                          <option value="utp">{t('dialog.settings.pref_utp')}</option>
                          <option value="tcp">{t('dialog.settings.pref_tcp')}</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="seq-dl"
                            checked={sequentialDownload()}
                            onChange={(e) => setSequentialDownload(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.add.sequential')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 5. Peers / Connection Limits */}
                <Show when={activeTab() === 'peer'}>
                  <div class="settings-group">
                    <div class="form-grid">
                      <div class="form-group">
                        <label>{t('dialog.settings.global_peer_limit')}</label>
                        <input
                          type="number"
                          value={peerLimitGlobal()}
                          onInput={(e) => setPeerLimitGlobal(Number(e.currentTarget.value))}
                        />
                      </div>
                      <div class="form-group">
                        <label>{t('mobile.max_peers')}</label>
                        <input
                          type="number"
                          value={peerLimitPerTorrent()}
                          onInput={(e) => setPeerLimitPerTorrent(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 6. Seeding limits */}
                <Show when={activeTab() === 'seeding'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('detail.settings.seed_ratio')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={seedRatioLimited()}
                            onChange={(e) => setSeedRatioLimited(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          class="w-24 text-right"
                          disabled={!seedRatioLimited()}
                          value={seedRatioLimit()}
                          onInput={(e) => setSeedRatioLimit(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>
                    <div class="settings-section">
                      <h4>{t('detail.settings.seed_idle')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={idleSeedingLimitEnabled()}
                            onChange={(e) => setIdleSeedingLimitEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!idleSeedingLimitEnabled()}
                          value={idleSeedingLimit()}
                          onInput={(e) => setIdleSeedingLimit(Number(e.currentTarget.value))}
                        />
                        <span class="text-sm text-secondary">({t('times.min')})</span>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 7. Queue limits */}
                <Show when={activeTab() === 'queue'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('dialog.settings.dl_queue')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="dl-q-en"
                            checked={downloadQueueEnabled()}
                            onChange={(e) => setDownloadQueueEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.max_dl')}:</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!downloadQueueEnabled()}
                          value={downloadQueueSize()}
                          onInput={(e) => setDownloadQueueSize(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.seed_queue')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="ul-q-en"
                            checked={seedQueueEnabled()}
                            onChange={(e) => setSeedQueueEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.max_seed')}:</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!seedQueueEnabled()}
                          value={seedQueueSize()}
                          onInput={(e) => setSeedQueueSize(Number(e.currentTarget.value))}
                        />
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.stalled_detection')}</h4>
                      <div class="form-row">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="stall-en"
                            checked={queueStalledEnabled()}
                            onChange={(e) => setQueueStalledEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.stalled_timeout')}:</span>
                        </label>
                        <input
                          type="number"
                          class="w-24 text-right"
                          disabled={!queueStalledEnabled()}
                          value={queueStalledMinutes()}
                          onInput={(e) => setQueueStalledMinutes(Number(e.currentTarget.value))}
                        />
                        <span class="text-sm text-secondary">({t('times.min')})</span>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 8. Custom Labels library */}
                <Show when={activeTab() === 'labels'}>
                  <div class="settings-group">
                    <div class="labels-library-manager">
                      <h4>{t('dialog.label.saved_label')}</h4>
                      <form onSubmit={handleAddLabel} class="flex-row gap-2 mb-4">
                        <input
                          type="text"
                          placeholder={t('dialog.label.placeholder')}
                          value={newLabelText()}
                          onInput={(e) => setNewLabelText(e.currentTarget.value)}
                        />
                        <button type="submit" class="trwm-btn primary" style={{ 'white-space': 'nowrap' }}>
                          {t('dialog.add.submit')}
                        </button>
                      </form>

                      <Show
                        when={(() => {
                          const saved = new Set(savedLabels());
                          const fromTorrent = new Set(torrentLabels());
                          const all = new Set([...saved, ...fromTorrent]);
                          return all.size > 0;
                        })()}
                        fallback={<div class="empty-list-note">{t('dialog.label.no_labels')}</div>}
                      >
                        <div class="labels-library-list flex-col gap-2">
                          <For each={(() => {
                            const saved = new Set(savedLabels());
                            const fromTorrent = new Set(torrentLabels());
                            const all = new Set([...saved, ...fromTorrent]);
                            return [...all].sort();
                          })()}>
                            {(lbl) => {
                              const isFromTorrent = torrentLabels().includes(lbl);
                              const isSaved = savedLabels().includes(lbl);
                              const source = isFromTorrent && isSaved
                                ? t('dialog.label.source_both')
                                : isFromTorrent
                                  ? t('dialog.label.source_torrent')
                                  : t('dialog.label.source_custom');
                              return (
                                <div class="label-library-item flex-row justify-between align-center">
                                  <div class="label-library-info">
                                    <span class="label-badge text-mono">{lbl}</span>
                                    <span class="label-source-tag">{source}</span>
                                  </div>
                                  <Show when={isSaved}>
                                    <button
                                      type="button"
                                      class="trwm-btn-sm danger"
                                      onClick={() => handleDeleteLabel(lbl)}
                                      title={t('dialog.delete.submit')}
                                    >
                                      &times;
                                    </button>
                                  </Show>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* 9. Blocklist & testing */}
                <Show when={activeTab() === 'blocklist'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('dialog.settings.blocklist')}</h4>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            id="bl-en"
                            checked={blocklistEnabled()}
                            onChange={(e) => setBlocklistEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                      </div>
                      <div class="form-group">
                        <label>{t('dialog.settings.blocklist_url')}</label>
                        <input
                          type="text"
                          value={blocklistUrl()}
                          onInput={(e) => setBlocklistUrl(e.currentTarget.value)}
                          disabled={!blocklistEnabled()}
                        />
                      </div>
                      <div class="form-group">
                        <span class="text-sm text-secondary">
                          {t('dialog.settings.rules_count')}:{' '}
                          <strong class="text-mono text-primary">{blocklistSize()}</strong>
                        </span>
                      </div>
                      <div class="flex-row gap-2">
                        <button
                          type="button"
                          class="trwm-btn"
                          onClick={handleUpdateBlocklist}
                          disabled={!blocklistEnabled()}
                        >
                          {t('dialog.settings.update_blocklist')}
                        </button>
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.test_port')}</h4>
                      <div class="form-row flex-wrap gap-4">
                        <Show when={rpcVersion() >= 19}>
                          <div class="form-row gap-2">
                            <label class="text-sm text-secondary">{t('dialog.settings.ip_protocol')}:</label>
                            <select
                              value={ipProtocol()}
                              onChange={(e) => setIpProtocol(e.currentTarget.value)}
                              style={{ padding: '4px', 'border-radius': '4px' }}
                            >
                              <option value="">{t('dialog.settings.ip_protocol_auto')}</option>
                              <option value="ipv4">IPv4</option>
                              <option value="ipv6">IPv6</option>
                            </select>
                          </div>
                        </Show>

                        <button
                          type="button"
                          class="trwm-btn"
                          onClick={handleTestPort}
                          disabled={portTesting()}
                        >
                          {portTesting() ? t('dialog.settings.testing') : t('dialog.settings.test_port')}
                        </button>

                        <Show when={portTestResult()}>
                          <span class={`port-result-badge ${portTestClass()}`}>
                            {portTestResult()}
                          </span>
                        </Show>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 10. RPC Information */}
                <Show when={activeTab() === 'rpc'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>RPC</h4>
                      <div class="form-group">
                        <label>{t('dialog.about.rpc_version')}</label>
                        <input type="text" class="readonly-input" readOnly value={rpcVersion()} />
                      </div>
                      <div class="form-group">
                        <label>{t('dialog.settings.rpc_semver')}</label>
                        <input type="text" class="readonly-input" readOnly value={rpcVersionSemver() || '-'} />
                      </div>
                      <div class="form-group">
                        <label>{t('dialog.settings.rpc_min_version')}</label>
                        <input type="text" class="readonly-input" readOnly value={rpcVersionMinimum()} />
                      </div>
                      <div class="form-group">
                        <label>{t('dialog.settings.session_id')}</label>
                        <input type="text" class="readonly-input text-mono" readOnly value={sessionId()} style={{ 'font-size': '12px' }} />
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 11. Script linkage */}
                <Show when={activeTab() === 'script'}>
                  <div class="settings-group">
                    <div class="settings-section">
                      <h4>{t('dialog.settings.script_added')}</h4>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={scriptTorrentAddedEnabled()}
                            onChange={(e) => setScriptTorrentAddedEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                        <Show when={scriptTorrentAddedEnabled()}>
                          <input
                            type="text"
                            placeholder={t('dialog.settings.script_path')}
                            value={scriptTorrentAddedFilename()}
                            onInput={(e) => setScriptTorrentAddedFilename(e.currentTarget.value)}
                            style={{ 'margin-top': '6px' }}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.script_done')}</h4>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={scriptTorrentDoneEnabled()}
                            onChange={(e) => setScriptTorrentDoneEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                        <Show when={scriptTorrentDoneEnabled()}>
                          <input
                            type="text"
                            placeholder={t('dialog.settings.script_path')}
                            value={scriptTorrentDoneFilename()}
                            onInput={(e) => setScriptTorrentDoneFilename(e.currentTarget.value)}
                            style={{ 'margin-top': '6px' }}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="settings-section">
                      <h4>{t('dialog.settings.script_done_seeding')}</h4>
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            checked={scriptTorrentDoneSeedingEnabled()}
                            onChange={(e) => setScriptTorrentDoneSeedingEnabled(e.currentTarget.checked)}
                          />
                          <span>{t('dialog.settings.enabled')}</span>
                        </label>
                        <Show when={scriptTorrentDoneSeedingEnabled()}>
                          <input
                            type="text"
                            placeholder={t('dialog.settings.script_path')}
                            value={scriptTorrentDoneSeedingFilename()}
                            onInput={(e) => setScriptTorrentDoneSeedingFilename(e.currentTarget.value)}
                            style={{ 'margin-top': '6px' }}
                          />
                        </Show>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* 12. Advanced settings */}
                <Show when={activeTab() === 'advanced'}>
                  <div class="settings-group">
                    <div class="form-group">
                      <label>{t('dialog.tracker.add_label')}</label>
                      <textarea
                        rows="5"
                        placeholder={t('dialog.tracker.format_info')}
                        value={defaultTrackers()}
                        onInput={(e) => setDefaultTrackers(e.currentTarget.value)}
                        style={{ 'font-family': 'var(--font-mono)', 'font-size': '12px' }}
                      />
                    </div>
                    <div class="form-group mt-4">
                      <label>{t('dialog.settings.cache_size')} (MB):</label>
                      <Show
                        when={rpcVersion() >= 17}
                        fallback={
                          <input
                            type="number"
                            value={cacheSizeMb()}
                            onInput={(e) => setCacheSizeMb(Number(e.currentTarget.value))}
                          />
                        }
                      >
                        <input
                          type="number"
                          value={cacheSizeMib()}
                          onInput={(e) => setCacheSizeMib(Number(e.currentTarget.value))}
                        />
                      </Show>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            <div class="modal-footer">
              <button type="submit" class="trwm-btn primary" disabled={saving()}>
                {saving() ? t('common.loading') : t('dialog.settings.save')}
              </button>
              <button
                type="button"
                class="trwm-btn"
                onClick={closeSettingsModal}
                disabled={saving()}
              >
                {t('dialog.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
