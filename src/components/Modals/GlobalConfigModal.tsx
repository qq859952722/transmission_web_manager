import { Component, Show, createSignal, createEffect, For } from 'solid-js';
import { closeSettingsModal, showSettingsModal } from '../../store/modalStore';
import { useSession } from '../../api/queries';
import { rpcCall } from '../../api/rpc';
import { torrentStore } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './Modals.css';

// Tab components
import { DownloadTab } from './SettingsTabs/DownloadTab';
import { SpeedTab } from './SettingsTabs/SpeedTab';
import { GroupsTab } from './SettingsTabs/GroupsTab';
import { NetworkTab } from './SettingsTabs/NetworkTab';
import { PeerTab } from './SettingsTabs/PeerTab';
import { SeedingTab } from './SettingsTabs/SeedingTab';
import { QueueTab } from './SettingsTabs/QueueTab';
import { LabelsTab } from './SettingsTabs/LabelsTab';
import { BlocklistTab } from './SettingsTabs/BlocklistTab';
import { RpcTab } from './SettingsTabs/RpcTab';
import { ScriptTab } from './SettingsTabs/ScriptTab';
import { AdvancedTab } from './SettingsTabs/AdvancedTab';

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

type TabId = 'download' | 'speed' | 'groups' | 'network' | 'peer' | 'seeding' | 'queue' | 'labels' | 'blocklist' | 'rpc' | 'script' | 'advanced';

