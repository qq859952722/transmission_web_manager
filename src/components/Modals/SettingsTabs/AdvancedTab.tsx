import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';

interface AdvancedTabProps {
  defaultTrackers: () => string;
  setDefaultTrackers: (v: string) => void;
  cacheSizeMb: () => number;
  setCacheSizeMb: (v: number) => void;
  cacheSizeMib: () => number;
  setCacheSizeMib: (v: number) => void;
  rpcVersion: () => number;
}

export const AdvancedTab: Component<AdvancedTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="form-group">
        <label>{t('dialog.tracker.add_label')}</label>
        <textarea
          rows="5"
          placeholder={t('dialog.tracker.format_info')}
          value={props.defaultTrackers()}
          onInput={(e) => props.setDefaultTrackers(e.currentTarget.value)}
          class="font-mono text-xs"
        />
      </div>
      <div class="form-group mt-4">
        <label>{t('dialog.settings.cache_size')} (MB):</label>
        <Show
          when={props.rpcVersion() >= 17}
          fallback={
            <input
              type="number"
              value={props.cacheSizeMb()}
              onInput={(e) => props.setCacheSizeMb(Number(e.currentTarget.value))}
            />
          }
        >
          <input
            type="number"
            value={props.cacheSizeMib()}
            onInput={(e) => props.setCacheSizeMib(Number(e.currentTarget.value))}
          />
        </Show>
      </div>
    </div>
  );
};
