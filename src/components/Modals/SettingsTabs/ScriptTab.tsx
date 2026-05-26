import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch } from './SettingsUI';

interface ScriptTabProps { scriptTorrentAddedEnabled: () => boolean; setScriptTorrentAddedEnabled: (v: boolean) => void; scriptTorrentAddedFilename: () => string; setScriptTorrentAddedFilename: (v: string) => void; scriptTorrentDoneEnabled: () => boolean; setScriptTorrentDoneEnabled: (v: boolean) => void; scriptTorrentDoneFilename: () => string; setScriptTorrentDoneFilename: (v: string) => void; scriptTorrentDoneSeedingEnabled: () => boolean; setScriptTorrentDoneSeedingEnabled: (v: boolean) => void; scriptTorrentDoneSeedingFilename: () => string; setScriptTorrentDoneSeedingFilename: (v: string) => void; }

export const ScriptTab: Component<ScriptTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.script_added')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc={t('dialog.settings.script_added_desc')}>
          <SettingsSwitch checked={props.scriptTorrentAddedEnabled()} onCheckedChange={props.setScriptTorrentAddedEnabled} />
        </SettingsRow>
        <Show when={props.scriptTorrentAddedEnabled()}>
          <SettingsRow label={t('dialog.settings.script_path')}>
            <SettingsInput type="text" class="w-64 text-left" placeholder={t('dialog.settings.script_path')} value={props.scriptTorrentAddedFilename()} onInput={(e) => props.setScriptTorrentAddedFilename(e.currentTarget.value)} />
          </SettingsRow>
        </Show>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.script_done')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc={t('dialog.settings.script_done_desc')}>
          <SettingsSwitch checked={props.scriptTorrentDoneEnabled()} onCheckedChange={props.setScriptTorrentDoneEnabled} />
        </SettingsRow>
        <Show when={props.scriptTorrentDoneEnabled()}>
          <SettingsRow label={t('dialog.settings.script_path')}>
            <SettingsInput type="text" class="w-64 text-left" placeholder={t('dialog.settings.script_path')} value={props.scriptTorrentDoneFilename()} onInput={(e) => props.setScriptTorrentDoneFilename(e.currentTarget.value)} />
          </SettingsRow>
        </Show>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.script_done_seeding')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc={t('dialog.settings.script_done_seeding_desc')}>
          <SettingsSwitch checked={props.scriptTorrentDoneSeedingEnabled()} onCheckedChange={props.setScriptTorrentDoneSeedingEnabled} />
        </SettingsRow>
        <Show when={props.scriptTorrentDoneSeedingEnabled()}>
          <SettingsRow label={t('dialog.settings.script_path')}>
            <SettingsInput type="text" class="w-64 text-left" placeholder={t('dialog.settings.script_path')} value={props.scriptTorrentDoneSeedingFilename()} onInput={(e) => props.setScriptTorrentDoneSeedingFilename(e.currentTarget.value)} />
          </SettingsRow>
        </Show>
      </SettingsSection>
    </div>
  );
};