export const GlobalConfigModal: Component = () => {
  const session = useSession();

  const [activeTab, setActiveTab] = createSignal<TabId>('download');
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
  const [altSpeedDown, setAltSpeedDown] = createSignal(50);
  const [altSpeedUp, setAltSpeedUp] = createSignal(50);
  const [altSpeedTimeEnabled, setAltSpeedTimeEnabled] = createSignal(false);
  const [altSpeedTimeBegin, setAltSpeedTimeBegin] = createSignal('09:00');
  const [altSpeedTimeEnd, setAltSpeedTimeEnd] = createSignal('17:00');
  const [altSpeedTimeDay, setAltSpeedTimeDay] = createSignal(127);

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
      alt_speed_enabled: false, // not saved here, it's a toggle
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
        result = await tryPortTest(selectedProtocol);
      } else {
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
        // Provide helpful hint: UPnP may have succeeded but firewall/ISP blocks
        setTimeout(() => {
          showToast(t('dialog.settings.port_closed_hint'), 'info');
        }, 500);
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

  const tabs: { id: TabId; label: string }[] = [
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
                        setActiveTab(tab.id);
                        setEditingGroup(null);
                      }}
                    >
                      {tab.label}
                    </button>
                  )}
                </For>
              </div>

              {/* Right Settings panel */}
              <div class="settings-tabs-content">
                <Show when={activeTab() === 'download'}>
                  <DownloadTab
                    downloadDir={downloadDir} setDownloadDir={setDownloadDir}
                    incompleteDirEnabled={incompleteDirEnabled} setIncompleteDirEnabled={setIncompleteDirEnabled}
                    incompleteDir={incompleteDir} setIncompleteDir={setIncompleteDir}
                    startAddedTorrents={startAddedTorrents} setStartAddedTorrents={setStartAddedTorrents}
                    renamePartialFiles={renamePartialFiles} setRenamePartialFiles={setRenamePartialFiles}
                    trashOriginalTorrentFiles={trashOriginalTorrentFiles} setTrashOriginalTorrentFiles={setTrashOriginalTorrentFiles}
                  />
                </Show>

                <Show when={activeTab() === 'speed'}>
                  <SpeedTab
                    speedLimitDownEnabled={speedLimitDownEnabled} setSpeedLimitDownEnabled={setSpeedLimitDownEnabled}
                    speedLimitDown={speedLimitDown} setSpeedLimitDown={setSpeedLimitDown}
                    speedLimitUpEnabled={speedLimitUpEnabled} setSpeedLimitUpEnabled={setSpeedLimitUpEnabled}
                    speedLimitUp={speedLimitUp} setSpeedLimitUp={setSpeedLimitUp}
                    altSpeedDown={altSpeedDown} setAltSpeedDown={setAltSpeedDown}
                    altSpeedUp={altSpeedUp} setAltSpeedUp={setAltSpeedUp}
                    altSpeedTimeEnabled={altSpeedTimeEnabled} setAltSpeedTimeEnabled={setAltSpeedTimeEnabled}
                    altSpeedTimeBegin={altSpeedTimeBegin} setAltSpeedTimeBegin={setAltSpeedTimeBegin}
                    altSpeedTimeEnd={altSpeedTimeEnd} setAltSpeedTimeEnd={setAltSpeedTimeEnd}
                    altSpeedTimeDay={altSpeedTimeDay} setAltSpeedTimeDay={setAltSpeedTimeDay}
                  />
                </Show>

                <Show when={activeTab() === 'groups'}>
                  <GroupsTab
                    bandwidthGroups={bandwidthGroups}
                    loadingGroups={loadingGroups}
                    editingGroup={editingGroup} setEditingGroup={setEditingGroup}
                    groupName={groupName} setGroupName={setGroupName}
                    groupDlEnabled={groupDlEnabled} setGroupDlEnabled={setGroupDlEnabled}
                    groupDlLimit={groupDlLimit} setGroupDlLimit={setGroupDlLimit}
                    groupUlEnabled={groupUlEnabled} setGroupUlEnabled={setGroupUlEnabled}
                    groupUlLimit={groupUlLimit} setGroupUlLimit={setGroupUlLimit}
                    groupHonors={groupHonors} setGroupHonors={setGroupHonors}
                    onCreateGroup={handleCreateGroup}
                    onSaveGroup={handleSaveGroup}
                    onDeleteGroup={handleDeleteGroup}
                  />
                </Show>

                <Show when={activeTab() === 'network'}>
                  <NetworkTab
                    peerPort={peerPort} setPeerPort={setPeerPort}
                    peerPortRandomOnStart={peerPortRandomOnStart} setPeerPortRandomOnStart={setPeerPortRandomOnStart}
                    portForwardingEnabled={portForwardingEnabled} setPortForwardingEnabled={setPortForwardingEnabled}
                    dhtEnabled={dhtEnabled} setDhtEnabled={setDhtEnabled}
                    pexEnabled={pexEnabled} setPexEnabled={setPexEnabled}
                    lpdEnabled={lpdEnabled} setLpdEnabled={setLpdEnabled}
                    utpEnabled={utpEnabled} setUtpEnabled={setUtpEnabled}
                    encryption={encryption} setEncryption={setEncryption}
                    antiBruteForceEnabled={antiBruteForceEnabled} setAntiBruteForceEnabled={setAntiBruteForceEnabled}
                    antiBruteForceThreshold={antiBruteForceThreshold} setAntiBruteForceThreshold={setAntiBruteForceThreshold}
                    preferredTransports={preferredTransports} setPreferredTransports={setPreferredTransports}
                    sequentialDownload={sequentialDownload} setSequentialDownload={setSequentialDownload}
                  />
                </Show>

                <Show when={activeTab() === 'peer'}>
                  <PeerTab
                    peerLimitGlobal={peerLimitGlobal} setPeerLimitGlobal={setPeerLimitGlobal}
                    peerLimitPerTorrent={peerLimitPerTorrent} setPeerLimitPerTorrent={setPeerLimitPerTorrent}
                  />
                </Show>

                <Show when={activeTab() === 'seeding'}>
                  <SeedingTab
                    seedRatioLimited={seedRatioLimited} setSeedRatioLimited={setSeedRatioLimited}
                    seedRatioLimit={seedRatioLimit} setSeedRatioLimit={setSeedRatioLimit}
                    idleSeedingLimitEnabled={idleSeedingLimitEnabled} setIdleSeedingLimitEnabled={setIdleSeedingLimitEnabled}
                    idleSeedingLimit={idleSeedingLimit} setIdleSeedingLimit={setIdleSeedingLimit}
                  />
                </Show>

                <Show when={activeTab() === 'queue'}>
                  <QueueTab
                    downloadQueueSize={downloadQueueSize} setDownloadQueueSize={setDownloadQueueSize}
                    downloadQueueEnabled={downloadQueueEnabled} setDownloadQueueEnabled={setDownloadQueueEnabled}
                    seedQueueSize={seedQueueSize} setSeedQueueSize={setSeedQueueSize}
                    seedQueueEnabled={seedQueueEnabled} setSeedQueueEnabled={setSeedQueueEnabled}
                    queueStalledEnabled={queueStalledEnabled} setQueueStalledEnabled={setQueueStalledEnabled}
                    queueStalledMinutes={queueStalledMinutes} setQueueStalledMinutes={setQueueStalledMinutes}
                  />
                </Show>

                <Show when={activeTab() === 'labels'}>
                  <LabelsTab
                    savedLabels={savedLabels}
                    torrentLabels={torrentLabels}
                    newLabelText={newLabelText} setNewLabelText={setNewLabelText}
                    onAddLabel={handleAddLabel}
                    onDeleteLabel={handleDeleteLabel}
                  />
                </Show>

                <Show when={activeTab() === 'blocklist'}>
                  <BlocklistTab
                    blocklistEnabled={blocklistEnabled} setBlocklistEnabled={setBlocklistEnabled}
                    blocklistUrl={blocklistUrl} setBlocklistUrl={setBlocklistUrl}
                    blocklistSize={blocklistSize}
                    onUpdateBlocklist={handleUpdateBlocklist}
                    rpcVersion={rpcVersion}
                    ipProtocol={ipProtocol} setIpProtocol={setIpProtocol}
                    portTesting={portTesting}
                    portTestResult={portTestResult}
                    portTestClass={portTestClass}
                    onTestPort={handleTestPort}
                  />
                </Show>

                <Show when={activeTab() === 'rpc'}>
                  <RpcTab
                    rpcVersion={rpcVersion}
                    rpcVersionSemver={rpcVersionSemver}
                    rpcVersionMinimum={rpcVersionMinimum}
                    sessionId={sessionId}
                  />
                </Show>

                <Show when={activeTab() === 'script'}>
                  <ScriptTab
                    scriptTorrentAddedEnabled={scriptTorrentAddedEnabled} setScriptTorrentAddedEnabled={setScriptTorrentAddedEnabled}
                    scriptTorrentAddedFilename={scriptTorrentAddedFilename} setScriptTorrentAddedFilename={setScriptTorrentAddedFilename}
                    scriptTorrentDoneEnabled={scriptTorrentDoneEnabled} setScriptTorrentDoneEnabled={setScriptTorrentDoneEnabled}
                    scriptTorrentDoneFilename={scriptTorrentDoneFilename} setScriptTorrentDoneFilename={setScriptTorrentDoneFilename}
                    scriptTorrentDoneSeedingEnabled={scriptTorrentDoneSeedingEnabled} setScriptTorrentDoneSeedingEnabled={setScriptTorrentDoneSeedingEnabled}
                    scriptTorrentDoneSeedingFilename={scriptTorrentDoneSeedingFilename} setScriptTorrentDoneSeedingFilename={setScriptTorrentDoneSeedingFilename}
                  />
                </Show>

                <Show when={activeTab() === 'advanced'}>
                  <AdvancedTab
                    defaultTrackers={defaultTrackers} setDefaultTrackers={setDefaultTrackers}
                    cacheSizeMb={cacheSizeMb} setCacheSizeMb={setCacheSizeMb}
                    cacheSizeMib={cacheSizeMib} setCacheSizeMib={setCacheSizeMib}
                    rpcVersion={rpcVersion}
                  />
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
