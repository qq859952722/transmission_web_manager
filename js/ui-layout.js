var TWC = TWC || {};

TWC.uiLayout = (function() {

    function renderToolbar() {
        return '<div class="twc-toolbar">' +
            '<div class="twc-logo">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' +
            'Transmission' +
            '</div>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-add" title="添加种子 (Ctrl+N)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' +
            '<span class="btn-label">添加</span><span class="btn-shortcut" title="快捷键: Ctrl+N">Ctrl+N</span>' +
            '</button>' +
            '<button class="twc-btn" id="btn-start" title="开始 (Ctrl+S)" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-start-now" title="立即开始(跳过队列)" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/><line x1="19" y1="3" x2="19" y2="21"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-pause" title="暂停 (Ctrl+D)" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-reannounce" title="重新宣告" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-verify" title="校验" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-remove" title="删除 (Delete)" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-queue-up" title="队列上移" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>' +
            '</button>' +
            '<button class="twc-btn" id="btn-queue-down" title="队列下移" disabled>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</button>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn" id="btn-alt-speed" title="备用限速">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '</button>' +
            '<div style="flex:1"></div>' +
            '<div class="twc-search-box" id="search-box">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input type="text" id="search-input" placeholder="搜索种子..." />' +
            '</div>' +
            '<div class="twc-separator"></div>' +
            '<button class="twc-btn twc-btn-icon" id="btn-refresh" title="刷新 (F5)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-auto-refresh" title="自动刷新">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-sidebar-toggle" title="切换侧边栏">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-detail-toggle" title="切换详情面板">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-theme" title="切换主题">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-stats" title="全局统计">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
            '</button>' +
            '<button class="twc-btn twc-btn-icon" id="btn-settings" title="设置 (Ctrl+P)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
            '</button>' +
            '</div>';
    }

    function renderSidebar() {
        return '<div class="twc-sidebar" id="sidebar">' +
            '<div class="twc-sidebar-content" id="sidebar-content"></div>' +
            '</div>';
    }

    function renderFilterBar() {
        return '<div class="twc-filter-bar" id="filter-bar">' +
            '<span id="filter-info" style="font-size:11px;color:var(--text-muted)"></span>' +
            '<div style="flex:1"></div>' +
            '<select class="twc-select" id="select-refresh-interval" style="width:auto;height:26px;font-size:11px">' +
            '<option value="2000">2秒</option>' +
            '<option value="5000" selected>5秒</option>' +
            '<option value="10000">10秒</option>' +
            '<option value="30000">30秒</option>' +
            '<option value="60000">60秒</option>' +
            '</select>' +
            '</div>';
    }

    function renderDetailPanel() {
        return '<div class="twc-detail-panel" id="detail-panel">' +
            '<div class="twc-detail-tabs" id="detail-tabs">' +
            '<div class="twc-detail-tab active" data-tab="general">基本信息</div>' +
            '<div class="twc-detail-tab" data-tab="files">文件</div>' +
            '<div class="twc-detail-tab" data-tab="trackers">Tracker</div>' +
            '<div class="twc-detail-tab" data-tab="peers">Peer</div>' +
            '<div class="twc-detail-tab" data-tab="speed">速度</div>' +
            '<div class="twc-detail-tab" data-tab="settings">设置</div>' +
            '</div>' +
            '<div class="twc-detail-content" id="detail-content"></div>' +
            '</div>';
    }

    function renderStatusBar() {
        return '<div class="twc-statusbar" id="statusbar">' +
            '<div class="twc-status-item" id="stat-connection-status" title="连接状态">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' +
            '<span id="stat-conn-icon" class="stat-conn-dot"></span>' +
            '<span id="stat-conn-text">连接中...</span>' +
            '</div>' +
            '<div class="twc-status-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary-500)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            '<span class="twc-speed-display download" id="stat-download-speed">0 B/s</span>' +
            '</div>' +
            '<div class="twc-status-item">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-success-500)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            '<span class="twc-speed-display upload" id="stat-upload-speed">0 B/s</span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-peer-count" title="当前Peer连接总数">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
            '<span id="stat-peers">0</span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-ratio" title="全局上传/下载比率">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' +
            '<span id="stat-global-ratio" class="text-mono">-</span>' +
            '</div>' +
            '<div class="twc-separator" style="height:16px;margin:0 4px"></div>' +
            '<div class="twc-status-item" id="stat-torrent-count"></div>' +
            '<div class="twc-status-item" id="stat-error-count" title="有错误的种子数">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-danger-500)"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
            '<span id="stat-errors">0</span>' +
            '</div>' +
            '<div class="twc-status-spacer"></div>' +
            '<div class="twc-status-item" id="stat-alt-speed" title="备用限速">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span id="stat-alt-speed-text" class="stat-alt-speed-off">限速关</span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-port-status" title="端口连通状态">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>' +
            '<span id="stat-port-text" class="stat-port-unknown">端口检测中</span>' +
            '</div>' +
            '<div class="twc-status-item" id="stat-free-space" title="下载目录可用空间"></div>' +
            '<div class="twc-status-item" id="stat-version" title="版本信息"></div>' +
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
        var trackers = TWC.torrent.getTrackerGroups();
        var dirs = TWC.torrent.getDirGroups();
        var labels = TWC.torrent.getLabelGroups();
        var filterState = TWC.torrent.getFilterState();

        var html = '';

        html += '<div class="twc-sidebar-header">种子状态</div>';
        var statusItems = [
            { id: 'all', name: '全部', count: counts.all, icon: '📁' },
            { id: 'downloading', name: '下载中', count: counts.downloading, icon: '⬇' },
            { id: 'seeding', name: '做种中', count: counts.seeding, icon: '⬆' },
            { id: 'stopped', name: '已停止', count: counts.stopped, icon: '⏸' },
            { id: 'checking', name: '校验中', count: counts.checking, icon: '✓' },
            { id: 'active', name: '活跃', count: counts.active, icon: '●' },
            { id: 'error', name: '错误', count: counts.error, icon: '✕' },
            { id: 'queued', name: '排队中', count: counts.queued, icon: '☰' }
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

        var trackerKeys = Object.keys(trackers).sort();
        if (trackerKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="trackers">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                'Tracker 分组' +
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

        var dirKeys = Object.keys(dirs).sort();
        if (dirKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="dirs">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                '目录分组' +
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

        var labelKeys = Object.keys(labels).sort();
        if (labelKeys.length > 0) {
            html += '<div class="twc-sidebar-group-header" data-group="labels">' +
                '<svg class="twc-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                '标签分组' +
                '</div>';
            html += '<div class="twc-sidebar-group" data-group-content="labels">';
            for (var l = 0; l < labelKeys.length; l++) {
                var label = labelKeys[l];
                var lActive = filterState.label === label;
                html += '<div class="twc-sidebar-item' + (lActive ? ' active' : '') + '" data-filter-type="label" data-filter-value="' + TWC.utils.escapeAttr(label) + '">' +
                    '<span class="twc-sidebar-icon">🏷</span>' +
                    '<span class="twc-sidebar-label">' + TWC.utils.escapeHtml(label) + '</span>' +
                    '<span class="twc-sidebar-count">' + labels[label].length + '</span>' +
                    '</div>';
            }
            html += '</div>';
        }

        $('#sidebar-content').html(html);

        $(document).off('click.sidebar').on('click.sidebar', '.twc-sidebar-item', function() {
            var type = $(this).data('filter-type');
            var value = $(this).data('filter-value');
            TWC.torrent.setFilter(type, value);
        });

        $(document).off('click.sidebarcollapse').on('click.sidebarcollapse', '.twc-sidebar-group-header', function() {
            var $header = $(this);
            $header.toggleClass('collapsed');
            var group = $header.data('group');
            var $content = $('[data-group-content="' + group + '"]');
            $content.toggle();
            TWC.utils.storageSet('twc-sidebar-group-' + group, !$header.hasClass('collapsed'));
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
