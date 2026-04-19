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
            '<div class="twc-stats-section-title">实时速度</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card twc-stat-wide">' +
            '<canvas id="global-speed-chart" style="width:100%;height:180px"></canvas>' +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">当前下载</div>' +
            '<div class="stat-value text-info">' + TWC.utils.formatSpeed(globalStats.downloadSpeed) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">当前上传</div>' +
            '<div class="stat-value text-success">' + TWC.utils.formatSpeed(globalStats.uploadSpeed) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">累计统计</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">累计下载</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(cumulative.downloadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.utils.formatDuration(cumulative.secondsActive || 0) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">累计上传</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(cumulative.uploadedBytes || 0) + '</div>' +
            '<div class="stat-sub">平均速度 ' + TWC.utils.formatSpeed(cumulative.secondsActive > 0 ? (cumulative.uploadedBytes || 0) / cumulative.secondsActive : 0) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">累计分享率</div>' +
            '<div class="stat-value">' + _formatCumulativeRatio(cumulative) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">累计文件数</div>' +
            '<div class="stat-value">' + TWC.utils.formatNumber(cumulative.fileCount || 0) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">本次会话</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">本次下载</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(current.downloadedBytes || 0) + '</div>' +
            '<div class="stat-sub">' + TWC.utils.formatDuration(current.secondsActive || 0) + '</div>' +
            '</div>' +
            '<div class="twc-stat-card">' +
            '<div class="stat-label">本次上传</div>' +
            '<div class="stat-value">' + TWC.utils.formatBytes(current.uploadedBytes || 0) + '</div>' +
            '<div class="stat-sub">平均速度 ' + TWC.utils.formatSpeed(current.secondsActive > 0 ? (current.uploadedBytes || 0) / current.secondsActive : 0) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">种子状态分布</div>' +
            '<div class="twc-stats-row">' +
            '<div class="twc-stat-card twc-stat-wide">' +
            _renderStatusBarChart(counts) +
            '</div>' +
            '</div>' +
            '<div class="twc-stats-grid">' +
            _miniStat('全部', counts.all, '') +
            _miniStat('下载中', counts.downloading, 'text-info') +
            _miniStat('做种中', counts.seeding, 'text-success') +
            _miniStat('已停止', counts.stopped, 'text-muted') +
            _miniStat('校验中', counts.checking, 'text-warning') +
            _miniStat('活跃', counts.active, 'text-info') +
            _miniStat('错误', counts.error, 'text-danger') +
            _miniStat('排队中', counts.queued, 'text-muted') +
            '</div>' +
            '</div>' +

            '<div class="twc-stats-section">' +
            '<div class="twc-stats-section-title">系统信息</div>' +
            '<div class="twc-stats-info-grid">' +
            _infoRow('Transmission 版本', session.version || '-') +
            _infoRow('RPC 版本', session['rpc-version'] || '-') +
            _infoRow('RPC 语义版本', session['rpc-version-semver'] || '-') +
            _infoRow('配置目录', session['config-dir'] || '-') +
            _infoRow('默认下载目录', session['download-dir'] || '-') +
            _infoRow('可用空间', session['download-dir-free-space'] ? TWC.utils.formatBytes(session['download-dir-free-space']) : '-') +
            _infoRow('监听端口', session['peer-port'] || '-') +
            _infoRow('端口转发', session['port-forwarding-enabled'] ? '启用' : '禁用') +
            _infoRow('DHT', session['dht-enabled'] ? '启用' : '禁用') +
            _infoRow('PEX', session['pex-enabled'] ? '启用' : '禁用') +
            _infoRow('LPD', session['lpd-enabled'] ? '启用' : '禁用') +
            _infoRow('uTP', session['utp-enabled'] ? '启用' : '禁用') +
            _infoRow('加密', TWC.utils.getEncryptionText(session.encryption) || '-') +
            _infoRow('备用限速', session['alt-speed-enabled'] ? '已启用' : '未启用') +
            '</div>' +
            '</div>' +

            '</div>';

        TWC.ui.showModal(html, {
            title: '全局统计',
            size: 'xl'
        });

        _drawGlobalSpeedChart(history);
    }

    function _renderStatusBarChart(counts) {
        var total = counts.all || 1;
        var segments = [
            { label: '下载', count: counts.downloading, color: 'var(--color-primary-500)' },
            { label: '做种', count: counts.seeding, color: 'var(--color-success-500)' },
            { label: '停止', count: counts.stopped, color: '#6b7280' },
            { label: '校验', count: counts.checking, color: 'var(--color-warning-500)' },
            { label: '错误', count: counts.error, color: 'var(--color-danger-500)' },
            { label: '排队', count: counts.queued, color: '#8b5cf6' }
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
            ctx.fillText('等待数据...', w / 2, h / 2);
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
        ctx.fillText('下载', padding.left + 14, h - 10);

        ctx.fillStyle = uploadColor;
        ctx.fillRect(padding.left + 55, h - 14, 10, 3);
        ctx.fillStyle = textColor;
        ctx.fillText('上传', padding.left + 69, h - 10);
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
