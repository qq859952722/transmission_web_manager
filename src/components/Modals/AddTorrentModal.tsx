import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { closeAddModal, showAddModal, droppedFile, setDroppedFile } from '../../store/modalStore';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents, torrentList } from '../../store/torrentStore';
import { useGroups, useSession } from '../../api/queries';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { cn } from '../../lib/utils';
import { X, UploadCloud, Link as LinkIcon, HardDrive, Settings2, ShieldCheck } from 'lucide-solid';

export const AddTorrentModal: Component = () => {
  const [urls, setUrls] = createSignal('');
  const [fileBase64, setFileBase64] = createSignal<string | null>(null);
  const [fileName, setFileName] = createSignal<string>('');
  const [downloadDir, setDownloadDir] = createSignal('');
  const [paused, setPaused] = createSignal(false);
  const [sequential, setSequential] = createSignal(false);
  const [priority, setPriority] = createSignal(0);
  const [labels, setLabels] = createSignal('');
  const [peerLimit, setPeerLimit] = createSignal('');
  const [downloadLimit, setDownloadLimit] = createSignal('');
  const [uploadLimit, setUploadLimit] = createSignal('');
  const [group, setGroup] = createSignal('');
  const [adding, setAdding] = createSignal(false);

  const groupsData = useGroups();
  const session = useSession();

  const availableLabels = () => {
    const list = torrentList();
    const set = new Set<string>();
    for (const t of list) {
      if (t.labels) t.labels.forEach(l => set.add(l));
    }
    try {
      const stored = localStorage.getItem('twc-label-library');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) parsed.forEach(l => set.add(l));
      }
    } catch(e) {}
    return Array.from(set).sort();
  };

  createEffect(() => {
    if (showAddModal() && session.data?.download_dir && !downloadDir()) {
      setDownloadDir(session.data.download_dir);
    }
    const file = droppedFile();
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64 = result.substring(result.indexOf(',') + 1);
        setFileBase64(base64);
      };
      reader.readAsDataURL(file);
      setDroppedFile(null);
    }
  });

  let fileInputRef: HTMLInputElement | undefined;

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.substring(result.indexOf(',') + 1);
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const toggleLabel = (l: string) => {
    const current = labels().split(',').map(x => x.trim()).filter(Boolean);
    if (current.includes(l)) {
      setLabels(current.filter(x => x !== l).join(', '));
    } else {
      setLabels([...current, l].join(', '));
    }
  };

  const handleAdd = async (e: Event) => {
    e.preventDefault();
    if (!urls().trim() && !fileBase64()) {
      showToast(t('dialog.add.empty_warn'), 'warning');
      return;
    }

    setAdding(true);
    try {
      const commonArgs: Record<string, any> = {
        paused: paused(),
        sequential_download: sequential(),
        bandwidth_priority: Number(priority()),
      };

      if (downloadDir().trim()) commonArgs['download_dir'] = downloadDir().trim();
      if (labels().trim()) {
        commonArgs.labels = labels().split(',').map(l => l.trim()).filter(l => l.length > 0);
      }
      const pLimit = parseInt(peerLimit(), 10);
      if (!isNaN(pLimit) && pLimit > 0) commonArgs['peer_limit'] = pLimit;
      if (group().trim()) commonArgs.group = group().trim();

      const dlLimit = parseInt(downloadLimit(), 10);
      const ulLimit = parseInt(uploadLimit(), 10);
      const addedIds: number[] = [];

      if (urls().trim()) {
        const list = urls().split('\n').map(u => u.trim()).filter(u => u.length > 0);
        for (const url of list) {
          const res = await rpcCall<any>('torrent_add', { ...commonArgs, filename: url });
          const id = res.torrent_added?.id || res.torrent_duplicate?.id;
          if (id) addedIds.push(id);
        }
      }

      if (fileBase64()) {
        const res = await rpcCall<any>('torrent_add', { ...commonArgs, metainfo: fileBase64() });
        const id = res.torrent_added?.id || res.torrent_duplicate?.id;
        if (id) addedIds.push(id);
      }

      if (addedIds.length > 0) {
        const setArgs: Record<string, any> = {};
        let needsSet = false;
        if (!isNaN(dlLimit) && dlLimit > 0) { setArgs.download_limit = dlLimit; setArgs.download_limited = true; needsSet = true; }
        if (!isNaN(ulLimit) && ulLimit > 0) { setArgs.upload_limit = ulLimit; setArgs.upload_limited = true; needsSet = true; }
        if (needsSet) await rpcCall('torrent_set', { ids: addedIds, ...setArgs });
      }

      showToast(t('dialog.add.add_success'), 'success');
      closeAddModal();
      setUrls(''); setFileBase64(null); setFileName(''); setDownloadDir(session.data?.download_dir || '');
      setPaused(false); setSequential(false); setPriority(0); setLabels('');
      setPeerLimit(''); setDownloadLimit(''); setUploadLimit(''); setGroup('');
      await fetchTorrents(true);
    } catch (err) {
      showToast(t('dialog.add.add_failed'), 'error');
    } finally {
      setAdding(false);
    }
  };

  const inputClass = "flex h-8 w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/20 hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Show when={showAddModal()}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeAddModal}>
        <div class="bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl w-[95%] max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          
          <div class="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
            <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
              <UploadCloud size={16} class="text-primary" />
              {t('dialog.add.title')}
            </h2>
            <button class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1 transition-colors" onClick={closeAddModal}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAdd} class="flex flex-col flex-1 overflow-y-auto max-h-[75vh] p-4 gap-4">
            
            {/* SOURCE SECTION */}
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-primary">
                <LinkIcon size={16} /> <span>{t('dialog.add.source')}</span>
              </div>
              
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-muted-foreground">
                  {t('dialog.add.url_label')} <span class="text-destructive">*</span>
                </label>
                  <textarea
                  rows="2"
                  placeholder={t('dialog.add.url_placeholder')}
                  value={urls()}
                  onInput={(e) => setUrls(e.currentTarget.value)}
                  disabled={adding() || !!fileBase64()}
                  class={cn(inputClass, "resize-y min-h-[60px] h-auto py-1.5")}
                />
              </div>

              <div class="relative flex items-center py-2">
                <div class="flex-grow border-t border-border/60"></div>
                <span class="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase">{t('dialog.add.or')}</span>
                <div class="flex-grow border-t border-border/60"></div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-muted-foreground">
                  {t('dialog.add.file_label')}
                </label>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.click()}
                    disabled={adding() || !!urls().trim()}
                    class="flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border/50 px-3 py-1.5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary/20 disabled:opacity-50"
                  >
                    <HardDrive size={14} />
                    {fileName() ? t('mobile.select_file') : t('dialog.add.file_label')}
                  </button>
                  <div class="flex-1 truncate rounded-md bg-muted/40 border border-dashed border-border/80 px-2.5 py-1.5 text-xs font-mono text-muted-foreground">
                    {fileName() || t('dialog.add.url_placeholder')}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".torrent" class="hidden" onChange={handleFileChange} />
                </div>
              </div>
            </div>

            {/* OPTIONS SECTION */}
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-primary pt-1 border-t border-border/50">
                <Settings2 size={16} /> <span>{t('dialog.add.options')}</span>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.download_dir')}</label>
                <input type="text" placeholder={t('dialog.add.dir_placeholder')} value={downloadDir()} onInput={(e) => setDownloadDir(e.currentTarget.value)} disabled={adding()} class={inputClass} />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.peer_limit')}</label>
                  <input type="number" min="0" placeholder={t('dialog.add.default')} value={peerLimit()} onInput={(e) => setPeerLimit(e.currentTarget.value)} disabled={adding()} class={inputClass} />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.priority')}</label>
                  <select value={priority()} onChange={(e) => setPriority(Number(e.currentTarget.value))} disabled={adding()} class={inputClass}>
                    <option value="-1">{t('detail.settings.priority_low')}</option>
                    <option value="0">{t('detail.settings.priority_normal')}</option>
                    <option value="1">{t('detail.settings.priority_high')}</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.group')}</label>
                  <select value={group()} onChange={(e) => setGroup(e.currentTarget.value)} disabled={adding() || !groupsData.isSuccess} class={inputClass}>
                    <option value="">{t('dialog.add.group_default')}</option>
                    <Show when={groupsData.isSuccess}>
                      <For each={groupsData.data}>{(g) => <option value={g.name}>{g.name}</option>}</For>
                    </Show>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.download_limit')} (KB/s)</label>
                  <input type="number" min="0" placeholder={t('dialog.add.unlimited')} value={downloadLimit()} onInput={(e) => setDownloadLimit(e.currentTarget.value)} disabled={adding()} class={inputClass} />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.upload_limit')} (KB/s)</label>
                  <input type="number" min="0" placeholder={t('dialog.add.unlimited')} value={uploadLimit()} onInput={(e) => setUploadLimit(e.currentTarget.value)} disabled={adding()} class={inputClass} />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-muted-foreground">{t('dialog.add.labels')} <span class="font-normal opacity-70">({t('dialog.add.labels_hint')})</span></label>
                <input type="text" placeholder={t('dialog.add.labels_hint')} value={labels()} onInput={(e) => setLabels(e.currentTarget.value)} disabled={adding()} class={inputClass} />
                
                <Show when={availableLabels().length > 0}>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <For each={availableLabels()}>
                      {(l) => (
                        <span
                          class={cn(
                            "cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors",
                            labels().split(',').map(x=>x.trim()).includes(l)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                          )}
                          onClick={() => toggleLabel(l)}
                        >
                          {l}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              <div class="flex items-center gap-6 pt-2">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative flex items-center justify-center">
                    <input type="checkbox" checked={paused()} onChange={(e) => setPaused(e.currentTarget.checked)} disabled={adding()} class="peer sr-only" />
                    <ShieldCheck size={12} class="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t('dialog.add.paused')}</span>
                </label>
                
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative flex items-center justify-center">
                    <input type="checkbox" checked={sequential()} onChange={(e) => setSequential(e.currentTarget.checked)} disabled={adding()} class="peer sr-only" />
                    <div class="w-4 h-4 rounded-[4px] border border-border/80 bg-muted/40 peer-focus-visible:ring-[2px] peer-focus-visible:ring-primary/20 peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                    <ShieldCheck size={12} class="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t('dialog.add.sequential')}</span>
                </label>
              </div>
            </div>

          </form>

          <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/50 bg-secondary/20">
            <button type="button" onClick={closeAddModal} disabled={adding()} class="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary/20 disabled:opacity-50 border border-border/60 bg-background hover:bg-muted hover:text-foreground px-4 py-1.5 shadow-sm">
              {t('dialog.cancel')}
            </button>
            <button type="submit" onClick={handleAdd} disabled={adding()} class="inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary/20 disabled:opacity-50 border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md px-4 py-1.5 shadow-sm active:scale-[0.98]">
              {adding() ? t('common.loading') : t('dialog.add.submit')}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
