import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput } from './SettingsUI';

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
    <div class="animate-in fade-in duration-300">
      <SettingsSection title="Default Trackers">
        <div class="p-4 flex flex-col gap-2">
          <span class="text-[13px] font-medium text-foreground">{t('dialog.tracker.add_label')}</span>
          <textarea
            rows="5"
            class="bg-background/80 border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono resize-y w-full mt-1 transition-all"
            placeholder={t('dialog.tracker.format_info')}
            value={props.defaultTrackers()}
            onInput={(e) => props.setDefaultTrackers(e.currentTarget.value)}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Memory">
        <SettingsRow label={t('dialog.settings.cache_size')} desc="Size of disk cache in MB">
          <Show
            when={props.rpcVersion() >= 17}
            fallback={
              <SettingsInput
                type="number"
                class="w-24"
                value={props.cacheSizeMb()}
                onInput={(e) => props.setCacheSizeMb(Number(e.currentTarget.value))}
              />
            }
          >
            <SettingsInput
              type="number"
              class="w-24"
              value={props.cacheSizeMib()}
              onInput={(e) => props.setCacheSizeMib(Number(e.currentTarget.value))}
            />
          </Show>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
