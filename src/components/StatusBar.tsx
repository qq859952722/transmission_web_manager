import { Component, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { useSession, useSessionStats, useFreeSpace } from '../api/queries';
import { rpcCall } from '../api/rpc';
import { torrentList, sidebarCounts, torrentStore } from '../store/torrentStore';
import { formatSpeed, formatBytes } from '../utils/format';
import { t } from '../utils/i18n';
import { QuickSettings } from './QuickSettings';
import { Tooltip } from './ui/tooltip';
import { cn } from '../lib/utils';

export const StatusBar: Component = () => {
  const session = useSession();
  const stats = useSessionStats();

  const [portStatus, setPortStatus] = createSignal<'testing' | 'open' | 'closed' | 'unknown'>('unknown');
  const [altSpeedLoading, setAltSpeedLoading] = createSignal(false);
  const connected = () => !torrentStore.error;
  const [showQuickSettings, setShowQuickSettings] = createSignal(false);
  const freeSpace = useFreeSpace(() => session.data?.download_dir);

  const checkPort = async () => {
    setPortStatus('testing');
    try {
      const data = await rpcCall<{ port_is_open: boolean }>('port_test');
      setPortStatus(data.port_is_open ? 'open' : 'closed');
    } catch {
      setPortStatus('unknown');
    }
  };

  onMount(() => {
    const portCheckTimer = setTimeout(checkPort, 3000);
    onCleanup(() => clearTimeout(portCheckTimer));
  });

  const toggleAltSpeed = async () => {
    const s = session.data;
    if (!s || altSpeedLoading()) return;
    setAltSpeedLoading(true);
    try {
      await rpcCall('session_set', { alt_speed_enabled: !s.alt_speed_enabled });
      session.refetch();
    } catch (e) {
      console.error('Failed to toggle alt speed', e);
    } finally {
      setAltSpeedLoading(false);
    }
  };

  const dlSpeed = () => stats.data?.download_speed || 0;
  const ulSpeed = () => stats.data?.upload_speed || 0;
  const counts = sidebarCounts;
  const totalTorrents = () => counts().all;
  const downloadingCount = () => counts().downloading;
  const seedingCount = () => counts().seeding;
  const activeCount = () => counts().active;
  const errorCount = () => counts().error;
  const totalDl = () => stats.data?.cumulative_stats?.downloaded_bytes || 0;
  const totalUl = () => stats.data?.cumulative_stats?.uploaded_bytes || 0;
  
  const globalRatio = () => {
    const dl = totalDl();
    const ul = totalUl();
    if (dl === 0) return '-';
    return (ul / dl).toFixed(2);
  };
  
  const ratioColorClass = () => {
    const r = globalRatio();
    if (r === '-') return '';
    const val = parseFloat(r);
    if (val >= 1) return 'text-success';
    if (val >= 0.5) return 'text-warning';
    return 'text-destructive';
  };
  
  const totalPeers = () => {
    let connected = 0;
    for (const t of torrentList()) {
      connected += t.peers_connected || 0;
    }
    return connected;
  };

  return (
    <div class="flex items-center gap-2.5 w-full h-full px-3 bg-secondary/30 border-t border-border/50 select-none text-xs text-muted-foreground">
      {/* Connection status */}
      <Tooltip text={connected() ? t('status.connected') : t('status.disconnected')}>
        <div class="flex items-center">
          <span class={cn("w-[7px] h-[7px] rounded-full", connected() ? "bg-success shadow-[0_0_6px_var(--success)] animate-pulse" : "bg-destructive")} />
        </div>
      </Tooltip>

      {/* Alt Speed toggle */}
      <Tooltip text={t('toolbar.alt_speed')}>
        <div
          class={cn(
            "flex items-center gap-1.5 px-1.5 h-6 rounded-md cursor-pointer transition-colors",
            session.data?.alt_speed_enabled ? "text-warning font-semibold hover:bg-warning/10" : "hover:bg-muted hover:text-foreground active:bg-muted/80"
          )}
          onClick={toggleAltSpeed}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <Show when={session.data?.alt_speed_enabled}>
            <span class="text-[10px] font-mono">
              {formatSpeed((session.data!.alt_speed_down || 0) * 1024, 0)}/{formatSpeed((session.data!.alt_speed_up || 0) * 1024, 0)}
            </span>
          </Show>
        </div>
      </Tooltip>

      <div class="w-[1px] h-3.5 bg-border/60 mx-0.5" />

      {/* Torrent counts */}
      <div class="flex items-center gap-3">
        {/* Downloading count */}
        <Tooltip text={t('sidebar.status_downloading')}>
          <div class="flex items-center gap-1.5 w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 text-primary">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span class="font-bold text-foreground font-mono">{downloadingCount()}</span>
          </div>
        </Tooltip>

        {/* Seeding count */}
        <Tooltip text={t('sidebar.status_seeding')}>
          <div class="flex items-center gap-1.5 w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 text-success">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span class="font-bold text-foreground font-mono">{seedingCount()}</span>
          </div>
        </Tooltip>

        {/* Total count */}
        <Tooltip text={t('sidebar.status_all')}>
          <div class="flex items-center gap-1.5 w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-3.5 h-3.5 text-muted-foreground">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="font-bold text-foreground font-mono">{totalTorrents()}</span>
          </div>
        </Tooltip>
      </div>

      {/* Peer count */}
      <Tooltip text={t('detail.peers.title')}>
        <div class="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span class="font-mono font-medium">{totalPeers()}</span>
        </div>
      </Tooltip>

      {/* Error count */}
      <Show when={errorCount() > 0}>
        <Tooltip text={t('filter.error')}>
          <div class="flex items-center gap-1.5 text-destructive font-bold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span class="font-mono">{errorCount()}</span>
          </div>
        </Tooltip>
      </Show>

      {/* Global ratio */}
      <Tooltip text={t('detail.general.ratio')}>
        <div class="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span class={cn("font-mono font-bold", ratioColorClass())}>{globalRatio()}</span>
        </div>
      </Tooltip>

      <div class="flex-1" />

      {/* Download speed */}
      <Tooltip text={t('detail.speed.download')}>
        <div class="flex items-center gap-1.5 w-[90px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 text-primary shrink-0">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span class="font-mono font-bold text-primary transition-opacity truncate">{formatSpeed(dlSpeed())}</span>
        </div>
      </Tooltip>

      {/* Upload speed */}
      <Tooltip text={t('detail.speed.upload')}>
        <div class="flex items-center gap-1.5 w-[90px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 text-success shrink-0">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
          <span class="font-mono font-bold text-success transition-opacity truncate">{formatSpeed(ulSpeed())}</span>
        </div>
      </Tooltip>

      <div class="w-[1px] h-3.5 bg-border/60 mx-0.5" />

      {/* Total downloaded / uploaded */}
      <Tooltip text={t('detail.speed.total_download')}>
        <div class="flex items-center gap-1 text-[10px] w-[70px]">
          <span class="font-bold text-primary">↓</span> <span class="font-mono truncate">{formatBytes(totalDl())}</span>
        </div>
      </Tooltip>
      <Tooltip text={t('detail.speed.total_upload')}>
        <div class="flex items-center gap-1 text-[10px] w-[70px]">
          <span class="font-bold text-success">↑</span> <span class="font-mono truncate">{formatBytes(totalUl())}</span>
        </div>
      </Tooltip>

      <div class="w-[1px] h-3.5 bg-border/60 mx-0.5" />

      {/* Free space */}
      <Show when={freeSpace.data !== undefined && freeSpace.data !== null}>
        <Tooltip text={t('stats.free_space')}>
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span class="font-mono">{formatBytes(freeSpace.data!)}</span>
          </div>
        </Tooltip>
        <div class="w-[1px] h-3.5 bg-border/60 mx-0.5" />
      </Show>

      {/* Port status */}
      <Tooltip text={t('dialog.settings.test_port')}>
        <div class="flex items-center gap-1.5 px-1.5 h-6 rounded-md cursor-pointer transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80" onClick={checkPort}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[13px] h-[13px]">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
          </svg>
          <span class={cn("font-medium", portStatus() === 'testing' ? 'text-warning' : portStatus() === 'open' ? 'text-success font-bold' : portStatus() === 'closed' ? 'text-destructive font-bold' : 'text-muted-foreground')}>
            {portStatus() === 'testing' ? t('dialog.settings.testing') : portStatus() === 'open' ? t('status.port_ok') : portStatus() === 'closed' ? t('status.port_closed') : t('common.unknown')}
          </span>
        </div>
      </Tooltip>

      {/* Version */}
      <Show when={session.data?.version}>
        <Tooltip text="Transmission Daemon Version">
          <div class="flex items-center px-1">
            <span class="font-mono opacity-70">v{session.data?.version}</span>
          </div>
        </Tooltip>
      </Show>

      {/* Settings gear */}
      <Tooltip text={t('toolbar.settings')}>
        <div class="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80" onClick={() => setShowQuickSettings(!showQuickSettings())}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-[14px] h-[14px]">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </div>
      </Tooltip>

      <QuickSettings open={showQuickSettings()} onClose={() => setShowQuickSettings(false)} />
    </div>
  );
};
