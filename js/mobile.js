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
            '<button class="m-icon-btn" id="m-btn-theme" title="切换主题">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '</button>' +
            '<button class="m-icon-btn" id="m-btn-settings" title="设置">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="m-content" id="m-content"></div>' +
            '<div class="m-navbar">' +
            '<div class="m-nav-item active" data-view="list">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' +
            '<span>种子</span></div>' +
            '<div class="m-nav-item" data-view="stats">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
            '<span>统计</span></div>' +
            '<div class="m-nav-item" data-view="speed">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span>速度</span></div>' +
            '<div class="m-nav-item" data-view="add">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' +
            '<span>添加</span></div>' +
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
                TWC.rpc.startTorrents(ids, function(s) { _showToast(s ? '已开始' : '操作失败', s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'stop':
                TWC.rpc.stopTorrents(ids, function(s) { _showToast(s ? '已暂停' : '操作失败', s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'reannounce':
                TWC.rpc.reannounceTorrents(ids, function(s) { _showToast(s ? '已重新宣告' : '操作失败', s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'verify':
                TWC.rpc.verifyTorrents(ids, function(s) { _showToast(s ? '已开始校验' : '操作失败', s ? 'success' : 'error'); _doRefresh(true); });
                break;
            case 'remove':
                if (confirm('确定要删除此种子吗？')) {
                    TWC.rpc.removeTorrents(ids, false, function(s) { _showToast(s ? '已删除' : '删除失败', s ? 'success' : 'error'); _detailId = null; _doRefresh(true); });
                }
                break;
        }
    }

    function _toggleAltSpeed() {
        var current = _sessionData['alt-speed-enabled'] || false;
        TWC.rpc.setSession({ 'alt-speed-enabled': !current }, function(s) {
            if (s) { _showToast(!current ? '已启用备用限速' : '已关闭备用限速', 'success'); _doRefresh(true); }
        });
    }

    function _setSpeedLimit(dl, ul) {
        var props = {};
        props['speed-limit-down-enabled'] = dl > 0;
        if (dl > 0) props['speed-limit-down'] = dl;
        props['speed-limit-up-enabled'] = ul > 0;
        if (ul > 0) props['speed-limit-up'] = ul;
        TWC.rpc.setSession(props, function(s) { if (s) { _showToast('限速已设置', 'success'); _doRefresh(true); } });
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
            bandwidthPriority: priority !== 1 ? priority : undefined,
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
                        _showToast(dup ? '种子已存在' : (s ? '已添加' : '添加失败'), dup ? 'warning' : (s ? 'success' : 'error'));
                        if (s && added) {
                            var id = added.id;
                            if (dlLimit) TWC.rpc.setTorrent([id], { 'download-limit': parseInt(dlLimit, 10), 'download-limited': true });
                            if (ulLimit) TWC.rpc.setTorrent([id], { 'upload-limit': parseInt(ulLimit, 10), 'upload-limited': true });
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
                        var base64 = btoa(new Uint8Array(e.target.result).reduce(function(d, b) { return d + String.fromCharCode(b); }, ''));
                        count++;
                        var fileOpts = $.extend({ metainfo: base64 }, opts);
                        TWC.rpc.addTorrent(fileOpts,
                            function(s, added) {
                                _showToast(s ? '已添加' : '添加失败', s ? 'success' : 'error');
                                if (s && added) {
                                    var id = added.id;
                                    if (dlLimit) TWC.rpc.setTorrent([id], { 'download-limit': parseInt(dlLimit, 10), 'download-limited': true });
                                    if (ulLimit) TWC.rpc.setTorrent([id], { 'upload-limit': parseInt(ulLimit, 10), 'upload-limited': true });
                                }
                                _doRefresh(true);
                            });
                    };
                    reader.readAsArrayBuffer(file);
                })(files[j]);
            }
        }
        if (count === 0 && (!files || files.length === 0)) _showToast('请输入种子链接或选择文件', 'warning');
    }

    function _showSettingsModal() {
        var html = '<div class="m-modal">' +
            '<div class="m-modal-header"><h3>设置</h3><button class="m-modal-close" id="m-modal-close">✕</button></div>' +
            '<div class="m-modal-body">' +
            _attrRow('版本', 'Transmission ' + (_sessionData.version || '-')) +
            _attrRow('RPC版本', _sessionData['rpc-version'] || '-') +
            _attrRow('默认下载目录', _sessionData['download-dir'] || '-') +
            _attrRow('监听端口', _sessionData['peer-port'] || '-') +
            _attrRow('DHT', _sessionData['dht-enabled'] ? '启用' : '禁用') +
            _attrRow('PEX', _sessionData['pex-enabled'] ? '启用' : '禁用') +
            _attrRow('端口转发', _sessionData['port-forwarding-enabled'] ? '启用' : '禁用') +
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

    function _doRefresh(forceFull) {
        TWC.rpc.getTorrents(null, [
            'id', 'name', 'status', 'totalSize', 'percentDone', 'leftUntilDone',
            'rateDownload', 'rateUpload', 'downloadedEver', 'uploadedEver', 'uploadRatio',
            'eta', 'peersConnected', 'addedDate', 'doneDate', 'downloadDir', 'labels',
            'error', 'errorString', 'haveValid', 'hashString', 'trackerStats',
            'isStalled', 'isFinished', 'downloadLimited', 'downloadLimit',
            'uploadLimited', 'uploadLimit'
        ], function(torrents, removed, success) {
            if (success) {
                if (torrents) { for (var i = 0; i < torrents.length; i++) _torrents[torrents[i].id] = torrents[i]; }
                if (removed) { for (var j = 0; j < removed.length; j++) delete _torrents[removed[j]]; }
                _renderCurrentView();
            }
        });
        TWC.rpc.getSessionStats(function(data, s) { if (s) _sessionStats = data; });
        TWC.rpc.getSession(null, function(data, s) { if (s) _sessionData = data; });
    }

    return { init: init };
})();
