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
            [TWC.i18n.t('columns.queue'), t.queue_position !== undefined ? t.queue_position : '-'],
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
        if (priority === -2) {
            props.filesUnwanted = indices;
            localPriority = -2;
        } else if (priority === 1) {
            props.filesWanted = indices;
            props.priorityHigh = indices;
            localPriority = 1;
        } else if (priority === 0) {
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

    var _trackerDataCache = [];

    function _renderTrackers(t) {
        if (!t.tracker_stats || t.tracker_stats.length === 0) {
            $('#detail-content').html('<div class="twc-empty">' + TWC.i18n.t('status.no_trackers') + '</div>');
            return;
        }

        _trackerDataCache = t.tracker_stats;

        var html = '<table class="twc-tracker-table">' +
            '<thead><tr>' +
            '<th>#</th>' +
            '<th>Tracker</th>' +
            '<th>' + TWC.i18n.t('detail.general.status') + '</th>' +
            '<th>' + TWC.i18n.t('columns.seeds') + '</th>' +
            '<th>' + TWC.i18n.t('columns.peers') + '</th>' +
            '<th>' + TWC.i18n.t('detail.trackers.downloader_count') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.activity') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.done_date') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.left') + '</th>' +
            '<th>' + TWC.i18n.t('detail.general.downloaded') + '</th>' +
            '<th></th>' +
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
            var backupTag = tr.is_backup ? ' <span style="font-size:10px;color:var(--text-muted);background:var(--bg-secondary);padding:0 4px;border-radius:3px">' + TWC.i18n.t('detail.trackers.backup') + '</span>' : '';

            html += '<tr>' +
                '<td>' + (i + 1) + '</td>' +
                '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis" title="' + TWC.utils.escapeHtml(tr.announce) + '">' + TWC.utils.escapeHtml(tr.announce) + backupTag + '</td>' +
                '<td>' + stateText + '</td>' +
                '<td>' + (tr.seeder_count >= 0 ? tr.seeder_count : '-') + '</td>' +
                '<td>' + (tr.leecher_count >= 0 ? tr.leecher_count : '-') + '</td>' +
                '<td>' + (tr.downloader_count >= 0 ? tr.downloader_count : '-') + '</td>' +
                '<td>' + lastAnnounce + '</td>' +
                '<td>' + announceResult + '</td>' +
                '<td>' + nextAnnounce + '</td>' +
                '<td>' + (tr.download_count >= 0 ? tr.download_count : '-') + '</td>' +
                '<td><button class="twc-peer-detail-btn" data-tracker-idx="' + i + '" title="' + TWC.i18n.t('detail.trackers.detail_btn') + '">ⓘ</button></td>' +
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

        $(document).off('click.twcTrackerDetail').on('click.twcTrackerDetail', '.twc-tracker-table .twc-peer-detail-btn', function() {
            var idx = parseInt($(this).attr('data-tracker-idx'));
            if (idx >= 0 && idx < _trackerDataCache.length) {
                _showTrackerDetail(_trackerDataCache[idx]);
            }
        });
    }

    function _showTrackerDetail(tr) {
        var existing = document.getElementById('twc-peer-detail-overlay');
        if (existing) existing.remove();

        function boolTag(val) {
            return val ? '<span class="twc-peer-tag twc-peer-tag-yes">' + TWC.i18n.t('common.yes') + '</span>' :
                         '<span class="twc-peer-tag twc-peer-tag-no">' + TWC.i18n.t('common.no') + '</span>';
        }

        function detailRow(label, value) {
            return '<div class="twc-peer-detail-row"><span class="twc-peer-detail-label">' + label + '</span><span class="twc-peer-detail-value">' + value + '</span></div>';
        }

        function timeOrDash(ts) {
            return ts > 0 ? TWC.utils.formatTimestamp(ts) : '-';
        }

        function countOrDash(val) {
            return (val !== undefined && val >= 0) ? val : '-';
        }

        var announceStateText = '';
        switch (tr.announce_state) {
            case 0: announceStateText = TWC.i18n.t('status.stopped'); break;
            case 1: announceStateText = TWC.i18n.t('status.check_wait'); break;
            case 2: announceStateText = TWC.i18n.t('sidebar.status_queued'); break;
            case 3: announceStateText = TWC.i18n.t('sidebar.status_active'); break;
            default: announceStateText = TWC.i18n.t('times.unknown'); break;
        }

        var scrapeStateText = '';
        switch (tr.scrape_state) {
            case 0: scrapeStateText = TWC.i18n.t('status.stopped'); break;
            case 1: scrapeStateText = TWC.i18n.t('sidebar.status_queued'); break;
            case 2: scrapeStateText = TWC.i18n.t('sidebar.status_active'); break;
            default: scrapeStateText = TWC.i18n.t('times.unknown'); break;
        }

        var announceResultHtml = tr.last_announce_succeeded ?
            '<span style="color:var(--color-success-500)">' + TWC.i18n.t('dialog.settings.testing').replace('...', '') + '</span>' :
            '<span style="color:var(--color-danger-500)">' + TWC.utils.escapeHtml(tr.last_announce_result || '-') + '</span>';

        var scrapeResultHtml = tr.last_scrape_succeeded ?
            '<span style="color:var(--color-success-500)">' + TWC.i18n.t('dialog.settings.testing').replace('...', '') + '</span>' :
            '<span style="color:var(--color-danger-500)">' + TWC.utils.escapeHtml(tr.last_scrape_result || '-') + '</span>';

        var html = '<div class="twc-peer-detail-overlay" id="twc-peer-detail-overlay">' +
            '<div class="twc-peer-detail-glass">' +
            '<div class="twc-peer-detail-header">' +
            '<div class="twc-peer-detail-title" style="font-size:13px;word-break:break-all">' + TWC.utils.escapeHtml(tr.announce) + '</div>' +
            '<button class="twc-peer-detail-close" id="twc-tracker-detail-close">&times;</button>' +
            '</div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.trackers.detail_basic') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            detailRow(TWC.i18n.t('detail.trackers.detail_host'), '<span class="text-mono">' + TWC.utils.escapeHtml(tr.host || '-') + '</span>') +
            detailRow(TWC.i18n.t('detail.trackers.detail_sitename'), TWC.utils.escapeHtml(tr.sitename || '-')) +
            detailRow(TWC.i18n.t('detail.trackers.detail_tier'), tr.tier !== undefined ? tr.tier : '-') +
            detailRow(TWC.i18n.t('detail.trackers.backup'), boolTag(tr.is_backup)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_scrape_url'), '<span class="text-mono" style="font-size:10px;word-break:break-all">' + TWC.utils.escapeHtml(tr.scrape || '-') + '</span>') +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.trackers.detail_announce') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            detailRow(TWC.i18n.t('detail.general.status'), announceStateText) +
            detailRow(TWC.i18n.t('detail.trackers.detail_has_announced'), boolTag(tr.has_announced)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_last_announce'), timeOrDash(tr.last_announce_time)) +
            detailRow(TWC.i18n.t('detail.general.left'), timeOrDash(tr.next_announce_time)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_announce_result'), announceResultHtml) +
            detailRow(TWC.i18n.t('detail.trackers.detail_announce_timed_out'), boolTag(tr.last_announce_timed_out)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_announce_start_time'), timeOrDash(tr.last_announce_start_time)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_announce_peer_count'), countOrDash(tr.last_announce_peer_count)) +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.trackers.detail_scrape') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            detailRow(TWC.i18n.t('detail.general.status'), scrapeStateText) +
            detailRow(TWC.i18n.t('detail.trackers.detail_has_scraped'), boolTag(tr.has_scraped)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_last_scrape'), timeOrDash(tr.last_scrape_time)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_next_scrape'), timeOrDash(tr.next_scrape_time)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_scrape_result'), scrapeResultHtml) +
            detailRow(TWC.i18n.t('detail.trackers.detail_scrape_timed_out'), boolTag(tr.last_scrape_timed_out)) +
            detailRow(TWC.i18n.t('detail.trackers.detail_scrape_start_time'), timeOrDash(tr.last_scrape_start_time)) +
            '</div></div>' +

            '<div class="twc-peer-detail-section">' +
            '<div class="twc-peer-detail-section-title">' + TWC.i18n.t('detail.trackers.detail_stats') + '</div>' +
            '<div class="twc-peer-detail-grid">' +
            detailRow(TWC.i18n.t('columns.seeds'), countOrDash(tr.seeder_count)) +
            detailRow(TWC.i18n.t('columns.peers'), countOrDash(tr.leecher_count)) +
            detailRow(TWC.i18n.t('detail.trackers.downloader_count'), countOrDash(tr.downloader_count)) +
            detailRow(TWC.i18n.t('detail.general.downloaded'), countOrDash(tr.download_count)) +
            '</div></div>' +

            '</div></div>';

        $('body').append(html);

        requestAnimationFrame(function() {
            var overlay = document.getElementById('twc-peer-detail-overlay');
            if (overlay) overlay.classList.add('twc-peer-detail-visible');
        });

        $(document).off('click.twcTrackerDetailClose').on('click.twcTrackerDetailClose', '#twc-tracker-detail-close, #twc-peer-detail-overlay', function(e) {
            if (e.target.id === 'twc-peer-detail-overlay' || e.target.id === 'twc-tracker-detail-close') {
                _closeTrackerDetail();
            }
        });

        $(document).off('keydown.twcTrackerDetail').on('keydown.twcTrackerDetail', function(e) {
            if (e.key === 'Escape') _closeTrackerDetail();
        });
    }

    function _closeTrackerDetail() {
        var overlay = document.getElementById('twc-peer-detail-overlay');
        if (overlay) {
            overlay.classList.remove('twc-peer-detail-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        }
        $(document).off('click.twcTrackerDetailClose keydown.twcTrackerDetail');
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
        var html = '<div class="twc-pieces-panel">';

        html += '<div class="twc-pieces-stats-row">';
        html += '<span>' + TWC.i18n.t('detail.general.piece_count') + ': <strong>' + (t.piece_count || '-') + '</strong></span>';
        html += '<span>' + TWC.i18n.t('detail.general.piece_size') + ': <strong>' + TWC.utils.formatBytes(t.piece_size) + '</strong></span>';
        html += '<span>' + TWC.i18n.t('detail.general.file_count') + ': <strong>' + (t.file_count || '-') + '</strong></span>';
        html += '</div>';

        if (!t.pieces || !t.piece_count || t.piece_count <= 0) {
            html += '<div class="twc-pieces-empty">' +
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
            var availability = t.availability || [];

            html += '<div class="twc-pieces-progress-row">';
            html += '<div class="twc-pieces-progress-track"><div class="twc-pieces-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '<span class="twc-pieces-progress-pct">' + pct + '%</span>';
            html += '</div>';

            html += '<div class="twc-pieces-legend">';
            html += '<span class="twc-pieces-legend-item"><span class="twc-pieces-legend-dot" style="background:#3b82f6"></span>' + TWC.i18n.t('detail.general.pieces_done') + ': <strong>' + completed + '</strong></span>';
            if (availability.length > 0) {
                var availStats = { none: 0, low: 0, mid: 0, high: 0 };
                for (var ai = 0; ai < availability.length; ai++) {
                    if (pieceStates[ai]) continue;
                    var av = availability[ai];
                    if (av < 0 || av === 0) availStats.none++;
                    else if (av === 1) availStats.low++;
                    else if (av <= 3) availStats.mid++;
                    else availStats.high++;
                }
                html += '<span class="twc-pieces-legend-item"><span class="twc-pieces-legend-dot" style="background:#ef4444"></span>' + TWC.i18n.t('detail.pieces.availability_none') + ': <strong>' + availStats.none + '</strong></span>';
                html += '<span class="twc-pieces-legend-item"><span class="twc-pieces-legend-dot" style="background:#f59e0b"></span>' + TWC.i18n.t('detail.pieces.availability_low') + ': <strong>' + availStats.low + '</strong></span>';
                html += '<span class="twc-pieces-legend-item"><span class="twc-pieces-legend-dot" style="background:#84cc16"></span>' + TWC.i18n.t('detail.pieces.availability_high') + ': <strong>' + (availStats.mid + availStats.high) + '</strong></span>';
            } else {
                html += '<span class="twc-pieces-legend-item"><span class="twc-pieces-legend-dot" style="background:var(--bg-tertiary,#d1d5db)"></span>' + TWC.i18n.t('detail.general.pieces_pending') + ': <strong>' + (t.piece_count - completed) + '</strong></span>';
            }
            html += '</div>';

            var canvasWidth = $('#detail-content').width() - 48;
            if (canvasWidth < 300) canvasWidth = 420;
            var cellSize = t.piece_count > 8000 ? 6 : (t.piece_count > 3000 ? 7 : 8);
            var gap = 1;
            var step = cellSize + gap;
            var cols = Math.floor(canvasWidth / step);
            if (cols < 1) cols = 1;
            var rowCount = Math.ceil(t.piece_count / cols);

            var canvasH = rowCount * step - gap;
            if (canvasH < 10) canvasH = rowCount * step;

            html += '<div class="twc-pieces-canvas-frame">';
            html += '<canvas id="pieces-canvas" width="' + (cols * step - gap) + '" height="' + canvasH + '" ' +
                'style="width:' + (cols * step - gap) + 'px;height:' + canvasH + 'px;display:block"></canvas>';
            html += '</div>';

            html += '</div>';

            _pendingPiecesRender = {
                states: pieceStates,
                availability: availability,
                cols: cols,
                cellSize: cellSize,
                gap: gap,
                step: step
            };

            $('#detail-content').html(html);
            _drawPiecesCanvas();
        } catch (e) {
            html += '<div class="twc-pieces-empty">' +
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
        var doneColor = '#3b82f6';
        var pendingColor = styles.getPropertyValue('--bg-tertiary').trim() || '#d1d5db';

        ctx.clearRect(0, 0, c.width, c.height);

        for (var i = 0; i < p.states.length; i++) {
            var col = i % p.cols;
            var row = Math.floor(i / p.cols);
            var x = col * p.step;
            var y = row * p.step;
            var s = p.cellSize;
            var fillColor;

            if (p.states[i]) {
                fillColor = doneColor;
            } else if (p.availability && p.availability.length > i) {
                var av = p.availability[i];
                if (av < 0) {
                    fillColor = pendingColor;
                } else if (av === 0) {
                    fillColor = '#ef4444';
                } else if (av === 1) {
                    fillColor = '#f59e0b';
                } else if (av <= 3) {
                    fillColor = '#84cc16';
                } else {
                    fillColor = '#22c55e';
                }
            } else {
                fillColor = pendingColor;
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x, y, s, 1);
            ctx.fillRect(x, y, 1, s);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x, y + s - 1, s, 1);
            ctx.fillRect(x + s - 1, y, 1, s);
        }
    }

    return {
        render: render,
        switchTab: switchTab,
        update: update
    };
})();
