import { Component, createSignal, Show } from 'solid-js';
import {
  selectedIds,
  startTorrents,
  startNowTorrents,
  pauseTorrents,
  reannounceTorrents,
  verifyTorrents,
  moveQueueUp,
  moveQueueDown,
  moveQueueTop,
  moveQueueBottom,
  searchQuery,
  setSearchQuery,
  fetchTorrents
} from '../store/torrentStore';
import {
  openAddModal,
  openSettingsModal,
  openDeleteModal,
  openHistoryModal,
  openStatsModal
} from '../store/modalStore';
import { t, currentLang, setLanguage, type LanguageType } from '../utils/i18n';
import './Toolbar.css';

export const Toolbar: Component<{
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  detailOpen: boolean;
  onToggleDetail: () => void;
}> = (props) => {
  const hasSelection = () => selectedIds().length > 0;

  // Theme toggle with localStorage persistence
  const [theme, setTheme] = createSignal(
    localStorage.getItem('trwm-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // Apply initial theme
  document.documentElement.setAttribute('data-theme', theme());

  const toggleTheme = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('trwm-theme', next);
  };

  // Language switcher
  const toggleLanguage = () => {
    const next: LanguageType = currentLang() === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
  };

  return (
    <div class="trwm-toolbar-inner">
      {/* Add torrent button */}
      <button class="tb-btn text-success" onClick={openAddModal} title={t('toolbar.add')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span class="btn-label">{t('toolbar.add')}</span>
      </button>

      <div class="tb-separator" />

      {/* Start button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => startTorrents()}
        title={t('toolbar.start')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </button>

      {/* Start Now button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => startNowTorrents()}
        title={t('toolbar.start_now')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
          <polygon points="5,3 19,12 5,21" />
          <line x1="19" y1="3" x2="19" y2="21" />
        </svg>
      </button>

      {/* Pause button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => pauseTorrents()}
        title={t('toolbar.pause')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-warning">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      </button>

      {/* Reannounce button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => reannounceTorrents()}
        title={t('toolbar.reannounce')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
          <circle cx="12" cy="12" r="1" />
          <path d="M7.33 16.67a7 7 0 0 1 9.34 0" />
          <path d="M4.93 20.42a11 11 0 0 1 14.14 0" />
        </svg>
      </button>

      {/* Verify button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => verifyTorrents()}
        title={t('toolbar.verify')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </button>

      {/* Remove button */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={openDeleteModal}
        title={t('toolbar.remove')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-danger">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      <div class="tb-separator" />

      {/* Queue position controls */}
      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => moveQueueUp()}
        title={t('toolbar.queue_up')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => moveQueueDown()}
        title={t('toolbar.queue_down')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => moveQueueTop()}
        title={t('toolbar.queue_top')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      <button
        class="tb-btn"
        disabled={!hasSelection()}
        onClick={() => moveQueueBottom()}
        title={t('toolbar.queue_bottom')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>

      <div class="tb-spacer" />

      {/* Search Box */}
      <div class="tb-search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t('toolbar.search_placeholder')}
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Show when={searchQuery()}>
          <button class="clear-search" onClick={() => setSearchQuery('')}>×</button>
        </Show>
      </div>

      <div class="tb-separator" />

      {/* Refresh */}
      <button class="tb-btn icon-only" onClick={() => fetchTorrents(true)} title={t('toolbar.refresh')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
          <path d="M1 4v6h6M23 20v-6h-6" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
      </button>

      {/* Toggle Sidebar */}
      <button
        class={`tb-btn icon-only ${props.sidebarOpen ? 'active' : ''}`}
        onClick={props.onToggleSidebar}
        title={t('toolbar.sidebar_toggle')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      {/* Toggle Details Panel */}
      <button
        class={`tb-btn icon-only ${props.detailOpen ? 'active' : ''}`}
        onClick={props.onToggleDetail}
        title={t('toolbar.detail_toggle')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      </button>

      {/* Language Toggle */}
      <button class="tb-btn icon-only lang-btn" onClick={toggleLanguage} title={currentLang() === 'zh-CN' ? 'Switch to English' : '切换到中文'}>
        <span class="lang-label">{currentLang() === 'zh-CN' ? 'EN' : '中'}</span>
      </button>

      {/* Theme Toggle */}
      <button class="tb-btn icon-only" onClick={toggleTheme} title={t('toolbar.theme')}>
        <Show
          when={theme() === 'light'}
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </Show>
      </button>

      {/* Stats modal */}
      <button class="tb-btn icon-only" onClick={openStatsModal} title={t('toolbar.stats')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #8b5cf6;">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      </button>

      {/* History modal */}
      <button class="tb-btn icon-only" onClick={openHistoryModal} title={t('toolbar.history')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Global settings */}
      <button class="tb-btn icon-only" onClick={openSettingsModal} title={t('toolbar.settings')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
};
