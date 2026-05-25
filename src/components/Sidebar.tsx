import { type Component, For, Show, createSignal } from 'solid-js';
import {
  Folder,
  ArrowDown,
  ArrowUp,
  Pause,
  ShieldCheck,
  Circle,
  CircleX,
  List,
  FolderOpen,
  Globe,
  Tag,
  Unlock,
  Lock,
  ChevronDown,
} from 'lucide-solid';
import {
  sidebarCounts,
  statusFilter,
  setStatusFilter,
  trackerFilter,
  setTrackerFilter,
  dirFilter,
  setDirFilter,
  labelFilter,
  setLabelFilter,
  privacyFilter,
  setPrivacyFilter,
  clearSelection
} from '../store/torrentStore';
import { t } from '../utils/i18n';
import './Sidebar.css';

export const Sidebar: Component = () => {
  const [showTrackers, setShowTrackers] = createSignal(true);
  const [showDirs, setShowDirs] = createSignal(true);
  const [showLabels, setShowLabels] = createSignal(true);
  const [showPrivacy, setShowPrivacy] = createSignal(true);

  const applyFilter = (type: 'status' | 'tracker' | 'dir' | 'label' | 'privacy', value: any) => {
    setStatusFilter('all');
    setTrackerFilter(null);
    setDirFilter(null);
    setLabelFilter(null);
    setPrivacyFilter('all');
    clearSelection();

    if (type === 'status') setStatusFilter(value);
    else if (type === 'tracker') setTrackerFilter(value);
    else if (type === 'dir') setDirFilter(value);
    else if (type === 'label') setLabelFilter(value);
    else if (type === 'privacy') setPrivacyFilter(value);
  };

  const statusItems: { id: string; name: string; icon: Component<{ size?: number; class?: string }> }[] = [
    { id: 'all', name: t('sidebar.status_all'), icon: Folder },
    { id: 'downloading', name: t('sidebar.status_downloading'), icon: ArrowDown },
    { id: 'seeding', name: t('sidebar.status_seeding'), icon: ArrowUp },
    { id: 'stopped', name: t('sidebar.status_stopped'), icon: Pause },
    { id: 'checking', name: t('sidebar.status_checking'), icon: ShieldCheck },
    { id: 'active', name: t('sidebar.status_active'), icon: Circle },
    { id: 'error', name: t('sidebar.status_error'), icon: CircleX },
    { id: 'queued', name: t('sidebar.status_queued'), icon: List },
  ];

  return (
    <div class="trwm-sidebar-inner flex flex-col h-full overflow-hidden select-none">
      <div class="sidebar-brand flex items-center gap-2.5 h-12 px-4 shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="brand-logo w-5 h-5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>{t('toolbar.logo')}</span>
      </div>

      <div class="sidebar-sections-container flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {/* Status Filters */}
        <div class="sidebar-section flex flex-col gap-px">
          <div class="section-title">{t('sidebar.status')}</div>
          <For each={statusItems}>
            {(item) => {
              const count = () => {
                const c = sidebarCounts();
                return ((c as any)[item.id] ?? 0) as number;
              };

              const isActive = () =>
                statusFilter() === item.id &&
                !trackerFilter() &&
                !dirFilter() &&
                !labelFilter() &&
                privacyFilter() === 'all';

              const IconComp = item.icon;
              return (
                <div
                  class={`sidebar-item flex items-center gap-2 px-3 py-1.5 cursor-pointer ${isActive() ? 'active' : ''}`}
                  onClick={() => applyFilter('status', item.id)}
                >
                  <IconComp size={14} class="item-icon shrink-0 w-4 text-center" />
                  <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
                  <span class="item-count tabular-nums">{count()}</span>
                </div>
              );
            }}
          </For>
        </div>

        {/* Directory Grouping */}
        <Show when={Object.keys(sidebarCounts().dirs).length > 0}>
          <div class="sidebar-section flex flex-col gap-px">
            <div class="section-header flex items-center justify-between px-2 py-1.5 cursor-pointer" onClick={() => setShowDirs(!showDirs())}>
              <span class="section-title">{t('sidebar.dirs')}</span>
              <ChevronDown size={14} class={`chevron-icon w-3.5 h-3.5 ${showDirs() ? 'expanded' : ''}`} />
            </div>
            <Show when={showDirs()}>
              <For each={Object.entries(sidebarCounts().dirs)}>
                {([dir, count]) => {
                  const dirName = dir.split('/').pop() || dir;
                  const isActive = () => dirFilter() === dir;

                  return (
                    <div
                      class={`sidebar-item sub-item flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('dir', dir)}
                      title={dir}
                    >
                      <FolderOpen size={14} class="item-icon shrink-0 w-4 text-center" />
                      <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{dirName}</span>
                      <span class="item-count tabular-nums">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Trackers Grouping */}
        <Show when={Object.keys(sidebarCounts().trackers).length > 0}>
          <div class="sidebar-section flex flex-col gap-px">
            <div class="section-header flex items-center justify-between px-2 py-1.5 cursor-pointer" onClick={() => setShowTrackers(!showTrackers())}>
              <span class="section-title">{t('sidebar.trackers')}</span>
              <ChevronDown size={14} class={`chevron-icon w-3.5 h-3.5 ${showTrackers() ? 'expanded' : ''}`} />
            </div>
            <Show when={showTrackers()}>
              <For each={Object.entries(sidebarCounts().trackers)}>
                {([domain, count]) => {
                  const isActive = () => trackerFilter() === domain;

                  return (
                    <div
                      class={`sidebar-item sub-item flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('tracker', domain)}
                      title={domain}
                    >
                      <Globe size={14} class="item-icon shrink-0 w-4 text-center" />
                      <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{domain}</span>
                      <span class="item-count tabular-nums">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Labels Grouping */}
        <Show when={Object.keys(sidebarCounts().labels).length > 0}>
          <div class="sidebar-section flex flex-col gap-px">
            <div class="section-header flex items-center justify-between px-2 py-1.5 cursor-pointer" onClick={() => setShowLabels(!showLabels())}>
              <span class="section-title">{t('sidebar.labels')}</span>
              <ChevronDown size={14} class={`chevron-icon w-3.5 h-3.5 ${showLabels() ? 'expanded' : ''}`} />
            </div>
            <Show when={showLabels()}>
              <For each={Object.entries(sidebarCounts().labels)}>
                {([label, count]) => {
                  const displayLabel = label === '_unlabeled' ? t('sidebar.unlabeled') : label;
                  const isActive = () => labelFilter() === label;

                  return (
                    <div
                      class={`sidebar-item sub-item flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('label', label)}
                    >
                      <Tag size={14} class="item-icon shrink-0 w-4 text-center" />
                      <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{displayLabel}</span>
                      <span class="item-count tabular-nums">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Privacy Grouping */}
        <div class="sidebar-section flex flex-col gap-px">
          <div class="section-header flex items-center justify-between px-2 py-1.5 cursor-pointer" onClick={() => setShowPrivacy(!showPrivacy())}>
            <span class="section-title">{t('sidebar.privacy')}</span>
            <ChevronDown size={14} class={`chevron-icon w-3.5 h-3.5 ${showPrivacy() ? 'expanded' : ''}`} />
          </div>
          <Show when={showPrivacy()}>
            <div
              class={`sidebar-item sub-item flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer ${privacyFilter() === 'public' ? 'active' : ''}`}
              onClick={() => applyFilter('privacy', 'public')}
            >
              <Unlock size={14} class="item-icon shrink-0 w-4 text-center" />
              <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{t('sidebar.privacy_public')}</span>
              <span class="item-count tabular-nums">{sidebarCounts().public}</span>
            </div>
            <div
              class={`sidebar-item sub-item flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer ${privacyFilter() === 'private' ? 'active' : ''}`}
              onClick={() => applyFilter('privacy', 'private')}
            >
              <Lock size={14} class="item-icon shrink-0 w-4 text-center" />
              <span class="item-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{t('sidebar.privacy_private')}</span>
              <span class="item-count tabular-nums">{sidebarCounts().private}</span>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
