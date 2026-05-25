import { Component, Show, For, createSignal, onMount } from 'solid-js';
import { useSession } from '../api/queries';
import { rpcCall } from '../api/rpc';
import { openSettingsModal } from '../store/modalStore';
import { fetchTorrents } from '../store/torrentStore';
import { t } from '../utils/i18n';
import { showToast } from '../utils/toast';
import { Settings, Zap, Globe, Users, Router, Shield, RefreshCw } from 'lucide-solid';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement;
}

const toggleSwitchStyle = (on: boolean): string => `
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${on ? 'var(--color-primary-500, #3b82f6)' : 'var(--color-neutral-400, #9ca3af)'};
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
`;

const toggleKnobStyle = (on: boolean): string => `
  position: absolute;
  top: 2px;
  left: ${on ? '18px' : '2px'};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

export const QuickSettings: Component<QuickSettingsProps> = (props) => {
  const session = useSession();
  const [toggling, setToggling] = createSignal<string | null>(null);

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
        style={{
          position: 'fixed',
          inset: '0',
          'z-index': '99998',
        }}
        onClick={props.onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: '48px',
          right: '12px',
          'z-index': '99999',
          width: '280px',
          'background-color': 'var(--bg-primary, rgba(255,255,255,0.85))',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
          'border-radius': '12px',
          'box-shadow': '0 8px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          animation: 'quickSettingsSlideUp 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          class="flex items-center gap-2 px-4 py-3"
          style={{
            'border-bottom': '1px solid var(--border-color, rgba(0,0,0,0.08))',
          }}
        >
          <Settings size={16} style={{ color: 'var(--text-secondary, #6b7280)' }} />
          <span
            class="font-semibold text-sm"
            style={{ color: 'var(--text-primary, #111827)' }}
          >
            {t('toolbar.settings_short')}
          </span>
        </div>

        {/* Settings rows */}
        <div class="py-1">
          <For each={settingsItems()}>
            {(item) => {
              const Icon = item.icon;
              const isToggling = () => toggling() === item.key;
              return (
                <div
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                  style={{
                    'transition': 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--bg-hover, rgba(0,0,0,0.04))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                  onClick={() => toggleSetting(item.key, item.value, item.label)}
                >
                  <Icon
                    size={16}
                    style={{
                      color: item.value
                        ? 'var(--color-primary-500, #3b82f6)'
                        : 'var(--text-tertiary, #9ca3af)',
                      'flex-shrink': '0',
                      transition: 'color 0.2s ease',
                    }}
                  />
                  <span
                    class="text-sm flex-1"
                    style={{
                      color: 'var(--text-primary, #111827)',
                    }}
                  >
                    {item.label}
                  </span>
                  <Show
                    when={!isToggling()}
                    fallback={
                      <div
                        style={{
                          width: '36px',
                          height: '20px',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid var(--text-tertiary, #9ca3af)',
                            'border-top-color': 'transparent',
                            'border-radius': '50%',
                            animation: 'quickSettingsSpin 0.6s linear infinite',
                          }}
                        />
                      </div>
                    }
                  >
                    <div style={toggleSwitchStyle(item.value)}>
                      <div style={toggleKnobStyle(item.value)} />
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Action buttons */}
        <div
          class="flex gap-2 px-4 py-2.5"
          style={{
            'border-top': '1px solid var(--border-color, rgba(0,0,0,0.08))',
          }}
        >
          <button
            class="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md"
            style={{
              'background': 'linear-gradient(180deg, var(--color-primary-400, #60a5fa) 0%, var(--color-primary-600, #2563eb) 100%)',
              color: '#fff',
              border: '1px solid var(--color-primary-700, #1d4ed8)',
              'border-top-color': 'var(--color-primary-500, #3b82f6)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              'box-shadow': '0 2px 0 var(--color-primary-800, #1e40af), 0 3px 6px rgba(0,0,0,0.15)',
              'text-shadow': '0 1px 1px rgba(0,0,0,0.2)',
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = '0 0px 0 var(--color-primary-800, #1e40af), 0 1px 2px rgba(0,0,0,0.15)';
              el.style.transform = 'translateY(2px)';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = '0 2px 0 var(--color-primary-800, #1e40af), 0 3px 6px rgba(0,0,0,0.15)';
              el.style.transform = 'translateY(0)';
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(180deg, var(--color-primary-300, #93c5fd) 0%, var(--color-primary-500, #3b82f6) 100%)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(180deg, var(--color-primary-400, #60a5fa) 0%, var(--color-primary-600, #2563eb) 100%)';
              el.style.boxShadow = '0 2px 0 var(--color-primary-800, #1e40af), 0 3px 6px rgba(0,0,0,0.15)';
              el.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              props.onClose();
              openSettingsModal();
            }}
          >
            <Settings size={11} />
            {t('dialog.settings.title')}
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md"
            style={{
              'background': 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)',
              color: 'var(--text-secondary, #4b5563)',
              border: '1px solid rgba(0,0,0,0.15)',
              'border-top-color': 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              'box-shadow': '0 2px 0 rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)',
              'text-shadow': '0 1px 0 rgba(255,255,255,0.5)',
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = '0 0px 0 rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)';
              el.style.transform = 'translateY(2px)';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = '0 2px 0 rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)';
              el.style.transform = 'translateY(0)';
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(180deg, #fff 0%, rgba(245,245,245,0.95) 100%)';
              el.style.color = 'var(--text-primary, #111827)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)';
              el.style.color = 'var(--text-secondary, #4b5563)';
              el.style.boxShadow = '0 2px 0 rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)';
              el.style.transform = 'translateY(0)';
            }}
            onClick={handleRefresh}
          >
            <RefreshCw size={11} />
            {t('toolbar.refresh')}
          </button>
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes quickSettingsSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes quickSettingsSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Show>
  );
};
