var TWC = TWC || {};

TWC.uiLayout = (function() {

    function renderToolbar() {
        return '<div class="twc-toolbar">' +
            '<div class="twc-logo">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' +
            (TWC.i18n.t('toolbar.logo') || 'Transmission') +
            '</div>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-add" title="' + TWC.i18n.t('toolbar.add') + ' (Ctrl+N)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-success-500)"><path d="M12 5v14M5 12h14"/></svg>' +
            '<span class="btn-label">' + TWC.i18n.t('toolbar.add') + '</span><span class="btn-shortcut" title="' + (TWC.i18n.t('toolbar.shortcut') || 'Shortcut') + ': Ctrl+N">Ctrl+N</span>' +
            '</button>' +
            '<button class="twc-btn" id="btn-start" title="' + TWC.i18n.t('toolbar.start') + ' (Ctrl+S)" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-success-500)"><polygon points="5,3 19,12 5,21"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-start-now" title="' + TWC.i18n.t('toolbar.start_now') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-success-500)"><polygon points="5,3 19,12 5,21"/><line x1="19" y1="3" x2="19" y2="21"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-pause" title="' + TWC.i18n.t('toolbar.pause') + ' (Ctrl+D)" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-warning-500)"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-reannounce" title="' + TWC.i18n.t('toolbar.reannounce') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary-500)"><circle cx="12" cy="12" r="1"/><path d="M7.33 16.67a7 7 0 0 1 9.34 0"/><path d="M4.93 20.42a11 11 0 0 1 14.14 0"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-verify" title="' + TWC.i18n.t('toolbar.verify') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-success-500)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-remove" title="' + TWC.i18n.t('toolbar.remove') + ' (Delete)" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-danger-500)"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-queue-up" title="' + TWC.i18n.t('toolbar.queue_up') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-queue-down" title="' + TWC.i18n.t('toolbar.queue_down') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-queue-top" title="' + TWC.i18n.t('toolbar.queue_top') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-queue-bottom" title="' + TWC.i18n.t('toolbar.queue_bottom') + '" :disabled="!$store.toolbar.hasSelection">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>' +
            '</button>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-alt-speed" title="' + TWC.i18n.t('toolbar.alt_speed') + '" :class="{ active: $store.toolbar.altSpeedActive }">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-warning-500)"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '</button>' +
            '<div style="flex:1"></div>' +
            '<div class="twc-search-box" id="search-box">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input type="text" id="search-input" placeholder="' + TWC.i18n.t('toolbar.search_placeholder') + '" />' +
            '</div>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn twc-btn-icon" id="btn-refresh" title="' + TWC.i18n.t('toolbar.refresh') + ' (F5)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary-500)"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-auto-refresh" title="' + TWC.i18n.t('toolbar.auto_refresh') + '" :class="{ active: $store.toolbar.autoRefreshActive }">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary-500)"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-sidebar-toggle" title="' + TWC.i18n.t('toolbar.sidebar_toggle') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-detail-toggle" title="' + TWC.i18n.t('toolbar.detail_toggle') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-theme" title="' + TWC.i18n.t('toolbar.theme') + '" @click="$store.theme.toggle()">' +
            '<svg x-show="$store.theme.mode === \'light\'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '<svg x-show="$store.theme.mode === \'dark\'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-stats" title="' + TWC.i18n.t('toolbar.stats') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#8b5cf6"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-history" title="' + (TWC.i18n.t('toolbar.history') || 'History') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary-500)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-settings" title="' + TWC.i18n.t('toolbar.settings') + ' (Ctrl+P)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
            '</button>' +
            '</div>';
    }

    function renderSidebar() {
        return '<div class="twc-sidebar" id="sidebar" x-data="{ collapsed: {} }" :class="{ collapsed: $store.toolbar.sidebarCollapsed }">' +
            '<div class="twc-sidebar-content" id="sidebar-content"></div>' +
            '</div>';
    }

    function renderFilterBar() {
        var currentLang = TWC.i18n.getLanguage();
        return '<div class="twc-filter-bar" id="filter-bar">' +
            '<span id="filter-info" style="font-size:11px;color:var(--text-muted)"></span>' +
            '<div style="flex:1"></div>' +
            '<select class="twc-select" id="select-lang" style="width:auto;height:26px;font-size:11px;margin-right:8px">' +
            '<option value="zh-CN"' + (currentLang === 'zh-CN' ? ' selected' : '') + '>' + (TWC.i18n.t('lang.zh_cn') || '中文') + '</option>' +
            '<option value="en"' + (currentLang === 'en' ? ' selected' : '') + '>' + (TWC.i18n.t('lang.en') || 'English') + '</option>' +
            '</select>' +
            '<select class="twc-select" id="select-refresh-interval" style="width:auto;height:26px;font-size:11px">' +
            '<option value="1000">1s</option>' +
            '<option value="2000">2s</option>' +
            '<option value="5000">5s</option>' +
            '<option value="10000">10s</option>' +
            '<option value="30000">30s</option>' +
            '<option value="60000">60s</option>' +
            '</select>' +
            '</div>';
    }

    function renderDetailPanel() {
        return '<div class="twc-detail-panel" id="detail-panel" x-data="{ activeTab: \'general\' }" :class="{ collapsed: $store.toolbar.detailCollapsed }">' +
            '<div class="twc-detail-tabs" id="detail-tabs">' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'general\'}" @click="activeTab = \'general\'" data-tab="general">' + TWC.i18n.t('detail.tabs.general') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'files\'}" @click="activeTab = \'files\'" data-tab="files">' + TWC.i18n.t('detail.tabs.files') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'trackers\'}" @click="activeTab = \'trackers\'" data-tab="trackers">' + TWC.i18n.t('detail.tabs.trackers') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'peers\'}" @click="activeTab = \'peers\'" data-tab="peers">' + TWC.i18n.t('detail.tabs.peers') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'pieces\'}" @click="activeTab = \'pieces\'" data-tab="pieces">' + TWC.i18n.t('detail.tabs.pieces') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'speed\'}" @click="activeTab = \'speed\'" data-tab="speed">' + TWC.i18n.t('detail.tabs.speed') + '</div>' +
            '<div class="twc-detail-tab" :class="{\'active\': activeTab === \'settings\'}" @click="activeTab = \'settings\'" data-tab="settings">' + TWC.i18n.t('detail.tabs.settings') + '</div>' +
            '<div style="flex:1"></div>' +
            '<button class="twc-btn twc-btn-icon twc-detail-collapse-btn" id="btn-detail-collapse" title="' + TWC.i18n.t('toolbar.detail_toggle') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="twc-detail-content" id="detail-content"></div>' +
            '</div>';
    }

    function renderStatusBar() {
        return '<div class="twc-statusbar" id="statusbar" x-data>' +
            '<div class="twc-status-item" id="stat-connection-status" title="' + TWC.i18n.t('status.connected') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' +
            '<span id="stat-conn-icon" class="stat-conn-dot" :style="{ background: $store.statusbar.connIconBg }"></span>' +
            '<span id="stat-conn-text" :style="{ color: $store.statusbar.connColor }" x-text="$store.statusbar.connText"></span>' +
            '<button id="btn-reconnect" class="twc-btn-sm" style="margin-left:6px" x-show="$store.statusbar.showReconnect" @click="TWC.ui.refreshData(true)" x-text="TWC.i18n.t(\'status.retry\') || \'Retry\'"></button>' +
            '</div>' +
            '<div class="twc-status-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--color-primary-500);flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            '<span class="twc-speed-display download" id="stat-download-speed" x-text="$store.statusbar.downloadSpeed"></span>' +
            '</div>' +
            '<div class="twc-status-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--color-success-500);flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            '<span class="twc-speed-display upload" id="stat-upload-speed" x-text="$store.statusbar.uploadSpeed"></span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-peer-count" title="' + TWC.i18n.t('detail.peers.title') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
            '<span id="stat-peers" x-text="$store.statusbar.peers"></span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-ratio" title="' + TWC.i18n.t('detail.general.ratio') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' +
            '<span id="stat-global-ratio" class="text-mono" :style="{ color: $store.statusbar.ratioColor }" x-text="$store.statusbar.globalRatio"></span>' +
            '</div>' +
            '<div class="twc-separator" style="height:16px;margin:0 4px"></div>' +
            '<div class="twc-status-item" id="stat-torrent-count" x-text="$store.statusbar.torrentCount"></div>' +
            '<div class="twc-status-item" id="stat-error-count" title="' + TWC.i18n.t('filter.error') + '" :style="{ color: $store.statusbar.errorColor }">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-danger-500)"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
            '<span id="stat-errors" x-text="$store.statusbar.errors"></span>' +
            '</div>' +
            '<div class="twc-status-spacer"></div>' +
            '<div class="twc-status-item" id="stat-alt-speed" title="' + TWC.i18n.t('toolbar.alt_speed') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-warning-500)"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '<span id="stat-alt-speed-text" :class="{ \'stat-alt-speed-on\': $store.statusbar.altSpeedOn, \'stat-alt-speed-off\': !$store.statusbar.altSpeedOn }" x-text="$store.statusbar.altSpeedText"></span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-port-status" title="' + TWC.i18n.t('dialog.settings.test_port') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>' +
            '<span id="stat-port-text" :class="$store.statusbar.portClass" x-text="$store.statusbar.portText"></span>' +
            '<span id="stat-ip-protocol" class="stat-ip-protocol" x-show="$store.statusbar.showIpProtocol" x-text="$store.statusbar.ipProtocol" style="margin-left:4px;font-size:11px;padding:1px 5px;border-radius:3px;background:var(--bg-tertiary);color:var(--text-secondary)"></span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-free-space" title="' + TWC.i18n.t('stats.free_space') + '" x-text="$store.statusbar.freeSpace"></div>' +
            '<div class="twc-status-item" id="stat-version" title="' + TWC.i18n.t('dialog.about.version') + '" x-text="$store.statusbar.version"></div>' +
            '</div>';
    }

    var _sidebarUpdateTimer = null;

    function updateSidebar() {
        if (_sidebarUpdateTimer) {
            clearTimeout(_sidebarUpdateTimer);
        }
        _sidebarUpdateTimer = setTimeout(function() {
            _sidebarUpdateTimer = null;
            _doUpdateSidebar();
        }, 50);
    }

    function _doUpdateSidebar() {
        var counts = TWC.torrent.getStatusCounts();
        var filterState = TWC.torrent.getFilterState();

        var $statusItems = $('#sidebar-status-items');
        if ($statusItems.length === 0) {
            _fullSidebarRender(counts, filterState);
            return;
        }

        var statusIds = ['all', 'downloading', 'seeding', 'stopped', 'checking', 'active', 'error', 'queued'];
        var statusCounts = [counts.all, counts.downloading, counts.seeding, counts.stopped, counts.checking, counts.active, counts.error, counts.queued];
        for (var i = 0; i < statusIds.length; i++) {
            var $item = $('[data-filter-value="' + statusIds[i] + '"][data-filter-type="status"] .twc-sidebar-count');
            if ($item.length && $item.text() !== String(statusCounts[i])) {
                $item.text(statusCounts[i]);
            }
            var isActive = (statusIds[i] === 'all' && !filterState.tracker && !filterState.dir && !filterState.label && filterState.type === 'all') ||
                (statusIds[i] !== 'all' && filterState.type === statusIds[i] && !filterState.tracker && !filterState.dir && !filterState.label);
            var $el = $('[data-filter-value="' + statusIds[i] + '"][data-filter-type="status"]');
            if ($el.length) {
                if (isActive && !$el.hasClass('active')) $el.addClass('active');
                else if (!isActive && $el.hasClass('active')) $el.removeClass('active');
            }
        }

        _updateTrackerSidebar(filterState);
        _updateDirSidebar(filterState);
        _updateLabelSidebar(filterState);
    }

    function _updateTrackerSidebar(filterState) {
        var trackers = TWC.torrent.getTrackerGroups();
        var trackerKeys = _.sortBy(Object.keys(trackers));
        var $group = $('[data-group-content="trackers"]');
        var $header = $('[data-group="trackers"]');

        if (trackerKeys.length === 0) {
            $group.remove();
            $header.remove();
            return;
        }

        if ($header.length === 0) {
            _fullSidebarRender(TWC.torrent.getStatusCounts(), filterState);
            return;
        }

        var existingDomains = {};
        $group.find('.twc-sidebar-item[data-filter-type="tracker"]').each(function() {
            existingDomains[$(this).data('filter-value')] = true;
        });

        var html = '';
        for (var j = 0; j < trackerKeys.length; j++) {
            var domain = trackerKeys[j];
            var count = trackers[domain].length;
            var tActive = filterState.tracker === domain;

            if (existingDomains[domain]) {
                var $item = $('[data-filter-value="' + TWC.utils.escapeAttr(domain) + '"][data-filter-type="tracker"]');
                var $count = $item.find('.twc-sidebar-count');
                if ($count.length && $count.text() !== String(count)) $count.text(count);
                if (tActive && !$item.hasClass('active')) $item.addClass('active');
                else if (!tActive && $item.hasClass('active')) $item.removeClass('active');
                delete existingDomains[domain];
            } else {
                html += '<div class="twc-sidebar-item' + (tActive ? ' active' : '') + '" data-filter-type="tracker" data-filter-value="' + TWC.utils.escapeAttr(domain) + '">' +
                    '<span class="twc-sidebar-icon">🌐</span>' +
                    '<span class="twc-sidebar-label" title="' + TWC.utils.escapeAttr(domain) + '">' + TWC.utils.escapeHtml(domain) + '</span>' +
                    '<span class="twc-sidebar-count">' + count + '</span>' +
                    '</div>';
            }
        }

        for (var oldDomain in existingDomains) {
            if (existingDomains.hasOwnProperty(oldDomain)) {
                $('[data-filter-value="' + TWC.utils.escapeAttr(oldDomain) + '"][data-filter-type="tracker"]').remove();
            }
        }

        if (html) $group.append(html);
    }

    function _updateDirSidebar(filterState) {
        var dirs = TWC.torrent.getDirGroups();
        var dirKeys = _.sortBy(Object.keys(dirs));
        var $group = $('[data-group-content="dirs"]');
        var $header = $('[data-group="dirs"]');

        if (dirKeys.length === 0) {
            $group.remove();
            $header.remove();
            return;
        }

        var existingDirs = {};
        $group.find('.twc-sidebar-item[data-filter-type="dir"]').each(function() {
            existingDirs[$(this).data('filter-value')] = true;
        });

        var html = '';
        for (var j = 0; j < dirKeys.length; j++) {
            var dir = dirKeys[j];
            var count = dirs[dir].length;
            var dActive = filterState.dir === dir;

            if (existingDirs[dir]) {
                var $item = $('[data-filter-value="' + TWC.utils.escapeAttr(dir) + '"][data-filter-type="dir"]');
                var $count = $item.find('.twc-sidebar-count');
                if ($count.length && $count.text() !== String(count)) $count.text(count);
                if (dActive && !$item.hasClass('active')) $item.addClass('active');
                else if (!dActive && $item.hasClass('active')) $item.removeClass('active');
                delete existingDirs[dir];
            } else {
                html += '<div class="twc-sidebar-item' + (dActive ? ' active' : '') + '" data-filter-type="dir" data-filter-value="' + TWC.utils.escapeAttr(dir) + '">' +
                    '<span class="twc-sidebar-icon">📂</span>' +
                    '<span class="twc-sidebar-label" title="' + TWC.utils.escapeAttr(dir) + '">' + TWC.utils.escapeHtml(dir) + '</span>' +
                    '<span class="twc-sidebar-count">' + count + '</span>' +
                    '</div>';
            }
        }

        for (var oldDir in existingDirs) {
            if (existingDirs.hasOwnProperty(oldDir)) {
                $('[data-filter-value="' + TWC.utils.escapeAttr(oldDir) + '"][data-filter-type="dir"]').remove();
            }
        }

        if (html) $group.append(html);
    }

    function _updateLabelSidebar(filterState) {
        var labels = TWC.torrent.getLabelGroups();
        var labelKeys = _.sortBy(Object.keys(labels));
        var $group = $('[data-group-content="labels"]');
        var $header = $('[data-group="labels"]');

        if (labelKeys.length === 0) {
            $group.remove();
            $header.remove();
            return;
        }

        var existingLabels = {};
        $group.find('.twc-sidebar-item[data-filter-type="label"]').each(function() {
            existingLabels[$(this).data('filter-value')] = true;
        });

        var html = '';
        for (var j = 0; j < labelKeys.length; j++) {
            var label = labelKeys[j];
            var count = labels[label].length;
            var lActive = filterState.label === label;

            if (existingLabels[label]) {
                var $item = $('[data-filter-value="' + TWC.utils.escapeAttr(label) + '"][data-filter-type="label"]');
                var $count = $item.find('.twc-sidebar-count');
                if ($count.length && $count.text() !== String(count)) $count.text(count);
                if (lActive && !$item.hasClass('active')) $item.addClass('active');
                else if (!lActive && $item.hasClass('active')) $item.removeClass('active');
                delete existingLabels[label];
            } else {
                html += '<div class="twc-sidebar-item' + (lActive ? ' active' : '') + '" data-filter-type="label" data-filter-value="' + TWC.utils.escapeAttr(label) + '">' +
                    '<span class="twc-sidebar-icon">🏷</span>' +
                    '<span class="twc-sidebar-label" title="' + TWC.utils.escapeAttr(label) + '">' + TWC.utils.escapeHtml(label) + '</span>' +
                    '<span class="twc-sidebar-count">' + count + '</span>' +
                    '</div>';
            }
        }

        for (var oldLabel in existingLabels) {
            if (existingLabels.hasOwnProperty(oldLabel)) {
                $('[data-filter-value="' + TWC.utils.escapeAttr(oldLabel) + '"][data-filter-type="label"]').remove();
            }
        }

        if (html) $group.append(html);
    }

    function _fullSidebarRender(counts, filterState) {
        var trackers = TWC.torrent.getTrackerGroups();
        var dirs = TWC.torrent.getDirGroups();
        var labels = TWC.torrent.getLabelGroups();

        var html = '';

        html += '<div class="twc-sidebar-header">' + TWC.i18n.t('sidebar.status') + '</div>';
        html += '<div id="sidebar-status-items">';
        var statusItems = [
            { id: 'all', name: TWC.i18n.t('sidebar.status_all'), count: counts.all, icon: '📁' },
            { id: 'downloading', name: TWC.i18n.t('sidebar.status_downloading'), count: counts.downloading, icon: '⬇' },
            { id: 'seeding', name: TWC.i18n.t('sidebar.status_seeding'), count: counts.seeding, icon: '⬆' },
            { id: 'stopped', name: TWC.i18n.t('sidebar.status_stopped'), count: counts.stopped, icon: '⏸' },
            { id: 'checking', name: TWC.i18n.t('sidebar.status_checking'), count: counts.checking, icon: '✓' },
            { id: 'active', name: TWC.i18n.t('sidebar.status_active'), count: counts.active, icon: '●' },
            { id: 'error', name: TWC.i18n.t('sidebar.status_error'), count: counts.error, icon: '✕' },
            { id: 'queued', name: TWC.i18n.t('sidebar.status_queued'), count: counts.queued, icon: '☰' }
        ];

        for (var i = 0; i < statusItems.length; i++) {
            var item = statusItems[i];
            var active = (item.id === 'all' && !filterState.tracker && !filterState.dir && !filterState.label && filterState.type === 'all') ||
                (item.id !== 'all' && filterState.type === item.id && !filterState.tracker && !filterState.dir && !filterState.label);
            html += '<div class="twc-sidebar-item' + (active ? ' active' : '') + '" data-filter-type="status" data-filter-value="' + TWC.utils.escapeAttr(item.id) + '">' +
                '<span class="twc-sidebar-icon">' + item.icon + '</span>' +
                '<span class="twc-sidebar-label">' + TWC.utils.escapeHtml(item.name) + '</span>' +
                '<span class="twc-sidebar-count">' + item.count + '</span>' +
                '</div>';
        }
        html += '</div>';

        var trackerKeys = _.sortBy(Object.keys(trackers));
        if (trackerKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="trackers">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                TWC.i18n.t('sidebar.trackers') +
                '</div>';
            html += '<div class="twc-sidebar-group" data-group-content="trackers">';
            for (var j = 0; j < trackerKeys.length; j++) {
                var domain = trackerKeys[j];
                var tActive = filterState.tracker === domain;
                html += '<div class="twc-sidebar-item' + (tActive ? ' active' : '') + '" data-filter-type="tracker" data-filter-value="' + TWC.utils.escapeAttr(domain) + '">' +
                    '<span class="twc-sidebar-icon">🌐</span>' +
                    '<span class="twc-sidebar-label" title="' + TWC.utils.escapeAttr(domain) + '">' + TWC.utils.escapeHtml(domain) + '</span>' +
                    '<span class="twc-sidebar-count">' + trackers[domain].length + '</span>' +
                    '</div>';
            }
            html += '</div>';
        }

        var dirKeys = _.sortBy(Object.keys(dirs));
        if (dirKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="dirs">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                TWC.i18n.t('sidebar.dirs') +
                '</div>';
            html += '<div class="twc-sidebar-group" data-group-content="dirs">';
            for (var k = 0; k < dirKeys.length; k++) {
                var dir = dirKeys[k];
                var dActive = filterState.dir === dir;
                var dirName = dir.split('/').pop() || dir;
                html += '<div class="twc-sidebar-item' + (dActive ? ' active' : '') + '" data-filter-type="dir" data-filter-value="' + TWC.utils.escapeAttr(dir) + '">' +
                    '<span class="twc-sidebar-icon">📂</span>' +
                    '<span class="twc-sidebar-label" title="' + TWC.utils.escapeAttr(dir) + '">' + TWC.utils.escapeHtml(dirName) + '</span>' +
                    '<span class="twc-sidebar-count">' + dirs[dir].length + '</span>' +
                    '</div>';
            }
            html += '</div>';
        }

        var labelKeys = _.sortBy(Object.keys(labels));
        if (labelKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="labels">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                TWC.i18n.t('sidebar.labels') +
                '</div>';
            html += '<div class="twc-sidebar-group" data-group-content="labels">';
            for (var l = 0; l < labelKeys.length; l++) {
                var label = labelKeys[l];
                var lActive = filterState.label === label;
                var displayLabel = label === TWC.torrent.getUnlabeledKey() ? TWC.i18n.t('sidebar.unlabeled') : label;
                html += '<div class="twc-sidebar-item' + (lActive ? ' active' : '') + '" data-filter-type="label" data-filter-value="' + TWC.utils.escapeAttr(label) + '">' +
                    '<span class="twc-sidebar-icon">🏷</span>' +
                    '<span class="twc-sidebar-label">' + TWC.utils.escapeHtml(displayLabel) + '</span>' +
                    '<span class="twc-sidebar-count">' + labels[label].length + '</span>' +
                    '</div>';
            }
            html += '</div>';
        }

        var privacyCounts = TWC.torrent.getPrivacyCounts();
        html += '<div class="twc-sidebar-group-header" data-group="privacy">' +
            '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
            (TWC.i18n.t('sidebar.privacy') || 'Privacy') +
            '</div>';
        html += '<div class="twc-sidebar-group" data-group-content="privacy">';
        var privacyItems = [
            { id: 'public', name: TWC.i18n.t('sidebar.privacy_public') || 'Public', count: privacyCounts.public, icon: '🔓' },
            { id: 'private', name: TWC.i18n.t('sidebar.privacy_private') || 'Private', count: privacyCounts.private, icon: '🔒' }
        ];
        for (var pi = 0; pi < privacyItems.length; pi++) {
            var pItem = privacyItems[pi];
            var pActive = filterState.privacy === pItem.id;
            html += '<div class="twc-sidebar-item' + (pActive ? ' active' : '') + '" data-filter-type="privacy" data-filter-value="' + TWC.utils.escapeAttr(pItem.id) + '">' +
                '<span class="twc-sidebar-icon">' + pItem.icon + '</span>' +
                '<span class="twc-sidebar-label">' + TWC.utils.escapeHtml(pItem.name) + '</span>' +
                '<span class="twc-sidebar-count">' + pItem.count + '</span>' +
                '</div>';
        }
        html += '</div>';

        $('#sidebar-content').html(html);

        $(document).off('click.sidebar').on('click.sidebar', '.twc-sidebar-item', function() {
            var type = $(this).data('filter-type');
            var value = $(this).data('filter-value');
            TWC.torrent.setFilter(type, value);
        });

        $(document).off('click.sidebarcollapse').on('click.sidebarcollapse', '.twc-sidebar-group-header', function() {
            var $header = $(this);
            var group = $header.data('group');
            $header.toggleClass('collapsed');
            var $content = $('[data-group-content="' + group + '"]');
            $content.toggle();
            TWC.utils.storageSet('twc-sidebar-group-' + group, !$header.hasClass('collapsed'));
            var sidebar = document.getElementById('sidebar');
            if (sidebar && Alpine.$data) {
                try {
                    var data = Alpine.$data(sidebar);
                    if (data) data.collapsed[group] = $header.hasClass('collapsed');
                } catch(e) {}
            }
        });

        $('[data-group-content]').each(function() {
            var group = $(this).data('group-content');
            var collapsed = TWC.utils.storageGet('twc-sidebar-group-' + group, true);
            if (!collapsed) {
                $('[data-group="' + group + '"]').addClass('collapsed');
                $(this).hide();
            }
        });
    }

    return {
        renderToolbar: renderToolbar,
        renderSidebar: renderSidebar,
        renderFilterBar: renderFilterBar,
        renderDetailPanel: renderDetailPanel,
        renderStatusBar: renderStatusBar,
        updateSidebar: updateSidebar
    };
})();
