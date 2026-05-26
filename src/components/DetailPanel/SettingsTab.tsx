import { Component, Show, createSignal, createEffect, on } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents, selectedIds } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';
import { Save, FolderInput, Activity, Zap, Users, Download, Upload, Clock } from 'lucide-solid';

export const SettingsTab: Component<{ torrents: Torrent[]; activeTab?: string }> = (props) => {
  const isMulti = () => props.torrents.length > 1;
  const first = () => props.torrents[0];

  const [downloadLimited, setDownloadLimited] = createSignal(false);
  const [downloadLimit, setDownloadLimit] = createSignal(0);
  const [uploadLimited, setUploadLimited] = createSignal(false);
  const [uploadLimit, setUploadLimit] = createSignal(0);
  const [bandwidthPriority, setBandwidthPriority] = createSignal(0);
  const [seedRatioMode, setSeedRatioMode] = createSignal(0);
  const [seedRatioLimit, setSeedRatioLimit] = createSignal(1.5);
  const [seedIdleMode, setSeedIdleMode] = createSignal(0);
  const [seedIdleLimit, setSeedIdleLimit] = createSignal(30);
  const [peerLimit, setPeerLimit] = createSignal(50);
  const [sequentialDownload, setSequentialDownload] = createSignal(false);
  const [sequentialFromPiece, setSequentialFromPiece] = createSignal(0);
  const [saving, setSaving] = createSignal(false);
  const [movePath, setMovePath] = createSignal('');
  const [moving, setMoving] = createSignal(false);

  const syncFormFromTorrent = () => {
    const torrent = first();
    if (!torrent) return;
    setDownloadLimited(torrent.download_limited || false);
    setDownloadLimit(torrent.download_limit || 0);
    setUploadLimited(torrent.upload_limited || false);
    setUploadLimit(torrent.upload_limit || 0);
    setBandwidthPriority(torrent.bandwidth_priority || 0);
    setSeedRatioMode(torrent.seed_ratio_mode || 0);
    setSeedRatioLimit(torrent.seed_ratio_limit || 1.5);
    setSeedIdleMode(torrent.seed_idle_mode || 0);
    setSeedIdleLimit(torrent.seed_idle_limit || 30);
    setPeerLimit(torrent.peer_limit || 50);
    setSequentialDownload(torrent.sequential_download || false);
    setSequentialFromPiece(torrent.sequential_download_from_piece || 0);
    setMovePath(torrent.download_dir || '');
  };

  createEffect(on(selectedIds, syncFormFromTorrent));
  createEffect(on(() => props.activeTab, (tab) => {
    if (tab === 'settings') syncFormFromTorrent();
  }));

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    const ids = props.torrents.map((t) => t.id);
    const args: Record<string, any> = {
      ids, download_limited: downloadLimited(), download_limit: Number(downloadLimit()),
      upload_limited: uploadLimited(), upload_limit: Number(uploadLimit()),
      bandwidth_priority: Number(bandwidthPriority()), seed_ratio_mode: Number(seedRatioMode()),
      seed_ratio_limit: Number(seedRatioLimit()), seed_idle_mode: Number(seedIdleMode()),
      seed_idle_limit: Number(seedIdleLimit()), peer_limit: Number(peerLimit()),
      sequential_download: sequentialDownload(), sequential_download_from_piece: Number(sequentialFromPiece()),
    };
    try {
      await rpcCall('torrent_set', args);
      showToast(t('dialog.settings.save_success'), 'success');
      await fetchTorrents(true);
    } catch (e) {
      showToast(t('dialog.settings.save_failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveLocation = async () => {
    const path = movePath().trim();
    if (!path) return;
    setMoving(true);
    const ids = props.torrents.map((t) => t.id);
    try {
      await rpcCall('torrent_set_location', { ids, location: path, move: true });
      showToast(t('dialog.change_dir.success'), 'success');
      await fetchTorrents(true);
    } catch (e) {
      showToast(t('dialog.change_dir.failed'), 'error');
    } finally {
      setMoving(false);
    }
  };

  const Card = (props: { title: string; icon: any; children: any; class?: string }) => (
    <div class={cn("flex flex-col bg-secondary/30 backdrop-blur-md border border-border/60 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-300", props.class)}>
      <div class="flex items-center gap-1.5 mb-1.5 border-b border-border/40 pb-1.5">
        <div class="p-0.5 bg-primary/10 rounded-md text-primary">
          {props.icon}
        </div>
        <h3 class="text-[11px] font-bold text-foreground m-0 tracking-wide">
          {props.title}
        </h3>
      </div>
      <div class="flex flex-col gap-1.5">{props.children}</div>
    </div>
  );

  const FormRow = (props: { children: any; class?: string }) => (
    <div class={cn("flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground", props.class)}>
      {props.children}
    </div>
  );

  const Input = (props: any) => (
    <input
      {...props}
      class={cn(
        "bg-background/80 border border-border rounded-md px-1 py-0 h-5 text-[10px] font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
        props.class
      )}
    />
  );

  const Select = (props: any) => (
    <div class="relative w-full">
      <select
        {...props}
        class={cn(
          "w-full appearance-none bg-background/80 border border-border rounded-md px-1 py-0 h-5 pr-4 text-[10px] font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50",
          props.class
        )}
      >
        {props.children}
      </select>
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-muted-foreground">
        <svg class="h-[10px] w-[10px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  );

  return (
    <div class="h-full pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <form class="flex flex-col h-full gap-2" onSubmit={handleSave}>
        {/* Bento Grid Layout */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2">
          
          {/* Speed Limits Island */}
          <Card title={t('dialog.settings.global_speed')} icon={<Activity size={12} stroke-width={2.5} />} class="lg:col-span-5">
            <FormRow>
              <div class="flex items-center gap-1.5">
                <div class="scale-[0.8] origin-left -my-1"><Switch checked={downloadLimited()} onCheckedChange={setDownloadLimited} /></div>
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{t('dialog.settings.dl_limit_enabled')}</span>
                  <span class="text-[11px] opacity-70">KB/s</span>
                </div>
              </div>
              <Input type="number" class="w-24 text-right" disabled={!downloadLimited()} value={downloadLimit()} onInput={(e: any) => setDownloadLimit(Number(e.currentTarget.value))} />
            </FormRow>
            
            <FormRow>
              <div class="flex items-center gap-1.5">
                <div class="scale-[0.8] origin-left -my-1"><Switch checked={uploadLimited()} onCheckedChange={setUploadLimited} /></div>
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{t('dialog.settings.ul_limit_enabled')}</span>
                  <span class="text-[11px] opacity-70">KB/s</span>
                </div>
              </div>
              <Input type="number" class="w-24 text-right" disabled={!uploadLimited()} value={uploadLimit()} onInput={(e: any) => setUploadLimit(Number(e.currentTarget.value))} />
            </FormRow>
            
            <div class="h-px w-full bg-border/50 my-1" />
            
            <FormRow>
              <span class="font-medium text-foreground">{t('detail.settings.priority')}:</span>
              <div class="w-36">
                <Select value={bandwidthPriority()} onChange={(e: any) => setBandwidthPriority(Number(e.currentTarget.value))}>
                  <option value="-1">{t('detail.settings.priority_low')}</option>
                  <option value="0">{t('detail.settings.priority_normal')}</option>
                  <option value="1">{t('detail.settings.priority_high')}</option>
                </Select>
              </div>
            </FormRow>
          </Card>

          {/* Connection & Seeding Island */}
          <Card title={t('dialog.settings.conn_limits')} icon={<Users size={12} stroke-width={2.5} />} class="lg:col-span-7">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-3 gap-y-2">
              <div class="flex flex-col gap-1">
                <span class="font-medium text-foreground text-[10px]">{t('dialog.add.peer_limit')}:</span>
                <Input type="number" class="w-full" value={peerLimit()} min="1" onInput={(e: any) => setPeerLimit(Number(e.currentTarget.value))} />
              </div>
              
              <div class="flex flex-col gap-1">
                <span class="font-medium text-foreground text-[10px]">{t('dialog.settings.seed_ratio')}:</span>
                <div class="flex gap-2">
                  <Select value={seedRatioMode()} onChange={(e: any) => setSeedRatioMode(Number(e.currentTarget.value))}>
                    <option value="0">{t('dialog.add.default')}</option>
                    <option value="1">{t('dialog.label.source_custom')}</option>
                    <option value="2">{t('dialog.add.unlimited')}</option>
                  </Select>
                  <Show when={seedRatioMode() === 1}>
                    <Input type="number" step="0.1" class="w-20 text-right" value={seedRatioLimit()} onInput={(e: any) => setSeedRatioLimit(Number(e.currentTarget.value))} />
                  </Show>
                </div>
              </div>

              <div class="flex flex-col gap-1 lg:col-start-2">
                <span class="font-medium text-foreground text-[10px]">{t('dialog.settings.seed_idle')}:</span>
                <div class="flex gap-2">
                  <Select value={seedIdleMode()} onChange={(e: any) => setSeedIdleMode(Number(e.currentTarget.value))}>
                    <option value="0">{t('dialog.add.default')}</option>
                    <option value="1">{t('dialog.label.source_custom')}</option>
                    <option value="2">{t('dialog.add.unlimited')}</option>
                  </Select>
                  <Show when={seedIdleMode() === 1}>
                    <Input type="number" class="w-20 text-right" value={seedIdleLimit()} onInput={(e: any) => setSeedIdleLimit(Number(e.currentTarget.value))} />
                  </Show>
                </div>
              </div>
            </div>
          </Card>

          {/* Sequential Download Island */}
          <Card title={t('detail.general.sequential')} icon={<Zap size={12} stroke-width={2.5} />} class="lg:col-span-4">
            <FormRow>
              <div class="flex items-center gap-1.5">
                <div class="scale-[0.8] origin-left -my-1"><Switch checked={sequentialDownload()} onCheckedChange={setSequentialDownload} /></div>
                <span class="font-semibold text-foreground">{t('detail.general.sequential')}</span>
              </div>
            </FormRow>
            <FormRow class={cn("transition-opacity", !sequentialDownload() && "opacity-50")}>
              <span class="font-medium text-foreground">{t('detail.general.from_piece')}:</span>
              <Input type="number" class="w-24 text-right" value={sequentialFromPiece()} min="0" disabled={!sequentialDownload()} onInput={(e: any) => setSequentialFromPiece(Number(e.currentTarget.value))} />
            </FormRow>
          </Card>

          {/* Directory Move Island */}
          <Card title={t('dialog.settings.config_dir')} icon={<FolderInput size={12} stroke-width={2.5} />} class="lg:col-span-8">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-muted-foreground">{t('detail.settings.download_dir')}</span>
              <div class="flex items-center gap-1.5">
                <Input type="text" class="flex-1 font-mono" placeholder="/path/to/download" value={movePath()} onInput={(e: any) => setMovePath(e.currentTarget.value)} disabled={moving()} />
                <button type="button" class="flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-bold py-0.5 px-2 rounded-md border border-border transition-all disabled:opacity-50 hover:shadow-sm h-5" onClick={handleMoveLocation} disabled={moving() || !movePath()}>
                  {moving() ? <Clock size={12} class="animate-spin" /> : <FolderInput size={12} />}
                  {moving() ? t('common.loading') : t('detail.settings.move')}
                </button>
              </div>
            </div>
          </Card>

        </div>

        {/* Global Save Button */}
        <div class="flex justify-end">
          <button type="submit" class="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold py-1 px-3 rounded-md shadow-sm shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100" disabled={saving()}>
            <Save size={12} stroke-width={2.5} />
            {saving() ? t('common.loading') : t('detail.settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
};
