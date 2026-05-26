import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch } from './SettingsUI';

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
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.download_dir')}>
        <SettingsRow label={t('dialog.settings.download_dir')} desc="Default directory for all downloaded files">
          <SettingsInput type="text" class="w-64 text-left" value={props.downloadDir()} onInput={(e) => props.setDownloadDir(e.currentTarget.value)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Incomplete Downloads">
        <SettingsRow label={t('dialog.settings.incomplete_enabled')} desc="Keep incomplete torrents in a separate directory">
          <SettingsSwitch checked={props.incompleteDirEnabled()} onCheckedChange={props.setIncompleteDirEnabled} />
        </SettingsRow>
        <Show when={props.incompleteDirEnabled()}>
          <SettingsRow label={t('dialog.settings.incomplete_dir_hint')}>
            <SettingsInput type="text" class="w-64 text-left" value={props.incompleteDir()} onInput={(e) => props.setIncompleteDir(e.currentTarget.value)} />
          </SettingsRow>
        </Show>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.add_behavior')}>
        <SettingsRow label={t('dialog.settings.start_added')} desc="Automatically start downloading new torrents">
          <SettingsSwitch checked={props.startAddedTorrents()} onCheckedChange={props.setStartAddedTorrents} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.rename_partial')} desc="Append '.part' to incomplete files">
          <SettingsSwitch checked={props.renamePartialFiles()} onCheckedChange={props.setRenamePartialFiles} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.trash_torrent')} desc="Delete .torrent file after adding">
          <SettingsSwitch checked={props.trashOriginalTorrentFiles()} onCheckedChange={props.setTrashOriginalTorrentFiles} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
