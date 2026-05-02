var TWC = TWC || {};

TWC.uiDetailExtras = (function() {

    function renderPeers(t) {
        if (!t.peers || t.peers.length === 0) {
            $('#detail-content').html('<div class="twc-empty">无Peer连接</div>');
            return;
        }

        var html = '<table class="twc-peer-table">' +
            '<thead><tr>' +
            '<th style="min-width:80px">国家</th>' +
            '<th>IP 地址</th>' +
            '<th>端口</th>' +
            '<th>客户端</th>' +
            '<th>进度</th>' +
            '<th>下载速度</th>' +
            '<th>上传速度</th>' +
            '<th>已下载</th>' +
            '<th>已上传</th>' +
            '<th>标识</th>' +
            '<th>来源</th>' +
            '<th>连接时间</th>' +
            '<th>加密</th>' +
            '<th>协议</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < t.peers.length; i++) {
            var p = t.peers[i];
            var flags = p.flagStr || '';
            var source = _getSourceText(p);
            var countryHtml = _getCountryDisplay(p.address);
            var encText = p.isEncrypted ? '是' : '否';
            var protoText = p.isUTP ? 'uTP' : 'TCP';
            var connTime = p.connectionType || '-';

            html += '<tr>' +
                '<td>' + countryHtml + '</td>' +
                '<td class="text-mono">' + TWC.utils.escapeHtml(p.address) + '</td>' +
                '<td class="text-mono">' + p.port + '</td>' +
                '<td title="' + TWC.utils.escapeHtml(p.clientName || '') + '">' + TWC.utils.escapeHtml(TWC.utils.truncateText(p.clientName, 20)) + '</td>' +
                '<td>' + _renderPeerProgress(p.progress) + '</td>' +
                '<td class="text-mono">' + (p.rateToClient > 0 ? '<span class="text-info">' + TWC.utils.formatSpeed(p.rateToClient) + '</span>' : '-') + '</td>' +
                '<td class="text-mono">' + (p.rateToPeer > 0 ? '<span class="text-success">' + TWC.utils.formatSpeed(p.rateToPeer) + '</span>' : '-') + '</td>' +
                '<td class="text-mono">' + (p.clientIsChoked ? '-' : TWC.utils.formatBytes(p.bytesToClient || 0)) + '</td>' +
                '<td class="text-mono">' + TWC.utils.formatBytes(p.bytesToPeer || 0) + '</td>' +
                '<td><span title="' + _getFlagsTooltip(flags) + '">' + TWC.utils.escapeHtml(flags) + '</span></td>' +
                '<td>' + source + '</td>' +
                '<td>' + connTime + '</td>' +
                '<td>' + encText + '</td>' +
                '<td>' + protoText + '</td>' +
                '</tr>';
        }

        html += '</tbody></table>';

        if (t.peersFrom) {
            html += '<div class="twc-peer-summary">' +
                '<div class="twc-peer-summary-title">Peer 来源统计</div>' +
                '<div class="twc-peer-summary-grid">' +
                _peerSourceItem('Tracker', t.peersFrom.fromTracker || 0) +
                _peerSourceItem('DHT', t.peersFrom.fromDht || 0) +
                _peerSourceItem('PEX', t.peersFrom.fromPex || 0) +
                _peerSourceItem('入站连接', t.peersFrom.fromIncoming || 0) +
                _peerSourceItem('LPD', t.peersFrom.fromLpd || 0) +
                _peerSourceItem('LTEP', t.peersFrom.fromLtep || 0) +
                _peerSourceItem('缓存', t.peersFrom.fromCache || 0) +
                '</div></div>';
        }

        html += '<div class="twc-peer-flags-legend">' +
            '<div class="twc-peer-summary-title">标识说明</div>' +
            '<div class="twc-flags-grid">' +
            _flagItem('D', '目前正在下载') +
            _flagItem('d', '对方拒绝我们的下载请求') +
            _flagItem('U', '目前正在上传') +
            _flagItem('u', '对方拒绝我们的上传请求') +
            _flagItem('K', '对方已撤回拒绝下载') +
            _flagItem('?', '对方已撤回拒绝上传') +
            _flagItem('E', '加密连接') +
            _flagItem('H', '对方是超级做种') +
            _flagItem('X', '通过PEX发现') +
            _flagItem('I', '通过DHT发现') +
            _flagItem('T', '通过uTP连接') +
            _flagItem('L', '通过LSD发现') +
            _flagItem('S', '对方正在忽略我们') +
            '</div></div>';

        $('#detail-content').html(html);
    }

    function _getCountryDisplay(ip) {
        if (TWC.geoip.isPrivateIP(ip)) {
            return '<span class="twc-country-lan" title="局域网">LAN</span>';
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

        return '<span class="twc-country-unknown" title="未知">-</span>';
    }

    function _getSourceText(p) {
        var parts = [];
        if (p.isIncoming) parts.push('入站');
        if (p.isUTP) parts.push('uTP');
        if (p.isEncrypted) parts.push('加密');
        if (p.isUploading) parts.push('上传中');
        if (p.isDownloading) parts.push('下载中');
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
        var map = {
            'D': '正在下载', 'd': '拒绝下载', 'U': '正在上传', 'u': '拒绝上传',
            'K': '撤回拒绝下载', '?': '撤回拒绝上传', 'E': '加密', 'H': '超级做种',
            'X': 'PEX发现', 'I': 'DHT发现', 'T': 'uTP', 'L': 'LSD发现', 'S': '忽略'
        };
        var tips = [];
        for (var i = 0; i < flags.length; i++) {
            var c = flags[i];
            tips.push(c + ': ' + (map[c] || '未知'));
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
            _statCard('当前下载速度', TWC.utils.formatSpeed(t.rateDownload), 'text-info') +
            _statCard('当前上传速度', TWC.utils.formatSpeed(t.rateUpload), 'text-success') +
            _statCard('总下载量', TWC.utils.formatBytes(t.downloadedEver), '') +
            _statCard('总上传量', TWC.utils.formatBytes(t.uploadedEver), '') +
            _statCard('分享率', '<span class="' + TWC.utils.getRatioClass(t.uploadRatio) + '">' + TWC.utils.formatRatio(t.uploadRatio) + '</span>', '') +
            _statCard('累计下载时间', TWC.utils.formatDuration(t.secondsDownloading), '') +
            _statCard('累计做种时间', TWC.utils.formatDuration(t.secondsSeeding), '') +
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
            '<label>下载限速</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="ts-dl-limited"' + (t.downloadLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="ts-dl-limit" value="' + (t.downloadLimit || 0) + '" style="width:80px" min="0" /> KB/s' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>上传限速</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="ts-ul-limited"' + (t.uploadLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="ts-ul-limit" value="' + (t.uploadLimit || 0) + '" style="width:80px" min="0" /> KB/s' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>带宽优先级</label>' +
            '<select class="twc-select" id="ts-priority">' +
            '<option value="-1"' + (t.bandwidthPriority === -1 ? ' selected' : '') + '>低</option>' +
            '<option value="0"' + (t.bandwidthPriority === 0 ? ' selected' : '') + '>正常</option>' +
            '<option value="1"' + (t.bandwidthPriority === 1 ? ' selected' : '') + '>高</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>最大连接Peer数</label>' +
            '<input type="number" class="twc-input" id="ts-peer-limit" value="' + (t.maxConnectedPeers || 50) + '" min="1" />' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>分享率模式</label>' +
            '<select class="twc-select" id="ts-ratio-mode">' +
            '<option value="0"' + (t.seedRatioMode === 0 ? ' selected' : '') + '>使用全局设置</option>' +
            '<option value="1"' + (t.seedRatioMode === 1 ? ' selected' : '') + '>使用自定义值</option>' +
            '<option value="2"' + (t.seedRatioMode === 2 ? ' selected' : '') + '>不限制</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>分享率限制</label>' +
            '<input type="number" class="twc-input" id="ts-ratio-limit" value="' + (t.seedRatioLimit || 2.0) + '" step="0.1" min="0" />' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>做种空闲模式</label>' +
            '<select class="twc-select" id="ts-idle-mode">' +
            '<option value="0"' + (t.seedIdleMode === 0 ? ' selected' : '') + '>使用全局设置</option>' +
            '<option value="1"' + (t.seedIdleMode === 1 ? ' selected' : '') + '>使用自定义值</option>' +
            '<option value="2"' + (t.seedIdleMode === 2 ? ' selected' : '') + '>不限制</option>' +
            '</select>' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>做种空闲超时(分钟)</label>' +
            '<input type="number" class="twc-input" id="ts-idle-limit" value="' + (t.seedIdleLimit || 30) + '" min="0" />' +
            '</div>' +

            '<div class="twc-form-group">' +
            '<label>遵守会话限速</label>' +
            '<div class="twc-toggle' + (t.honorsSessionLimits ? ' active' : '') + '" id="ts-honors-limits">' +
            '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div>' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group full-width">' +
            '<label>下载目录</label>' +
            '<div style="display:flex;gap:4px">' +
            '<input type="text" class="twc-input" id="ts-download-dir" value="' + TWC.utils.escapeHtml(t.downloadDir || '') + '" />' +
            '<button class="twc-btn primary" id="ts-change-dir-btn" style="white-space:nowrap">移动</button>' +
            '</div>' +
            '</div>' +

            '<div class="twc-form-group full-width" style="margin-top:8px">' +
            '<button class="twc-btn primary" id="ts-save-btn">保存设置</button>' +
            '</div>' +
            '</div>';

        $('#detail-content').html(html);

        $('#ts-save-btn').on('click', function() {
            var torrentIds = TWC.torrent.getSelectedIds();
            var props = {
                downloadLimited: $('#ts-dl-limited').is(':checked'),
                downloadLimit: parseInt($('#ts-dl-limit').val()) || 0,
                uploadLimited: $('#ts-ul-limited').is(':checked'),
                uploadLimit: parseInt($('#ts-ul-limit').val()) || 0,
                bandwidthPriority: parseInt($('#ts-priority').val()),
                peerLimit: parseInt($('#ts-peer-limit').val()) || 50,
                seedRatioMode: parseInt($('#ts-ratio-mode').val()),
                seedRatioLimit: parseFloat($('#ts-ratio-limit').val()) || 2.0,
                seedIdleMode: parseInt($('#ts-idle-mode').val()),
                seedIdleLimit: parseInt($('#ts-idle-limit').val()) || 30,
                honorsSessionLimits: $('#ts-honors-limits').hasClass('active')
            };

            TWC.rpc.setTorrent(torrentIds, props, function(success) {
                if (success) {
                    TWC.ui.showToast('设置已保存', 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast('保存失败', 'error');
                }
            });
        });

        $('#ts-change-dir-btn').on('click', function() {
            var torrentIds = TWC.torrent.getSelectedIds();
            var newDir = $('#ts-download-dir').val();
            TWC.rpc.setTorrentLocation(torrentIds, newDir, true, function(success) {
                if (success) {
                    TWC.ui.showToast('已移动到: ' + newDir, 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast('移动失败', 'error');
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
        ctx.fillText('下载', padding.left + 14, h - 8);

        ctx.fillStyle = uploadColor;
        ctx.fillRect(padding.left + 50, h - 12, 10, 3);
        ctx.fillStyle = textColor;
        ctx.fillText('上传', padding.left + 64, h - 8);
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
