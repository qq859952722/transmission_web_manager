import { type Component, For, Show, createSignal } from 'solid-js';
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
  // Expand/collapse states for groupings
  const [showTrackers, setShowTrackers] = createSignal(true);
  const [showDirs, setShowDirs] = createSignal(true);
  const [showLabels, setShowLabels] = createSignal(true);
  const [showPrivacy, setShowPrivacy] = createSignal(true);

  // Set specific filter type helper
  const applyFilter = (type: 'status' | 'tracker' | 'dir' | 'label' | 'privacy', value: any) => {
    // Reset other filters to avoid empty intersections
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

  const statusItems = [
    { id: 'all', name: t('sidebar.status_all'), icon: '📁' },
    { id: 'downloading', name: t('sidebar.status_downloading'), icon: '⬇' },
    { id: 'seeding', name: t('sidebar.status_seeding'), icon: '⬆' },
    { id: 'stopped', name: t('sidebar.status_stopped'), icon: '⏸' },
    { id: 'checking', name: t('sidebar.status_checking'), icon: '✓' },
    { id: 'active', name: t('sidebar.status_active'), icon: '●' },
    { id: 'error', name: t('sidebar.status_error'), icon: '✕' },
    { id: 'queued', name: t('sidebar.status_queued'), icon: '☰' },
  ];

  return (
    <div class="trwm-sidebar-inner">
      <div class="sidebar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="brand-logo">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>{t('toolbar.logo')}</span>
      </div>

      <div class="sidebar-sections-container">
        {/* Status Filters */}
        <div class="sidebar-section">
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

              return (
                <div
                  class={`sidebar-item ${isActive() ? 'active' : ''}`}
                  onClick={() => applyFilter('status', item.id)}
                >
                  <span class="item-icon">{item.icon}</span>
                  <span class="item-label">{item.name}</span>
                  <span class="item-count text-mono">{count()}</span>
                </div>
              );
            }}
          </For>
        </div>

        {/* Directory Grouping */}
        <Show when={Object.keys(sidebarCounts().dirs).length > 0}>
          <div class="sidebar-section">
            <div class="section-header" onClick={() => setShowDirs(!showDirs())}>
              <span class="section-title">{t('sidebar.dirs')}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class={`chevron-icon ${showDirs() ? 'expanded' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <Show when={showDirs()}>
              <For each={Object.entries(sidebarCounts().dirs)}>
                {([dir, count]) => {
                  const dirName = dir.split('/').pop() || dir;
                  const isActive = () => dirFilter() === dir;

                  return (
                    <div
                      class={`sidebar-item sub-item ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('dir', dir)}
                      title={dir}
                    >
                      <span class="item-icon">📂</span>
                      <span class="item-label">{dirName}</span>
                      <span class="item-count text-mono">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Trackers Grouping */}
        <Show when={Object.keys(sidebarCounts().trackers).length > 0}>
          <div class="sidebar-section">
            <div class="section-header" onClick={() => setShowTrackers(!showTrackers())}>
              <span class="section-title">{t('sidebar.trackers')}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class={`chevron-icon ${showTrackers() ? 'expanded' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <Show when={showTrackers()}>
              <For each={Object.entries(sidebarCounts().trackers)}>
                {([domain, count]) => {
                  const isActive = () => trackerFilter() === domain;

                  return (
                    <div
                      class={`sidebar-item sub-item ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('tracker', domain)}
                      title={domain}
                    >
                      <span class="item-icon">🌐</span>
                      <span class="item-label">{domain}</span>
                      <span class="item-count text-mono">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Labels Grouping */}
        <Show when={Object.keys(sidebarCounts().labels).length > 0}>
          <div class="sidebar-section">
            <div class="section-header" onClick={() => setShowLabels(!showLabels())}>
              <span class="section-title">{t('sidebar.labels')}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class={`chevron-icon ${showLabels() ? 'expanded' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <Show when={showLabels()}>
              <For each={Object.entries(sidebarCounts().labels)}>
                {([label, count]) => {
                  const displayLabel = label === '_unlabeled' ? t('sidebar.unlabeled') : label;
                  const isActive = () => labelFilter() === label;

                  return (
                    <div
                      class={`sidebar-item sub-item ${isActive() ? 'active' : ''}`}
                      onClick={() => applyFilter('label', label)}
                    >
                      <span class="item-icon">🏷</span>
                      <span class="item-label">{displayLabel}</span>
                      <span class="item-count text-mono">{count}</span>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Privacy Grouping */}
        <div class="sidebar-section">
          <div class="section-header" onClick={() => setShowPrivacy(!showPrivacy())}>
            <span class="section-title">{t('sidebar.privacy')}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class={`chevron-icon ${showPrivacy() ? 'expanded' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <Show when={showPrivacy()}>
            <div
              class={`sidebar-item sub-item ${privacyFilter() === 'public' ? 'active' : ''}`}
              onClick={() => applyFilter('privacy', 'public')}
            >
              <span class="item-icon">🔓</span>
              <span class="item-label">{t('sidebar.privacy_public')}</span>
              <span class="item-count text-mono">{sidebarCounts().public}</span>
            </div>
            <div
              class={`sidebar-item sub-item ${privacyFilter() === 'private' ? 'active' : ''}`}
              onClick={() => applyFilter('privacy', 'private')}
            >
              <span class="item-icon">🔒</span>
              <span class="item-label">{t('sidebar.privacy_private')}</span>
              <span class="item-count text-mono">{sidebarCounts().private}</span>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
