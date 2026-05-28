import { Component, Show, For, createSignal } from 'solid-js';
import { useSession } from '../api/queries';
import { rpcCall } from '../api/rpc';
import { openSettingsModal, openTrackerAggregatorModal } from '../store/modalStore';
import { fetchTorrents } from '../store/torrentStore';
import { t } from '../utils/i18n';
import { showToast } from '../utils/toast';
import { createPersistedSignal } from '../utils/persist';
import { Settings, Zap, Globe, Users, Router, Shield, RefreshCw, Bell, Link, ListPlus } from 'lucide-solid';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const QuickSettings: Component<QuickSettingsProps> = (props) => {
  const session = useSession();
  const [toggling, setToggling] = createSignal<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = createPersistedSignal('trwm-notifications-enabled', false);

  const handleToggleNotifications = async (checked: boolean) => {
    if (!checked) {
      setNotificationsEnabled(false);
      showToast(`${t('dialog.settings.notifications')}: ${t('common.disabled')}`, 'success');
      return;
    }
    
    if (!('Notification' in window)) {
      showToast(t('common.error'), 'warning');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      showToast(`${t('dialog.settings.notifications')}: ${t('common.enabled')}`, 'success');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showToast(`${t('dialog.settings.notifications')}: ${t('common.enabled')}`, 'success');
      } else {
        setNotificationsEnabled(false);
        showToast(t('common.error'), 'warning');
      }
    } else {
      showToast(t('common.error'), 'warning');
    }
  };

  const handleRegisterMagnet = () => {
    if ('navigator' in window && 'registerProtocolHandler' in navigator) {
      try {
        navigator.registerProtocolHandler(
          'magnet',
          window.location.origin + '/?uri=%s'
        );
        showToast(t('dialog.settings.magnet_handler'), 'info');
      } catch (e) {
        showToast(t('common.error'), 'error');
      }
    } else {
      showToast(t('common.error'), 'warning');
    }
  };

  const toggleSetting = async (key: string, currentValue: boolean, label: string) => {
    if (toggling()) return;
    setToggling(key);
    try {
      await rpcCall('session_set', { [key]: !currentValue });
      session.refetch();
      showToast(`${label}: ${!currentValue ? t('common.enabled') : t('common.disabled')}`, 'success');
    } catch (e) {
      showToast(`${label}: ${t('common.error')}`, 'error');
    } finally {
      setToggling(null);
    }
  };

  const settingsItems = () => {
    const s = session.data;
    return [
      {
        key: 'alt_speed_enabled',
        label: t('toolbar.alt_speed'),
        icon: Zap,
        value: s?.alt_speed_enabled ?? false,
      },
      {
        key: 'dht_enabled',
        label: t('dialog.settings.dht'),
        icon: Globe,
        value: s?.dht_enabled ?? false,
      },
      {
        key: 'pex_enabled',
        label: t('dialog.settings.pex'),
        icon: Users,
        value: s?.pex_enabled ?? false,
      },
      {
        key: 'port_forwarding_enabled',
        label: t('dialog.settings.port_forwarding'),
        icon: Router,
        value: s?.port_forwarding_enabled ?? false,
      },
      {
        key: 'blocklist_enabled',
        label: t('dialog.settings.blocklist'),
        icon: Shield,
        value: s?.blocklist_enabled ?? false,
      },
    ];
  };

  const handleRefresh = () => {
    fetchTorrents(true);
    showToast(t('status.refreshed'), 'info');
  };

  return (
    <Show when={props.open}>
      {/* Overlay for click-outside close */}
      <div
        class="fixed inset-0 z-[99998]"
        onClick={props.onClose}
      />

      {/* Panel */}
      <div
        class="fixed bottom-12 right-3 z-[99999] w-[280px] bg-background/85 backdrop-blur-2xl border border-border/60 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div class="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-secondary/40">
          <Settings size={16} class="text-muted-foreground" />
          <span class="font-bold text-sm text-foreground">
            {t('toolbar.settings_short')}
          </span>
        </div>

        {/* Settings rows */}
        <div class="py-1.5 flex flex-col gap-0.5">
          <For each={settingsItems()}>
            {(item) => {
              const Icon = item.icon;
              const isToggling = () => toggling() === item.key;
              return (
                <div
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted"
                  onClick={() => toggleSetting(item.key, item.value, item.label)}
                >
                  <Icon
                    size={16}
                    class={cn("flex-shrink-0 transition-colors", item.value ? "text-primary" : "text-muted-foreground")}
                  />
                  <span class="text-sm font-semibold text-foreground flex-1">
                    {item.label}
                  </span>
                  
                  <Show
                    when={!isToggling()}
                    fallback={
                      <div class="w-9 h-5 flex items-center justify-center">
                        <div class="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <Switch
                      checked={item.value}
                      onCheckedChange={() => {}} // handled by parent div onClick
                      class="pointer-events-none" // prevent double firing
                    />
                  </Show>
                </div>
              );
            }}
          </For>

          {/* Local Settings separator */}
          <div class="h-px bg-border/40 mx-4 my-1" />

          {/* Notifications Toggle */}
          <div
            class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted"
            onClick={() => handleToggleNotifications(!notificationsEnabled())}
          >
            <Bell size={16} class={cn("flex-shrink-0 transition-colors", notificationsEnabled() ? "text-primary" : "text-muted-foreground")} />
            <span class="text-sm font-semibold text-foreground flex-1">
              {t('dialog.settings.notifications')}
            </span>
            <Switch
              checked={notificationsEnabled()}
              onCheckedChange={() => {}}
              class="pointer-events-none"
            />
          </div>

          {/* Magnet Handler Action */}
          <div
            class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted"
            onClick={handleRegisterMagnet}
          >
            <Link size={16} class="flex-shrink-0 text-muted-foreground" />
            <span class="text-sm font-semibold text-foreground flex-1">
              {t('dialog.settings.magnet_handler')}
            </span>
          </div>

          {/* Tracker Aggregator */}
          <div
            class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted"
            onClick={() => {
              props.onClose();
              openTrackerAggregatorModal();
            }}
          >
            <ListPlus size={16} class="flex-shrink-0 text-primary" />
            <span class="text-sm font-semibold text-foreground flex-1">
              {t('tracker_agg.entry')}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex gap-2 px-4 py-3 border-t border-border/50 bg-secondary/20">
          <Button
            variant="default"
            class="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-bold rounded-lg shadow-sm"
            onClick={() => {
              props.onClose();
              openSettingsModal();
            }}
          >
            <Settings size={14} />
            {t('dialog.settings.title')}
          </Button>
          
          <Button
            variant="secondary"
            class="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-bold rounded-lg bg-background border border-border/60 hover:bg-muted shadow-sm hover:shadow-md"
            onClick={handleRefresh}
          >
            <RefreshCw size={14} />
            {t('toolbar.refresh')}
          </Button>
        </div>
      </div>
    </Show>
  );
};
