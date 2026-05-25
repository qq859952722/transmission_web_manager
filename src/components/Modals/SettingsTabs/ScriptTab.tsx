import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';

interface ScriptTabProps {
  scriptTorrentAddedEnabled: () => boolean;
  setScriptTorrentAddedEnabled: (v: boolean) => void;
  scriptTorrentAddedFilename: () => string;
  setScriptTorrentAddedFilename: (v: string) => void;
  scriptTorrentDoneEnabled: () => boolean;
  setScriptTorrentDoneEnabled: (v: boolean) => void;
  scriptTorrentDoneFilename: () => string;
  setScriptTorrentDoneFilename: (v: string) => void;
  scriptTorrentDoneSeedingEnabled: () => boolean;
  setScriptTorrentDoneSeedingEnabled: (v: boolean) => void;
  scriptTorrentDoneSeedingFilename: () => string;
  setScriptTorrentDoneSeedingFilename: (v: string) => void;
}

export const ScriptTab: Component<ScriptTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('dialog.settings.script_added')}</h4>
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.scriptTorrentAddedEnabled()}
              onChange={(e) => props.setScriptTorrentAddedEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
          <Show when={props.scriptTorrentAddedEnabled()}>
            <input
              type="text"
              placeholder={t('dialog.settings.script_path')}
              value={props.scriptTorrentAddedFilename()}
              onInput={(e) => props.setScriptTorrentAddedFilename(e.currentTarget.value)}
              class="mt-1.5"
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
              checked={props.scriptTorrentDoneEnabled()}
              onChange={(e) => props.setScriptTorrentDoneEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
          <Show when={props.scriptTorrentDoneEnabled()}>
            <input
              type="text"
              placeholder={t('dialog.settings.script_path')}
              value={props.scriptTorrentDoneFilename()}
              onInput={(e) => props.setScriptTorrentDoneFilename(e.currentTarget.value)}
              class="mt-1.5"
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
              checked={props.scriptTorrentDoneSeedingEnabled()}
              onChange={(e) => props.setScriptTorrentDoneSeedingEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
          <Show when={props.scriptTorrentDoneSeedingEnabled()}>
            <input
              type="text"
              placeholder={t('dialog.settings.script_path')}
              value={props.scriptTorrentDoneSeedingFilename()}
              onInput={(e) => props.setScriptTorrentDoneSeedingFilename(e.currentTarget.value)}
              class="mt-1.5"
            />
          </Show>
        </div>
      </div>
    </div>
  );
};
