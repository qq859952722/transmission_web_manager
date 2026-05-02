var TWC = TWC || {};

TWC.ui = (function() {
    var _refreshTimer = null;
    var _speedTimer = null;
    var _refreshInterval = 5000;
    var _speedInterval = 1000;
    var _autoRefresh = true;
    var _detailPanelVisible = true;
    var _sidebarVisible = true;
    var _lastSelectedId = null;
    var _speedBuffer = new Array(120);
    var _speedBufferPos = 0;
    var _speedBufferSize = 0;
    var _maxSpeedPoints = 120;
    var _freeSpaceTimer = null;
    var _freeSpaceLastUpdated = 0;

    function init() {
        _loadUIConfig();
        TWC.theme.init();
        _renderLayout();
        _bindEvents();
        _startRefresh();
        _updateSpeedHistory();
        _doRefresh(true);
        
        _updatePortStatus();
        _portTestTimer = setInterval(_updatePortStatus, 300000);
        _updateFreeSpace();
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
            '<div class="twc-modal-overlay" id="modal-overlay"></div>' +
            '<div class="twc-context-menu" id="context-menu" style="display:none"></div>' +
            '<div class="twc-toast-container" id="toast-container"></div>';

        $('body').html(html);
        TWC.uiList.init();
        TWC.uiList.render();
        TWC.uiList.bindEvents();
        TWC.uiDetail.render();

        if (!_detailPanelVisible) {
            $('#detail-panel').addClass('collapsed');
            $('#btn-detail-collapse svg').html('<polyline points="6 15 12 9 18 15"/>');
            $('#btn-detail-collapse').attr('title', '展开详情面板');
        }
        if (!_sidebarVisible) {
            $('#sidebar').addClass('collapsed');
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
        $('#btn-alt-speed').off('click').on('click', _toggleAltSpeed);
        $('#btn-refresh').off('click').on('click', function() { _doRefresh(true); });
        $('#btn-auto-refresh').off('click').on('click', _toggleAutoRefresh);
        $('#btn-sidebar-toggle').off('click').on('click', _toggleSidebar);
        $('#btn-detail-toggle').off('click').on('click', _toggleDetailPanel);
        $('#btn-detail-collapse').off('click').on('click', _toggleDetailPanel);
        $('#btn-theme').off('click').on('click', function() { TWC.theme.toggle(); });
        $('#btn-stats').off('click').on('click', function() { TWC.uiStats.renderGlobalStats(); });
        $('#btn-settings').off('click').on('click', function() { TWC.uiDialog.showSettings(); });

        $('#search-input').off('input').on('input', TWC.utils.debounce(function() {
            TWC.torrent.setFilter('search', $(this).val());
        }, 300));

        $('#select-refresh-interval').off('change').on('change', function() {
            _refreshInterval = parseInt($(this).val());
            TWC.utils.storageSet('twc-refresh-interval', _refreshInterval);
            _startRefresh();
        });

        $(document).off('click.detailtab').on('click', '.twc-detail-tab', function() {
            $('.twc-detail-tab').removeClass('active');
            $(this).addClass('active');
            TWC.uiDetail.switchTab($(this).data('tab'));
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

        function postActionRefresh() {
            _doRefresh(true, true, true);
        }

        switch (action) {
            case 'start':
                TWC.rpc.startTorrents(ids, function(success) {
                    if (success) showToast('已开始 ' + ids.length + ' 个种子', 'success');
                    postActionRefresh();
                });
                break;
            case 'startNow':
                TWC.rpc.startNowTorrents(ids, function(success) {
                    if (success) showToast('已立即开始 ' + ids.length + ' 个种子', 'success');
                    postActionRefresh();
                });
                break;
            case 'stop':
                TWC.rpc.stopTorrents(ids, function(success) {
                    if (success) showToast('已暂停 ' + ids.length + ' 个种子', 'success');
                    postActionRefresh();
                });
                break;
            case 'reannounce':
                TWC.rpc.reannounceTorrents(ids, function(success) {
                    if (success) showToast('已重新宣告', 'success');
                    postActionRefresh();
                });
                break;
            case 'verify':
                TWC.rpc.verifyTorrents(ids, function(success) {
                    if (success) {
                        if (ids.length === 1) {
                            var t = TWC.torrent.getTorrent(ids[0]);
                            showToast('已开始校验: ' + (t ? t.name : ids.length + ' 个种子'), 'success');
                        } else {
                            showToast('已开始校验 ' + ids.length + ' 个种子', 'success');
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
        }
    }

    function _toggleAltSpeed() {
        var current = TWC.config.getSessionValue('alt-speed-enabled');
        TWC.config.saveSession({ 'alt-speed-enabled': !current }, function(success) {
            if (success) {
                showToast(!current ? '已启用备用限速' : '已关闭备用限速', 'success');
                _updateAltSpeedButton();
                _updateAltSpeedStatus();
            }
        });
    }

    function _updateAltSpeedButton() {
        var enabled = TWC.config.getSessionValue('alt-speed-enabled');
        if (enabled) {
            $('#btn-alt-speed').addClass('active');
        } else {
            $('#btn-alt-speed').removeClass('active');
        }
    }
    
    function _updateAltSpeedStatus() {
        var altSpeed = TWC.config.getSessionValue('alt-speed-enabled');
        if (altSpeed) {
            $('#stat-alt-speed-text').text('⏱ 限速开').removeClass('stat-alt-speed-off').addClass('stat-alt-speed-on');
        } else {
            $('#stat-alt-speed-text').text('限速关').removeClass('stat-alt-speed-on').addClass('stat-alt-speed-off');
        }
    }

    function _toggleAutoRefresh() {
        _autoRefresh = !_autoRefresh;
        if (_autoRefresh) {
            $('#btn-auto-refresh').addClass('active');
            _startRefresh();
        } else {
            $('#btn-auto-refresh').removeClass('active');
            _stopRefresh();
        }
        TWC.utils.storageSet('twc-auto-refresh', _autoRefresh);
    }

    function _toggleSidebar() {
        _sidebarVisible = !_sidebarVisible;
        if (_sidebarVisible) {
            $('#sidebar').removeClass('collapsed');
        } else {
            $('#sidebar').addClass('collapsed');
        }
        TWC.utils.storageSet('twc-sidebar-visible', _sidebarVisible);
    }

    function _toggleDetailPanel() {
        _detailPanelVisible = !_detailPanelVisible;
        if (_detailPanelVisible) {
            $('#detail-panel').removeClass('collapsed');
            $('#btn-detail-collapse svg').html('<polyline points="6 9 12 15 18 9"/>');
            $('#btn-detail-collapse').attr('title', '折叠详情面板');
        } else {
            $('#detail-panel').addClass('collapsed');
            $('#btn-detail-collapse svg').html('<polyline points="6 15 12 9 18 15"/>');
            $('#btn-detail-collapse').attr('title', '展开详情面板');
        }
        TWC.utils.storageSet('twc-detail-visible', _detailPanelVisible);
    }

    function _updateToolbarState() {
        var ids = TWC.torrent.getSelectedIds();
        var hasSelection = ids.length > 0;
        $('#btn-start, #btn-start-now, #btn-pause, #btn-reannounce, #btn-verify, #btn-remove, #btn-queue-up, #btn-queue-down')
            .prop('disabled', !hasSelection);
    }

    function _startRefresh() {
        _stopRefresh();
        if (_autoRefresh) {
            _refreshTimer = setInterval(function() {
                _doRefresh(false);
            }, _refreshInterval);
            _speedTimer = setInterval(function() {
                _updateSpeedHistory();
            }, _speedInterval);
            $('#btn-auto-refresh').addClass('active');
        }
    }

    function _stopRefresh() {
        if (_refreshTimer) {
            clearInterval(_refreshTimer);
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
            _fullRefresh();
        } else {
            _hybridRefresh();
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
        }
    }

    function _fullRefresh() {
        TWC.rpc.getTorrents(null, TWC.rpc.LIST_FIELDS, function(torrents, removed, success, error) {
            if (success) {
                TWC.torrent.updateData(torrents, removed);
                TWC.torrent.setFirstLoad(false);
                _updateUI();
            }
            _finishRefresh();
        });
    }

    function _hybridRefresh() {
        TWC.rpc.getRecentlyActiveTorrents(TWC.rpc.LIST_FIELDS, function(torrents, removed, success) {
            if (success) {
                TWC.torrent.updateData(torrents, removed);
                
                var currentSelectedIds = TWC.torrent.getSelectedIds();
                if (currentSelectedIds.length > 0) {
                    var allFields = TWC.rpc.LIST_FIELDS.concat(TWC.rpc.DETAIL_FIELDS);
                    var uniqueFields = [];
                    var seen = {};
                    for (var i = 0; i < allFields.length; i++) {
                        if (!seen[allFields[i]]) { seen[allFields[i]] = true; uniqueFields.push(allFields[i]); }
                    }
                    TWC.rpc.getTorrents(currentSelectedIds, uniqueFields, function(selectedTorrents, removedSelected, detailSuccess) {
                        if (detailSuccess && selectedTorrents && selectedTorrents.length > 0) {
                            TWC.torrent.updateData(selectedTorrents, removedSelected);
                        }
                        _updateUI();
                        _finishRefresh();
                    });
                } else {
                    _updateUI();
                    _finishRefresh();
                }
            } else {
                _finishRefresh();
            }
        });
    }

    function _updateUI() {
        TWC.uiLayout.updateSidebar();
        TWC.uiList.render();
        TWC.uiDetail.update();
        _updateStatusBar();
        _updateFreeSpace();
    }

    function _updateStatusBar() {
        var stats = TWC.torrent.getGlobalStats();
        var counts = TWC.torrent.getStatusCounts();

        $('#stat-download-speed').text(TWC.utils.formatSpeed(stats.downloadSpeed));
        $('#stat-upload-speed').text(TWC.utils.formatSpeed(stats.uploadSpeed));

        var countText = '种子: ' + counts.all;
        if (counts.downloading > 0) countText += ' | 下载: ' + counts.downloading;
        if (counts.seeding > 0) countText += ' | 做种: ' + counts.seeding;
        $('#stat-torrent-count').text(countText);

        $('#stat-errors').text(counts.error > 0 ? counts.error : '0');
        if (counts.error > 0) {
            $('#stat-error-count').css('color', 'var(--color-danger-500)');
        } else {
            $('#stat-error-count').css('color', '');
        }

        $('#stat-peers').text(stats.totalPeers || 0);

        if (stats.totalDownloaded > 0 && stats.totalUploaded > 0) {
            var ratio = (stats.totalUploaded / stats.totalDownloaded).toFixed(2);
            $('#stat-global-ratio').text(ratio).css('color', ratio >= 1 ? 'var(--color-success-500)' : 'var(--color-warning-500)');
        }

        _updateAltSpeedStatus();

        var version = TWC.config.getSessionValue('version');
        if (version) {
            $('#stat-version').text('Transmission ' + version);
        }

        _updateConnectionStatus(true);
    }

    function _updateFreeSpace() {
        var now = Date.now();
        if (now - _freeSpaceLastUpdated < 30000) return; // 至少30秒更新一次
        
        var downloadDir = TWC.config.getSessionValue('download-dir');
        if (downloadDir) {
            TWC.rpc.getFreeSpace(downloadDir, function(freeBytes, totalBytes, path, success) {
                if (success && freeBytes >= 0) {
                    $('#stat-free-space').text('可用空间: ' + TWC.utils.formatBytes(freeBytes));
                    _freeSpaceLastUpdated = Date.now();
                }
            });
        }
    }

    var _portTestTimer = null;
    var _portTestInProgress = false;

    function _updateConnectionStatus(connected) {
        if (connected) {
            $('#stat-conn-icon').css('background', 'var(--color-success-500)');
            $('#stat-conn-text').text('✓ 已连接').css('color', 'var(--color-success-500)');
        } else {
            $('#stat-conn-icon').css('background', 'var(--color-danger-500)');
            $('#stat-conn-text').text('✗ 已断开').css('color', 'var(--color-danger-500)');
        }
    }

    function _updatePortStatus() {
        if (_portTestInProgress) return;
        _portTestInProgress = true;
        $('#stat-port-text').text('检测中...').removeClass('stat-port-unknown stat-port-closed stat-port-open').addClass('stat-port-unknown');
        TWC.rpc.testPort(function(isOpen, success) {
            _portTestInProgress = false;
            if (success) {
                if (isOpen) {
                    $('#stat-port-text').text('✓ 端口开放').removeClass('stat-port-unknown stat-port-closed').addClass('stat-port-open');
                } else {
                    $('#stat-port-text').text('✗ 端口关闭').removeClass('stat-port-unknown stat-port-open').addClass('stat-port-closed');
                }
            } else {
                $('#stat-port-text').text('? 检测失败').removeClass('stat-port-open stat-port-closed').addClass('stat-port-unknown');
            }
        });
    }

    function _loadUIConfig() {
        _refreshInterval = TWC.utils.storageGet('twc-refresh-interval', 5000);
        _autoRefresh = TWC.utils.storageGet('twc-auto-refresh', true);
        _detailPanelVisible = TWC.utils.storageGet('twc-detail-visible', true);
        _sidebarVisible = TWC.utils.storageGet('twc-sidebar-visible', true);
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
        $overlay.html(html).addClass('visible');

        $overlay.find('#modal-close-btn, .twc-modal-cancel').on('click', function() {
            hideModal();
            if (onClose) onClose();
        });

        $overlay.on('click', function(e) {
            if ($(e.target).is('.twc-modal-overlay')) {
                hideModal();
                if (onClose) onClose();
            }
        });
    }

    function hideModal() {
        $('#modal-overlay').removeClass('visible').html('');
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
