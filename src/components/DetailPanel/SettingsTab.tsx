import { Component, For, Show, createSignal, createEffect, on } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents, selectedIds } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './SettingsTab.css';

export const SettingsTab: Component<{ torrents: Torrent[]; activeTab?: string }> = (props) => {
  const isMulti = () => props.torrents.length > 1;
  const first = () => props.torrents[0];

  // Forms States
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

  // Only sync settings when selected torrent IDs change OR when switching to this tab
  // This prevents the form from being reset while the user is editing
  const syncFormFromTorrent = () => {
    const t = first();
    if (!t) return;

    setDownloadLimited(t.download_limited || false);
    setDownloadLimit(t.download_limit || 0);
    setUploadLimited(t.upload_limited || false);
    setUploadLimit(t.upload_limit || 0);
    setBandwidthPriority(t.bandwidth_priority || 0);
    setSeedRatioMode(t.seed_ratio_mode || 0);
    setSeedRatioLimit(t.seed_ratio_limit || 1.5);
    setSeedIdleMode(t.seed_idle_mode || 0);
    setSeedIdleLimit(t.seed_idle_limit || 30);
    setPeerLimit(t.peer_limit || 50);
    setSequentialDownload(t.sequential_download || false);
    setSequentialFromPiece(t.sequential_download_from_piece || 0);
    setMovePath(t.download_dir || '');
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
      ids,
      download_limited: downloadLimited(),
      download_limit: Number(downloadLimit()),
      upload_limited: uploadLimited(),
      upload_limit: Number(uploadLimit()),
      bandwidth_priority: Number(bandwidthPriority()),
      seed_ratio_mode: Number(seedRatioMode()),
      seed_ratio_limit: Number(seedRatioLimit()),
      seed_idle_mode: Number(seedIdleMode()),
      seed_idle_limit: Number(seedIdleLimit()),
      peer_limit: Number(peerLimit()),
      sequential_download: sequentialDownload(),
      sequential_download_from_piece: Number(sequentialFromPiece()),
    };

    try {
      await rpcCall('torrent_set', args);
      showToast(t('dialog.settings.save_success'), 'success');
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to save torrent settings', e);
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
      await rpcCall('torrent_set_location', {
        ids,
        location: path,
        move: true,
      });
      showToast(t('dialog.change_dir.success'), 'success');
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to move torrent directory', e);
      showToast(t('dialog.change_dir.failed'), 'error');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div class="trwm-settings-tab">
      <form class="settings-form" onSubmit={handleSave}>
        <div class="settings-grid">
          {/* Limits section */}
          <div class="settings-section">
            <h3>{t('dialog.settings.global_speed')}</h3>
            <div class="form-row">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={downloadLimited()}
                  onChange={(e) => setDownloadLimited(e.currentTarget.checked)}
                />
                <span>{t('dialog.settings.dl_limit_enabled')} (KB/s):</span>
              </label>
              <input
                type="number"
                class="num-input"
                disabled={!downloadLimited()}
                value={downloadLimit()}
                onInput={(e) => setDownloadLimit(Number(e.currentTarget.value))}
              />
            </div>
            <div class="form-row">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={uploadLimited()}
                  onChange={(e) => setUploadLimited(e.currentTarget.checked)}
                />
                <span>{t('dialog.settings.ul_limit_enabled')} (KB/s):</span>
              </label>
              <input
                type="number"
                class="num-input"
                disabled={!uploadLimited()}
                value={uploadLimit()}
                onInput={(e) => setUploadLimit(Number(e.currentTarget.value))}
              />
            </div>
            <div class="form-row">
              <span>{t('detail.settings.priority')}:</span>
              <select
                class="select-input"
                value={bandwidthPriority()}
                onChange={(e) => setBandwidthPriority(Number(e.currentTarget.value))}
              >
                <option value="-1">{t('detail.settings.priority_low')}</option>
                <option value="0">{t('detail.settings.priority_normal')}</option>
                <option value="1">{t('detail.settings.priority_high')}</option>
              </select>
            </div>
          </div>

          {/* Seed Limits section */}
          <div class="settings-section">
            <h3>{t('dialog.settings.conn_limits')}</h3>
            <div class="form-row">
              <span>{t('dialog.add.peer_limit')}:</span>
              <input
                type="number"
                class="num-input"
                value={peerLimit()}
                min="1"
                onInput={(e) => setPeerLimit(Number(e.currentTarget.value))}
              />
            </div>
            <div class="form-row flex-col">
              <span>{t('dialog.settings.seed_ratio')}:</span>
              <div class="flex-row">
                <select
                  class="select-input flex-1"
                  value={seedRatioMode()}
                  onChange={(e) => setSeedRatioMode(Number(e.currentTarget.value))}
                >
                  <option value="0">{t('dialog.add.default')}</option>
                  <option value="1">{t('dialog.label.source_custom')}</option>
                  <option value="2">{t('dialog.add.unlimited')}</option>
                </select>
                <Show when={seedRatioMode() === 1}>
                  <input
                    type="number"
                    step="0.1"
                    class="num-input w-24"
                    value={seedRatioLimit()}
                    onInput={(e) => setSeedRatioLimit(Number(e.currentTarget.value))}
                  />
                </Show>
              </div>
            </div>
            <div class="form-row flex-col">
              <span>{t('dialog.settings.seed_idle')}:</span>
              <div class="flex-row">
                <select
                  class="select-input flex-1"
                  value={seedIdleMode()}
                  onChange={(e) => setSeedIdleMode(Number(e.currentTarget.value))}
                >
                  <option value="0">{t('dialog.add.default')}</option>
                  <option value="1">{t('dialog.label.source_custom')}</option>
                  <option value="2">{t('dialog.add.unlimited')}</option>
                </select>
                <Show when={seedIdleMode() === 1}>
                  <input
                    type="number"
                    class="num-input w-24"
                    value={seedIdleLimit()}
                    onInput={(e) => setSeedIdleLimit(Number(e.currentTarget.value))}
                  />
                </Show>
              </div>
            </div>
          </div>

          {/* Sequential Download section */}
          <div class="settings-section">
            <h3>{t('detail.general.sequential') || 'Sequential Download'}</h3>
            <div class="form-row">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={sequentialDownload()}
                  onChange={(e) => setSequentialDownload(e.currentTarget.checked)}
                />
                <span>{t('detail.general.sequential') || 'Sequential Download'}</span>
              </label>
            </div>
            <div class="form-row">
              <span>{t('detail.general.from_piece') || 'From Piece'}:</span>
              <input
                type="number"
                class="num-input"
                value={sequentialFromPiece()}
                min="0"
                disabled={!sequentialDownload()}
                onInput={(e) => setSequentialFromPiece(Number(e.currentTarget.value))}
              />
            </div>
          </div>

          {/* Location Move Section */}
          <div class="settings-section full-width">
            <h3>{t('dialog.settings.config_dir')}</h3>
            <div class="move-location-row">
              <input
                type="text"
                class="path-input"
                placeholder={t('detail.settings.download_dir')}
                value={movePath()}
                onInput={(e) => setMovePath(e.currentTarget.value)}
                disabled={moving()}
              />
              <button
                type="button"
                class="trwm-btn primary"
                onClick={handleMoveLocation}
                disabled={moving() || !movePath()}
              >
                {moving() ? t('common.loading') : t('detail.settings.move')}
              </button>
            </div>
          </div>
        </div>

        <button type="submit" class="trwm-btn primary save-btn" disabled={saving()}>
          {saving() ? t('common.loading') : t('detail.settings.save')}
        </button>
      </form>


    </div>
  );
};
