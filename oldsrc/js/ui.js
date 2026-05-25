var TWC = TWC || {};

TWC.ui = (function() {
    var _refreshTimer = null;
    var _speedTimer = null;
    var _refreshInterval = 2000;
    var _speedInterval = 1000;
    var _autoRefresh = true;
    var _detailPanelVisible = true;
    var _sidebarVisible = true;
    var _speedBuffer = new Array(120);
    var _speedBufferPos = 0;
    var _speedBufferSize = 0;
    var _maxSpeedPoints = 120;
    var _freeSpaceLastUpdated = 0;
    var _refreshSeq = 0;
    var _lastConnectedAt = null;
    var _statusCountsCache = null;
    var _statusCountsDirty = true;

    function init() {
        _loadUIConfig();
        TWC.i18n.init();
        TWC.theme.init();
        _initAlpineStores();
        _renderLayout();
        _bindEvents();
        _applyUIConfig();
        _startRefresh();
        _updateSpeedHistory();
        
        _updatePortStatus();
        if (_portTestTimer) clearInterval(_portTestTimer);
        _portTestTimer = setInterval(_updatePortStatus, 300000);
        _updateFreeSpace();

        document.removeEventListener('visibilitychange', _onVisibilityChange);
        document.addEventListener('visibilitychange', _onVisibilityChange);
    }

    function _onVisibilityChange() {
        if (!document.hidden && _autoRefresh) {
            _doRefresh(true);
        }
    }

    function _renderLayout() {
        var html = '<div class="twc-app">' +
            TWC.uiLayout.renderToolbar() +
            '<div class="twc-main">' +
            TWC.uiLayout.renderSidebar() +
            '<div class="twc-content">' +
            TWC.uiLayout.renderFilterBar() +
            '<div class="twc-torrent-list-container" id="torrent-list-container"></div>' +
            TWC.uiLayout.renderDetailPanel() +
            '</div>' +
            '</div>' +
            TWC.uiLayout.renderStatusBar() +
            '</div>' +
            '<div class="twc-modal-overlay" id="modal-overlay" x-data="{ open: false }" x-show="open" x-transition:enter="twc-fade-enter" x-transition:enter-end="twc-fade-enter-end" x-transition:leave="twc-fade-leave" x-transition:leave-end="twc-fade-leave-end"></div>' +
            '<div class="twc-context-menu" id="context-menu" style="display:none"></div>' +
            '<div class="twc-toast-container" id="toast-container"></div>';

        $('body').html(html);
        if (window.Alpine) {
            try { Alpine.initTree(document.body); } catch(e) {}
        }
        TWC.uiList.init();
        TWC.uiList.render();
        TWC.uiList.bindEvents();
        TWC.uiDetail.render();

        if (!_detailPanelVisible) {
            $('#btn-detail-collapse svg').html('<polyline points="6 15 12 9 18 15"/>');
            $('#btn-detail-collapse').attr('title', TWC.i18n.t('toolbar.detail_toggle'));
        }
    }

    function _bindEvents() {
        $('#btn-add').off('click').on('click', function() { TWC.uiDialog.showAddTorrent(); });
        $('#btn-start').off('click').on('click', function() { _actionOnSelected('start'); });
        $('#btn-start-now').off('click').on('click', function() { _actionOnSelected('startNow'); });
        $('#btn-pause').off('click').on('click', function() { _actionOnSelected('stop'); });
        $('#btn-reannounce').off('click').on('click', function() { _actionOnSelected('reannounce'); });
        $('#btn-verify').off('click').on('click', function() { _actionOnSelected('verify'); });
        $('#btn-remove').off('click').on('click', function() { _actionOnSelected('remove'); });
        $('#btn-queue-up').off('click').on('click', function() { _actionOnSelected('queueUp'); });
        $('#btn-queue-down').off('click').on('click', function() { _actionOnSelected('queueDown'); });
        $('#btn-queue-top').off('click').on('click', function() { _actionOnSelected('queueTop'); });
        $('#btn-queue-bottom').off('click').on('click', function() { _actionOnSelected('queueBottom'); });
        $('#btn-alt-speed').off('click').on('click', _toggleAltSpeed);
        $('#btn-refresh').off('click').on('click', function() { _doRefresh(true); });
        $('#btn-auto-refresh').off('click').on('click', _toggleAutoRefresh);
        $('#btn-sidebar-toggle').off('click').on('click', _toggleSidebar);
        $('#btn-detail-toggle').off('click').on('click', _toggleDetailPanel);
        $('#btn-detail-collapse').off('click').on('click', _toggleDetailPanel);
        $('#btn-stats').off('click').on('click', function() { TWC.uiStats.renderGlobalStats(); });
        $('#btn-history').off('click').on('click', function() { TWC.uiHistory.showHistory(); });
        $('#btn-settings').off('click').on('click', function() { TWC.uiDialog.showSettings(); });

        $('#search-input').off('input').on('input', TWC.utils.debounce(function() {
            TWC.torrent.setFilter('search', $(this).val());
        }, 300));

        $('#select-refresh-interval').off('change').on('change', function() {
            _refreshInterval = parseInt($(this).val());
            TWC.utils.storageSet('twc-refresh-interval', _refreshInterval);
            _startRefresh();
        });

        $('#select-lang').off('change').on('change', function() {
            TWC.i18n.setLanguage($(this).val());
        });

        $(document).off('click.detailtab').on('click', '.twc-detail-tab', function() {
            var tab = $(this).data('tab');
            var panel = document.getElementById('detail-panel');
            if (panel && Alpine.$data) {
                try {
                    var data = Alpine.$data(panel);
                    if (data) data.activeTab = tab;
                } catch(e) {}
            }
            TWC.uiDetail.switchTab(tab);
        });

        $(document).off('click.modal').on('click', function(e) {
            if (!$(e.target).closest('#context-menu').length) {
                $('#context-menu').hide();
            }
        });

        $(document).off('keydown.main').on('keydown', function(e) {
            _handleKeyboard(e);
        });

        TWC.torrent.onEvent(function(eventType) {
            if (eventType === 'selection-changed') {
                _updateToolbarState();
                TWC.uiDetail.update();
            }
            if (eventType === 'filter-changed' || eventType === 'sort-changed') {
                TWC.uiList.render();
                TWC.ui.refreshSidebar();
            }
        });

        TWC.theme.onThemeChange(function() {
            _updateAltSpeedButton();
        });

        _bindDragDrop();
    }

    function _bindDragDrop() {
        var $body = $('body');
        var dragCounter = 0;

        $body.off('dragenter.twcDrop dragover.twcDrop dragleave.twcDrop drop.twcDrop');

        $body.on('dragenter.twcDrop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            if (dragCounter === 1) {
                $body.addClass('twc-drag-over');
            }
        });

        $body.on('dragover.twcDrop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });

        $body.on('dragleave.twcDrop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            if (dragCounter === 0) {
                $body.removeClass('twc-drag-over');
            }
        });

        $body.on('drop.twcDrop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter = 0;
            $body.removeClass('twc-drag-over');

            var files = e.originalEvent.dataTransfer.files;
            if (!files || files.length === 0) return;

            var torrentFiles = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (f.name.endsWith('.torrent')) {
                    torrentFiles.push(f);
                }
            }

            if (torrentFiles.length === 0) {
                TWC.ui.showToast(TWC.i18n.t('dialog.add.no_torrent_file') || 'No .torrent files found', 'warning');
                return;
            }

            TWC.uiDialog.showAddTorrent(torrentFiles);
        });
    }

    function _handleKeyboard(e) {
        if ($(e.target).is('input, textarea, select')) return;

        if (e.key === 'Delete') {
            _actionOnSelected('remove');
            e.preventDefault();
        }
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            TWC.torrent.selectAll();
            e.preventDefault();
        }
        if (e.key === 'F5') {
            _doRefresh(true);
            e.preventDefault();
        }
        if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
            TWC.uiDialog.showAddTorrent();
            e.preventDefault();
        }
        if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
            TWC.uiDialog.showSettings();
            e.preventDefault();
        }
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            _actionOnSelected('start');
            e.preventDefault();
        }
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            _actionOnSelected('stop');
            e.preventDefault();
        }
        if (e.key === 'Escape') {
            TWC.torrent.clearSelection();
            hideModal();
            $('#context-menu').hide();
        }
    }

    function _actionOnSelected(action) {
        var ids = TWC.torrent.getSelectedIds();
        if (ids.length === 0) return;

        _optimisticUpdate(action, ids);

        function postActionRefresh() {
            _doRefresh(true, true, true);
        }

        switch (action) {
            case 'start':
                TWC.rpc.startTorrents(ids, function(success) {
                    if (success) showToast(TWC.i18n.t('status.started').replace('{n}', ids.length), 'success');
                    else _rollbackOptimistic(ids);
                    postActionRefresh();
                });
                break;
            case 'startNow':
                TWC.rpc.startNowTorrents(ids, function(success) {
                    if (success) showToast(TWC.i18n.t('status.started_now').replace('{n}', ids.length), 'success');
                    else _rollbackOptimistic(ids);
                    postActionRefresh();
                });
                break;
            case 'stop':
                TWC.rpc.stopTorrents(ids, function(success) {
                    if (success) showToast(TWC.i18n.t('status.paused').replace('{n}', ids.length), 'success');
                    else _rollbackOptimistic(ids);
                    postActionRefresh();
                });
                break;
            case 'reannounce':
                TWC.rpc.reannounceTorrents(ids, function(success) {
                    if (success) showToast(TWC.i18n.t('status.reannounced'), 'success');
                    postActionRefresh();
                });
                break;
            case 'verify':
                TWC.rpc.verifyTorrents(ids, function(success) {
                    if (success) {
                        if (ids.length === 1) {
                            var t = TWC.torrent.getTorrent(ids[0]);
                            showToast(TWC.i18n.t('status.checking_torrent').replace('{name}', (t ? t.name : ids.length)), 'success');
                        } else {
                            showToast(TWC.i18n.t('status.checking_multi').replace('{n}', ids.length), 'success');
                        }
                    }
                    postActionRefresh();
                });
                break;
            case 'remove':
                TWC.uiDialog.showConfirmDelete(ids);
                break;
            case 'queueUp':
                TWC.rpc.queueMoveUp(ids, function() { postActionRefresh(); });
                break;
            case 'queueDown':
                TWC.rpc.queueMoveDown(ids, function() { postActionRefresh(); });
                break;
            case 'queueTop':
                TWC.rpc.queueMoveTop(ids, function() { postActionRefresh(); });
                break;
            case 'queueBottom':
                TWC.rpc.queueMoveBottom(ids, function() { postActionRefresh(); });
                break;
        }
    }

    function _optimisticUpdate(action, ids) {
        var newStatus;
        switch (action) {
            case 'start': case 'startNow': newStatus = 4; break;
            case 'stop': newStatus = 0; break;
            default: return;
        }
        for (var i = 0; i < ids.length; i++) {
            var t = TWC.torrent.getTorrent(ids[i]);
            if (t) {
                t._prevStatus = t.status;
                t.status = newStatus;
                if (newStatus === 0) {
                    t.rate_download = 0;
                    t.rate_upload = 0;
                    t.is_stalled = false;
                }
            }
        }
        TWC.uiList.render();
        TWC.uiDetail.update();
        _statusCountsDirty = true;
    }

    function _rollbackOptimistic(ids) {
        for (var i = 0; i < ids.length; i++) {
            var t = TWC.torrent.getTorrent(ids[i]);
            if (t && t._prevStatus !== undefined) {
                t.status = t._prevStatus;
                delete t._prevStatus;
            }
        }
        TWC.uiList.render();
        TWC.uiDetail.update();
        _statusCountsDirty = true;
    }

    function _toggleAltSpeed() {
        var current = TWC.config.getSessionValue('alt_speed_enabled');
        TWC.config.saveSession({ alt_speed_enabled: !current }, function(success) {
            if (success) {
                showToast(!current ? TWC.i18n.t('status.alt_speed_on') : TWC.i18n.t('status.alt_speed_off'), 'success');
                _updateAltSpeedButton();
                _updateAltSpeedStatus();
            }
        });
    }

    function _updateAltSpeedButton() {
        var enabled = TWC.config.getSessionValue('alt_speed_enabled');
        if (typeof Alpine !== 'undefined' && Alpine.store('toolbar')) {
            Alpine.store('toolbar').altSpeedActive = !!enabled;
        }
    }
    
    function _updateAltSpeedStatus() {
        var altSpeed = TWC.config.getSessionValue('alt_speed_enabled');
        if (typeof Alpine !== 'undefined' && Alpine.store('statusbar')) {
            Alpine.store('statusbar').altSpeedText = altSpeed ? '⏱ ' + TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled');
            Alpine.store('statusbar').altSpeedOn = !!altSpeed;
        }
    }

    function _toggleAutoRefresh() {
        _autoRefresh = !_autoRefresh;
        if (_autoRefresh) {
            _startRefresh();
        } else {
            _stopRefresh();
        }
        TWC.utils.storageSet('twc-auto-refresh', _autoRefresh);
        if (typeof Alpine !== 'undefined' && Alpine.store('toolbar')) {
            Alpine.store('toolbar').autoRefreshActive = _autoRefresh;
        }
    }

    function _toggleSidebar() {
        _sidebarVisible = !_sidebarVisible;
        TWC.utils.storageSet('twc-sidebar-visible', _sidebarVisible);
        if (typeof Alpine !== 'undefined' && Alpine.store('toolbar')) {
            Alpine.store('toolbar').sidebarCollapsed = !_sidebarVisible;
        }
    }

    function _toggleDetailPanel() {
        _detailPanelVisible = !_detailPanelVisible;
        if (_detailPanelVisible) {
            $('#btn-detail-collapse svg').html('<polyline points="6 9 12 15 18 9"/>');
            $('#btn-detail-collapse').attr('title', TWC.i18n.t('toolbar.detail_toggle'));
        } else {
            $('#btn-detail-collapse svg').html('<polyline points="6 15 12 9 18 15"/>');
            $('#btn-detail-collapse').attr('title', TWC.i18n.t('toolbar.detail_toggle'));
        }
        TWC.utils.storageSet('twc-detail-visible', _detailPanelVisible);
        if (typeof Alpine !== 'undefined' && Alpine.store('toolbar')) {
            Alpine.store('toolbar').detailCollapsed = !_detailPanelVisible;
        }
    }

    function _updateToolbarState() {
        var ids = TWC.torrent.getSelectedIds();
        var hasSelection = ids.length > 0;
        if (typeof Alpine !== 'undefined' && Alpine.store('toolbar')) {
            Alpine.store('toolbar').hasSelection = hasSelection;
        }
    }

    function _startRefresh() {
        _stopRefresh();
        if (_autoRefresh) {
            _doRefresh(true);
            _speedTimer = setInterval(function() {
                _updateSpeedHistory();
            }, _speedInterval);
        }
    }

    function _scheduleNextRefresh() {
        if (_refreshTimer) clearTimeout(_refreshTimer);
        _refreshTimer = setTimeout(function() {
            _doRefresh(false);
        }, _getRefreshInterval());
    }

    function _getRefreshInterval() {
        if (document.hidden) return 15000;
        var stats = TWC.torrent.getGlobalStats();
        if (stats.downloadSpeed === 0 && stats.uploadSpeed === 0) {
            var counts = TWC.torrent.getStatusCounts();
            if (counts.downloading === 0 && counts.seeding === 0) return 10000;
        }
        return _refreshInterval;
    }

    function _stopRefresh() {
        if (_refreshTimer) {
            clearTimeout(_refreshTimer);
            _refreshTimer = null;
        }
        if (_speedTimer) {
            clearInterval(_speedTimer);
            _speedTimer = null;
        }
    }

    function _updateSpeedHistory() {
        var stats = TWC.torrent.getGlobalStats();
        _speedBuffer[_speedBufferPos] = {
            download: stats.downloadSpeed,
            upload: stats.uploadSpeed,
            timestamp: Date.now()
        };
        _speedBufferPos = (_speedBufferPos + 1) % _speedBuffer.length;
        if (_speedBufferSize < _speedBuffer.length) _speedBufferSize++;

        $('#stat-download-speed').text(TWC.utils.formatSpeed(stats.downloadSpeed));
        $('#stat-upload-speed').text(TWC.utils.formatSpeed(stats.uploadSpeed));
        $('#stat-peers').text(stats.totalPeers || 0);
    }

    var _refreshing = false;
    var _pendingRefresh = null;
    var _isActionRefresh = false;
    var _refreshTimeout = null;

    function _doRefresh(forceFull, skipStats, isAction) {
        if (_refreshing) {
            if (isAction) {
                _pendingRefresh = 'full-action';
            } else if (!_pendingRefresh || _pendingRefresh === 'auto') {
                _pendingRefresh = forceFull ? 'full' : 'auto';
            }
            return;
        }

        var isFirst = TWC.torrent.isFirstLoad();
        var currentSeq = ++_refreshSeq;

        _refreshing = true;
        _isActionRefresh = isAction;

        if (_refreshTimeout) clearTimeout(_refreshTimeout);
        _refreshTimeout = setTimeout(function() {
            if (_refreshing) {
                console.warn('[TWC] Refresh timeout, forcing reset');
                _refreshing = false;
                _pendingRefresh = null;
            }
        }, 10000);

        if (isFirst || forceFull) {
            _fullRefresh(currentSeq);
        } else {
            _hybridRefresh(currentSeq);
        }

        if (!skipStats) {
            TWC.config.loadStats(function(success) {
                if (success) _updateStatusBar();
            });
        }
    }

    function _finishRefresh() {
        if (_refreshTimeout) { clearTimeout(_refreshTimeout); _refreshTimeout = null; }
        _refreshing = false;
        _isActionRefresh = false;
        if (_pendingRefresh) {
            var type = _pendingRefresh;
            _pendingRefresh = null;
            switch (type) {
                case 'full-action':
                    _doRefresh(true, true, true);
                    break;
                case 'full':
                    _doRefresh(true, true);
                    break;
                case 'auto':
                    _doRefresh(false);
                    break;
            }
        } else if (_autoRefresh) {
            _scheduleNextRefresh();
        }
    }

    var _groupsLoaded = false;

    var _lastSnapshotTime = 0;
    var _SNAPSHOT_INTERVAL = 300;

    function _archiveSnapshots() {
        if (!TWC.dbCache) return;
        var now = Date.now() / 1000 | 0;
        if (now - _lastSnapshotTime < _SNAPSHOT_INTERVAL) return;
        _lastSnapshotTime = now;

        var allTorrents = TWC.torrent.getAllTorrents();
        var ids = Object.keys(allTorrents);
        for (var i = 0; i < ids.length; i++) {
            var t = allTorrents[ids[i]];
            if (t.rate_download > 0 || t.rate_upload > 0 || t.percent_done < 1) {
                TWC.dbCache.history.archiveSnapshot(t);
            }
        }
    }

    function _fullRefresh(seq) {
        TWC.rpc.getTorrents(null, TWC.rpc.LIST_FIELDS, function(torrents, removed, success, error) {
            if (seq !== _refreshSeq) return;
            try {
                if (success) {
                    TWC.torrent.updateData(torrents, removed);
                    TWC.torrent.setFirstLoad(false);
                    _statusCountsDirty = true;
                    _updateUI();
                    _updateSpeedHistory();
                }
            } catch (e) {
                console.error('[TWC] _fullRefresh error:', e);
            }
            _finishRefresh();
        });
        if (!_groupsLoaded) {
            _groupsLoaded = true;
            TWC.config.loadGroups();
        }
    }

    function _hybridRefresh(seq) {
        TWC.rpc.getTorrents(null, TWC.rpc.LIST_FIELDS, function(torrents, removed, success) {
            if (seq !== _refreshSeq) return;
            try {
                if (success) {
                    TWC.torrent.updateData(torrents, removed);
                    _statusCountsDirty = true;
                    
                    var currentSelectedIds = TWC.torrent.getSelectedIds();
                    if (currentSelectedIds.length > 0) {
                        var allFields = TWC.rpc.LIST_FIELDS.concat(TWC.rpc.DETAIL_FIELDS);
                        var uniqueFields = [];
                        var seen = {};
                        for (var i = 0; i < allFields.length; i++) {
                            if (!seen[allFields[i]]) { seen[allFields[i]] = true; uniqueFields.push(allFields[i]); }
                        }
                        TWC.rpc.getTorrents(currentSelectedIds, uniqueFields, function(selectedTorrents, removedSelected, detailSuccess) {
                            if (seq !== _refreshSeq) return;
                            try {
                                if (detailSuccess && selectedTorrents && selectedTorrents.length > 0) {
                                    TWC.torrent.updateData(selectedTorrents, removedSelected);
                                }
                                _updateUI();
                                _updateSpeedHistory();
                            } catch (e2) {
                                console.error('[TWC] _hybridRefresh detail error:', e2);
                            }
                            _finishRefresh();
                        });
                    } else {
                        _updateUI();
                        _updateSpeedHistory();
                        _finishRefresh();
                    }
                } else {
                    _finishRefresh();
                }
            } catch (e) {
                console.error('[TWC] _hybridRefresh error:', e);
                _finishRefresh();
            }
        });
    }

    function _updateUI() {
        _statusCountsDirty = true;
        TWC.uiLayout.updateSidebar();
        TWC.uiList.render();
        TWC.uiDetail.update();
        _updateStatusBar();
        _updateFreeSpace();
        _archiveSnapshots();
    }

    function _updateStatusBar() {
        var stats = TWC.torrent.getGlobalStats();
        var counts = _getCachedStatusCounts();

        var dlSpeed = TWC.utils.formatSpeed(stats.downloadSpeed);
        var ulSpeed = TWC.utils.formatSpeed(stats.uploadSpeed);

        var countText = TWC.i18n.t('status.torrents').replace('{n}', counts.all);
        if (counts.downloading > 0) countText += ' | ' + TWC.i18n.t('sidebar.status_downloading') + ': ' + counts.downloading;
        if (counts.seeding > 0) countText += ' | ' + TWC.i18n.t('sidebar.status_seeding') + ': ' + counts.seeding;

        var errCount = counts.error > 0 ? String(counts.error) : '0';
        var errColor = counts.error > 0 ? 'var(--color-danger-500)' : '';

        var peersCount = String(stats.totalPeers || 0);

        var ratioText = '-';
        var ratioColor = '';
        if (stats.totalDownloaded > 0 && stats.totalUploaded > 0) {
            var ratio = (stats.totalUploaded / stats.totalDownloaded).toFixed(2);
            ratioText = ratio;
            ratioColor = ratio >= 1 ? 'var(--color-success-500)' : 'var(--color-warning-500)';
        }

        _updateAltSpeedStatus();

        var version = TWC.config.getSessionValue('version');

        _updateConnectionStatus(true);

        if (typeof Alpine !== 'undefined' && Alpine.store('statusbar')) {
            var sb = Alpine.store('statusbar');
            sb.downloadSpeed = dlSpeed;
            sb.uploadSpeed = ulSpeed;
            sb.peers = peersCount;
            sb.errors = errCount;
            sb.errorColor = errColor;
            sb.torrentCount = countText;
            if (ratioText !== '-') {
                sb.globalRatio = ratioText;
                sb.ratioColor = ratioColor;
            }
            if (version) sb.version = 'Transmission ' + version;
        }
    }

    function _getCachedStatusCounts() {
        if (_statusCountsDirty || !_statusCountsCache) {
            _statusCountsCache = TWC.torrent.getStatusCounts();
            _statusCountsDirty = false;
        }
        return _statusCountsCache;
    }

    function _updateFreeSpace() {
        var now = Date.now();
        if (now - _freeSpaceLastUpdated < 30000) return;

        var download_dir = TWC.config.getSessionValue('download_dir');
        if (download_dir) {
            TWC.rpc.getFreeSpace(download_dir, function(freeBytes, totalBytes, path, success) {
                if (success && freeBytes >= 0) {
                    var text = TWC.i18n.t('stats.free_space') + ': ' + TWC.utils.formatBytes(freeBytes);
                    _freeSpaceLastUpdated = Date.now();
                    if (typeof Alpine !== 'undefined' && Alpine.store('statusbar')) {
                        Alpine.store('statusbar').freeSpace = text;
                    }
                }
            });
        }
    }

    var _portTestTimer = null;
    var _portTestInProgress = false;
    var _portTestTimeoutTimer = null;
    var _portTestTimedOut = false;
    var _PORT_TEST_TIMEOUT = 60000;

    function _updateConnectionStatus(connected) {
        if (typeof Alpine !== 'undefined' && Alpine.store('statusbar')) {
            var sb = Alpine.store('statusbar');
            if (connected) {
                sb.connIconBg = 'var(--color-success-500)';
                sb.connText = '✓ ' + TWC.i18n.t('status.connected');
                sb.connColor = 'var(--color-success-500)';
                sb.showReconnect = false;
            } else {
                sb.connIconBg = 'var(--color-danger-500)';
                sb.connText = '✗ ' + TWC.i18n.t('status.disconnected');
                sb.connColor = 'var(--color-danger-500)';
                sb.showReconnect = true;
            }
        }
        if (connected) {
            _lastConnectedAt = new Date();
        }
    }

    function _updatePortStatus() {
        if (_portTestInProgress) return;
        _portTestInProgress = true;
        _portTestTimedOut = false;
        if (_portTestTimeoutTimer) clearTimeout(_portTestTimeoutTimer);
        _portTestTimeoutTimer = setTimeout(function() {
            if (_portTestInProgress) {
                _portTestInProgress = false;
                _portTestTimedOut = true;
                _syncPortStore('✗ ' + (TWC.i18n.t('status.port_test_timeout') || 'Timeout'), 'stat-port-closed', '', false);
            }
        }, _PORT_TEST_TIMEOUT);
        _syncPortStore(TWC.i18n.t('status.connecting'), 'stat-port-unknown', '', false);
        TWC.rpc.testPort(function(isOpen, success, ipProtocol, ipProtocolFromError) {
            if (_portTestTimeoutTimer) { clearTimeout(_portTestTimeoutTimer); _portTestTimeoutTimer = null; }
            if (_portTestTimedOut) return;
            var effectiveIpProtocol = ipProtocol || ipProtocolFromError || '';
            var errMsg = (!success && typeof ipProtocolFromError === 'string' && ipProtocolFromError) ? ipProtocol : '';
            if (!success && errMsg) effectiveIpProtocol = ipProtocolFromError || '';
            _portTestInProgress = false;
            if (success) {
                if (isOpen) {
                    _syncPortStore('✓ ' + TWC.i18n.t('status.port_ok'), 'stat-port-open', effectiveIpProtocol, !!effectiveIpProtocol);
                } else {
                    _syncPortStore('✗ ' + TWC.i18n.t('status.port_closed'), 'stat-port-closed', effectiveIpProtocol, !!effectiveIpProtocol);
                }
            } else {
                var errorText = errMsg || TWC.i18n.t('status.port_test_failed') || 'Test Failed';
                _syncPortStore('✗ ' + errorText, 'stat-port-closed', effectiveIpProtocol, !!effectiveIpProtocol);
            }
        });
    }

    function _syncPortStore(text, portClass, ipProtocol, showIp) {
        if (typeof Alpine !== 'undefined' && Alpine.store('statusbar')) {
            var sb = Alpine.store('statusbar');
            sb.portText = text;
            sb.portClass = portClass;
            sb.ipProtocol = ipProtocol ? ipProtocol.toUpperCase() : '';
            sb.showIpProtocol = !!showIp;
        }
    }

    function _loadUIConfig() {
        _refreshInterval = TWC.utils.storageGet('twc-refresh-interval', 2000);
        _autoRefresh = TWC.utils.storageGet('twc-auto-refresh', true);
        _detailPanelVisible = TWC.utils.storageGet('twc-detail-visible', true);
        _sidebarVisible = TWC.utils.storageGet('twc-sidebar-visible', true);
    }

    function _initAlpineStores() {
        if (typeof Alpine === 'undefined') return;
        Alpine.store('statusbar', {
            downloadSpeed: '0 B/s',
            uploadSpeed: '0 B/s',
            peers: '0',
            errors: '0',
            errorColor: '',
            globalRatio: '-',
            ratioColor: '',
            torrentCount: '',
            connIconBg: '',
            connText: TWC.i18n.t('status.connecting'),
            connColor: '',
            showReconnect: false,
            altSpeedText: TWC.i18n.t('dialog.settings.disabled'),
            altSpeedOn: false,
            portText: TWC.i18n.t('dialog.settings.testing'),
            portClass: 'stat-port-unknown',
            ipProtocol: '',
            showIpProtocol: false,
            freeSpace: '',
            version: ''
        });
        Alpine.store('toolbar', {
            altSpeedActive: false,
            autoRefreshActive: _autoRefresh,
            hasSelection: false,
            sidebarCollapsed: !_sidebarVisible,
            detailCollapsed: !_detailPanelVisible
        });
    }

    function _applyUIConfig() {
        $('#select-refresh-interval').val(String(_refreshInterval));
    }

    function showToast(message, type) {
        type = type || 'info';
        var $container = $('#toast-container');
        var $toast = $('<div class="twc-toast ' + type + '">' +
            '<span>' + TWC.utils.escapeHtml(message) + '</span>' +
            '</div>');
        $container.append($toast);
        setTimeout(function() {
            $toast.fadeOut(300, function() { $(this).remove(); });
        }, 3000);
    }

    var _progressToastId = 0;
    function showProgressToast(message) {
        var id = ++_progressToastId;
        var $container = $('#toast-container');
        var $toast = $('<div class="twc-toast info progress" data-progress-id="' + id + '">' +
            '<div class="progress-bar-wrap" style="background:rgba(255,255,255,0.2);height:3px;border-radius:2px;margin-top:8px">' +
            '<div class="progress-bar-fill" style="height:100%;background:#3b82f6;width:0%;transition:width 0.3s"></div>' +
            '</div>' +
            '<span class="progress-text" style="display:block;margin-top:4px">' + TWC.utils.escapeHtml(message) + '</span>' +
            '</div>');
        $container.append($toast);
        return id;
    }

    function updateProgressToast(id, message, progress) {
        var $toast = $('.twc-toast[data-progress-id="' + id + '"]');
        if ($toast.length === 0) return;
        $toast.find('.progress-text').text(message);
        if (progress !== undefined) {
            $toast.find('.progress-bar-fill').css('width', Math.min(100, progress) + '%');
        }
    }

    function removeProgressToast(id) {
        var $toast = $('.twc-toast[data-progress-id="' + id + '"]');
        if ($toast.length > 0) {
            $toast.fadeOut(300, function() { $(this).remove(); });
        }
    }

    function showModal(content, options) {
        options = options || {};
        var size = options.size || 'md';
        var title = options.title || '';
        var onClose = options.onClose;
        var footer = options.footer || '';

        var html = '<div class="twc-modal ' + size + '">' +
            '<div class="twc-modal-header">' +
            '<h3>' + TWC.utils.escapeHtml(title) + '</h3>' +
            '<button class="twc-modal-close" id="modal-close-btn">&times;</button>' +
            '</div>' +
            '<div class="twc-modal-body">' + content + '</div>' +
            (footer ? '<div class="twc-modal-footer">' + footer + '</div>' : '') +
            '</div>';

        var $overlay = $('#modal-overlay');
        $overlay.html(html);

        var alpineData = Alpine.$data($overlay[0]);
        if (alpineData) alpineData.open = true;
        $overlay.addClass('visible');

        $overlay.find('#modal-close-btn, .twc-modal-cancel').on('click', function() {
            hideModal();
            if (onClose) onClose();
        });

        $overlay.off('click.twcModal').on('click.twcModal', function(e) {
            if ($(e.target).is('.twc-modal-overlay')) {
                hideModal();
                if (onClose) onClose();
            }
        });

        if (window.Alpine) {
            try {
                var hasUninitXData = false;
                var xDataEls = $overlay[0] ? $overlay[0].querySelectorAll('[x-data]') : [];
                for (var i = 0; i < xDataEls.length; i++) {
                    if (!xDataEls[i]._x_dataStack) {
                        hasUninitXData = true;
                        break;
                    }
                }
                if (hasUninitXData) {
                    Alpine.initTree($overlay[0]);
                }
            } catch(e) {}
        }
    }

    function hideModal() {
        var $overlay = $('#modal-overlay');
        var alpineData = Alpine.$data($overlay[0]);
        if (alpineData) alpineData.open = false;
        $overlay.removeClass('visible');
        setTimeout(function() { $overlay.html(''); }, 300);
    }

    function showContextMenu(items, x, y) {
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.separator) {
                html += '<div class="twc-context-menu-separator"></div>';
                continue;
            }
            var cls = (item.danger ? ' danger' : '') + (item.disabled ? ' disabled' : '');
            html += '<div class="twc-context-menu-item' + cls + '" data-action="' + (item.action || '') + '">' +
                (item.icon ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">' + item.icon + '</svg>' : '') +
                '<span>' + TWC.utils.escapeHtml(item.label) + '</span>' +
                '</div>';
        }

        var $menu = $('#context-menu');
        $menu.html(html).css({ display: 'block', left: x + 'px', top: y + 'px' });

        var menuWidth = $menu.outerWidth();
        var menuHeight = $menu.outerHeight();
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        if (x + menuWidth > winWidth) $menu.css('left', (winWidth - menuWidth - 5) + 'px');
        if (y + menuHeight > winHeight) $menu.css('top', (winHeight - menuHeight - 5) + 'px');

        $menu.find('.twc-context-menu-item:not(.disabled)').off('click').on('click', function() {
            var action = $(this).data('action');
            $menu.hide();
            if (action) {
                var found = null;
                for (var j = 0; j < items.length; j++) {
                    if (items[j].action === action) { found = items[j]; break; }
                }
                if (found && found.onClick) found.onClick();
            }
        });
    }

    function getSpeedHistory() {
        var download = [];
        var upload = [];
        var timestamps = [];
        for (var i = 0; i < _speedBufferSize; i++) {
            var idx = (_speedBufferPos - _speedBufferSize + i + _speedBuffer.length) % _speedBuffer.length;
            download.push(_speedBuffer[idx].download);
            upload.push(_speedBuffer[idx].upload);
            timestamps.push(_speedBuffer[idx].timestamp);
        }
        return { download: download, upload: upload, timestamps: timestamps };
    }

    return {
        init: init,
        showToast: showToast,
        showProgressToast: showProgressToast,
        updateProgressToast: updateProgressToast,
        removeProgressToast: removeProgressToast,
        showModal: showModal,
        hideModal: hideModal,
        showContextMenu: showContextMenu,
        getSpeedHistory: getSpeedHistory,
        refreshSidebar: TWC.uiLayout.updateSidebar,
        refreshData: function(forceFull) {
            _doRefresh(forceFull !== false, true, true);
        },
        updateToolbarState: _updateToolbarState,
        updateAltSpeedButton: _updateAltSpeedButton,
        updateAltSpeedStatus: _updateAltSpeedStatus
    };
})();
