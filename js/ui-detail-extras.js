var TWC = TWC || {};

TWC.uiDetailExtras = (function() {

    var _peerDataCache = [];

    function renderPeers(t) {
        if (!t.peers || t.peers.length === 0) {
            $('#detail-content').html('<div class="twc-empty">' + TWC.i18n.t('detail.peers.empty') + '</div>');
            return;
        }

        _peerDataCache = t.peers;

        var html = '<table class="twc-peer-table">' +
            '<thead><tr>' +
            '<th style="min-width:80px">' + TWC.i18n.t('detail.peers.country') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.address') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.port') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.client') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.progress') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.rate_to_client') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.rate_to_peer') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.downloaded') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.uploaded') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.protocol') + '</th>' +
            '<th>' + TWC.i18n.t('detail.peers.flags') + '</th>' +
            '<th></th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < t.peers.length; i++) {
            var p = t.peers[i];
            var flags = p.flagStr || p.flag_str || '';
            var countryHtml = _getCountryDisplay(p.address);
            var cName = p.clientName || p.client_name || '';
            var rClient = p.rateToClient !== undefined ? p.rateToClient : (p.rate_to_client || 0);
            var rPeer = p.rateToPeer !== undefined ? p.rateToPeer : (p.rate_to_peer || 0);
            var cChoked = p.clientIsChoked !== undefined ? p.clientIsChoked : p.client_is_choked;
            var bClient = p.bytesToClient !== undefined ? p.bytesToClient : (p.bytes_to_client || 0);
            var bPeer = p.bytesToPeer !== undefined ? p.bytesToPeer : (p.bytes_to_peer || 0);
            var isUtp = p.isUTP !== undefined ? p.isUTP : p.is_utp;
            var protoText = isUtp ? 'uTP' : 'TCP';

            html += '<tr>' +
                '<td>' + countryHtml + '</td>' +
                '<td class="text-mono">' + TWC.utils.escapeHtml(p.address) + '</td>' +
                '<td class="text-mono">' + (p.port || '-') + '</td>' +
                '<td title="' + TWC.utils.escapeHtml(cName) + '">' + TWC.utils.escapeHtml(TWC.utils.truncateText(cName, 20)) + '</td>' +
                '<td>' + _renderPeerProgress(p.progress) + '</td>' +
                '<td class="text-mono">' + (rClient > 0 ? '<span class="text-info">' + TWC.utils.formatSpeed(rClient) + '</span>' : '-') + '</td>' +
                '<td class="text-mono">' + (rPeer > 0 ? '<span class="text-success">' + TWC.utils.formatSpeed(rPeer) + '</span>' : '-') + '</td>' +
                '<td class="text-mono">' + (cChoked ? '-' : TWC.utils.formatBytes(bClient)) + '</td>' +
                '<td class="text-mono">' + TWC.utils.formatBytes(bPeer) + '</td>' +
                '<td>' + protoText + '</td>' +
                '<td><span title="' + _getFlagsTooltip(flags) + '">' + TWC.utils.escapeHtml(flags) + '</span></td>' +
                '<td><button class="twc-peer-detail-btn" data-peer-idx="' + i + '" title="' + TWC.i18n.t('detail.peers.detail_btn') + '">ⓘ</button></td>' +
                '</tr>';
        }

        html += '</tbody></table>';

        if (t.peers_from) {
            html += '<div class="twc-peer-summary">' +
                '<div class="twc-peer-summary-title">' + TWC.i18n.t('detail.peers.source_stats') + '</div>' +
                '<div class="twc-peer-summary-grid">' +
                _peerSourceItem(TWC.i18n.t('detail.peers.source_tracker'), t.peers_from.fromTracker || 0) +
                _peerSourceItem(TWC.i18n.t('dialog.settings.dht'), t.peers_from.fromDht || 0) +
                _peerSourceItem(TWC.i18n.t('dialog.settings.pex'), t.peers_from.fromPex || 0) +
                _peerSourceItem(TWC.i18n.t('detail.peers.getting'), t.peers_from.fromIncoming || 0) +
                _peerSourceItem(TWC.i18n.t('dialog.settings.lpd'), t.peers_from.fromLpd || 0) +
                _peerSourceItem(TWC.i18n.t('detail.peers.source_ltep'), t.peers_from.fromLtep || 0) +
                _peerSourceItem(TWC.i18n.t('detail.peers.source_cache'), t.peers_from.fromCache || 0) +
                '</div></div>';
        }

        html += '<div class="twc-peer-flags-legend">' +
            '<div class="twc-peer-summary-title">' + TWC.i18n.t('detail.peers.flags_legend') + '</div>' +
            '<div class="twc-flags-grid">' +
            _flagItem('D', TWC.i18n.t('detail.peers.flag_D')) +
            _flagItem('d', TWC.i18n.t('detail.peers.flag_d')) +
            _flagItem('U', TWC.i18n.t('detail.peers.flag_U')) +
            _flagItem('u', TWC.i18n.t('detail.peers.flag_u')) +
            _flagItem('K', TWC.i18n.t('detail.peers.flag_K')) +
            _flagItem('?', TWC.i18n.t('detail.peers.flag_?')) +
            _flagItem('E', TWC.i18n.t('detail.peers.flag_E')) +
            _flagItem('H', TWC.i18n.t('detail.peers.flag_H')) +
            _flagItem('X', TWC.i18n.t('detail.peers.flag_X')) +
            _flagItem('I', TWC.i18n.t('detail.peers.flag_I')) +
            _flagItem('T', TWC.i18n.t('detail.peers.flag_T')) +
            _flagItem('L', TWC.i18n.t('detail.peers.flag_L')) +
            _flagItem('S', TWC.i18n.t('detail.peers.flag_S')) +
            '</div></div>';

        $('#detail-content').html(html);

        $(document).off('click.twcPeerDetail').on('click.twcPeerDetail', '.twc-peer-detail-btn', function() {
            var idx = parseInt($(this).attr('data-peer-idx'));
            if (idx >= 0 && idx < _peerDataCache.length) {
                _showPeerDetail(_peerDataCache[idx]);
            }
        });
    }

    function _showPeerDetail(p) {
        var existing = document.getElementById('twc-peer-detail-overlay');
        if (existing) existing.remove();

        var isEnc = p.isEncrypted !== undefined ? p.isEncrypted : p.is_encrypted;
        var isUtp = p.isUTP !== undefined ? p.isUTP : p.is_utp;
        var isIncoming = p.isIncoming !== undefined ? p.isIncoming : p.is_incoming;
        var isDownloading = p.isDownloadingFrom !== undefined ? p.isDownloadingFrom : p.is_downloading_from;
        var isUploading = p.isUploadingTo !== undefined ? p.isUploadingTo : p.is_uploading_to;
        var clientChoked = p.clientIsChoked !== undefined ? p.clientIsChoked : p.client_is_choked;
        var clientInterested = p.clientIsInterested !== undefined ? p.clientIsInterested : p.client_is_interested;
        var peerChoked = p.peerIsChoked !== undefined ? p.peerIsChoked : p.peer_is_choked;
        var peerInterested = p.peerIsInterested !== undefined ? p.peerIsInterested : p.peer_is_interested;
        var rClient = p.rateToClient !== undefined ? p.rateToClient : (p.rate_to_client || 0);
        var rPeer = p.rateToPeer !== undefined ? p.rateToPeer : (p.rate_to_peer || 0);
        var bClient = p.bytesToClient !== undefined ? p.bytesToClient : (p.bytes_to_client || 0);
        var bPeer = p.bytesToPeer !== undefined ? p.bytesToPeer : (p.bytes_to_peer || 0);
        var cName = p.clientName || p.client_name || '-';
        var flags = p.flagStr || p.flag_str || '-';
        var countryHtml = _getCountryDisplay(p.address);

        function boolTag(val) {
            return val ? '<span class="twc-peer-tag twc-peer-tag-yes">' + TWC.i18n.t('common.yes') + '</span>' :
                         '<span class="twc-peer-tag twc-peer-tag-no">' + TWC.i18n.t('common.no') + '</span>';
        }

        var html = '<div class="twc-peer-detail-overlay" id="twc-peer-detail-overlay">' +
            '<div class="twc-peer-detail-glass">' +
            '<div class="twc-peer-detail-header">' +
            '<div class="twc-peer-detail-title">' + countryHtml + ' <span class="text-mono">' + TWC.utils.escapeHtml(p.address) + '</span></div>' +
            '<button class="twc-peer-detail-close" id="twc-peer-detail-close">&times;</button>' +
            '</div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.peers.detail_connection') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            _detailRow(TWC.i18n.t('detail.peers.port'), '<span class="text-mono">' + (p.port || '-') + '</span>') +
            _detailRow(TWC.i18n.t('detail.peers.protocol'), isUtp ? 'uTP' : 'TCP') +
            _detailRow(TWC.i18n.t('detail.peers.encryption'), boolTag(isEnc)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_incoming'), boolTag(isIncoming)) +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.peers.detail_transfer') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            _detailRow(TWC.i18n.t('detail.peers.progress'), _renderPeerProgress(p.progress)) +
            _detailRow(TWC.i18n.t('detail.peers.rate_to_client'), rClient > 0 ? '<span class="text-info">' + TWC.utils.formatSpeed(rClient) + '</span>' : '-') +
            _detailRow(TWC.i18n.t('detail.peers.rate_to_peer'), rPeer > 0 ? '<span class="text-success">' + TWC.utils.formatSpeed(rPeer) + '</span>' : '-') +
            _detailRow(TWC.i18n.t('detail.peers.downloaded'), TWC.utils.formatBytes(bClient)) +
            _detailRow(TWC.i18n.t('detail.peers.uploaded'), TWC.utils.formatBytes(bPeer)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_downloading'), boolTag(isDownloading)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_uploading'), boolTag(isUploading)) +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.peers.detail_choking') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            _detailRow(TWC.i18n.t('detail.peers.detail_client_choked'), boolTag(clientChoked)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_client_interested'), boolTag(clientInterested)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_peer_choked'), boolTag(peerChoked)) +
            _detailRow(TWC.i18n.t('detail.peers.detail_peer_interested'), boolTag(peerInterested)) +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.peers.detail_client') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            _detailRow(TWC.i18n.t('detail.peers.client'), TWC.utils.escapeHtml(cName)) +
            _detailRow(TWC.i18n.t('detail.peers.flags'), '<span title="' + _getFlagsTooltip(flags) + '">' + TWC.utils.escapeHtml(flags) + '</span>') +
            _detailRow('Peer ID', '<span class="text-mono" style="font-size:10px;word-break:break-all">' + TWC.utils.escapeHtml(p.peer_id || '-') + '</span>') +
            '</div></div>' +

            '</div></div>';

        $('body').append(html);

        requestAnimationFrame(function() {
            var overlay = document.getElementById('twc-peer-detail-overlay');
            if (overlay) overlay.classList.add('twc-peer-detail-visible');
        });

        $(document).on('click.twcPeerDetailClose', '#twc-peer-detail-close, #twc-peer-detail-overlay', function(e) {
            if (e.target.id === 'twc-peer-detail-overlay' || e.target.id === 'twc-peer-detail-close') {
                _closePeerDetail();
            }
        });

        $(document).on('keydown.twcPeerDetail', function(e) {
            if (e.key === 'Escape') _closePeerDetail();
        });
    }

    function _closePeerDetail() {
        var overlay = document.getElementById('twc-peer-detail-overlay');
        if (overlay) {
            overlay.classList.remove('twc-peer-detail-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        }
        $(document).off('click.twcPeerDetailClose keydown.twcPeerDetail');
    }

    function _detailRow(label, value) {
        return '<div class="twc-peer-detail-row"><span class="twc-peer-detail-label">' + label + '</span><span class="twc-peer-detail-value">' + value + '</span></div>';
    }

    function _getCountryDisplay(ip) {
        if (TWC.geoip.is_privateIP(ip)) {
            return '<span class="twc-country-lan" title="' + TWC.i18n.t('peer.lan') + '">LAN</span>';
        }

        if (TWC.geoip.isLoaded()) {
            var info = TWC.geoip.getCountryInfo(ip);
            if (info && info.code) {
                var title = info.name ? info.name + ' (' + info.code + ')' : info.code;
                var nameText = info.name ? info.name : info.code.toUpperCase();
                return '<span class="twc-country-flag-wrap" title="' + TWC.utils.escapeHtml(title) + '">' +
                    TWC.geoip.getCountryFlagHtml(info.code) +
                    '<span style="margin-left:3px;font-size:11px">' + TWC.utils.escapeHtml(nameText) + '</span>' +
                    '</span>';
            }
        }

        return '<span class="twc-country-unknown" title="' + TWC.i18n.t('times.unknown') + '">-</span>';
    }

    function _getSourceText(p) {
        var parts = [];
        if (p.is_incoming !== undefined ? p.is_incoming : p.isIncoming) parts.push(TWC.i18n.t('detail.peers.getting'));
        if (p.is_utp !== undefined ? p.is_utp : p.isUTP) parts.push(TWC.i18n.t('dialog.settings.utp'));
        if (p.is_encrypted !== undefined ? p.is_encrypted : p.isEncrypted) parts.push(TWC.i18n.t('detail.peers.encryption'));
        if (p.is_uploading_to !== undefined ? p.is_uploading_to : p.isUploading) parts.push(TWC.i18n.t('sidebar.status_seeding'));
        if (p.is_downloading_from !== undefined ? p.is_downloading_from : p.isDownloading) parts.push(TWC.i18n.t('sidebar.status_downloading'));
        return parts.length > 0 ? parts.join('/') : '-';
    }

    function _renderPeerProgress(progress) {
        var pct = (progress || 0) * 100;
        var pctStr = pct.toFixed(1);
        var colorClass = 'bg-blue-500';
        if (pct >= 100) colorClass = 'bg-green-500';
        else if (pct >= 50) colorClass = 'bg-blue-500';
        else colorClass = 'bg-yellow-500';

        return '<div class="twc-progress-bar" style="height:12px;min-width:60px">' +
            '<div class="twc-progress-fill ' + colorClass + '" style="width:' + pctStr + '%"></div>' +
            '<span class="twc-progress-text" style="font-size:9px">' + pctStr + '%</span>' +
            '</div>';
    }

    function _peerSourceItem(label, count) {
        return '<div class="twc-peer-source-item">' +
            '<span class="twc-peer-source-label">' + label + '</span>' +
            '<span class="twc-peer-source-count">' + count + '</span>' +
            '</div>';
    }

    function _flagItem(code, desc) {
        return '<div class="twc-flag-item"><span class="twc-flag-code">' + code + '</span><span class="twc-flag-desc">' + desc + '</span></div>';
    }

    function _getFlagsTooltip(flags) {
        var tips = [];
        for (var i = 0; i < flags.length; i++) {
            var c = flags[i];
            var mapped = TWC.i18n.t('peer_flags.' + c);
            if (mapped === 'peer_flags.' + c) { // If missing translation, use Unknown
                mapped = TWC.i18n.t('peer.unknown_country');
            }
            tips.push(c + ': ' + mapped);
        }
        return tips.join('\n');
    }

    function renderSpeed(t) {
        var history = TWC.ui.getSpeedHistory();
        var $content = $('#detail-content');

        var html = '<div style="display:flex;gap:16px;height:100%">' +
            '<div style="flex:1;position:relative">' +
            '<canvas id="speed-chart-canvas" class="twc-speed-chart"></canvas>' +
            '</div>' +
            '<div style="width:200px;flex-shrink:0">' +
            '<div class="twc-stat-grid" style="grid-template-columns:1fr">' +
            _statCard(TWC.i18n.t('detail.speed.current_download'), TWC.utils.formatSpeed(t.rate_download), 'text-info') +
            _statCard(TWC.i18n.t('detail.speed.current_upload'), TWC.utils.formatSpeed(t.rate_upload), 'text-success') +
            _statCard(TWC.i18n.t('detail.speed.total_download'), TWC.utils.formatBytes(t.downloaded_ever), '') +
            _statCard(TWC.i18n.t('detail.speed.total_upload'), TWC.utils.formatBytes(t.uploaded_ever), '') +
            _statCard(TWC.i18n.t('detail.speed.ratio'), '<span class="' + TWC.utils.getRatioClass(t.upload_ratio) + '">' + TWC.utils.formatRatio(t.upload_ratio) + '</span>', '') +
            _statCard(TWC.i18n.t('detail.speed.download_time'), TWC.utils.formatDuration(t.seconds_downloading), '') +
            _statCard(TWC.i18n.t('detail.speed.seed_time'), TWC.utils.formatDuration(t.seconds_seeding), '') +
            '</div>' +
            '</div>' +
            '</div>';

        $content.html(html);
        _drawSpeedChart(history);
    }

    function _statCard(label, value, cls) {
        return '<div class="twc-stat-card">' +
            '<div class="stat-label">' + label + '</div>' +
            '<div class="stat-value ' + cls + '" style="font-size:14px">' + value + '</div>' +
            '</div>';
    }

    function renderSettings(t) {
        var html = '<div class="twc-config-grid">' +
            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.download_limit') + '</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="ts-dl-limited"' + (t.download_limited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="ts-dl-limit" value="' + (t.download_limit || 0) + '" style="width:80px" min="0" /> KB/s' +
            '</div>' +
            '</div>' +
 
            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.upload_limit') + '</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="ts-ul-limited"' + (t.upload_limited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="ts-ul-limit" value="' + (t.upload_limit || 0) + '" style="width:80px" min="0" /> KB/s' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.priority') + '</label>' +
            '<select class="twc-select" id="ts-priority">' +
            '<option value="-1"' + (t.bandwidth_priority === -1 ? ' selected' : '') + '>' + TWC.i18n.t('detail.settings.priority_low') + '</option>' +
            '<option value="0"' + (t.bandwidth_priority === 0 ? ' selected' : '') + '>' + TWC.i18n.t('detail.settings.priority_normal') + '</option>' +
            '<option value="1"' + (t.bandwidth_priority === 1 ? ' selected' : '') + '>' + TWC.i18n.t('detail.settings.priority_high') + '</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('dialog.add.peer_limit') + '</label>' +
            '<input type="number" class="twc-input" id="ts-peer-limit" value="' + (t.max_connected_peers || 50) + '" min="1" />' +
            '</div>' +
 
            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.seed_ratio') + ' ' + TWC.i18n.t('dialog.label.source_custom').split('+')[0] + '</label>' +
            '<select class="twc-select" id="ts-ratio-mode">' +
            '<option value="0"' + (t.seed_ratio_mode === 0 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.add.default') + '</option>' +
            '<option value="1"' + (t.seed_ratio_mode === 1 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.label.source_custom') + '</option>' +
            '<option value="2"' + (t.seed_ratio_mode === 2 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.add.unlimited') + '</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.seed_ratio') + '</label>' +
            '<input type="number" class="twc-input" id="ts-ratio-limit" value="' + (t.seed_ratio_limit || 2.0) + '" step="0.1" min="0" />' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.seed_idle') + ' ' + TWC.i18n.t('dialog.label.source_custom').split('+')[0] + '</label>' +
            '<select class="twc-select" id="ts-idle-mode">' +
            '<option value="0"' + (t.seed_idle_mode === 0 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.add.default') + '</option>' +
            '<option value="1"' + (t.seed_idle_mode === 1 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.label.source_custom') + '</option>' +
            '<option value="2"' + (t.seed_idle_mode === 2 ? ' selected' : '') + '>' + TWC.i18n.t('dialog.add.unlimited') + '</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('detail.settings.seed_idle') + ' (' + TWC.i18n.t('times.min') + ')</label>' +
            '<input type="number" class="twc-input" id="ts-idle-limit" value="' + (t.seed_idle_limit || 30) + '" min="0" />' +
            '</div>' +
 
            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('dialog.add.group') + '</label>' +
            '<select class="twc-select" id="ts-group"><option value="">' + TWC.i18n.t('dialog.add.group_default') + '</option>';

        var groups = TWC.config.getGroups() || [];
        for (var gi = 0; gi < groups.length; gi++) {
            html += '<option value="' + TWC.utils.escapeAttr(groups[gi].name) + '"' + (t.group === groups[gi].name ? ' selected' : '') + '>' + TWC.utils.escapeHtml(groups[gi].name) + '</option>';
        }
        html += '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('toolbar.auto_refresh') + '</label>' +
            '<div class="twc-toggle' + (t.honors_session_limits ? ' active' : '') + '" id="ts-honors-limits">' +
            '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group full-width">' +
            '<label>' + TWC.i18n.t('detail.general.download_dir') + '</label>' +
            '<div style="display:flex;gap:4px">' +
            '<input type="text" class="twc-input" id="ts-download-dir" value="' + TWC.utils.escapeHtml(t.download_dir || '') + '" />' +
            '<button class="twc-btn primary" id="ts-change-dir-btn" style="white-space:nowrap">' + TWC.i18n.t('detail.settings.move') + '</button>' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group full-width" style="margin-top:8px">' +
            '<button class="twc-btn primary" id="ts-save-btn">' + TWC.i18n.t('detail.settings.save') + '</button>' +
            '</div>' +
            '</div>';

        $('#detail-content').html(html);

        $('#ts-save-btn').on('click', function() {
            var torrentIds = TWC.torrent.getSelectedIds();
            var props = {
                download_limited: $('#ts-dl-limited').is(':checked'),
                download_limit: parseInt($('#ts-dl-limit').val()) || 0,
                upload_limited: $('#ts-ul-limited').is(':checked'),
                upload_limit: parseInt($('#ts-ul-limit').val()) || 0,
                bandwidth_priority: parseInt($('#ts-priority').val()),
                peerLimit: parseInt($('#ts-peer-limit').val()) || 50,
                seed_ratio_mode: parseInt($('#ts-ratio-mode').val()),
                seed_ratio_limit: parseFloat($('#ts-ratio-limit').val()) || 2.0,
                seed_idle_mode: parseInt($('#ts-idle-mode').val()),
                seed_idle_limit: parseInt($('#ts-idle-limit').val()) || 30,
                honors_session_limits: $('#ts-honors-limits').hasClass('active')
            };

            var selectedGroup = $('#ts-group').val() || '';
            if (selectedGroup) {
                props.group = selectedGroup;
            }

            TWC.rpc.setTorrent(torrentIds, props, function(success) {
                if (success) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_success'), 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_failed'), 'error');
                }
            });
        });

        $('#ts-change-dir-btn').on('click', function() {
            var torrentIds = TWC.torrent.getSelectedIds();
            var newDir = $('#ts-download-dir').val();
            TWC.rpc.setTorrentLocation(torrentIds, newDir, true, function(success) {
                if (success) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.change_dir.success') + ': ' + newDir, 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast(TWC.i18n.t('dialog.change_dir.failed'), 'error');
                }
            });
        });

        $('#ts-honors-limits').on('click', function() {
            $(this).toggleClass('active');
        });
    }

    function _drawSpeedChart(history) {
        var canvas = document.getElementById('speed-chart-canvas');
        if (!canvas) return;

        var container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight || 200;

        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var padding = { top: 10, right: 10, bottom: 20, left: 50 };
        var chartW = w - padding.left - padding.right;
        var chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        var isDark = TWC.theme.isDark();
        var textColor = isDark ? '#a0a0b8' : '#6b7280';
        var gridColor = isDark ? '#353550' : '#e5e7eb';
        var downloadColor = isDark ? '#5b8def' : '#3b82f6';
        var uploadColor = isDark ? '#4ade80' : '#22c55e';

        var dlData = history.download;
        var ulData = history.upload;
        if (dlData.length < 2) return;

        var maxVal = 0;
        for (var i = 0; i < dlData.length; i++) {
            if (dlData[i] > maxVal) maxVal = dlData[i];
            if (ulData[i] > maxVal) maxVal = ulData[i];
        }
        maxVal = Math.max(maxVal, 1024);
        maxVal = Math.ceil(maxVal / 1024) * 1024;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        for (var g = 0; g <= 4; g++) {
            var gy = padding.top + chartH * (1 - g / 4);
            ctx.beginPath();
            ctx.moveTo(padding.left, gy);
            ctx.lineTo(w - padding.right, gy);
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(TWC.utils.formatSpeed(maxVal * g / 4), padding.left - 4, gy + 3);
        }

        _drawLine(ctx, dlData, maxVal, downloadColor, padding, chartW, chartH);
        _drawLine(ctx, ulData, maxVal, uploadColor, padding, chartW, chartH);

        ctx.fillStyle = downloadColor;
        ctx.fillRect(padding.left, h - 12, 10, 3);
        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(TWC.i18n.t('detail.speed.download'), padding.left + 14, h - 8);

        ctx.fillStyle = uploadColor;
        ctx.fillRect(padding.left + 50, h - 12, 10, 3);
        ctx.fillStyle = textColor;
        ctx.fillText(TWC.i18n.t('detail.speed.upload'), padding.left + 64, h - 8);
    }

    function _drawLine(ctx, data, maxVal, color, padding, chartW, chartH) {
        if (data.length < 2) return;
        var step = chartW / (data.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        for (var i = 0; i < data.length; i++) {
            var x = padding.left + i * step;
            var y = padding.top + chartH * (1 - data[i] / maxVal);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = color + '1a';
        ctx.moveTo(padding.left, padding.top + chartH);
        for (var j = 0; j < data.length; j++) {
            var x2 = padding.left + j * step;
            var y2 = padding.top + chartH * (1 - data[j] / maxVal);
            ctx.lineTo(x2, y2);
        }
        ctx.lineTo(padding.left + (data.length - 1) * step, padding.top + chartH);
        ctx.closePath();
        ctx.fill();
    }

    return {
        renderPeers: renderPeers,
        renderSpeed: renderSpeed,
        renderSettings: renderSettings
    };
})();
