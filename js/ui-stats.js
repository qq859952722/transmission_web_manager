var TWC = TWC || {};

TWC.uiStats = (function() {
    var _speedChartCanvas = null;
    var _speedChartCtx = null;
    var _speedChartAnimFrame = null;

    function renderGlobalStats() {
        var sessionStats = TWC.config.getSessionStats();
        var counts = TWC.torrent.getStatusCounts();
        var globalStats = TWC.torrent.getGlobalStats();
        var session = TWC.config.getSessionData();
        var history = TWC.ui.getSpeedHistory();

        var cumulative = sessionStats['cumulative-stats'] || {};
        var current = sessionStats['current-stats'] || {};

        var html = '<div class="twc-stats-page">' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">' + TWC.i18n.t('stats.speed_title') + '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card twc-stat-wide">' +
            '<canvas id="global-speed-chart" style="width:100%;height:180px"></canvas>' +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.speed.current_download') + '</div>' +
            '<div class="stat-value text-info">' + TWC.utils.formatSpeed(globalStats.downloadSpeed) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.speed.current_upload') + '</div>' +
            '<div class="stat-value text-success">' + TWC.utils.formatSpeed(globalStats.uploadSpeed) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">' + TWC.i18n.t('stats.cumulative_title') + '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.general.downloaded') + '</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(cumulative.downloadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.utils.formatDuration(cumulative.secondsActive || 0) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.general.uploaded') + '</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(cumulative.uploadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.i18n.t('stats.avg_speed') + ' ' + TWC.utils.formatSpeed(cumulative.secondsActive > 0 ? (cumulative.uploadedBytes || 0) / cumulative.secondsActive : 0) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.general.ratio') + '</div>' +
            '<div class="stat-value">' + _formatCumulativeRatio(cumulative) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('stats.file_count') + '</div>' +
            '<div class="stat-value">' + TWC.utils.formatNumber(cumulative.file_count || 0) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">' + TWC.i18n.t('stats.current_title') + '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.general.downloaded') + '</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(current.downloadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.utils.formatDuration(current.secondsActive || 0) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">' + TWC.i18n.t('detail.general.uploaded') + '</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(current.uploadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.i18n.t('stats.avg_speed') + ' ' + TWC.utils.formatSpeed(current.secondsActive > 0 ? (current.uploadedBytes || 0) / current.secondsActive : 0) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">' + TWC.i18n.t('stats.torrent_stats') + '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card twc-stat-wide">' +
            _renderStatusBarChart(counts) +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-grid">' +
            _miniStat(TWC.i18n.t('filter.all'), counts.all, '') +
            _miniStat(TWC.i18n.t('status.downloading'), counts.downloading, 'text-info') +
            _miniStat(TWC.i18n.t('status.seeding'), counts.seeding, 'text-success') +
            _miniStat(TWC.i18n.t('status.stopped'), counts.stopped, 'text-muted') +
            _miniStat(TWC.i18n.t('status.checking'), counts.checking, 'text-warning') +
            _miniStat(TWC.i18n.t('filter.active'), counts.active, 'text-info') +
            _miniStat(TWC.i18n.t('filter.error'), counts.error, 'text-danger') +
            _miniStat(TWC.i18n.t('status.download_wait'), counts.queued, 'text-muted') +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">' + TWC.i18n.t('stats.sys_info') + '</div>' +
            '<div class="twc-stats-info-grid">' +
            _infoRow(TWC.i18n.t('dialog.about.version'), session.version || '-') +
            _infoRow(TWC.i18n.t('dialog.about.rpc_version'), session['rpc-version'] || '-') +
            _infoRow(TWC.i18n.t('dialog.settings.rpc_semver') || 'RPC Semantic Version', session['rpc-version-semver'] || '-') +
            _infoRow(TWC.i18n.t('dialog.settings.config_dir') || 'Config Dir', session['config-dir'] || '-') +
            _infoRow(TWC.i18n.t('dialog.add.download_dir'), session['download-dir'] || '-') +
            _infoRow(TWC.i18n.t('stats.free_space'), session['download-dir-free-space'] ? TWC.utils.formatBytes(session['download-dir-free-space']) : '-') +
            _infoRow(TWC.i18n.t('dialog.settings.listen_port') || 'Peer Port', session['peer-port'] || '-') +
            _infoRow(TWC.i18n.t('dialog.settings.port_forwarding') || 'Port Forwarding', session['port-forwarding-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            _infoRow(TWC.i18n.t('dialog.settings.dht'), session['dht-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            _infoRow(TWC.i18n.t('dialog.settings.pex'), session['pex-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            _infoRow(TWC.i18n.t('dialog.settings.lpd'), session['lpd-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            _infoRow(TWC.i18n.t('dialog.settings.utp'), session['utp-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            _infoRow(TWC.i18n.t('detail.peers.encryption'), TWC.utils.getEncryptionText(session.encryption) || '-') +
            _infoRow(TWC.i18n.t('toolbar.alt_speed'), session['alt-speed-enabled'] ? TWC.i18n.t('dialog.settings.enabled') : TWC.i18n.t('dialog.settings.disabled')) +
            '</div>' +
            '</div>' +

            '</div>';

        TWC.ui.showModal(html, {
            title: TWC.i18n.t('stats.title'),
            size: 'xl'
        });

        _drawGlobalSpeedChart(history);
    }

    function _renderStatusBarChart(counts) {
        var total = counts.all || 1;
        var segments = [
            { label: TWC.i18n.t('columns.downloaded'), count: counts.downloading, color: 'var(--color-primary-500)' },
            { label: TWC.i18n.t('columns.uploaded'), count: counts.seeding, color: 'var(--color-success-500)' },
            { label: TWC.i18n.t('status.stopped'), count: counts.stopped, color: '#6b7280' },
            { label: TWC.i18n.t('status.checking'), count: counts.checking, color: 'var(--color-warning-500)' },
            { label: TWC.i18n.t('filter.error'), count: counts.error, color: 'var(--color-danger-500)' },
            { label: TWC.i18n.t('status.download_wait'), count: counts.queued, color: '#8b5cf6' }
        ];

        var html = '<div style="display:flex;height:24px;border-radius:4px;overflow:hidden;margin-bottom:8px">';
        for (var i = 0; i < segments.length; i++) {
            var s = segments[i];
            if (s.count <= 0) continue;
            var pct = (s.count / total * 100).toFixed(1);
            html += '<div style="width:' + pct + '%;background:' + s.color + ';display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600;min-width:' + (s.count > 0 ? '20px' : '0') + '" title="' + s.label + ': ' + s.count + '">' +
                (parseFloat(pct) >= 5 ? s.count : '') +
                '</div>';
        }
        html += '</div>';

        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px">';
        for (var j = 0; j < segments.length; j++) {
            var seg = segments[j];
            html += '<div style="display:flex;align-items:center;gap:4px">' +
                '<div style="width:10px;height:10px;border-radius:2px;background:' + seg.color + '"></div>' +
                '<span style="color:var(--text-muted)">' + seg.label + '</span>' +
                '<span style="font-weight:600;color:var(--text-primary)">' + seg.count + '</span>' +
                '</div>';
        }
        html += '</div>';

        return html;
    }

    function _miniStat(label, count, cls) {
        return '<div class="twc-stat-mini">' +
            '<div class="twc-stat-mini-val ' + cls + '">' + count + '</div>' +
            '<div class="twc-stat-mini-label">' + label + '</div>' +
            '</div>';
    }

    function _infoRow(label, value) {
        return '<div class="twc-stats-info-row">' +
            '<span class="twc-stats-info-label">' + label + '</span>' +
            '<span class="twc-stats-info-value">' + TWC.utils.escapeHtml(String(value)) + '</span>' +
            '</div>';
    }

    function _formatCumulativeRatio(stats) {
        if (!stats || !stats.downloadedBytes || stats.downloadedBytes === 0) return '∞';
        var ratio = (stats.uploadedBytes || 0) / stats.downloadedBytes;
        return '<span class="' + TWC.utils.getRatioClass(ratio) + '">' + ratio.toFixed(3) + '</span>';
    }

    function _drawGlobalSpeedChart(history) {
        var canvas = document.getElementById('global-speed-chart');
        if (!canvas) return;

        var container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 180;

        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var padding = { top: 10, right: 10, bottom: 24, left: 60 };
        var chartW = w - padding.left - padding.right;
        var chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        var isDark = TWC.theme.isDark();
        var textColor = isDark ? '#a0a0b8' : '#6b7280';
        var gridColor = isDark ? '#353550' : '#e5e7eb';
        var downloadColor = isDark ? '#5b8def' : '#3b82f6';
        var uploadColor = isDark ? '#4ade80' : '#22c55e';

        var dlData = history.download || [];
        var ulData = history.upload || [];
        if (dlData.length < 2) {
            ctx.fillStyle = textColor;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(TWC.i18n.t('status.loading'), w / 2, h / 2);
            return;
        }

        var maxVal = 0;
        for (var i = 0; i < dlData.length; i++) {
            if (dlData[i] > maxVal) maxVal = dlData[i];
            if (ulData[i] > maxVal) maxVal = ulData[i];
        }
        maxVal = Math.max(maxVal, 1024);
        maxVal = _niceMax(maxVal);

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

        _drawChartLine(ctx, dlData, maxVal, downloadColor, padding, chartW, chartH);
        _drawChartLine(ctx, ulData, maxVal, uploadColor, padding, chartW, chartH);

        ctx.fillStyle = downloadColor;
        ctx.fillRect(padding.left, h - 14, 10, 3);
        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(TWC.i18n.t('detail.speed.download'), padding.left + 14, h - 10);

        ctx.fillStyle = uploadColor;
        ctx.fillRect(padding.left + 55, h - 14, 10, 3);
        ctx.fillStyle = textColor;
        ctx.fillText(TWC.i18n.t('detail.speed.upload'), padding.left + 69, h - 10);
    }

    function _drawChartLine(ctx, data, maxVal, color, padding, chartW, chartH) {
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

    function _niceMax(val) {
        if (val <= 0) return 1024;
        var magnitude = Math.pow(1024, Math.floor(Math.log(val) / Math.log(1024)));
        var normalized = val / magnitude;
        var nice = [1, 2, 3, 5, 10];
        for (var i = 0; i < nice.length; i++) {
            if (normalized <= nice[i]) {
                return nice[i] * magnitude;
            }
        }
        return 10 * magnitude;
    }

    return {
        renderGlobalStats: renderGlobalStats
    };
})();
