import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';

interface SpeedTabProps {
  speedLimitDownEnabled: () => boolean;
  setSpeedLimitDownEnabled: (v: boolean) => void;
  speedLimitDown: () => number;
  setSpeedLimitDown: (v: number) => void;
  speedLimitUpEnabled: () => boolean;
  setSpeedLimitUpEnabled: (v: boolean) => void;
  speedLimitUp: () => number;
  setSpeedLimitUp: (v: number) => void;
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
    if (isDayActive(day)) {
      props.setAltSpeedTimeDay(props.altSpeedTimeDay() & ~day);
    } else {
      props.setAltSpeedTimeDay(props.altSpeedTimeDay() | day);
    }
  };

  return (
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('dialog.settings.global_speed')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.speedLimitDownEnabled()}
              onChange={(e) => props.setSpeedLimitDownEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.dl_limit_enabled')} (KB/s):</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.speedLimitDownEnabled()}
            value={props.speedLimitDown()}
            onInput={(e) => props.setSpeedLimitDown(Number(e.currentTarget.value))}
          />
        </div>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.speedLimitUpEnabled()}
              onChange={(e) => props.setSpeedLimitUpEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.ul_limit_enabled')} (KB/s):</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.speedLimitUpEnabled()}
            value={props.speedLimitUp()}
            onInput={(e) => props.setSpeedLimitUp(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('toolbar.alt_speed')}</h4>
        <div class="form-row">
          <span class="flex-1 text-sm">{t('dialog.settings.download_limit')} (KB/s):</span>
          <input
            type="number"
            class="w-24 text-right"
            value={props.altSpeedDown()}
            onInput={(e) => props.setAltSpeedDown(Number(e.currentTarget.value))}
          />
        </div>
        <div class="form-row">
          <span class="flex-1 text-sm">{t('dialog.settings.upload_limit')} (KB/s):</span>
          <input
            type="number"
            class="w-24 text-right"
            value={props.altSpeedUp()}
            onInput={(e) => props.setAltSpeedUp(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.altSpeedTimeEnabled()}
              onChange={(e) => props.setAltSpeedTimeEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.alt_speed_time')}</span>
          </label>
        </div>

        <Show when={props.altSpeedTimeEnabled()}>
          <div class="form-grid">
            <div class="form-group">
              <label>{t('dialog.settings.start_time')}</label>
              <input
                type="time"
                value={props.altSpeedTimeBegin()}
                onInput={(e) => props.setAltSpeedTimeBegin(e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <label>{t('dialog.settings.end_time')}</label>
              <input
                type="time"
                value={props.altSpeedTimeEnd()}
                onInput={(e) => props.setAltSpeedTimeEnd(e.currentTarget.value)}
              />
            </div>
          </div>

          <div class="form-group">
            <label>{t('dialog.settings.days')}</label>
            <div class="daymask-presets flex-row gap-2 mb-2">
              <button
                type="button"
                class="trwm-btn-sm"
                onClick={() => props.setAltSpeedTimeDay(127)}
              >
                {t('days.every')}
              </button>
              <button
                type="button"
                class="trwm-btn-sm"
                onClick={() => props.setAltSpeedTimeDay(62)}
              >
                {t('days.work')}
              </button>
              <button
                type="button"
                class="trwm-btn-sm"
                onClick={() => props.setAltSpeedTimeDay(65)}
              >
                {t('days.weekend')}
              </button>
            </div>
            <div class="daymask-checkboxes flex flex-row gap-1.5 flex-nowrap overflow-x-auto">
              <For
                each={[
                  { bit: 1, label: t('days.sun') },
                  { bit: 2, label: t('days.mon') },
                  { bit: 4, label: t('days.tue') },
                  { bit: 8, label: t('days.wed') },
                  { bit: 16, label: t('days.thu') },
                  { bit: 32, label: t('days.fri') },
                  { bit: 64, label: t('days.sat') },
                ]}
              >
                {(day) => (
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isDayActive(day.bit)}
                      onChange={() => toggleDay(day.bit)}
                    />
                    <span>{day.label}</span>
                  </label>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
