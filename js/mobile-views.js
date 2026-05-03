var TWC = TWC || {};

TWC.mobileViews = (function() {

    function renderList(torrents, filterStatus) {
        var filtered = _getFiltered(torrents, filterStatus);
        var counts = _getCounts(torrents);

        var html = '<div class="m-filter-bar">';
        var filters = [
            { status: 'all', label: TWC.i18n.t('filter.all'), count: counts.all },
            { status: 'downloading', label: TWC.i18n.t('sidebar.status_downloading'), count: counts.downloading },
            { status: 'seeding', label: TWC.i18n.t('sidebar.status_seeding'), count: counts.seeding },
            { status: 'stopped', label: TWC.i18n.t('sidebar.status_stopped'), count: counts.stopped },
            { status: 'active', label: TWC.i18n.t('filter.active'), count: counts.active },
            { status: 'error', label: TWC.i18n.t('filter.error'), count: counts.error }
        ];
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            html += '<div class="m-filter-chip' + (filterStatus === f.status ? ' active' : '') + '" data-status="' + f.status + '">' +
                f.label + ' <span class="m-filter-count">' + f.count + '</span></div>';
        }
        html += '</div>';

        html += '<div class="m-torrent-list">';
        if (filtered.length === 0) {
            html += '<div class="m-empty">' + TWC.i18n.t('status.no_torrents') + '</div>';
        } else {
            for (var j = 0; j < filtered.length; j++) html += _renderItem(filtered[j]);
        }
        html += '</div>';

        html += _renderSpeedBar(torrents);
        $('#m-content').html(html);
    }

    function renderDetail(t) {
        var pct = ((t.percent_done || 0) * 100).toFixed(1);
        var statusText = TWC.utils.getStatusText(t.status);

        var html = '<div class="m-detail">' +
            '<div class="m-detail-header">' +
            '<button class="m-detail-back">← ' + TWC.i18n.t('dialog.tracker.btn_cancel') + '</button><span>' + TWC.i18n.t('detail.title') + '</span>' +
            '</div>' +
            '<div class="m-detail-body">' +
            '<div class="m-detail-name">' + TWC.utils.escapeHtml(t.name) + '</div>' +
            '<div class="m-detail-progress">' +
            '<div class="m-progress-bar" style="height:20px">' +
            '<div class="m-progress-fill m-progress-downloading" style="width:' + pct + '%"></div>' +
            '<span class="m-progress-label">' + pct + '%</span></div></div>' +
            '<div class="m-detail-actions">' +
            (t.status === 0 ? '<button class="m-detail-action" data-action="start">▶ ' + TWC.i18n.t('toolbar.start') + '</button>' :
                '<button class="m-detail-action" data-action="stop">⏸ ' + TWC.i18n.t('toolbar.pause') + '</button>') +
            '<button class="m-detail-action" data-action="reannounce">🔄 ' + TWC.i18n.t('toolbar.reannounce') + '</button>' +
            '<button class="m-detail-action" data-action="verify">✓ ' + TWC.i18n.t('toolbar.verify') + '</button>' +
            '<button class="m-detail-action danger" data-action="remove">✕ ' + TWC.i18n.t('toolbar.remove') + '</button>' +
            '</div>' +
            '<div class="m-detail-attrs">' +
            _attrRow(TWC.i18n.t('columns.status'), statusText) +
            _attrRow(TWC.i18n.t('columns.size'), TWC.utils.formatBytes(t.total_size)) +
            _attrRow(TWC.i18n.t('columns.downloaded'), TWC.utils.formatBytes(t.have_valid)) +
            _attrRow(TWC.i18n.t('detail.general.left'), TWC.utils.formatBytes(t.left_until_done)) +
            _attrRow(TWC.i18n.t('columns.rate_download'), TWC.utils.formatSpeed(t.rate_download)) +
            _attrRow(TWC.i18n.t('columns.rate_upload'), TWC.utils.formatSpeed(t.rate_upload)) +
            _attrRow(TWC.i18n.t('detail.speed.total_download'), TWC.utils.formatBytes(t.downloaded_ever)) +
            _attrRow(TWC.i18n.t('detail.speed.total_upload'), TWC.utils.formatBytes(t.uploaded_ever)) +
            _attrRow(TWC.i18n.t('columns.ratio'), TWC.utils.formatRatio(t.upload_ratio)) +
            _attrRow(TWC.i18n.t('columns.seeders'), _getSeederCount(t)) +
            _attrRow(TWC.i18n.t('columns.leechers'), _getLeecherCount(t)) +
            _attrRow(TWC.i18n.t('columns.peers'), t.peers_connected) +
            _attrRow(TWC.i18n.t('columns.eta'), TWC.utils.formatETA(t.eta)) +
            _attrRow(TWC.i18n.t('columns.added_date'), TWC.utils.formatTimestamp(t.added_date)) +
            _attrRow(TWC.i18n.t('columns.download_dir'), t.download_dir || '-') +
            _attrRow(TWC.i18n.t('columns.labels'), t.labels ? t.labels.join(', ') : '-') +
            (t.error !== 0 ? _attrRow(TWC.i18n.t('sidebar.status_error'), t.error_string) : '') +
            '</div></div></div>';

        $('#m-content').html(html);
    }

    function renderStats(torrents, sessionStats, sessionData) {
        var counts = _getCounts(torrents);
        var globalStats = _getGlobalStats(torrents);
        var cumulative = sessionStats['cumulative-stats'] || {};
        var current = sessionStats['current-stats'] || {};
        var altSpeedEnabled = sessionData['alt-speed-enabled'] || false;

        var html = '<div class="m-stats">' +
            '<div class="m-stats-section"><div class="m-stats-title">' + TWC.i18n.t('system.global_stats') + '</div>' +
            '<div class="m-stats-row">' +
            '<div class="m-stat-card"><div class="m-stat-label">' + TWC.i18n.t('columns.rate_download') + '</div><div class="m-stat-value m-stat-dl">' + TWC.utils.formatSpeed(globalStats.downloadSpeed) + '</div></div>' +
            '<div class="m-stat-card"><div class="m-stat-label">' + TWC.i18n.t('columns.rate_upload') + '</div><div class="m-stat-value m-stat-ul">' + TWC.utils.formatSpeed(globalStats.uploadSpeed) + '</div></div>' +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">' + TWC.i18n.t('system.cumulative_stats') + '</div>' +
            '<div class="m-stats-row">' +
            '<div class="m-stat-card"><div class="m-stat-label">' + TWC.i18n.t('columns.downloaded') + '</div><div class="m-stat-value">' + TWC.utils.formatBytes(cumulative.downloadedBytes || 0) + '</div></div>' +
            '<div class="m-stat-card"><div class="m-stat-label">' + TWC.i18n.t('columns.uploaded') + '</div><div class="m-stat-value">' + TWC.utils.formatBytes(cumulative.uploadedBytes || 0) + '</div></div>' +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">' + TWC.i18n.t('sidebar.status_all') + '</div>' +
            '<div class="m-stats-grid">' +
            _miniStat(TWC.i18n.t('filter.all'), counts.all) + _miniStat(TWC.i18n.t('sidebar.status_downloading'), counts.downloading) +
            _miniStat(TWC.i18n.t('sidebar.status_seeding'), counts.seeding) + _miniStat(TWC.i18n.t('sidebar.status_stopped'), counts.stopped) +
            _miniStat(TWC.i18n.t('sidebar.status_checking'), counts.checking) + _miniStat(TWC.i18n.t('filter.error'), counts.error) +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">' + TWC.i18n.t('system.sys_info') + '</div>' +
            _attrRow(TWC.i18n.t('mobile.version'), 'Transmission ' + (sessionData.version || '-')) +
            _attrRow(TWC.i18n.t('dialog.speed.alt_speed'), altSpeedEnabled ? TWC.i18n.t('mobile.enabled') : TWC.i18n.t('mobile.disabled')) +
            '</div>' +
            '<div class="m-stats-section">' +
            '<button class="m-btn' + (altSpeedEnabled ? ' active' : '') + '" id="m-alt-speed-toggle">' +
            (altSpeedEnabled ? TWC.i18n.t('mobile.alt_speed_off') : TWC.i18n.t('mobile.alt_speed_on')) + '</button></div></div>';

        $('#m-content').html(html);
    }

    function renderSpeed(sessionData) {
        var dlEnabled = sessionData['speed-limit-down-enabled'] || false;
        var dlLimit = sessionData['speed-limit-down'] || 0;
        var ulEnabled = sessionData['speed-limit-up-enabled'] || false;
        var ulLimit = sessionData['speed-limit-up'] || 0;
        var altEnabled = sessionData['alt-speed-enabled'] || false;
        var altDl = sessionData['alt-speed-down'] || 0;
        var altUl = sessionData['alt-speed-up'] || 0;

        var html = '<div class="m-speed-page">' +
            '<div class="m-speed-section"><div class="m-speed-title">' + TWC.i18n.t('dialog.speed.global_limits') + '</div>' +
            '<div class="m-speed-form">' +
            '<div class="m-speed-row"><label>' + TWC.i18n.t('dialog.add.dl_limit') + '</label><div class="m-speed-input-group">' +
            '<input type="checkbox" id="m-dl-enabled"' + (dlEnabled ? ' checked' : '') + ' />' +
            '<input type="number" id="m-dl-limit" value="' + dlLimit + '" min="0" /> KB/s</div></div>' +
            '<div class="m-speed-row"><label>' + TWC.i18n.t('dialog.add.ul_limit') + '</label><div class="m-speed-input-group">' +
            '<input type="checkbox" id="m-ul-enabled"' + (ulEnabled ? ' checked' : '') + ' />' +
            '<input type="number" id="m-ul-limit" value="' + ulLimit + '" min="0" /> KB/s</div></div>' +
            '<button class="m-btn primary" id="m-save-speed">' + TWC.i18n.t('dialog.settings.save') + '</button>' +
            '</div></div>' +
            '<div class="m-speed-section"><div class="m-speed-title">' + TWC.i18n.t('dialog.speed.alt_speed') + '</div>' +
            '<div class="m-speed-row"><label>' + TWC.i18n.t('mobile.enabled') + '</label>' +
            '<button class="m-btn' + (altEnabled ? ' active' : '') + '" id="m-alt-speed-toggle2">' + (altEnabled ? TWC.i18n.t('mobile.enabled') : TWC.i18n.t('mobile.disabled')) + '</button></div>' +
            '<div class="m-speed-row"><label>' + TWC.i18n.t('dialog.add.dl_limit') + '</label><span class="m-speed-val-sm">' + altDl + ' KB/s</span></div>' +
            '<div class="m-speed-row"><label>' + TWC.i18n.t('dialog.add.ul_limit') + '</label><span class="m-speed-val-sm">' + altUl + ' KB/s</span></div>' +
            '</div></div>';

        $('#m-content').html(html);

        $('#m-save-speed').on('click', function() {
            TWC.rpc.setSession({
                'speed-limit-down-enabled': $('#m-dl-enabled').is(':checked'),
                'speed-limit-down': parseInt($('#m-dl-limit').val()) || 0,
                'speed-limit-up-enabled': $('#m-ul-enabled').is(':checked'),
                'speed-limit-up': parseInt($('#m-ul-limit').val()) || 0
            }, function(s) {
                if (s) { _showToast('限速设置已保存', 'success'); } else { _showToast('保存失败', 'error'); }
            });
        });
    }

    function renderAdd(sessionData) {
        var download_dir = sessionData['download-dir'] || '';
        var peerLimit = sessionData['peer-limit-per-torrent'] || '';
        var html = '<div class="m-add-page">' +
            '<div class="m-add-section"><label>' + TWC.i18n.t('dialog.add.urls') + '</label>' +
            '<textarea id="m-add-url" rows="3" placeholder="' + TWC.i18n.t('mobile.enter_link_file') + '"></textarea></div>' +
            '<div class="m-add-section"><label>' + TWC.i18n.t('mobile.select_file') + '</label><input type="file" id="m-add-file" accept=".torrent" multiple /></div>' +
            '<div class="m-add-section"><label>' + TWC.i18n.t('columns.download_dir') + '</label><input type="text" id="m-add-dir" value="' + TWC.utils.escapeHtml(download_dir) + '" placeholder="' + TWC.i18n.t('mobile.empty_default') + '" /></div>' +
            '<div class="m-add-row"><div class="m-add-half"><label>' + TWC.i18n.t('mobile.max_peers') + '</label>' +
            '<input type="number" id="m-add-peer-limit" min="0" placeholder="' + TWC.i18n.t('mobile.default') + '" value="' + peerLimit + '" /></div>' +
            '<div class="m-add-half"><label>' + TWC.i18n.t('mobile.priority') + '</label>' +
            '<select id="m-add-priority"><option value="0">' + TWC.i18n.t('mobile.low') + '</option><option value="1" selected>' + TWC.i18n.t('mobile.normal') + '</option><option value="2">' + TWC.i18n.t('mobile.high') + '</option></select></div></div>' +
            '<div class="m-add-row"><div class="m-add-half"><label>' + TWC.i18n.t('mobile.dl_limit') + '</label>' +
            '<input type="number" id="m-add-dl-limit" min="0" placeholder="' + TWC.i18n.t('mobile.unlimited') + '" /></div>' +
            '<div class="m-add-half"><label>' + TWC.i18n.t('mobile.ul_limit') + '</label>' +
            '<input type="number" id="m-add-ul-limit" min="0" placeholder="' + TWC.i18n.t('mobile.unlimited') + '" /></div></div>' +
            '<div class="m-add-section"><label>' + TWC.i18n.t('columns.labels') + ' <span style="font-weight:normal;color:var(--text-muted);font-size:12px">' + TWC.i18n.t('mobile.tags_hint') + '</span></label>' +
            '<input type="text" id="m-add-labels" placeholder="' + TWC.i18n.t('mobile.tags_placeholder') + '" /></div>' +
            '<div class="m-add-section" style="display:flex;gap:16px;flex-wrap:wrap">' +
            '<label class="m-checkbox-label"><input type="checkbox" id="m-add-paused" /> ' + TWC.i18n.t('mobile.pause_start') + '</label>' +
            '<label class="m-checkbox-label"><input type="checkbox" id="m-add-sequential" /> ' + TWC.i18n.t('mobile.sequential') + '</label></div>' +
            '<button class="m-btn primary" id="m-add-submit" style="width:100%;margin-top:16px">' + TWC.i18n.t('mobile.add_torrent') + '</button></div>';
        $('#m-content').html(html);
    }

    function _renderItem(t) {
        var pct = ((t.percent_done || 0) * 100).toFixed(1);
        var statusText = TWC.utils.getStatusText(t.status);
        var progressColor = '';
        if (t.status === 0) progressColor = 'm-progress-stopped';
        else if (t.status === 4 || t.status === 3) progressColor = 'm-progress-downloading';
        else if (t.status === 6 || t.status === 5) progressColor = 'm-progress-seeding';
        else progressColor = 'm-progress-checking';

        var actionIcon = t.status === 0 ?
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        var actionLabel = t.status === 0 ? 'start' : 'stop';

        return '<div class="m-torrent-item" data-id="' + t.id + '">' +
            '<div class="m-torrent-header">' +
            '<div class="m-torrent-name">' + TWC.utils.escapeHtml(t.name) + '</div>' +
            '<div class="m-torrent-action" data-action="' + actionLabel + '">' + actionIcon + '</div></div>' +
            '<div class="m-torrent-progress">' +
            '<div class="m-progress-bar"><div class="m-progress-fill ' + progressColor + '" style="width:' + pct + '%"></div></div>' +
            '<span class="m-progress-text">' + pct + '%</span></div>' +
            '<div class="m-torrent-info">' +
            '<span class="m-info-status">' + statusText + '</span>' +
            (t.rate_download > 0 ? '<span class="m-info-dl">⬇ ' + TWC.utils.formatSpeed(t.rate_download) + '</span>' : '') +
            (t.rate_upload > 0 ? '<span class="m-info-ul">⬆ ' + TWC.utils.formatSpeed(t.rate_upload) + '</span>' : '') +
            '<span class="m-info-size">' + TWC.utils.formatBytes(t.total_size) + '</span>' +
            '<span class="m-info-ratio">R:' + TWC.utils.formatRatio(t.upload_ratio) + '</span>' +
            '</div></div>';
    }

    function _renderSpeedBar(torrents) {
        var stats = _getGlobalStats(torrents);
        return '<div class="m-speed-bar">' +
            '<span class="m-speed-dl">⬇ ' + TWC.utils.formatSpeed(stats.downloadSpeed) + '</span>' +
            '<span class="m-speed-ul">⬆ ' + TWC.utils.formatSpeed(stats.uploadSpeed) + '</span></div>';
    }

    function _attrRow(label, value) {
        return '<div class="m-attr-row"><span class="m-attr-label">' + label + '</span><span class="m-attr-value">' + TWC.utils.escapeHtml(String(value)) + '</span></div>';
    }

    function _miniStat(label, count) {
        return '<div class="m-stat-mini"><span class="m-stat-mini-val">' + count + '</span><span class="m-stat-mini-label">' + label + '</span></div>';
    }

    function _showToast(message, type) {
        var $container = $('#m-toast-container');
        var $toast = $('<div class="m-toast ' + (type || 'info') + '">' + TWC.utils.escapeHtml(message) + '</div>');
        $container.append($toast);
        setTimeout(function() { $toast.fadeOut(300, function() { $(this).remove(); }); }, 2500);
    }

    function _getFiltered(torrents, filterStatus) {
        var results = [];
        var ids = Object.keys(torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = torrents[ids[i]];
            if (_matchFilter(t, filterStatus)) results.push(t);
        }
        results.sort(function(a, b) { return a.name.localeCompare(b.name, 'zh-CN'); });
        return results;
    }

    function _matchFilter(t, filterStatus) {
        switch (filterStatus) {
            case 'downloading': return t.status === 4 || t.status === 3;
            case 'seeding': return t.status === 6 || t.status === 5;
            case 'stopped': return t.status === 0;
            case 'checking': return t.status === 1 || t.status === 2;
            case 'active': return t.rate_download > 0 || t.rate_upload > 0;
            case 'error': return t.error !== 0;
            default: return true;
        }
    }

    function _getCounts(torrents) {
        var counts = { all: 0, downloading: 0, seeding: 0, stopped: 0, checking: 0, active: 0, error: 0 };
        var ids = Object.keys(torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = torrents[ids[i]];
            counts.all++;
            if (t.status === 4 || t.status === 3) counts.downloading++;
            if (t.status === 6 || t.status === 5) counts.seeding++;
            if (t.status === 0) counts.stopped++;
            if (t.status === 1 || t.status === 2) counts.checking++;
            if (t.rate_download > 0 || t.rate_upload > 0) counts.active++;
            if (t.error !== 0) counts.error++;
        }
        return counts;
    }

    function _getGlobalStats(torrents) {
        var totalDl = 0, totalUl = 0;
        var ids = Object.keys(torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = torrents[ids[i]];
            totalDl += t.rate_download || 0;
            totalUl += t.rate_upload || 0;
        }
        return { downloadSpeed: totalDl, uploadSpeed: totalUl };
    }

    function _getSeederCount(t) {
        if (t.tracker_stats && t.tracker_stats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.tracker_stats.length; i++) { if (t.tracker_stats[i].seeder_count > max) max = t.tracker_stats[i].seeder_count; }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    function _getLeecherCount(t) {
        if (t.tracker_stats && t.tracker_stats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.tracker_stats.length; i++) { if (t.tracker_stats[i].leecher_count > max) max = t.tracker_stats[i].leecher_count; }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    return {
        renderList: renderList,
        renderDetail: renderDetail,
        renderStats: renderStats,
        renderSpeed: renderSpeed,
        renderAdd: renderAdd
    };
})();
