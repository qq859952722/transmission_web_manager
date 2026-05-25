import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';

interface DownloadTabProps {
  downloadDir: () => string;
  setDownloadDir: (v: string) => void;
  incompleteDirEnabled: () => boolean;
  setIncompleteDirEnabled: (v: boolean) => void;
  incompleteDir: () => string;
  setIncompleteDir: (v: string) => void;
  startAddedTorrents: () => boolean;
  setStartAddedTorrents: (v: boolean) => void;
  renamePartialFiles: () => boolean;
  setRenamePartialFiles: (v: boolean) => void;
  trashOriginalTorrentFiles: () => boolean;
  setTrashOriginalTorrentFiles: (v: boolean) => void;
}

export const DownloadTab: Component<DownloadTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="form-group">
        <label>{t('dialog.settings.download_dir')}</label>
        <input
          type="text"
          value={props.downloadDir()}
          onInput={(e) => props.setDownloadDir(e.currentTarget.value)}
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={props.incompleteDirEnabled()}
            onChange={(e) => props.setIncompleteDirEnabled(e.currentTarget.checked)}
          />
          <span>{t('dialog.settings.incomplete_enabled')}</span>
        </label>
        <Show when={props.incompleteDirEnabled()}>
          <input
            type="text"
            placeholder={t('dialog.settings.incomplete_dir_hint')}
            value={props.incompleteDir()}
            onInput={(e) => props.setIncompleteDir(e.currentTarget.value)}
            class="mt-1.5"
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
              checked={props.startAddedTorrents()}
              onChange={(e) => props.setStartAddedTorrents(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.start_added')}</span>
          </label>

          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.renamePartialFiles()}
              onChange={(e) => props.setRenamePartialFiles(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.rename_partial')}</span>
          </label>

          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.trashOriginalTorrentFiles()}
              onChange={(e) => props.setTrashOriginalTorrentFiles(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.trash_torrent')}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
