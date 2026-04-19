var TWC = TWC || {};

TWC.uiDetail = (function() {
    var _currentTab = 'general';

    function render() {
        _renderContent();
    }

    function switchTab(tab) {
        _currentTab = tab;
        if (tab === 'peers' || tab === 'speed') {
            _refreshCurrentTorrent();
        }
        _renderContent();
    }

    function _refreshCurrentTorrent() {
        var ids = TWC.torrent.getSelectedIds();
        if (ids.length !== 1) return;
        var fields = ['id', 'name', 'status', 'peers', 'peersFrom', 'rateDownload', 'rateUpload',
            'percentDone', 'downloadedEver', 'uploadedEver', 'uploadRatio',
            'secondsDownloading', 'secondsSeeding', 'error', 'errorString'];
        TWC.rpc.getTorrents(ids, fields, function(torrents, removed, success) {
            if (success && torrents && torrents.length > 0) {
                TWC.torrent.updateData(torrents, []);
                _renderContent();
            }
        });
    }

    function update() {
        _renderContent();
    }

    function _renderContent() {
        var ids = TWC.torrent.getSelectedIds();
        var $content = $('#detail-content');
        if (ids.length === 0) {
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">选择种子查看详情</span></div>');
            return;
        }
        if (ids.length > 1) {
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">已选择 ' + ids.length + ' 个种子</span></div>');
            return;
        }

        var t = TWC.torrent.getTorrent(ids[0]);
        if (!t) {
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">种子信息不可用</span></div>');
            return;
        }

        switch (_currentTab) {
            case 'general': _renderGeneral(t); break;
            case 'files': _renderFiles(t); break;
            case 'trackers': _renderTrackers(t); break;
            case 'peers': TWC.uiDetailExtras.renderPeers(t); break;
            case 'speed': TWC.uiDetailExtras.renderSpeed(t); break;
            case 'settings': TWC.uiDetailExtras.renderSettings(t); break;
        }
    }

    function _renderGeneral(t) {
        var html = '<table class="twc-attr-table">';
        var rows = [
            ['名称', t.name],
            ['ID', t.id],
            ['Hash', t.hashString],
            ['状态', TWC.utils.getStatusText(t.status)],
            ['进度', TWC.utils.formatPercent(t.percentDone)],
            ['总大小', TWC.utils.formatBytes(t.totalSize)],
            ['已完成', TWC.utils.formatBytes(t.haveValid)],
            ['剩余', TWC.utils.formatBytes(t.leftUntilDone)],
            ['下载速度', TWC.utils.formatSpeed(t.rateDownload)],
            ['上传速度', TWC.utils.formatSpeed(t.rateUpload)],
            ['下载量', TWC.utils.formatBytes(t.downloadedEver)],
            ['上传量', TWC.utils.formatBytes(t.uploadedEver)],
            ['分享率', '<span class="' + TWC.utils.getRatioClass(t.uploadRatio) + '">' + TWC.utils.formatRatio(t.uploadRatio) + '</span>'],
            ['损坏数据', TWC.utils.formatBytes(t.corruptEver)],
            ['做种数', _getSeederCount(t)],
            ['下载数', _getLeecherCount(t)],
            ['连接Peer', t.peersConnected],
            ['向我们上传', t.peersSendingToUs],
            ['从我们下载', t.peersGettingFromUs],
            ['ETA', TWC.utils.formatETA(t.eta)],
            ['添加时间', TWC.utils.formatTimestamp(t.addedDate)],
            ['完成时间', t.doneDate > 0 ? TWC.utils.formatTimestamp(t.doneDate) : '-'],
            ['活动时间', TWC.utils.formatTimestamp(t.activityDate)],
            ['创建者', t.creator || '-'],
            ['创建时间', t.dateCreated > 0 ? TWC.utils.formatTimestamp(t.dateCreated) : '-'],
            ['注释', t.comment || '-'],
            ['下载目录', t.downloadDir || '-'],
            ['标签', t.labels ? t.labels.join(', ') : '-'],
            ['来源', t.source || '-'],
            ['MIME类型', t['primary-mime-type'] || '-'],
            ['私有种子', t.isPrivate ? '是' : '否'],
            ['分片数', t.pieceCount],
            ['分片大小', TWC.utils.formatBytes(t.pieceSize)],
            ['错误', t.error !== 0 ? '<span class="text-danger">' + TWC.utils.escapeHtml(t.errorString) + '</span>' : '无'],
            ['带宽组', t.group || '-'],
            ['累计下载时间', TWC.utils.formatDuration(t.secondsDownloading)],
            ['累计做种时间', TWC.utils.formatDuration(t.secondsSeeding)]
        ];

        for (var i = 0; i < rows.length; i++) {
            html += '<tr><td>' + rows[i][0] + '</td><td>' + rows[i][1] + '</td></tr>';
        }
        html += '</table>';
        $('#detail-content').html(html);
    }

    function _renderFiles(t) {
        if (!t.files || t.files.length === 0) {
            $('#detail-content').html('<div class="twc-empty">无文件信息</div>');
            return;
        }

        var html = '<div class="twc-file-tree" id="file-tree">';
        for (var i = 0; i < t.files.length; i++) {
            var file = t.files[i];
            var stat = t.fileStats ? t.fileStats[i] : null;
            var wanted = stat ? stat.wanted : true;
            var priority = stat ? stat.priority : 0;
            var pct = file.length > 0 ? (file.bytesCompleted / file.length * 100).toFixed(1) : '0.0';
            var priorityText = wanted ? TWC.utils.getFilePriorityText(priority) : '不下载';
            var priorityClass = '';
            if (!wanted) priorityClass = 'text-muted';
            else if (priority === 1) priorityClass = 'text-info';

            html += '<div class="twc-file-item" data-index="' + i + '">' +
                '<input type="checkbox" class="file-checkbox" data-index="' + i + '"' + (wanted ? ' checked' : '') + ' />' +
                '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' +
                '<span class="file-name" title="' + TWC.utils.escapeHtml(file.name) + '">' + TWC.utils.escapeHtml(file.name) + '</span>' +
                '<span class="file-size">' + TWC.utils.formatBytes(file.length) + '</span>' +
                '<div class="file-progress">' +
                '<div class="twc-progress-bar" style="height:10px">' +
                '<div class="twc-progress-fill bg-blue-500" style="width:' + pct + '%"></div>' +
                '</div>' +
                '</div>' +
                '<span class="file-priority ' + priorityClass + '" data-index="' + i + '">' + priorityText + '</span>' +
                '</div>';
        }
        html += '</div>';

        html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-secondary)">' +
            '<div style="display:flex;gap:8px;align-items:center">' +
            '<span style="font-size:11px;color:var(--text-muted)">批量设置优先级:</span>' +
            '<button class="twc-btn" id="file-priority-high" style="font-size:11px;height:24px">高</button>' +
            '<button class="twc-btn" id="file-priority-normal" style="font-size:11px;height:24px">正常</button>' +
            '<button class="twc-btn" id="file-priority-low" style="font-size:11px;height:24px">低</button>' +
            '<button class="twc-btn" id="file-priority-skip" style="font-size:11px;height:24px">不下载</button>' +
            '</div>' +
            '</div>';

        $('#detail-content').html(html);

        $('.file-checkbox').on('change', function() {
            var idx = parseInt($(this).data('index'));
            var checked = $(this).is(':checked');
            var torrentIds = TWC.torrent.getSelectedIds();
            if (torrentIds.length > 0) {
                var props = {};
                if (checked) {
                    props['files-wanted'] = [idx];
                } else {
                    props['files-unwanted'] = [idx];
                }
                TWC.rpc.setTorrent(torrentIds, props, function(success) {
                    if (success) TWC.ui.refreshData(true);
                });
            }
        });

        $('.file-priority').on('click', function() {
            var idx = parseInt($(this).data('index'));
            _cycleFilePriority(idx);
        });

        $('#file-priority-high').on('click', function() { _setSelectedFilesPriority(2); });
        $('#file-priority-normal').on('click', function() { _setSelectedFilesPriority(1); });
        $('#file-priority-low').on('click', function() { _setSelectedFilesPriority(0); });
        $('#file-priority-skip').on('click', function() { _setSelectedFilesPriority(-1); });
    }

    function _cycleFilePriority(fileIndex) {
        var torrentIds = TWC.torrent.getSelectedIds();
        if (torrentIds.length === 0) return;
        var t = TWC.torrent.getTorrent(torrentIds[0]);
        if (!t || !t.fileStats || !t.fileStats[fileIndex]) return;

        var current = t.fileStats[fileIndex].priority;
        var wanted = t.fileStats[fileIndex].wanted;
        var props = {};
        var nextWanted, nextPriority;

        if (!wanted) {
            props['files-wanted'] = [fileIndex];
            props['priority-low'] = [fileIndex];
            nextWanted = true;
            nextPriority = -1;
        } else {
            var next = current === -1 ? 0 : (current === 0 ? 1 : -1);
            if (next === 1) props['priority-high'] = [fileIndex];
            else if (next === 0) props['priority-normal'] = [fileIndex];
            else props['priority-low'] = [fileIndex];
            nextWanted = true;
            nextPriority = next;
        }

        TWC.rpc.setTorrent(torrentIds, props, function(success) {
            if (success) {
                t.fileStats[fileIndex].wanted = nextWanted;
                t.fileStats[fileIndex].priority = nextPriority;
                _renderFiles(t);
                TWC.ui.refreshData(true);
            }
        });
    }

    function _setSelectedFilesPriority(priority) {
        var torrentIds = TWC.torrent.getSelectedIds();
        if (torrentIds.length === 0) return;
        var t = TWC.torrent.getTorrent(torrentIds[0]);
        if (!t || !t.fileStats) return;

        var indices = [];
        $('.file-checkbox:checked').each(function() {
            indices.push(parseInt($(this).data('index')));
        });

        if (indices.length === 0) return;

        var props = {};
        var localPriority;
        if (priority === -1) {
            props['files-unwanted'] = indices;
            localPriority = -2;
        } else if (priority === 2) {
            props['files-wanted'] = indices;
            props['priority-high'] = indices;
            localPriority = 1;
        } else if (priority === 1) {
            props['files-wanted'] = indices;
            props['priority-normal'] = indices;
            localPriority = 0;
        } else {
            props['files-wanted'] = indices;
            props['priority-low'] = indices;
            localPriority = -1;
        }

        TWC.rpc.setTorrent(torrentIds, props, function(success) {
            if (success) {
                for (var k = 0; k < indices.length; k++) {
                    var idx = indices[k];
                    if (t.fileStats[idx]) {
                        t.fileStats[idx].wanted = (localPriority !== -2);
                        t.fileStats[idx].priority = localPriority;
                    }
                }
                _renderFiles(t);
                TWC.ui.refreshData(true);
            }
        });
    }

    function _renderTrackers(t) {
        if (!t.trackerStats || t.trackerStats.length === 0) {
            $('#detail-content').html('<div class="twc-empty">无Tracker信息</div>');
            return;
        }

        var html = '<table class="twc-tracker-table">' +
            '<thead><tr>' +
            '<th>#</th>' +
            '<th>Tracker</th>' +
            '<th>状态</th>' +
            '<th>做种</th>' +
            '<th>下载</th>' +
            '<th>上次宣告</th>' +
            '<th>宣告结果</th>' +
            '<th>下次宣告</th>' +
            '<th>下载次数</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < t.trackerStats.length; i++) {
            var tr = t.trackerStats[i];
            var state = tr.announceState;
            var stateText = '';
            switch (state) {
                case 0: stateText = '未激活'; break;
                case 1: stateText = '等待'; break;
                case 2: stateText = '排队中'; break;
                case 3: stateText = '活跃'; break;
                default: stateText = '未知'; break;
            }
            var lastAnnounce = tr.lastAnnounceTime > 0 ? TWC.utils.formatTimestamp(tr.lastAnnounceTime) : '-';
            var nextAnnounce = tr.nextAnnounceTime > 0 ? TWC.utils.formatTimestamp(tr.nextAnnounceTime) : '-';
            var announceResult = tr.lastAnnounceSucceeded ? '成功' : TWC.utils.escapeHtml(tr.lastAnnounceResult || '-');

            html += '<tr>' +
                '<td>' + (i + 1) + '</td>' +
                '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis" title="' + TWC.utils.escapeHtml(tr.announce) + '">' + TWC.utils.escapeHtml(tr.announce) + '</td>' +
                '<td>' + stateText + '</td>' +
                '<td>' + (tr.seederCount >= 0 ? tr.seederCount : '-') + '</td>' +
                '<td>' + (tr.leecherCount >= 0 ? tr.leecherCount : '-') + '</td>' +
                '<td>' + lastAnnounce + '</td>' +
                '<td>' + announceResult + '</td>' +
                '<td>' + nextAnnounce + '</td>' +
                '<td>' + (tr.downloadCount >= 0 ? tr.downloadCount : '-') + '</td>' +
                '</tr>';
        }

        html += '</tbody></table>';

        html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-secondary)">' +
            '<div style="display:flex;gap:8px">' +
            '<button class="twc-btn" id="tracker-add-btn" style="font-size:11px;height:24px">添加Tracker</button>' +
            '<button class="twc-btn" id="tracker-replace-btn" style="font-size:11px;height:24px">替换Tracker</button>' +
            '</div>' +
            '</div>';

        $('#detail-content').html(html);

        var selectedIds = TWC.torrent.getSelectedIds();
        $('#tracker-add-btn').on('click', function() { TWC.uiDialog.showAddTracker(selectedIds); });
        $('#tracker-replace-btn').on('click', function() { TWC.uiDialog.showReplaceTracker(selectedIds); });
    }

    function _getSeederCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.trackerStats.length; i++) {
                if (t.trackerStats[i].seederCount > max) max = t.trackerStats[i].seederCount;
            }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    function _getLeecherCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.trackerStats.length; i++) {
                if (t.trackerStats[i].leecherCount > max) max = t.trackerStats[i].leecherCount;
            }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    return {
        render: render,
        switchTab: switchTab,
        update: update
    };
})();
