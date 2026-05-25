import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';

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
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('detail.settings.seed_ratio')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.seedRatioLimited()}
              onChange={(e) => props.setSeedRatioLimited(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
          <input
            type="number"
            step="0.1"
            class="w-24 text-right"
            disabled={!props.seedRatioLimited()}
            value={props.seedRatioLimit()}
            onInput={(e) => props.setSeedRatioLimit(Number(e.currentTarget.value))}
          />
        </div>
      </div>
      <div class="settings-section">
        <h4>{t('detail.settings.seed_idle')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.idleSeedingLimitEnabled()}
              onChange={(e) => props.setIdleSeedingLimitEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.idleSeedingLimitEnabled()}
            value={props.idleSeedingLimit()}
            onInput={(e) => props.setIdleSeedingLimit(Number(e.currentTarget.value))}
          />
          <span class="text-sm text-secondary">({t('times.min')})</span>
        </div>
      </div>
    </div>
  );
};
