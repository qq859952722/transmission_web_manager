import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { closeAddModal, showAddModal, droppedFile, setDroppedFile } from '../../store/modalStore';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents, torrentList } from '../../store/torrentStore';
import { useGroups, useSession } from '../../api/queries';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './Modals.css';

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

  // Compute all available labels from local storage and existing torrents
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
    } catch(e) {
      console.warn('Failed to parse label library from localStorage', e);
    }
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

      if (downloadDir().trim()) {
        commonArgs['download_dir'] = downloadDir().trim();
      }

      if (labels().trim()) {
        commonArgs.labels = labels()
          .split(',')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
      }

      const pLimit = parseInt(peerLimit(), 10);
      if (!isNaN(pLimit) && pLimit > 0) {
        commonArgs['peer_limit'] = pLimit;
      }

      if (group().trim()) {
        commonArgs.group = group().trim();
      }

      const dlLimit = parseInt(downloadLimit(), 10);
      const ulLimit = parseInt(uploadLimit(), 10);

      const addedIds: number[] = [];

      // Add by URLs (one per line)
      if (urls().trim()) {
        const list = urls()
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0);

        for (const url of list) {
          const res = await rpcCall<any>('torrent_add', {
          ...commonArgs,
          filename: url,
        });
        const id = res.torrent_added?.id || res.torrent_duplicate?.id;
          if (id) addedIds.push(id);
        }
      }

      // Add by base64 File metainfo
      if (fileBase64()) {
        const res = await rpcCall<any>('torrent_add', {
          ...commonArgs,
          metainfo: fileBase64(),
        });
        const id = res.torrent_added?.id || res.torrent_duplicate?.id;
        if (id) addedIds.push(id);
      }

      // If we need to set speed limits, do it via torrent_set
      if (addedIds.length > 0) {
        const setArgs: Record<string, any> = {};
        let needsSet = false;
        if (!isNaN(dlLimit) && dlLimit > 0) {
          setArgs.download_limit = dlLimit;
          setArgs.download_limited = true;
          needsSet = true;
        }
        if (!isNaN(ulLimit) && ulLimit > 0) {
          setArgs.upload_limit = ulLimit;
          setArgs.upload_limited = true;
          needsSet = true;
        }
        if (needsSet) {
          await rpcCall('torrent_set', { ids: addedIds, ...setArgs });
        }
      }

      showToast(t('dialog.add.add_success'), 'success');
      closeAddModal();
      // Clear form
      setUrls('');
      setFileBase64(null);
      setFileName('');
      setDownloadDir(session.data?.download_dir || '');
      setPaused(false);
      setSequential(false);
      setPriority(0);
      setLabels('');
      setPeerLimit('');
      setDownloadLimit('');
      setUploadLimit('');
      setGroup('');

      await fetchTorrents(true);
    } catch (err) {
      console.error('Failed to add torrent', err);
      showToast(t('dialog.add.add_failed'), 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Show when={showAddModal()}>
      <div class="trwm-modal-overlay" onClick={closeAddModal}>
        <div class="trwm-modal-box wide" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>{t('dialog.add.title')}</h2>
            <button class="close-btn" onClick={closeAddModal}>×</button>
          </div>

          <form onSubmit={handleAdd} class="modal-form add-torrent-form">
            {/* === Source Section: URL or File (Required) === */}
            <div class="add-section add-section-source">
              <div class="add-section-header">
                <span class="add-section-title">{t('dialog.add.source')}</span>
                <span class="add-required-badge">{t('dialog.add.required')}</span>
              </div>

              {/* Input URL */}
              <div class="form-group">
                <label>
                  {t('dialog.add.url_label')}
                  <span class="label-hint label-hint-required">*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder={t('dialog.add.url_placeholder')}
                  value={urls()}
                  onInput={(e) => setUrls(e.currentTarget.value)}
                  disabled={adding() || !!fileBase64()}
                  class="add-textarea"
                />
              </div>

              {/* Divider hint */}
              <div class="add-or-divider">
                <span>{t('dialog.add.or')}</span>
              </div>

              {/* Input Local File */}
              <div class="form-group">
                <label>
                  {t('dialog.add.file_label')}
                  <span class="label-hint label-hint-optional">{t('dialog.add.optional')}</span>
                </label>
                <div class="file-uploader-row">
                  <button
                    type="button"
                    class="trwm-btn add-file-btn"
                    onClick={() => fileInputRef?.click()}
                    disabled={adding() || !!urls().trim()}
                  >
                    {fileName() ? t('mobile.select_file') : t('dialog.add.file_label')}
                  </button>
                  <span class={`file-name text-mono ${fileName() ? 'file-name-active' : ''}`}>
                    {fileName() || t('dialog.add.url_placeholder')}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".torrent"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Mutual exclusion hint */}
              <Show when={urls().trim() && fileBase64()}>
                <div class="add-hint add-hint-warning">
                  {t('dialog.add.mutual_exclusive_hint')}
                </div>
              </Show>
              <Show when={!urls().trim() && !fileBase64()}>
                <div class="add-hint add-hint-info">
                  {t('dialog.add.empty_source_hint')}
                </div>
              </Show>
            </div>

            {/* === Options Section (Optional) === */}
            <div class="add-section add-section-options">
              <div class="add-section-header">
                <span class="add-section-title">{t('dialog.add.options')}</span>
                <span class="add-optional-badge">{t('dialog.add.optional')}</span>
              </div>

              {/* Download Dir */}
              <div class="form-group">
                <label>{t('dialog.add.download_dir')}</label>
                <input
                  type="text"
                  placeholder={t('dialog.add.dir_placeholder')}
                  value={downloadDir()}
                  onInput={(e) => setDownloadDir(e.currentTarget.value)}
                  disabled={adding()}
                />
              </div>

              {/* Peer Limit / Priority / Group - 3 columns */}
              <div class="form-grid-3col">
                <div class="form-group">
                  <label>{t('dialog.add.peer_limit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('dialog.add.default')}
                    value={peerLimit()}
                    onInput={(e) => setPeerLimit(e.currentTarget.value)}
                    disabled={adding()}
                  />
                </div>

                <div class="form-group">
                  <label>{t('dialog.add.priority')}</label>
                  <select
                    value={priority()}
                    onChange={(e) => setPriority(Number(e.currentTarget.value))}
                    disabled={adding()}
                  >
                    <option value="-1">{t('detail.settings.priority_low')}</option>
                    <option value="0">{t('detail.settings.priority_normal')}</option>
                    <option value="1">{t('detail.settings.priority_high')}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>{t('dialog.add.group')}</label>
                  <select
                    value={group()}
                    onChange={(e) => setGroup(e.currentTarget.value)}
                    disabled={adding() || !groupsData.isSuccess}
                  >
                    <option value="">{t('dialog.add.group_default')}</option>
                    <Show when={groupsData.isSuccess}>
                      <For each={groupsData.data}>
                        {(g) => <option value={g.name}>{g.name}</option>}
                      </For>
                    </Show>
                  </select>
                </div>
              </div>

              {/* Speed Limits - 2 columns with unit suffix */}
              <div class="form-grid-2col">
                <div class="form-group">
                  <label>{t('dialog.add.download_limit')}</label>
                  <div class="input-with-suffix">
                    <input
                      type="number"
                      min="0"
                      placeholder={t('dialog.add.unlimited')}
                      value={downloadLimit()}
                      onInput={(e) => setDownloadLimit(e.currentTarget.value)}
                      disabled={adding()}
                    />
                    <span class="input-suffix">KB/s</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>{t('dialog.add.upload_limit')}</label>
                  <div class="input-with-suffix">
                    <input
                      type="number"
                      min="0"
                      placeholder={t('dialog.add.unlimited')}
                      value={uploadLimit()}
                      onInput={(e) => setUploadLimit(e.currentTarget.value)}
                      disabled={adding()}
                    />
                    <span class="input-suffix">KB/s</span>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div class="form-group">
                <label>
                  {t('dialog.add.labels')}
                  <span class="label-hint label-hint-optional">{t('dialog.add.labels_hint')}</span>
                </label>
                <input
                  type="text"
                  placeholder={t('dialog.add.labels_hint')}
                  value={labels()}
                  onInput={(e) => setLabels(e.currentTarget.value)}
                  disabled={adding()}
                />
                <Show when={availableLabels().length > 0}>
                  <div class="label-picker-header">
                    {t('dialog.label.saved_label')}
                  </div>
                  <div class="label-picker-chips">
                    <For each={availableLabels()}>
                      {(l) => (
                        <span
                          class={`label-chip ${labels().split(',').map(x=>x.trim()).includes(l) ? 'active' : ''}`}
                          onClick={() => toggleLabel(l)}
                        >
                          {l}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Checkboxes */}
              <div class="form-checkbox-row">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    checked={paused()}
                    onChange={(e) => setPaused(e.currentTarget.checked)}
                    disabled={adding()}
                  />
                  <span>{t('dialog.add.paused')}</span>
                </label>

                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sequential()}
                    onChange={(e) => setSequential(e.currentTarget.checked)}
                    disabled={adding()}
                  />
                  <span>{t('dialog.add.sequential')}</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="submit" class="trwm-btn primary" disabled={adding()}>
                {adding() ? t('common.loading') : t('dialog.add.submit')}
              </button>
              <button type="button" class="trwm-btn" onClick={closeAddModal} disabled={adding()}>
                {t('dialog.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
