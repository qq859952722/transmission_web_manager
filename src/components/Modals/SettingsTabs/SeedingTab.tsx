import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch } from './SettingsUI';

interface SeedingTabProps {
  seedRatioLimited: () => boolean;
  setSeedRatioLimited: (v: boolean) => void;
  seedRatioLimit: () => number;
  setSeedRatioLimit: (v: number) => void;
  idleSeedingLimitEnabled: () => boolean;
  setIdleSeedingLimitEnabled: (v: boolean) => void;
  idleSeedingLimit: () => number;
  setIdleSeedingLimit: (v: number) => void;
}

export const SeedingTab: Component<SeedingTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('detail.settings.seed_ratio')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc="Stop seeding when ratio is reached">
          <div class="flex items-center gap-4">
            <Show when={props.seedRatioLimited()}>
              <SettingsInput
                type="number"
                step="0.1"
                class="w-24"
                value={props.seedRatioLimit()}
                onInput={(e) => props.setSeedRatioLimit(Number(e.currentTarget.value))}
              />
            </Show>
            <SettingsSwitch checked={props.seedRatioLimited()} onCheckedChange={props.setSeedRatioLimited} />
          </div>
        </SettingsRow>
      </SettingsSection>
      
      <SettingsSection title={t('detail.settings.seed_idle')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc="Stop seeding if idle for a specified time">
          <div class="flex items-center gap-4">
            <Show when={props.idleSeedingLimitEnabled()}>
              <div class="flex items-center gap-2">
                <SettingsInput
                  type="number"
                  class="w-24"
                  value={props.idleSeedingLimit()}
                  onInput={(e) => props.setIdleSeedingLimit(Number(e.currentTarget.value))}
                />
                <span class="text-xs text-muted-foreground">{t('times.min')}</span>
              </div>
            </Show>
            <SettingsSwitch checked={props.idleSeedingLimitEnabled()} onCheckedChange={props.setIdleSeedingLimitEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
