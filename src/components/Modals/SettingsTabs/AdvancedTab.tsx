import { Component, Show, createSignal } from 'solid-js';
import { t } from '../../../utils/i18n';
import { rpcCall } from '../../../api/rpc';
import { showToast } from '../../../utils/toast';
import { SettingsSection, SettingsRow, SettingsInput } from './SettingsUI';
import { AlertTriangle } from 'lucide-solid';

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
  const [showConfirmShutdown, setShowConfirmShutdown] = createSignal(false);

  const handleShutdown = async () => {
    try {
      await rpcCall('session_close');
      showToast(t('dialog.settings.shutdown_success'), 'success');
    } catch {
      showToast(t('common.operation_failed'), 'error');
    } finally {
      setShowConfirmShutdown(false);
    }
  };

  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.default_trackers')}>
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

      <SettingsSection title={t('dialog.settings.memory')}>
        <SettingsRow label={t('dialog.settings.cache_size')} desc={t('dialog.settings.cache_size_desc')}>
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

      <div class="p-4 mt-4 border-t border-border/40">
        <button
          class="w-full px-4 py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 active:bg-destructive/80 text-destructive-foreground text-[13px] font-medium transition-colors"
          onClick={() => setShowConfirmShutdown(true)}
        >
          {t('dialog.settings.shutdown_daemon')}
        </button>
      </div>

      {/* Shutdown confirmation dialog */}
      <Show when={showConfirmShutdown()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowConfirmShutdown(false)}>
          <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div class="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-secondary/50">
              <AlertTriangle size={20} class="text-warning" />
              <span class="text-base font-bold text-foreground">{t('dialog.settings.shutdown_daemon')}</span>
            </div>
            <div class="px-6 py-4 text-sm text-muted-foreground">
              {t('dialog.settings.shutdown_confirm')}
            </div>
            <div class="flex gap-2 justify-end px-6 py-3 border-t border-border/50 bg-secondary/30">
              <button class="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm" onClick={() => setShowConfirmShutdown(false)}>{t('dialog.cancel')}</button>
              <button class="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold px-6 py-1.5 rounded-lg transition-colors text-sm" onClick={handleShutdown}>{t('dialog.ok')}</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
