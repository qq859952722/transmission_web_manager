var TWC = TWC || {};

TWC.uiDetail = (function() {
    var _currentTab = 'general';

    function render() {
        _renderContent();
    }

    function switchTab(tab) {
        _currentTab = tab;
        if (tab === 'peers' || tab === 'speed' || tab === 'pieces') {
            _refreshCurrentTorrent();
        }
        _renderContent();
    }

    function _refreshCurrentTorrent() {
        var ids = TWC.torrent.getSelectedIds();
        if (ids.length !== 1) return;
        var fields = TWC.rpc.DETAIL_FIELDS;
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
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">' + TWC.i18n.t('detail.empty_msg') + '</span></div>');
            return;
        }
        if (ids.length > 1) {
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">' + TWC.i18n.t('detail.multi_msg').replace('{n}', ids.length) + '</span></div>');
            return;
        }

        var t = TWC.torrent.getTorrent(ids[0]);
        if (!t) {
            $content.html('<div class="twc-empty"><span style="color:var(--text-muted)">' + TWC.i18n.t('status.no_files') + '</span></div>');
            return;
        }

        switch (_currentTab) {
            case 'general': _renderGeneral(t); break;
            case 'files': _renderFiles(t); break;
            case 'trackers': _renderTrackers(t); break;
            case 'peers': TWC.uiDetailExtras.renderPeers(t); break;
            case 'pieces': _renderPieces(t); break;
            case 'speed': TWC.uiDetailExtras.renderSpeed(t); break;
            case 'settings': TWC.uiDetailExtras.renderSettings(t); break;
        }
    }

    function _renderGeneral(t) {
        var html = '<table class="twc-attr-table">';
        var rows = [
            [TWC.i18n.t('detail.general.name'), TWC.utils.escapeHtml(t.name)],
            [TWC.i18n.t('detail.general.id'), t.id],
            [TWC.i18n.t('detail.general.hash'), TWC.utils.escapeHtml(t.hash_string)],
            [TWC.i18n.t('detail.general.status'), TWC.utils.getStatusText(t.status)],
            [TWC.i18n.t('detail.general.progress'), TWC.utils.formatPercent(t.percent_done)],
            [TWC.i18n.t('detail.general.size'), TWC.utils.formatBytes(t.total_size)],
            [TWC.i18n.t('detail.general.downloaded'), TWC.utils.formatBytes(t.have_valid)],
            [TWC.i18n.t('detail.general.left'), TWC.utils.formatBytes(t.left_until_done)],
            [TWC.i18n.t('detail.speed.download'), TWC.utils.formatSpeed(t.rate_download)],
            [TWC.i18n.t('detail.speed.upload'), TWC.utils.formatSpeed(t.rate_upload)],
            [TWC.i18n.t('detail.general.downloaded'), TWC.utils.formatBytes(t.downloaded_ever)],
            [TWC.i18n.t('detail.general.uploaded'), TWC.utils.formatBytes(t.uploaded_ever)],
            [TWC.i18n.t('detail.general.ratio'), '<span class="' + TWC.utils.getRatioClass(t.upload_ratio) + '">' + TWC.utils.formatRatio(t.upload_ratio) + '</span>'],
            [TWC.i18n.t('detail.general.corrupt'), TWC.utils.formatBytes(t.corrupt_ever)],
            [TWC.i18n.t('columns.seeds'), _getSeederCount(t)],
            [TWC.i18n.t('columns.peers'), _getLeecherCount(t)],
            [TWC.i18n.t('detail.peers.title'), t.peers_connected],
            [TWC.i18n.t('detail.peers.sending'), t.peers_sending_to_us],
            [TWC.i18n.t('detail.peers.getting'), t.peers_getting_from_us],
            [TWC.i18n.t('detail.general.eta'), TWC.utils.formatETA(t.eta)],
            [TWC.i18n.t('detail.general.added_date'), TWC.utils.formatTimestamp(t.added_date)],
            [TWC.i18n.t('detail.general.done_date'), t.done_date > 0 ? TWC.utils.formatTimestamp(t.done_date) : '-'],
            [TWC.i18n.t('detail.general.activity'), TWC.utils.formatTimestamp(t.activity_date)],
            [TWC.i18n.t('detail.general.creator'), TWC.utils.escapeHtml(t.creator || '-')],
            [TWC.i18n.t('detail.general.created'), t.date_created > 0 ? TWC.utils.formatTimestamp(t.date_created) : '-'],
            [TWC.i18n.t('detail.general.comment'), TWC.utils.escapeHtml(t.comment || '-')],
            [TWC.i18n.t('detail.general.download_dir'), TWC.utils.escapeHtml(t.download_dir || '-')],
            [TWC.i18n.t('dialog.label.input_label').split('（')[0], TWC.utils.escapeHtml(t.labels ? t.labels.join(', ') : '-')],
            [TWC.i18n.t('detail.general.source'), TWC.utils.escapeHtml(t.source || '-')],
            [TWC.i18n.t('detail.general.mime'), TWC.utils.escapeHtml(t['primary_mime_type'] || '-')],
            [TWC.i18n.t('detail.general.private'), t.is_private ? TWC.i18n.t('common.yes') : TWC.i18n.t('common.no')],
            [TWC.i18n.t('detail.general.piece_count'), t.piece_count],
            [TWC.i18n.t('detail.general.piece_size'), TWC.utils.formatBytes(t.piece_size)],
            [TWC.i18n.t('detail.general.file_count'), t.file_count || '-'],
            [TWC.i18n.t('detail.general.torrent_file'), TWC.utils.escapeHtml(t.torrent_file || '-')],
            [TWC.i18n.t('sidebar.status_error'), t.error !== 0 ? '<span class="text-danger">' + TWC.utils.escapeHtml(t.error_string) + '</span>' : TWC.i18n.t('common.no')],
            [TWC.i18n.t('detail.general.group'), TWC.utils.escapeHtml(t.group || '-')],
            [TWC.i18n.t('detail.general.download_time'), TWC.utils.formatDuration(t.seconds_downloading)],
            [TWC.i18n.t('detail.general.upload_time'), TWC.utils.formatDuration(t.seconds_seeding)]
        ];

        for (var i = 0; i < rows.length; i++) {
            html += '<tr><td>' + rows[i][0] + '</td><td>' + rows[i][1] + '</td></tr>';
        }

        html += '</table>';
        $('#detail-content').html(html);
    }

    function _renderFiles(t) {
        if (!t.files || t.files.length === 0) {
            $('#detail-content').html('<div class="twc-empty">' + TWC.i18n.t('status.no_files') + '</div>');
            return;
        }

        var html = '<div class="twc-file-tree" id="file-tree">';
        for (var i = 0; i < t.files.length; i++) {
            var file = t.files[i];
            var stat = t.file_stats ? t.file_stats[i] : null;
            var wanted = stat ? stat.wanted : true;
            var priority = stat ? stat.priority : 0;
            var pct = file.length > 0 ? (file.bytes_completed / file.length * 100).toFixed(1) : '0.0';
            var priorityText = wanted ? TWC.utils.getFilePriorityText(priority) : TWC.i18n.t('dialog.settings.disabled');
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
            '<span style="font-size:11px;color:var(--text-muted)">' + TWC.i18n.t('detail.settings.priority') + ':</span>' +
            '<button class="twc-btn" id="file-priority-high" style="font-size:11px;height:24px">' + TWC.i18n.t('detail.settings.priority_high') + '</button>' +
            '<button class="twc-btn" id="file-priority-normal" style="font-size:11px;height:24px">' + TWC.i18n.t('detail.settings.priority_normal') + '</button>' +
            '<button class="twc-btn" id="file-priority-low" style="font-size:11px;height:24px">' + TWC.i18n.t('detail.settings.priority_low') + '</button>' +
            '<button class="twc-btn" id="file-priority-skip" style="font-size:11px;height:24px">' + TWC.i18n.t('dialog.settings.disabled') + '</button>' +
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
                    props.filesWanted = [idx];
                } else {
                    props.filesUnwanted = [idx];
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

        $('#file-priority-high').on('click', function() { _setSelectedFilesPriority(1); });
        $('#file-priority-normal').on('click', function() { _setSelectedFilesPriority(0); });
        $('#file-priority-low').on('click', function() { _setSelectedFilesPriority(-1); });
        $('#file-priority-skip').on('click', function() { _setSelectedFilesPriority(-2); });
    }

    function _cycleFilePriority(fileIndex) {
        var torrentIds = TWC.torrent.getSelectedIds();
        if (torrentIds.length === 0) return;
        var t = TWC.torrent.getTorrent(torrentIds[0]);
        if (!t || !t.file_stats || !t.file_stats[fileIndex]) return;

        var current = t.file_stats[fileIndex].priority;
        var wanted = t.file_stats[fileIndex].wanted;
        var props = {};
        var nextWanted, nextPriority;

        if (!wanted) {
            props.filesWanted = [fileIndex];
            props.priorityLow = [fileIndex];
            nextWanted = true;
            nextPriority = -1;
        } else {
            var next = current === -1 ? 0 : (current === 0 ? 1 : -1);
            if (next === 1) props.priorityHigh = [fileIndex];
            else if (next === 0) props.priorityNormal = [fileIndex];
            else props.priorityLow = [fileIndex];
            nextWanted = true;
            nextPriority = next;
        }

        TWC.rpc.setTorrent(torrentIds, props, function(success) {
            if (success) {
                t.file_stats[fileIndex].wanted = nextWanted;
                t.file_stats[fileIndex].priority = nextPriority;
                _renderFiles(t);
                TWC.ui.refreshData(true);
            }
        });
    }

    function _setSelectedFilesPriority(priority) {
        var torrentIds = TWC.torrent.getSelectedIds();
        if (torrentIds.length === 0) return;
        var t = TWC.torrent.getTorrent(torrentIds[0]);
        if (!t || !t.file_stats) return;

        var indices = [];
        $('.file-checkbox:checked').each(function() {
            indices.push(parseInt($(this).data('index')));
        });

        if (indices.length === 0) return;

        var props = {};
        var localPriority;
        if (priority === -1) {
            props.filesUnwanted = indices;
            localPriority = -2;
        } else if (priority === 2) {
            props.filesWanted = indices;
            props.priorityHigh = indices;
            localPriority = 1;
        } else if (priority === 1) {
            props.filesWanted = indices;
            props.priorityNormal = indices;
            localPriority = 0;
        } else {
            props.filesWanted = indices;
            props.priorityLow = indices;
            localPriority = -1;
        }

        TWC.rpc.setTorrent(torrentIds, props, function(success) {
            if (success) {
                for (var k = 0; k < indices.length; k++) {
                    var idx = indices[k];
                    if (t.file_stats[idx]) {
                        t.file_stats[idx].wanted = (localPriority !== -2);
                        t.file_stats[idx].priority = localPriority;
                    }
                }
                _renderFiles(t);
                TWC.ui.refreshData(true);
            }
        });
    }

    function _renderTrackers(t) {
        if (!t.tracker_stats || t.tracker_stats.length === 0) {
            $('#detail-content').html('<div class="twc-empty">' + TWC.i18n.t('status.no_trackers') + '</div>');
            return;
        }

        var html = '<table class="twc-tracker-table">' +
            '<thead><tr>' +
            '<th>#</th>' +
            '<th>Tracker</th>' +
            '<th>' + TWC.i18n.t('detail.general.status') + '</th>' +
            '<th>' + TWC.i18n.t('columns.seeds') + '</th>' +
            '<th>' + TWC.i18n.t('columns.peers') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.activity') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.done_date') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.left') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.downloaded') + '</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < t.tracker_stats.length; i++) {
            var tr = t.tracker_stats[i];
            var state = tr.announce_state;
            var stateText = '';
            switch (state) {
                case 0: stateText = TWC.i18n.t('status.stopped'); break;
                case 1: stateText = TWC.i18n.t('status.check_wait'); break;
                case 2: stateText = TWC.i18n.t('sidebar.status_queued'); break;
                case 3: stateText = TWC.i18n.t('sidebar.status_active'); break;
                default: stateText = TWC.i18n.t('times.unknown'); break;
            }
            var lastAnnounce = tr.last_announce_time > 0 ? TWC.utils.formatTimestamp(tr.last_announce_time) : '-';
            var nextAnnounce = tr.next_announce_time > 0 ? TWC.utils.formatTimestamp(tr.next_announce_time) : '-';
            var announceResult = tr.last_announce_succeeded ? TWC.i18n.t('dialog.settings.testing').replace('...', '') : TWC.utils.escapeHtml(tr.last_announce_result || '-');

            html += '<tr>' +
                '<td>' + (i + 1) + '</td>' +
                '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis" title="' + TWC.utils.escapeHtml(tr.announce) + '">' + TWC.utils.escapeHtml(tr.announce) + '</td>' +
                '<td>' + stateText + '</td>' +
                '<td>' + (tr.seeder_count >= 0 ? tr.seeder_count : '-') + '</td>' +
                '<td>' + (tr.leecher_count >= 0 ? tr.leecher_count : '-') + '</td>' +
                '<td>' + lastAnnounce + '</td>' +
                '<td>' + announceResult + '</td>' +
                '<td>' + nextAnnounce + '</td>' +
                '<td>' + (tr.download_count >= 0 ? tr.download_count : '-') + '</td>' +
                '</tr>';
        }

        html += '</tbody></table>';

        html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-secondary)">' +
            '<div style="display:flex;gap:8px">' +
            '<button class="twc-btn" id="tracker-add-btn" style="font-size:11px;height:24px">' + TWC.i18n.t('dialog.tracker.add_title') + '</button>' +
            '<button class="twc-btn" id="tracker-replace-btn" style="font-size:11px;height:24px">' + TWC.i18n.t('dialog.tracker.replace_title') + '</button>' +
            '</div>' +
            '</div>';

        $('#detail-content').html(html);

        var selectedIds = TWC.torrent.getSelectedIds();
        $('#tracker-add-btn').on('click', function() { TWC.uiDialog.showAddTracker(selectedIds); });
        $('#tracker-replace-btn').on('click', function() { TWC.uiDialog.showReplaceTracker(selectedIds); });
    }

    function _getSeederCount(t) {
        if (t.tracker_stats && t.tracker_stats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.tracker_stats.length; i++) {
                if (t.tracker_stats[i].seeder_count > max) max = t.tracker_stats[i].seeder_count;
            }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    function _getLeecherCount(t) {
        if (t.tracker_stats && t.tracker_stats.length > 0) {
            var max = -1;
            for (var i = 0; i < t.tracker_stats.length; i++) {
                if (t.tracker_stats[i].leecher_count > max) max = t.tracker_stats[i].leecher_count;
            }
            return max >= 0 ? max : '-';
        }
        return '-';
    }

    function _renderPieces(t) {
        var html = '<div style="padding:12px">';

        html += '<div style="display:flex;gap:16px;margin-bottom:12px;font-size:12px;color:var(--text-secondary)">';
        html += '<span>' + TWC.i18n.t('detail.general.piece_count') + ': <strong style="color:var(--text-primary)">' + (t.piece_count || '-') + '</strong></span>';
        html += '<span>' + TWC.i18n.t('detail.general.piece_size') + ': <strong style="color:var(--text-primary)">' + TWC.utils.formatBytes(t.piece_size) + '</strong></span>';
        html += '<span>' + TWC.i18n.t('detail.general.file_count') + ': <strong style="color:var(--text-primary)">' + (t.file_count || '-') + '</strong></span>';
        html += '</div>';

        if (!t.pieces || !t.piece_count || t.piece_count <= 0) {
            html += '<div style="color:var(--text-muted);text-align:center;padding:20px">' +
                (TWC.i18n.t('detail.pieces.no_data') || '暂无分片数据') + '</div>';
            html += '</div>';
            $('#detail-content').html(html);
            return;
        }

        try {
            var raw = atob(t.pieces);
            var pieceStates = [];
            var completed = 0;
            var bitIndex = 0;
            for (var i = 0; i < raw.length && bitIndex < t.piece_count; i++) {
                var byte = raw.charCodeAt(i);
                for (var bit = 7; bit >= 0 && bitIndex < t.piece_count; bit--) {
                    var done = (byte >> bit) & 1;
                    pieceStates.push(done);
                    if (done) completed++;
                    bitIndex++;
                }
            }

            var pct = t.piece_count > 0 ? (completed / t.piece_count * 100).toFixed(1) : 0;

            html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">';
            html += '<div style="flex:1;height:22px;background:var(--bg-tertiary,#e5e7eb);border-radius:4px;overflow:hidden;position:relative">';
            html += '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--color-success,#22c55e),var(--color-primary,#3b82f6));border-radius:4px;transition:width 0.3s"></div>';
            html += '</div>';
            html += '<span style="font-size:14px;font-weight:600;color:var(--text-primary);white-space:nowrap">' + pct + '%</span>';
            html += '</div>';

            html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;font-size:12px">';
            html += '<span style="display:flex;align-items:center;gap:4px;color:var(--text-secondary)">' +
                '<span style="display:inline-block;width:12px;height:12px;background:var(--color-success,#22c55e);border-radius:2px;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.2)"></span>' +
                TWC.i18n.t('detail.general.pieces_done') + ': <strong>' + completed + '</strong></span>';
            html += '<span style="display:flex;align-items:center;gap:4px;color:var(--text-secondary)">' +
                '<span style="display:inline-block;width:12px;height:12px;background:var(--bg-tertiary,#d1d5db);border-radius:2px;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.15)"></span>' +
                TWC.i18n.t('detail.general.pieces_pending') + ': <strong>' + (t.piece_count - completed) + '</strong></span>';
            html += '</div>';

            var canvasWidth = $('#detail-content').width() - 28;
            if (canvasWidth < 280) canvasWidth = 400;
            var cellSize = t.piece_count > 8000 ? 3 : (t.piece_count > 3000 ? 4 : 5);
            var gap = 1;
            var step = cellSize + gap;
            var cols = Math.floor(canvasWidth / step);
            if (cols < 1) cols = 1;
            var rowCount = Math.ceil(t.piece_count / cols);

            var canvasH = rowCount * step - gap;
            if (canvasH < 10) canvasH = rowCount * step;

            html += '<div style="background:var(--bg-secondary,#f3f4f6);border:1px solid var(--border-primary,#e5e7eb);border-radius:6px;padding:10px;overflow:hidden">';
            html += '<canvas id="pieces-canvas" width="' + (cols * step - gap) + '" height="' + canvasH + '" ' +
                'style="width:' + (cols * step - gap) + 'px;height:' + canvasH + 'px;display:block"></canvas>';
            html += '</div>';

            html += '</div>';

            _pendingPiecesRender = {
                states: pieceStates,
                cols: cols,
                cellSize: cellSize,
                gap: gap,
                step: step
            };

            $('#detail-content').html(html);
            _drawPiecesCanvas();
        } catch (e) {
            html += '<div style="color:var(--text-muted);text-align:center;padding:20px">' +
                (TWC.i18n.t('detail.pieces.no_data') || '暂无分片数据') + '</div>';
            html += '</div>';
            $('#detail-content').html(html);
        }
    }

    var _pendingPiecesRender = null;

    function _drawPiecesCanvas() {
        if (!_pendingPiecesRender) return;
        var p = _pendingPiecesRender;
        _pendingPiecesRender = null;
        var c = document.getElementById('pieces-canvas');
        if (!c) return;
        var ctx = c.getContext('2d');
        var styles = getComputedStyle(document.documentElement);
        var doneColor = styles.getPropertyValue('--color-success').trim() || '#22c55e';
        var pendingColor = styles.getPropertyValue('--bg-tertiary').trim() || '#d1d5db';

        ctx.clearRect(0, 0, c.width, c.height);

        for (var i = 0; i < p.states.length; i++) {
            var col = i % p.cols;
            var row = Math.floor(i / p.cols);
            var x = col * p.step;
            var y = row * p.step;
            var s = p.cellSize;

            if (p.states[i]) {
                ctx.fillStyle = doneColor;
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(x, y, s, 1);
                ctx.fillRect(x, y, 1, s);
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(x, y + s - 1, s, 1);
                ctx.fillRect(x + s - 1, y, 1, s);
            } else {
                ctx.fillStyle = pendingColor;
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(x, y, s, 1);
                ctx.fillRect(x, y, 1, s);
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                ctx.fillRect(x, y + s - 1, s, 1);
                ctx.fillRect(x + s - 1, y, 1, s);
            }
        }
    }

    return {
        render: render,
        switchTab: switchTab,
        update: update
    };
})();
