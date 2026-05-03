var TWC = TWC || {};

TWC.mobile = (function() {
    var _refreshTimer = null;
    var _refreshInterval = 5000;
    var _autoRefresh = true;
    var _torrents = {};
    var _filterStatus = 'all';
    var _viewMode = 'list';
    var _detailId = null;
    var _sessionData = {};
    var _sessionStats = {};

    function init() {
        var savedTheme = TWC.utils.storageGet('twc-theme', 'light');
        TWC.theme.applyTheme(savedTheme);

        _renderApp();
        _bindEvents();
        _doRefresh(true);
        _startRefresh();
    }

    function _renderApp() {
        var html = '<div class="m-app">' +
            '<div class="m-header">' +
            '<div class="m-header-left">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' +
            '<span class="m-header-title">Transmission</span>' +
            '</div>' +
            '<div class="m-header-right">' +
            '<button class="m-icon-btn" id="m-btn-theme" title="' + TWC.i18n.t('mobile.theme_toggle') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '</button>' +
            '<button class="m-icon-btn" id="m-btn-settings" title="' + TWC.i18n.t('mobile.settings') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="m-content" id="m-content"></div>' +
            '<div class="m-navbar">' +
            '<div class="m-nav-item active" data-view="list">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' +
            '<span>' + TWC.i18n.t('mobile.torrents') + '</span></div>' +
            '<div class="m-nav-item" data-view="stats">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
            '<span>' + TWC.i18n.t('mobile.stats') + '</span></div>' +
            '<div class="m-nav-item" data-view="speed">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span>' + TWC.i18n.t('mobile.speed') + '</span></div>' +
            '<div class="m-nav-item" data-view="add">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' +
            '<span>' + TWC.i18n.t('mobile.add') + '</span></div>' +
            '</div>' +
            '</div>' +
            '<div class="m-modal-overlay" id="m-modal-overlay"></div>' +
            '<div class="m-toast-container" id="m-toast-container"></div>';

        $('body').html(html);
    }

    function _bindEvents() {
        $(document).on('click', '.m-nav-item', function() {
            _viewMode = $(this).data('view');
            _detailId = null;
            $('.m-nav-item').removeClass('active');
            $(this).addClass('active');
            _renderCurrentView();
        });

        $(document).on('click', '#m-btn-theme', function() { TWC.theme.toggle(); });
        $(document).on('click', '#m-btn-settings', function() { _showSettingsModal(); });
        $(document).on('click', '.m-torrent-item', function(e) {
            if ($(e.target).closest('.m-torrent-action').length) return;
            var id = parseInt($(this).data('id'));
            if (id) _showTorrentDetail(id);
        });
        $(document).on('click', '.m-torrent-action', function(e) {
            e.stopPropagation();
            var id = parseInt($(this).closest('.m-torrent-item').data('id'));
            _doTorrentAction(id, $(this).data('action'));
        });
        $(document).on('click', '.m-filter-chip', function() {
            _filterStatus = $(this).data('status');
            _renderCurrentView();
        });
        $(document).on('click', '.m-detail-back', function() { _detailId = null; _renderCurrentView(); });
        $(document).on('click', '.m-detail-action', function() {
            if (_detailId) _doTorrentAction(_detailId, $(this).data('action'));
        });
        $(document).on('click', '#m-add-submit', function() { _submitAddTorrent(); });
        $(document).on('click', '.m-speed-preset', function() {
            var dl = parseInt($(this).data('dl')) || 0;
            var ul = parseInt($(this).data('ul')) || 0;
            _setSpeedLimit(dl, ul);
        });
    }

    function _renderCurrentView() {
        switch (_viewMode) {
            case 'list': TWC.mobileViews.renderList(_torrents, _filterStatus); break;
            case 'stats': TWC.mobileViews.renderStats(_torrents, _sessionStats, _sessionData); break;
            case 'speed': TWC.mobileViews.renderSpeed(_sessionData); break;
            case 'add': TWC.mobileViews.renderAdd(_sessionData); break;
        }
    }

    function _showTorrentDetail(id) {
        var t = _torrents[id];
        if (!t) return;
        _detailId = id;
        TWC.mobileViews.renderDetail(t);
    }

    function _doTorrentAction(id, action) {
        var ids = [id];
        switch (action) {
            case 'start':
                TWC.rpc.startTorrents(ids, function(s) { _showToast(s ? TWC.i18n.t('mobile.started') : TWC.i18n.t('mobile.op_failed'), s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'stop':
                TWC.rpc.stopTorrents(ids, function(s) { _showToast(s ? TWC.i18n.t('mobile.paused') : TWC.i18n.t('mobile.op_failed'), s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'reannounce':
                TWC.rpc.reannounceTorrents(ids, function(s) { _showToast(s ? TWC.i18n.t('mobile.reannounced') : TWC.i18n.t('mobile.op_failed'), s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'verify':
                TWC.rpc.verifyTorrents(ids, function(s) { _showToast(s ? TWC.i18n.t('mobile.verifying') : TWC.i18n.t('mobile.op_failed'), s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'remove':
                if (confirm(TWC.i18n.t('mobile.confirm_delete'))) {
                    TWC.rpc.removeTorrents(ids, false, function(s) { _showToast(s ? TWC.i18n.t('mobile.deleted') : TWC.i18n.t('mobile.delete_failed'), s ? 'success' : 'error'); _detailId = null; _doRefresh(true); });
                }
                break;
        }
    }

    function _toggleAltSpeed() {
        var current = _sessionData['alt-speed-enabled'] || false;
        TWC.rpc.setSession({ 'alt-speed-enabled': !current }, function(s) {
            if (s) { _showToast(!current ? TWC.i18n.t('mobile.alt_speed_on') : TWC.i18n.t('mobile.alt_speed_off'), 'success'); _doRefresh(true); }
        });
    }

    function _setSpeedLimit(dl, ul) {
        var props = {};
        props['speed-limit-down-enabled'] = dl > 0;
        if (dl > 0) props['speed-limit-down'] = dl;
        props['speed-limit-up-enabled'] = ul > 0;
        if (ul > 0) props['speed-limit-up'] = ul;
        TWC.rpc.setSession(props, function(s) { if (s) { _showToast(TWC.i18n.t('mobile.speed_limit_set'), 'success'); _doRefresh(true); } });
    }

    function _submitAddTorrent() {
        var urls = $('#m-add-url').val().trim();
        var files = $('#m-add-file')[0].files;
        var dir = $('#m-add-dir').val().trim();
        var paused = $('#m-add-paused').is(':checked');
        var peerLimit = $('#m-add-peer-limit').val().trim();
        var priority = parseInt($('#m-add-priority').val(), 10);
        var dlLimit = $('#m-add-dl-limit').val().trim();
        var ulLimit = $('#m-add-ul-limit').val().trim();
        var labelsStr = $('#m-add-labels').val().trim();
        var sequential = $('#m-add-sequential').is(':checked');
        var count = 0;

        var opts = {
            'download-dir': dir || undefined,
            paused: paused,
            bandwidth_priority: priority !== 1 ? priority : undefined,
            sequential_download: sequential ? true : undefined
        };
        if (peerLimit && parseInt(peerLimit, 10) > 0) opts['peer-limit'] = parseInt(peerLimit, 10);
        if (labelsStr) opts.labels = labelsStr.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });

        if (urls) {
            var urlList = urls.split('\n');
            for (var i = 0; i < urlList.length; i++) {
                var url = urlList[i].trim();
                if (!url) continue;
                count++;
                var urlOpts = $.extend({ filename: url }, opts);
                TWC.rpc.addTorrent(urlOpts,
                    function(s, added, dup, err) {
                        _showToast(dup ? TWC.i18n.t('mobile.torrent_exists') : (s ? TWC.i18n.t('mobile.added') : TWC.i18n.t('mobile.add_failed')), dup ? 'warning' : (s ? 'success' : 'error'));
                        if (s && added) {
                            var id = added.id;
                            if (dlLimit) TWC.rpc.setTorrent([id], { download_limit: parseInt(dlLimit, 10), download_limited: true });
                            if (ulLimit) TWC.rpc.setTorrent([id], { upload_limit: parseInt(ulLimit, 10), upload_limited: true });
                        }
                        _doRefresh(true);
                    });
            }
        }
        if (files && files.length > 0) {
            for (var j = 0; j < files.length; j++) {
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var base64 = TWC.utils.arrayBufferToBase64(e.target.result);
                        count++;
                        var fileOpts = $.extend({ metainfo: base64 }, opts);
                        TWC.rpc.addTorrent(fileOpts,
                            function(s, added) {
                                _showToast(s ? TWC.i18n.t('mobile.added') : TWC.i18n.t('mobile.add_failed'), s ? 'success' : 'error');
                                if (s && added) {
                                    var id = added.id;
                                    if (dlLimit) TWC.rpc.setTorrent([id], { download_limit: parseInt(dlLimit, 10), download_limited: true });
                                    if (ulLimit) TWC.rpc.setTorrent([id], { upload_limit: parseInt(ulLimit, 10), upload_limited: true });
                                }
                                _doRefresh(true);
                            });
                    };
                    reader.readAsArrayBuffer(file);
                })(files[j]);
            }
        }
        if (count === 0 && (!files || files.length === 0)) _showToast(TWC.i18n.t('mobile.enter_link_file'), 'warning');
    }

    function _showSettingsModal() {
        var html = '<div class="m-modal">' +
            '<div class="m-modal-header"><h3>' + TWC.i18n.t('mobile.settings') + '</h3><button class="m-modal-close" id="m-modal-close">✕</button></div>' +
            '<div class="m-modal-body">' +
            _attrRow(TWC.i18n.t('mobile.version'), 'Transmission ' + (_sessionData.version || '-')) +
            _attrRow(TWC.i18n.t('mobile.rpc_version'), _sessionData['rpc-version'] || '-') +
            _attrRow(TWC.i18n.t('mobile.default_dir'), _sessionData['download-dir'] || '-') +
            _attrRow(TWC.i18n.t('mobile.peer_port'), _sessionData['peer-port'] || '-') +
            _attrRow(TWC.i18n.t('mobile.dht'), _sessionData['dht-enabled'] ? TWC.i18n.t('mobile.enabled') : TWC.i18n.t('mobile.disabled')) +
            _attrRow(TWC.i18n.t('mobile.pex'), _sessionData['pex-enabled'] ? TWC.i18n.t('mobile.enabled') : TWC.i18n.t('mobile.disabled')) +
            _attrRow(TWC.i18n.t('mobile.port_forwarding'), _sessionData['port-forwarding-enabled'] ? TWC.i18n.t('mobile.enabled') : TWC.i18n.t('mobile.disabled')) +
            '</div></div>';
        $('#m-modal-overlay').html(html).addClass('visible');
        $('#m-modal-close, #m-modal-overlay').on('click', function(e) {
            if ($(e.target).is('#m-modal-close') || $(e.target).is('#m-modal-overlay'))
                $('#m-modal-overlay').removeClass('visible').html('');
        });
    }

    function _attrRow(label, value) {
        return '<div class="m-attr-row"><span class="m-attr-label">' + label + '</span><span class="m-attr-value">' + TWC.utils.escapeHtml(String(value)) + '</span></div>';
    }

    function _showToast(message, type) {
        var $container = $('#m-toast-container');
        var $toast = $('<div class="m-toast ' + (type || 'info') + '">' + TWC.utils.escapeHtml(message) + '</div>');
        $container.append($toast);
        setTimeout(function() { $toast.fadeOut(300, function() { $(this).remove(); }); }, 2500);
    }

    function _startRefresh() {
        _stopRefresh();
        if (_autoRefresh) _refreshTimer = setInterval(function() { _doRefresh(false); }, _refreshInterval);
    }

    function _stopRefresh() {
        if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
    }

    var _mobileRefreshSeq = 0;

    function _doRefresh(forceFull) {
        var seq = ++_mobileRefreshSeq;
        var fields = [
            'id', 'name', 'status', 'total_size', 'percent_done', 'left_until_done',
            'rate_download', 'rate_upload', 'downloaded_ever', 'uploaded_ever', 'upload_ratio',
            'eta', 'peers_connected', 'added_date', 'done_date', 'download_dir', 'labels',
            'error', 'error_string', 'have_valid', 'hash_string', 'tracker_stats',
            'is_stalled', 'is_finished', 'download_limited', 'download_limit',
            'upload_limited', 'upload_limit'
        ];

        if (forceFull) {
            TWC.rpc.getTorrents(null, fields, function(torrents, removed, success) {
                if (seq !== _mobileRefreshSeq) return;
                if (success) {
                    if (torrents) { for (var i = 0; i < torrents.length; i++) _torrents[torrents[i].id] = torrents[i]; }
                    if (removed) { for (var j = 0; j < removed.length; j++) delete _torrents[removed[j]]; }
                    _renderCurrentView();
                }
            });
        } else {
            TWC.rpc.getRecentlyActiveTorrents(fields, function(torrents, removed, success) {
                if (seq !== _mobileRefreshSeq) return;
                if (success) {
                    if (torrents) { for (var i = 0; i < torrents.length; i++) _torrents[torrents[i].id] = torrents[i]; }
                    if (removed) { for (var j = 0; j < removed.length; j++) delete _torrents[removed[j]]; }
                    _renderCurrentView();
                }
            });
        }
        TWC.rpc.getSessionStats(function(data, s) { if (s && seq === _mobileRefreshSeq) _sessionStats = data; });
        TWC.rpc.getSession(null, function(data, s) { if (s && seq === _mobileRefreshSeq) _sessionData = data; });
    }

    return { init: init };
})();
