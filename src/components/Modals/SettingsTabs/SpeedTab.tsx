import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch } from './SettingsUI';
import { cn } from '../../../lib/utils';

interface SpeedTabProps {
  speedLimitDownEnabled: () => boolean;
  setSpeedLimitDownEnabled: (v: boolean) => void;
  speedLimitDown: () => number;
  setSpeedLimitDown: (v: number) => void;
  speedLimitUpEnabled: () => boolean;
  setSpeedLimitUpEnabled: (v: boolean) => void;
  speedLimitUp: () => number;
  setSpeedLimitUp: (v: number) => void;
  altSpeedEnabled: () => boolean;
  setAltSpeedEnabled: (v: boolean) => void;
  altSpeedDown: () => number;
  setAltSpeedDown: (v: number) => void;
  altSpeedUp: () => number;
  setAltSpeedUp: (v: number) => void;
  altSpeedTimeEnabled: () => boolean;
  setAltSpeedTimeEnabled: (v: boolean) => void;
  altSpeedTimeBegin: () => string;
  setAltSpeedTimeBegin: (v: string) => void;
  altSpeedTimeEnd: () => string;
  setAltSpeedTimeEnd: (v: string) => void;
  altSpeedTimeDay: () => number;
  setAltSpeedTimeDay: (v: number) => void;
}

export const SpeedTab: Component<SpeedTabProps> = (props) => {
  const isDayActive = (day: number) => (props.altSpeedTimeDay() & day) !== 0;
  const toggleDay = (day: number) => {
    if (isDayActive(day)) props.setAltSpeedTimeDay(props.altSpeedTimeDay() & ~day);
    else props.setAltSpeedTimeDay(props.altSpeedTimeDay() | day);
  };

  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.global_speed')}>
        <SettingsRow label={t('dialog.settings.dl_limit_enabled')} desc={t('dialog.settings.dl_limit_enabled_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.speedLimitDownEnabled()}>
              <div class="flex items-center gap-2">
                <SettingsInput type="number" class="w-24" value={props.speedLimitDown()} onInput={(e) => props.setSpeedLimitDown(Number(e.currentTarget.value))} />
                <span class="text-xs text-muted-foreground font-mono">KB/s</span>
              </div>
            </Show>
            <SettingsSwitch checked={props.speedLimitDownEnabled()} onCheckedChange={props.setSpeedLimitDownEnabled} />
          </div>
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.ul_limit_enabled')} desc={t('dialog.settings.ul_limit_enabled_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.speedLimitUpEnabled()}>
              <div class="flex items-center gap-2">
                <SettingsInput type="number" class="w-24" value={props.speedLimitUp()} onInput={(e) => props.setSpeedLimitUp(Number(e.currentTarget.value))} />
                <span class="text-xs text-muted-foreground font-mono">KB/s</span>
              </div>
            </Show>
            <SettingsSwitch checked={props.speedLimitUpEnabled()} onCheckedChange={props.setSpeedLimitUpEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('toolbar.alt_speed')}>
        <SettingsRow label={t('dialog.settings.alt_speed_enabled')} desc={t('dialog.settings.alt_speed_enabled_desc')}>
          <SettingsSwitch checked={props.altSpeedEnabled()} onCheckedChange={props.setAltSpeedEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.download_limit')}>
          <div class="flex items-center gap-2">
            <SettingsInput type="number" class="w-24" value={props.altSpeedDown()} onInput={(e) => props.setAltSpeedDown(Number(e.currentTarget.value))} />
            <span class="text-xs text-muted-foreground font-mono">KB/s</span>
          </div>
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.upload_limit')}>
          <div class="flex items-center gap-2">
            <SettingsInput type="number" class="w-24" value={props.altSpeedUp()} onInput={(e) => props.setAltSpeedUp(Number(e.currentTarget.value))} />
            <span class="text-xs text-muted-foreground font-mono">KB/s</span>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.alt_speed_time')}>
        <SettingsRow label={t('dialog.settings.alt_speed_time')} desc={t('dialog.settings.alt_speed_time_desc')}>
          <SettingsSwitch checked={props.altSpeedTimeEnabled()} onCheckedChange={props.setAltSpeedTimeEnabled} />
        </SettingsRow>

        <Show when={props.altSpeedTimeEnabled()}>
          <SettingsRow label={t('dialog.settings.start_time')}>
            <SettingsInput type="time" class="w-32" value={props.altSpeedTimeBegin()} onInput={(e) => props.setAltSpeedTimeBegin(e.currentTarget.value)} />
          </SettingsRow>
          <SettingsRow label={t('dialog.settings.end_time')}>
            <SettingsInput type="time" class="w-32" value={props.altSpeedTimeEnd()} onInput={(e) => props.setAltSpeedTimeEnd(e.currentTarget.value)} />
          </SettingsRow>
          
          <div class="flex flex-col p-4 gap-4 bg-secondary/10">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-medium text-foreground min-w-[60px]">{t('dialog.settings.days')}</span>
              <div class="flex gap-2">
                <button type="button" class="px-3 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors" onClick={() => props.setAltSpeedTimeDay(127)}>{t('days.every')}</button>
                <button type="button" class="px-3 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors" onClick={() => props.setAltSpeedTimeDay(62)}>{t('days.work')}</button>
                <button type="button" class="px-3 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors" onClick={() => props.setAltSpeedTimeDay(65)}>{t('days.weekend')}</button>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <For each={[
                { bit: 1, label: t('days.sun') }, { bit: 2, label: t('days.mon') }, { bit: 4, label: t('days.tue') },
                { bit: 8, label: t('days.wed') }, { bit: 16, label: t('days.thu') }, { bit: 32, label: t('days.fri') }, { bit: 64, label: t('days.sat') },
              ]}>
                {(day) => (
                  <label class={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-[12px] font-medium select-none", isDayActive(day.bit) ? "bg-primary/10 border-primary/50 text-primary" : "bg-background border-border text-muted-foreground hover:bg-muted")}>
                    <input type="checkbox" class="hidden" checked={isDayActive(day.bit)} onChange={() => toggleDay(day.bit)} />
                    {day.label}
                  </label>
                )}
              </For>
            </div>
          </div>
        </Show>
      </SettingsSection>
    </div>
  );
};
