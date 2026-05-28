import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
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
import { cn } from '../lib/utils';

export const Sidebar: Component = () => {
  const [showTrackers, setShowTrackers] = createSignal(true);
  const [showDirs, setShowDirs] = createSignal(true);
  const [showLabels, setShowLabels] = createSignal(true);
  const [showPrivacy, setShowPrivacy] = createSignal(true);

  type FilterType = 'status' | 'tracker' | 'dir' | 'label' | 'privacy';
  type FilterValue = string;

  const applyFilter = (type: FilterType, value: FilterValue) => {
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
    else if (type === 'privacy') setPrivacyFilter(value as 'public' | 'private');
  };

  const statusItems = createMemo(() => [
    { id: 'all', name: t('sidebar.status_all'), icon: Folder },
    { id: 'downloading', name: t('sidebar.status_downloading'), icon: ArrowDown, iconClass: 'text-blue-500', activeBgClass: 'bg-blue-500/10', activeBadgeBgClass: 'bg-blue-500', activeTextClass: 'text-blue-500', activeBorderClass: 'border-l-blue-500' },
    { id: 'seeding', name: t('sidebar.status_seeding'), icon: ArrowUp, iconClass: 'text-green-500', activeBgClass: 'bg-green-500/10', activeBadgeBgClass: 'bg-green-500', activeTextClass: 'text-green-500', activeBorderClass: 'border-l-green-500' },
    { id: 'stopped', name: t('sidebar.status_stopped'), icon: Pause, iconClass: 'text-muted-foreground/80' },
    { id: 'checking', name: t('sidebar.status_checking'), icon: ShieldCheck, iconClass: 'text-amber-500', activeBgClass: 'bg-amber-500/10', activeBadgeBgClass: 'bg-amber-500', activeTextClass: 'text-amber-500', activeBorderClass: 'border-l-amber-500' },
    { id: 'active', name: t('sidebar.status_active'), icon: Circle, iconClass: 'text-purple-500', activeBgClass: 'bg-purple-500/10', activeBadgeBgClass: 'bg-purple-500', activeTextClass: 'text-purple-500', activeBorderClass: 'border-l-purple-500' },
    { id: 'error', name: t('sidebar.status_error'), icon: CircleX, iconClass: 'text-red-500', activeBgClass: 'bg-red-500/10', activeBadgeBgClass: 'bg-red-500', activeTextClass: 'text-red-500', activeBorderClass: 'border-l-red-500' },
    { id: 'queued', name: t('sidebar.status_queued'), icon: List, iconClass: 'text-amber-500', activeBgClass: 'bg-amber-500/10', activeBadgeBgClass: 'bg-amber-500', activeTextClass: 'text-amber-500', activeBorderClass: 'border-l-amber-500' },
  ]);

  const ItemIcon = (props: { icon: Component<any>; class?: string }) => {
    const IconComp = props.icon;
    return <IconComp size={14} class={cn("shrink-0 w-4 text-center", props.class)} />;
  };

  return (
    <div class="flex flex-col h-full overflow-hidden select-none bg-background">
      <div class="flex items-center gap-2.5 h-12 px-4 shrink-0 border-b border-border font-bold text-[15px] text-foreground tracking-tight">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary w-5 h-5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>{t('toolbar.logo')}</span>
      </div>

      <div class="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {/* Status Filters */}
        <div class="flex flex-col gap-px">
          <div class="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 py-1">{t('sidebar.status')}</div>
          <For each={statusItems()}>
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

              return (
                <div
                  classList={{
                    "group flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                    "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": !isActive(),
                    [`${item.activeBgClass || 'bg-primary/10'} ${item.activeTextClass || 'text-primary'} font-semibold ${item.activeBorderClass || 'border-l-primary'}`]: isActive()
                  }}
                  onClick={() => applyFilter('status', item.id)}
                >
                  <ItemIcon icon={item.icon} class={isActive() ? "" : (item.iconClass || "text-muted-foreground group-hover:text-foreground")} />
                  <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
                  <span classList={{
                    "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                    [`${item.activeBadgeBgClass || 'bg-primary'} text-white dark:text-black`]: isActive(),
                    "bg-muted text-muted-foreground group-hover:text-foreground": !isActive()
                  }}>{count()}</span>
                </div>
              );
            }}
          </For>
        </div>

        {/* Directory Grouping */}
        <Show when={Object.keys(sidebarCounts().dirs).length > 0}>
          <div class="flex flex-col gap-px">
            <div class="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm transition-colors hover:bg-muted/50" onClick={() => setShowDirs(!showDirs())}>
              <span class="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('sidebar.dirs')}</span>
              <ChevronDown size={14} class={cn("text-muted-foreground transition-transform duration-250 ease-out w-3.5 h-3.5", showDirs() ? 'rotate-180' : '')} />
            </div>
            <Show when={showDirs()}>
              <For each={Object.entries(sidebarCounts().dirs)}>
                {([dir, count]) => {
                  const dirName = dir.split('/').pop() || dir;
                  const isActive = () => dirFilter() === dir;

                  return (
                    <div
                      classList={{
                        "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                        "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": !isActive(),
                        "bg-primary/10 text-primary font-semibold border-l-primary": isActive()
                      }}
                      onClick={() => applyFilter('dir', dir)}
                      title={dir}
                    >
                      <ItemIcon icon={FolderOpen} />
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{dirName}</span>
                      <span classList={{
                        "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                        "bg-primary text-primary-foreground": isActive(),
                        "bg-muted text-muted-foreground group-hover:text-foreground": !isActive()
                      }}>{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Trackers Grouping */}
        <Show when={Object.keys(sidebarCounts().trackers).length > 0}>
          <div class="flex flex-col gap-px">
            <div class="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm transition-colors hover:bg-muted/50" onClick={() => setShowTrackers(!showTrackers())}>
              <span class="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('sidebar.trackers')}</span>
              <ChevronDown size={14} class={cn("text-muted-foreground transition-transform duration-250 ease-out w-3.5 h-3.5", showTrackers() ? 'rotate-180' : '')} />
            </div>
            <Show when={showTrackers()}>
              <For each={Object.entries(sidebarCounts().trackers)}>
                {([domain, count]) => {
                  const isActive = () => trackerFilter() === domain;

                  return (
                    <div
                      classList={{
                        "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                        "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": !isActive(),
                        "bg-primary/10 text-primary font-semibold border-l-primary": isActive()
                      }}
                      onClick={() => applyFilter('tracker', domain)}
                      title={domain}
                    >
                      <ItemIcon icon={Globe} />
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{domain}</span>
                      <span classList={{
                        "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                        "bg-primary text-primary-foreground": isActive(),
                        "bg-muted text-muted-foreground group-hover:text-foreground": !isActive()
                      }}>{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Labels Grouping */}
        <Show when={Object.keys(sidebarCounts().labels).length > 0}>
          <div class="flex flex-col gap-px">
            <div class="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm transition-colors hover:bg-muted/50" onClick={() => setShowLabels(!showLabels())}>
              <span class="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('sidebar.labels')}</span>
              <ChevronDown size={14} class={cn("text-muted-foreground transition-transform duration-250 ease-out w-3.5 h-3.5", showLabels() ? 'rotate-180' : '')} />
            </div>
            <Show when={showLabels()}>
              <For each={Object.entries(sidebarCounts().labels)}>
                {([label, count]) => {
                  const displayLabel = label === '_unlabeled' ? t('sidebar.unlabeled') : label;
                  const isActive = () => labelFilter() === label;

                  return (
                    <div
                      classList={{
                        "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                        "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": !isActive(),
                        "bg-primary/10 text-primary font-semibold border-l-primary": isActive()
                      }}
                      onClick={() => applyFilter('label', label)}
                    >
                      <ItemIcon icon={Tag} />
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{displayLabel}</span>
                      <span classList={{
                        "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                        "bg-primary text-primary-foreground": isActive(),
                        "bg-muted text-muted-foreground group-hover:text-foreground": !isActive()
                      }}>{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Privacy Grouping */}
        <div class="flex flex-col gap-px">
          <div class="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm transition-colors hover:bg-muted/50" onClick={() => setShowPrivacy(!showPrivacy())}>
            <span class="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{t('sidebar.privacy')}</span>
            <ChevronDown size={14} class={cn("text-muted-foreground transition-transform duration-250 ease-out w-3.5 h-3.5", showPrivacy() ? 'rotate-180' : '')} />
          </div>
          <Show when={showPrivacy()}>
            <div
              classList={{
                "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": privacyFilter() !== 'public',
                "bg-primary/10 text-primary font-semibold border-l-primary": privacyFilter() === 'public'
              }}
              onClick={() => applyFilter('privacy', 'public')}
            >
              <ItemIcon icon={Unlock} />
              <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{t('sidebar.privacy_public')}</span>
              <span classList={{
                "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                "bg-primary text-primary-foreground": privacyFilter() === 'public',
                "bg-muted text-muted-foreground group-hover:text-foreground": privacyFilter() !== 'public'
              }}>{sidebarCounts().public}</span>
            </div>
            <div
              classList={{
                "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer rounded-md text-[13px] font-medium border-l-[3px] transition-all duration-200": true,
                "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground": privacyFilter() !== 'private',
                "bg-primary/10 text-primary font-semibold border-l-primary": privacyFilter() === 'private'
              }}
              onClick={() => applyFilter('privacy', 'private')}
            >
              <ItemIcon icon={Lock} />
              <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{t('sidebar.privacy_private')}</span>
              <span classList={{
                "tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center transition-colors": true,
                "bg-primary text-primary-foreground": privacyFilter() === 'private',
                "bg-muted text-muted-foreground group-hover:text-foreground": privacyFilter() !== 'private'
              }}>{sidebarCounts().private}</span>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
