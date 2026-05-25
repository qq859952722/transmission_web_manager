import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';

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
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('dialog.settings.dl_queue')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="dl-q-en"
              checked={props.downloadQueueEnabled()}
              onChange={(e) => props.setDownloadQueueEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.max_dl')}:</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.downloadQueueEnabled()}
            value={props.downloadQueueSize()}
            onInput={(e) => props.setDownloadQueueSize(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.seed_queue')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="ul-q-en"
              checked={props.seedQueueEnabled()}
              onChange={(e) => props.setSeedQueueEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.max_seed')}:</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.seedQueueEnabled()}
            value={props.seedQueueSize()}
            onInput={(e) => props.setSeedQueueSize(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.stalled_detection')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="stall-en"
              checked={props.queueStalledEnabled()}
              onChange={(e) => props.setQueueStalledEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.stalled_timeout')}:</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.queueStalledEnabled()}
            value={props.queueStalledMinutes()}
            onInput={(e) => props.setQueueStalledMinutes(Number(e.currentTarget.value))}
          />
          <span class="text-sm text-secondary">({t('times.min')})</span>
        </div>
      </div>
    </div>
  );
};
