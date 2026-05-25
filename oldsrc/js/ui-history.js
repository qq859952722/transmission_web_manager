var TWC = TWC || {};

TWC.uiHistory = (function() {
    var _currentFilter = '';
    var _currentSort = 'deletedAt';
    var _currentSortOrder = 'desc';

    function showHistory() {
        if (!TWC.dbCache) {
            TWC.ui.showToast(TWC.i18n.t('history.db_unavailable') || 'IndexedDB not available', 'error');
            return;
        }

        TWC.dbCache.history.getAllTorrents(function(torrents) {
            _renderHistoryPage(torrents);
        });
    }

    function _renderHistoryPage(torrents) {
        torrents = _sortTorrents(torrents, _currentSort, _currentSortOrder);

        var totalCount = torrents.length;

        var html = '<div class="twc-history-page">' +

            '<div class="twc-history-toolbar">' +
            '<div class="twc-history-search">' +
            '<input type="text" id="history-search" placeholder="' + (TWC.i18n.t('history.search_placeholder') || 'Search name, hash, tracker...') + '" value="' + TWC.utils.escapeAttr(_currentFilter) + '" />' +
            '</div>' +
            '<div class="twc-history-actions">' +
            '<button class="twc-btn" id="history-export-json" title="Export JSON">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            ' ' + (TWC.i18n.t('history.export_json') || 'Export JSON') +
            '</button>' +
            '<button class="twc-btn" id="history-export-csv" title="Export CSV">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
            ' ' + (TWC.i18n.t('history.export_csv') || 'Export CSV') +
            '</button>' +
            '<button class="twc-btn danger" id="history-clear-all">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            ' ' + (TWC.i18n.t('history.clear_all') || 'Clear All') +
            '</button>' +
            '</div>' +
            '</div>' +

            '<div class="twc-history-count">' +
            (TWC.i18n.t('history.total') || 'Total').replace('{n}', totalCount) +
            '</div>' +

            '<div class="twc-history-list" id="history-list">' +
            _renderTorrentList(torrents) +
            '</div>' +

            '</div>';

        TWC.ui.showModal(html, {
            title: TWC.i18n.t('history.title') || 'History',
            size: 'xl'
        });

        _bindHistoryEvents(torrents);
    }

    function _renderTorrentList(torrents) {
        if (torrents.length === 0) {
            return '<div class="twc-history-empty">' +
                (TWC.i18n.t('history.empty') || 'No history records') +
                '</div>';
        }

        var html = '<table class="twc-history-table">' +
            '<thead><tr>' +
            '<th class="sortable" data-sort="name">' + (TWC.i18n.t('columns.name') || 'Name') + _sortIcon('name') + '</th>' +
            '<th class="sortable" data-sort="total_size">' + (TWC.i18n.t('columns.size') || 'Size') + _sortIcon('total_size') + '</th>' +
            '<th class="sortable" data-sort="downloaded_ever">' + (TWC.i18n.t('columns.downloaded') || 'Downloaded') + _sortIcon('downloaded_ever') + '</th>' +
            '<th class="sortable" data-sort="uploaded_ever">' + (TWC.i18n.t('columns.uploaded') || 'Uploaded') + _sortIcon('uploaded_ever') + '</th>' +
            '<th class="sortable" data-sort="upload_ratio">' + (TWC.i18n.t('columns.ratio') || 'Ratio') + _sortIcon('upload_ratio') + '</th>' +
            '<th class="sortable" data-sort="addedDate">' + (TWC.i18n.t('columns.added') || 'Added') + _sortIcon('addedDate') + '</th>' +
            '<th class="sortable" data-sort="deletedAt">' + (TWC.i18n.t('history.deleted_at') || 'Deleted') + _sortIcon('deletedAt') + '</th>' +
            '<th>' + (TWC.i18n.t('history.actions') || 'Actions') + '</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < torrents.length; i++) {
            var t = torrents[i];
            html += '<tr data-hash="' + TWC.utils.escapeAttr(t.hash_string) + '">' +
                '<td class="twc-history-name" title="' + TWC.utils.escapeAttr(t.name || '') + '">' +
                TWC.utils.escapeHtml(TWC.utils.truncateText(t.name, 50)) +
                (t.labels && t.labels.length > 0 ? ' <span class="twc-history-labels">' + t.labels.map(function(l) { return TWC.utils.escapeHtml(l); }).join(', ') + '</span>' : '') +
                '</td>' +
                '<td>' + TWC.utils.formatBytes(t.total_size || 0) + '</td>' +
                '<td>' + TWC.utils.formatBytes(t.downloaded_ever || 0) + '</td>' +
                '<td>' + TWC.utils.formatBytes(t.uploaded_ever || 0) + '</td>' +
                '<td>' + TWC.utils.formatRatio(t.upload_ratio) + '</td>' +
                '<td>' + TWC.utils.formatTimestamp(t.addedDate) + '</td>' +
                '<td>' + TWC.utils.formatTimestamp(t.deletedAt) + '</td>' +
                '<td>' +
                '<button class="twc-btn-sm history-detail-btn" data-hash="' + TWC.utils.escapeAttr(t.hash_string) + '" title="' + (TWC.i18n.t('history.view_detail') || 'View Detail') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                '</button>' +
                '<button class="twc-btn-sm history-delete-btn danger" data-hash="' + TWC.utils.escapeAttr(t.hash_string) + '" title="' + (TWC.i18n.t('history.delete_record') || 'Delete Record') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
                '</button>' +
                '</td>' +
                '</tr>';
        }

        html += '</tbody></table>';
        return html;
    }

    function _sortIcon(field) {
        if (_currentSort !== field) return '';
        return ' <span class="sort-indicator">' + (_currentSortOrder === 'asc' ? '↑' : '↓') + '</span>';
    }

    function _sortTorrents(torrents, field, order) {
        return _.orderBy(torrents, function(t) {
            var val = t[field];
            if (val === undefined || val === null) {
                return field === 'name' ? '' : 0;
            }
            return val;
        }, [order]);
    }

    function _bindHistoryEvents(torrents) {
        $('#history-search').off('input').on('input', TWC.utils.debounce(function() {
            _currentFilter = $(this).val().trim();
            _refreshList();
        }, 300));

        $(document).off('click.historySort').on('click.historySort', '.twc-history-table th.sortable', function() {
            var field = $(this).data('sort');
            if (_currentSort === field) {
                _currentSortOrder = _currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                _currentSort = field;
                _currentSortOrder = 'asc';
            }
            _refreshList();
        });

        $(document).off('click.historyDetail').on('click.historyDetail', '.history-detail-btn', function() {
            var hash = $(this).data('hash');
            _showTorrentDetail(hash);
        });

        $(document).off('click.historyDelete').on('click.historyDelete', '.history-delete-btn', function() {
            var hash = $(this).data('hash');
            if (confirm(TWC.i18n.t('history.confirm_delete') || 'Delete this history record?')) {
                TWC.dbCache.history.deleteTorrent(hash, function(success) {
                    if (success) {
                        TWC.ui.showToast(TWC.i18n.t('history.record_deleted') || 'Record deleted', 'success');
                        _refreshList();
                    }
                });
            }
        });

        $('#history-export-json').off('click').on('click', function() {
            _exportJSON();
        });

        $('#history-export-csv').off('click').on('click', function() {
            _exportCSV();
        });

        $('#history-clear-all').off('click').on('click', function() {
            if (confirm(TWC.i18n.t('history.confirm_clear') || 'Clear all history records? This cannot be undone.')) {
                TWC.dbCache.history.clearAll(function(success) {
                    if (success) {
                        TWC.ui.showToast(TWC.i18n.t('history.cleared') || 'History cleared', 'success');
                        _refreshList();
                    }
                });
            }
        });
    }

    function _refreshList() {
        TWC.dbCache.history.getAllTorrents(function(torrents) {
            if (_currentFilter) {
                var search = _currentFilter.toLowerCase();
                torrents = torrents.filter(function(t) {
                    return (t.name || '').toLowerCase().indexOf(search) !== -1 ||
                        (t.hash_string || '').toLowerCase().indexOf(search) !== -1 ||
                        (t.download_dir || '').toLowerCase().indexOf(search) !== -1 ||
                        (t.labels && t.labels.some(function(l) { return l.toLowerCase().indexOf(search) !== -1; }));
                });
            }
            torrents = _sortTorrents(torrents, _currentSort, _currentSortOrder);
            $('#history-list').html(_renderTorrentList(torrents));
            $('.twc-history-count').text((TWC.i18n.t('history.total') || 'Total').replace('{n}', torrents.length));
        });
    }

    function _showTorrentDetail(hash) {
        TWC.dbCache.history.getAllTorrents(function(torrents) {
            var t = null;
            for (var i = 0; i < torrents.length; i++) {
                if (torrents[i].hash_string === hash) { t = torrents[i]; break; }
            }
            if (!t) return;

            TWC.dbCache.history.getSnapshots(hash, function(snapshots) {
                var html = '<div class="twc-history-detail">' +

                    '<div class="twc-stats-section">' +
                    '<div class="twc-stats-section-title">' + (TWC.i18n.t('history.detail_info') || 'Torrent Info') + '</div>' +
                    '<div class="twc-stats-info-grid">' +
                    _infoRow(TWC.i18n.t('columns.name') || 'Name', t.name || '-') +
                    _infoRow(TWC.i18n.t('columns.hash') || 'Hash', t.hash_string || '-') +
                    _infoRow(TWC.i18n.t('columns.size') || 'Size', TWC.utils.formatBytes(t.total_size || 0)) +
                    _infoRow(TWC.i18n.t('columns.downloaded') || 'Downloaded', TWC.utils.formatBytes(t.downloaded_ever || 0)) +
                    _infoRow(TWC.i18n.t('columns.uploaded') || 'Uploaded', TWC.utils.formatBytes(t.uploaded_ever || 0)) +
                    _infoRow(TWC.i18n.t('columns.ratio') || 'Ratio', TWC.utils.formatRatio(t.upload_ratio)) +
                    _infoRow(TWC.i18n.t('detail.general.added') || 'Added', TWC.utils.formatTimestamp(t.addedDate)) +
                    _infoRow(TWC.i18n.t('history.deleted_at') || 'Deleted', TWC.utils.formatTimestamp(t.deletedAt)) +
                    _infoRow(TWC.i18n.t('dialog.add.download_dir') || 'Download Dir', t.download_dir || '-') +
                    (t.labels && t.labels.length > 0 ? _infoRow(TWC.i18n.t('sidebar.labels') || 'Labels', t.labels.join(', ')) : '') +
                    (t.comment ? _infoRow(TWC.i18n.t('detail.general.comment') || 'Comment', t.comment) : '') +
                    (t.creator ? _infoRow(TWC.i18n.t('detail.general.creator') || 'Creator', t.creator) : '') +
                    '</div></div>';

                if (snapshots.length > 0) {
                    html += '<div class="twc-stats-section">' +
                        '<div class="twc-stats-section-title">' + (TWC.i18n.t('history.snapshots') || 'Activity Snapshots') + ' (' + snapshots.length + ')</div>' +
                        '<div style="max-height:200px;overflow-y:auto">' +
                        '<table class="twc-history-table" style="font-size:11px">' +
                        '<thead><tr>' +
                        '<th>' + (TWC.i18n.t('history.snapshot_time') || 'Time') + '</th>' +
                        '<th>' + (TWC.i18n.t('columns.progress') || 'Progress') + '</th>' +
                        '<th>↓</th>' +
                        '<th>↑</th>' +
                        '<th>' + (TWC.i18n.t('detail.peers.title') || 'Peers') + '</th>' +
                        '</tr></thead><tbody>';

                    var sortedSnaps = _.orderBy(snapshots, 'snapshotAt', 'desc');
                    for (var j = 0; j < sortedSnaps.length; j++) {
                        var s = sortedSnaps[j];
                        html += '<tr>' +
                            '<td>' + TWC.utils.formatTimestamp(s.snapshotAt) + '</td>' +
                            '<td>' + TWC.utils.formatPercent(s.percentDone) + '</td>' +
                            '<td>' + TWC.utils.formatSpeed(s.rateDownload) + '</td>' +
                            '<td>' + TWC.utils.formatSpeed(s.rateUpload) + '</td>' +
                            '<td>' + (s.peersConnected || 0) + '</td>' +
                            '</tr>';
                    }

                    html += '</tbody></table></div></div>';
                }

                if (t.magnet_link) {
                    html += '<div class="twc-stats-section">' +
                        '<div class="twc-stats-section-title">' + (TWC.i18n.t('history.magnet_link') || 'Magnet Link') + '</div>' +
                        '<div style="word-break:break-all;font-size:11px;color:var(--text-secondary);padding:8px;background:var(--bg-tertiary);border-radius:4px;max-height:80px;overflow-y:auto">' +
                        TWC.utils.escapeHtml(t.magnet_link) +
                        '</div></div>';
                }

                html += '</div>';

                TWC.ui.showModal(html, {
                    title: TWC.utils.truncateText(t.name, 40),
                    size: 'lg'
                });
            });
        });
    }

    function _infoRow(label, value) {
        return '<div class="twc-stats-info-row">' +
            '<span class="twc-stats-info-label">' + label + '</span>' +
            '<span class="twc-stats-info-value">' + TWC.utils.escapeHtml(String(value)) + '</span>' +
            '</div>';
    }

    function _exportJSON() {
        TWC.dbCache.history.exportData(function(data) {
            if (!data) {
                TWC.ui.showToast(TWC.i18n.t('history.export_failed') || 'Export failed', 'error');
                return;
            }
            var json = JSON.stringify(data, null, 2);
            _downloadFile(json, 'twc_history_' + _dateStamp() + '.json', 'application/json');
            TWC.ui.showToast((TWC.i18n.t('history.exported') || 'Exported').replace('{n}', data.torrents.length), 'success');
        });
    }

    function _exportCSV() {
        TWC.dbCache.history.getAllTorrents(function(torrents) {
            if (!torrents || torrents.length === 0) {
                TWC.ui.showToast(TWC.i18n.t('history.empty') || 'No history records', 'info');
                return;
            }

            var headers = ['Name', 'Hash', 'Size', 'Downloaded', 'Uploaded', 'Ratio', 'Added', 'Deleted', 'Download Dir', 'Labels', 'Comment', 'Creator'];
            var rows = [headers.join(',')];

            for (var i = 0; i < torrents.length; i++) {
                var t = torrents[i];
                var row = [
                    _csvEscape(t.name),
                    _csvEscape(t.hash_string),
                    t.total_size || 0,
                    t.downloaded_ever || 0,
                    t.uploaded_ever || 0,
                    t.upload_ratio || 0,
                    t.addedDate || '',
                    t.deletedAt || '',
                    _csvEscape(t.download_dir),
                    _csvEscape(t.labels ? t.labels.join('; ') : ''),
                    _csvEscape(t.comment || ''),
                    _csvEscape(t.creator || '')
                ];
                rows.push(row.join(','));
            }

            var csv = '\uFEFF' + rows.join('\n');
            _downloadFile(csv, 'twc_history_' + _dateStamp() + '.csv', 'text/csv;charset=utf-8');
            TWC.ui.showToast((TWC.i18n.t('history.exported') || 'Exported').replace('{n}', torrents.length), 'success');
        });
    }

    function _csvEscape(str) {
        if (!str) return '""';
        str = String(str);
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return '"' + str + '"';
    }

    function _dateStamp() {
        var d = new Date();
        return d.getFullYear() + TWC.utils.padZero(d.getMonth() + 1) + TWC.utils.padZero(d.getDate()) +
            '_' + TWC.utils.padZero(d.getHours()) + TWC.utils.padZero(d.getMinutes());
    }

    function _downloadFile(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return {
        showHistory: showHistory
    };
})();
