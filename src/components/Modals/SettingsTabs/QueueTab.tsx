import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch } from './SettingsUI';

interface QueueTabProps {
  downloadQueueSize: () => number;
  setDownloadQueueSize: (v: number) => void;
  downloadQueueEnabled: () => boolean;
  setDownloadQueueEnabled: (v: boolean) => void;
  seedQueueSize: () => number;
  setSeedQueueSize: (v: number) => void;
  seedQueueEnabled: () => boolean;
  setSeedQueueEnabled: (v: boolean) => void;
  queueStalledEnabled: () => boolean;
  setQueueStalledEnabled: (v: boolean) => void;
  queueStalledMinutes: () => number;
  setQueueStalledMinutes: (v: number) => void;
}

export const QueueTab: Component<QueueTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.dl_queue')}>
        <SettingsRow label={t('dialog.settings.max_dl')} desc={t('dialog.settings.max_dl_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.downloadQueueEnabled()}>
              <SettingsInput
                type="number"
                class="w-24"
                value={props.downloadQueueSize()}
                onInput={(e) => props.setDownloadQueueSize(Number(e.currentTarget.value))}
              />
            </Show>
            <SettingsSwitch checked={props.downloadQueueEnabled()} onCheckedChange={props.setDownloadQueueEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.seed_queue')}>
        <SettingsRow label={t('dialog.settings.max_seed')} desc={t('dialog.settings.max_seed_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.seedQueueEnabled()}>
              <SettingsInput
                type="number"
                class="w-24"
                value={props.seedQueueSize()}
                onInput={(e) => props.setSeedQueueSize(Number(e.currentTarget.value))}
              />
            </Show>
            <SettingsSwitch checked={props.seedQueueEnabled()} onCheckedChange={props.setSeedQueueEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.stalled_detection')}>
        <SettingsRow label={t('dialog.settings.stalled_timeout')} desc={t('dialog.settings.stalled_timeout_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.queueStalledEnabled()}>
              <div class="flex items-center gap-2">
                <SettingsInput
                  type="number"
                  class="w-24"
                  value={props.queueStalledMinutes()}
                  onInput={(e) => props.setQueueStalledMinutes(Number(e.currentTarget.value))}
                />
                <span class="text-xs text-muted-foreground">{t('times.min')}</span>
              </div>
            </Show>
            <SettingsSwitch checked={props.queueStalledEnabled()} onCheckedChange={props.setQueueStalledEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
