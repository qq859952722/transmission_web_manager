var TWC = TWC || {};

TWC.mobileViews = (function() {

    function renderList(torrents, filterStatus) {
        var filtered = _getFiltered(torrents, filterStatus);
        var counts = _getCounts(torrents);

        var html = '<div class="m-filter-bar">';
        var filters = [
            { status: 'all', label: '全部', count: counts.all },
            { status: 'downloading', label: '下载', count: counts.downloading },
            { status: 'seeding', label: '做种', count: counts.seeding },
            { status: 'stopped', label: '停止', count: counts.stopped },
            { status: 'active', label: '活跃', count: counts.active },
            { status: 'error', label: '错误', count: counts.error }
        ];
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            html += '<div class="m-filter-chip' + (filterStatus === f.status ? ' active' : '') + '" data-status="' + f.status + '">' +
                f.label + ' <span class="m-filter-count">' + f.count + '</span></div>';
        }
        html += '</div>';

        html += '<div class="m-torrent-list">';
        if (filtered.length === 0) {
            html += '<div class="m-empty">暂无种子</div>';
        } else {
            for (var j = 0; j < filtered.length; j++) html += _renderItem(filtered[j]);
        }
        html += '</div>';

        html += _renderSpeedBar(torrents);
        $('#m-content').html(html);
    }

    function renderDetail(t) {
        var pct = ((t.percentDone || 0) * 100).toFixed(1);
        var statusText = TWC.utils.getStatusText(t.status);

        var html = '<div class="m-detail">' +
            '<div class="m-detail-header">' +
            '<button class="m-detail-back">← 返回</button><span>种子详情</span>' +
            '</div>' +
            '<div class="m-detail-body">' +
            '<div class="m-detail-name">' + TWC.utils.escapeHtml(t.name) + '</div>' +
            '<div class="m-detail-progress">' +
            '<div class="m-progress-bar" style="height:20px">' +
            '<div class="m-progress-fill m-progress-downloading" style="width:' + pct + '%"></div>' +
            '<span class="m-progress-label">' + pct + '%</span></div></div>' +
            '<div class="m-detail-actions">' +
            (t.status === 0 ? '<button class="m-detail-action" data-action="start">▶ 开始</button>' :
                '<button class="m-detail-action" data-action="stop">⏸ 暂停</button>') +
            '<button class="m-detail-action" data-action="reannounce">🔄 重新宣告</button>' +
            '<button class="m-detail-action" data-action="verify">✓ 校验</button>' +
            '<button class="m-detail-action danger" data-action="remove">✕ 删除</button>' +
            '</div>' +
            '<div class="m-detail-attrs">' +
            _attrRow('状态', statusText) +
            _attrRow('总大小', TWC.utils.formatBytes(t.totalSize)) +
            _attrRow('已完成', TWC.utils.formatBytes(t.haveValid)) +
            _attrRow('剩余', TWC.utils.formatBytes(t.leftUntilDone)) +
            _attrRow('下载速度', TWC.utils.formatSpeed(t.rateDownload)) +
            _attrRow('上传速度', TWC.utils.formatSpeed(t.rateUpload)) +
            _attrRow('下载量', TWC.utils.formatBytes(t.downloadedEver)) +
            _attrRow('上传量', TWC.utils.formatBytes(t.uploadedEver)) +
            _attrRow('分享率', TWC.utils.formatRatio(t.uploadRatio)) +
            _attrRow('做种数', _getSeederCount(t)) +
            _attrRow('下载数', _getLeecherCount(t)) +
            _attrRow('连接Peer', t.peersConnected) +
            _attrRow('ETA', TWC.utils.formatETA(t.eta)) +
            _attrRow('添加时间', TWC.utils.formatTimestamp(t.addedDate)) +
            _attrRow('下载目录', t.downloadDir || '-') +
            _attrRow('标签', t.labels ? t.labels.join(', ') : '-') +
            (t.error !== 0 ? _attrRow('错误', t.errorString) : '') +
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
            '<div class="m-stats-section"><div class="m-stats-title">全局速度</div>' +
            '<div class="m-stats-row">' +
            '<div class="m-stat-card"><div class="m-stat-label">下载速度</div><div class="m-stat-value m-stat-dl">' + TWC.utils.formatSpeed(globalStats.downloadSpeed) + '</div></div>' +
            '<div class="m-stat-card"><div class="m-stat-label">上传速度</div><div class="m-stat-value m-stat-ul">' + TWC.utils.formatSpeed(globalStats.uploadSpeed) + '</div></div>' +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">累计统计</div>' +
            '<div class="m-stats-row">' +
            '<div class="m-stat-card"><div class="m-stat-label">累计下载</div><div class="m-stat-value">' + TWC.utils.formatBytes(cumulative.downloadedBytes || 0) + '</div></div>' +
            '<div class="m-stat-card"><div class="m-stat-label">累计上传</div><div class="m-stat-value">' + TWC.utils.formatBytes(cumulative.uploadedBytes || 0) + '</div></div>' +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">种子状态</div>' +
            '<div class="m-stats-grid">' +
            _miniStat('全部', counts.all) + _miniStat('下载中', counts.downloading) +
            _miniStat('做种中', counts.seeding) + _miniStat('已停止', counts.stopped) +
            _miniStat('校验中', counts.checking) + _miniStat('错误', counts.error) +
            '</div></div>' +
            '<div class="m-stats-section"><div class="m-stats-title">系统信息</div>' +
            _attrRow('版本', 'Transmission ' + (sessionData.version || '-')) +
            _attrRow('备用限速', altSpeedEnabled ? '已启用' : '未启用') +
            '</div>' +
            '<div class="m-stats-section">' +
            '<button class="m-btn' + (altSpeedEnabled ? ' active' : '') + '" id="m-alt-speed-toggle">' +
            (altSpeedEnabled ? '关闭备用限速' : '启用备用限速') + '</button></div></div>';

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
            '<div class="m-speed-section"><div class="m-speed-title">速度限制</div>' +
            '<div class="m-speed-form">' +
            '<div class="m-speed-row"><label>下载限速</label><div class="m-speed-input-group">' +
            '<input type="checkbox" id="m-dl-enabled"' + (dlEnabled ? ' checked' : '') + ' />' +
            '<input type="number" id="m-dl-limit" value="' + dlLimit + '" min="0" /> KB/s</div></div>' +
            '<div class="m-speed-row"><label>上传限速</label><div class="m-speed-input-group">' +
            '<input type="checkbox" id="m-ul-enabled"' + (ulEnabled ? ' checked' : '') + ' />' +
            '<input type="number" id="m-ul-limit" value="' + ulLimit + '" min="0" /> KB/s</div></div>' +
            '<button class="m-btn primary" id="m-save-speed">保存限速设置</button>' +
            '</div></div>' +
            '<div class="m-speed-section"><div class="m-speed-title">快速限速预设</div>' +
            '<div class="m-speed-presets">' +
            '<button class="m-speed-preset" data-dl="0" data-ul="0">不限速</button>' +
            '<button class="m-speed-preset" data-dl="512" data-ul="256">512/256</button>' +
            '<button class="m-speed-preset" data-dl="1024" data-ul="512">1M/512K</button>' +
            '<button class="m-speed-preset" data-dl="2048" data-ul="1024">2M/1M</button>' +
            '<button class="m-speed-preset" data-dl="5120" data-ul="2048">5M/2M</button>' +
            '</div></div>' +
            '<div class="m-speed-section"><div class="m-speed-title">备用限速</div>' +
            '<div class="m-speed-row"><label>启用备用限速</label>' +
            '<button class="m-btn' + (altEnabled ? ' active' : '') + '" id="m-alt-speed-toggle2">' + (altEnabled ? '已启用' : '未启用') + '</button></div>' +
            '<div class="m-speed-row"><label>备用下载</label><span class="m-speed-val-sm">' + altDl + ' KB/s</span></div>' +
            '<div class="m-speed-row"><label>备用上传</label><span class="m-speed-val-sm">' + altUl + ' KB/s</span></div>' +
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
        var downloadDir = sessionData['download-dir'] || '';
        var peerLimit = sessionData['peer-limit-per-torrent'] || '';
        var html = '<div class="m-add-page">' +
            '<div class="m-add-section"><label>种子链接 / 磁力链接</label>' +
            '<textarea id="m-add-url" rows="3" placeholder="输入种子URL或磁力链接，每行一个"></textarea></div>' +
            '<div class="m-add-section"><label>种子文件</label><input type="file" id="m-add-file" accept=".torrent" multiple /></div>' +
            '<div class="m-add-section"><label>下载目录</label><input type="text" id="m-add-dir" value="' + TWC.utils.escapeHtml(downloadDir) + '" placeholder="留空使用默认目录" /></div>' +
            '<div class="m-add-row"><div class="m-add-half"><label>最大连接数</label>' +
            '<input type="number" id="m-add-peer-limit" min="0" placeholder="默认" value="' + peerLimit + '" /></div>' +
            '<div class="m-add-half"><label>优先级</label>' +
            '<select id="m-add-priority"><option value="0">低</option><option value="1" selected>正常</option><option value="2">高</option></select></div></div>' +
            '<div class="m-add-row"><div class="m-add-half"><label>下载限速 (kB/s)</label>' +
            '<input type="number" id="m-add-dl-limit" min="0" placeholder="不限" /></div>' +
            '<div class="m-add-half"><label>上传限速 (kB/s)</label>' +
            '<input type="number" id="m-add-ul-limit" min="0" placeholder="不限" /></div></div>' +
            '<div class="m-add-section"><label>标签 <span style="font-weight:normal;color:var(--text-muted);font-size:12px">(逗号分隔)</span></label>' +
            '<input type="text" id="m-add-labels" placeholder="例如: 电影, 高清" /></div>' +
            '<div class="m-add-section" style="display:flex;gap:16px;flex-wrap:wrap">' +
            '<label class="m-checkbox-label"><input type="checkbox" id="m-add-paused" /> 暂停启动</label>' +
            '<label class="m-checkbox-label"><input type="checkbox" id="m-add-sequential" /> 顺序下载</label></div>' +
            '<button class="m-btn primary" id="m-add-submit" style="width:100%;margin-top:16px">添加种子</button></div>';
        $('#m-content').html(html);
    }

    function _renderItem(t) {
        var pct = ((t.percentDone || 0) * 100).toFixed(1);
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
            (t.rateDownload > 0 ? '<span class="m-info-dl">⬇ ' + TWC.utils.formatSpeed(t.rateDownload) + '</span>' : '') +
            (t.rateUpload > 0 ? '<span class="m-info-ul">⬆ ' + TWC.utils.formatSpeed(t.rateUpload) + '</span>' : '') +
            '<span class="m-info-size">' + TWC.utils.formatBytes(t.totalSize) + '</span>' +
            '<span class="m-info-ratio">R:' + TWC.utils.formatRatio(t.uploadRatio) + '</span>' +
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
            case 'active': return t.rateDownload > 0 || t.rateUpload > 0;
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
            if (t.rateDownload > 0 || t.rateUpload > 0) counts.active++;
            if (t.error !== 0) counts.error++;
        }
        return counts;
    }

    function _getGlobalStats(torrents) {
        var totalDl = 0, totalUl = 0;
        var ids = Object.keys(torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = torrents[ids[i]];
            totalDl += t.rateDownload || 0;
            totalUl += t.rateUpload || 0;
        }
        return { downloadSpeed: totalDl, uploadSpeed: totalUl };
    }

    function _getSeederCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.trackerStats.length; i++) { if (t.trackerStats[i].seederCount > max) max = t.trackerStats[i].seederCount; }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    function _getLeecherCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.trackerStats.length; i++) { if (t.trackerStats[i].leecherCount > max) max = t.trackerStats[i].leecherCount; }
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
