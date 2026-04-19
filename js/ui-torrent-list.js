var TWC = TWC || {};

TWC.uiList = (function() {
    var _columns = [
        { id: 'name', label: '名称', width: 300, sortable: true, visible: true },
        { id: 'totalSize', label: '大小', width: 80, sortable: true, visible: true, align: 'right' },
        { id: 'percentDone', label: '进度', width: 120, sortable: true, visible: true },
        { id: 'rateDownload', label: '下载速度', width: 90, sortable: true, visible: true, align: 'right' },
        { id: 'rateUpload', label: '上传速度', width: 90, sortable: true, visible: true, align: 'right' },
        { id: 'uploadRatio', label: '分享率', width: 65, sortable: true, visible: true, align: 'right' },
        { id: 'uploadedEver', label: '上传量', width: 85, sortable: true, visible: true, align: 'right' },
        { id: 'downloadedEver', label: '下载量', width: 85, sortable: true, visible: true, align: 'right' },
        { id: 'eta', label: '剩余时间', width: 80, sortable: true, visible: true, align: 'right' },
        { id: 'seeders', label: '做种', width: 50, sortable: true, visible: true, align: 'center' },
        { id: 'leechers', label: '下载', width: 50, sortable: true, visible: true, align: 'center' },
        { id: 'peersConnected', label: '连接', width: 50, sortable: true, visible: true, align: 'center' },
        { id: 'status', label: '状态', width: 70, sortable: true, visible: true },
        { id: 'addedDate', label: '添加时间', width: 130, sortable: true, visible: false },
        { id: 'doneDate', label: '完成时间', width: 130, sortable: true, visible: false },
        { id: 'downloadDir', label: '下载目录', width: 150, sortable: true, visible: false },
        { id: 'labels', label: '标签', width: 100, sortable: false, visible: false },
        { id: 'queuePosition', label: '队列', width: 50, sortable: true, visible: false, align: 'center' }
    ];
    var _lastShiftId = null;
    var _virtualScrollEnabled = false;
    var _virtualThreshold = 500;
    var _rowHeight = 30;
    var _scrollTop = 0;
    var _visibleStart = 0;
    var _visibleEnd = 0;
    var _bufferRows = 10;
    var _resizingCol = null;
    var _resizeStartX = 0;
    var _resizeStartWidth = 0;
    var _columnMenuVisible = false;
    var _countryCache = {};
    var _lastRenderedIds = [];
    var _needsFullRender = true;

    function init() {
        _loadColumnConfig();
    }

    function bindEvents() {
        _bindColumnResize();
    }

    function render() {
        var torrents = TWC.torrent.getFilteredTorrents();
        var selectedIds = TWC.torrent.getSelectedIds();
        var sort = TWC.torrent.getSort();

        _virtualScrollEnabled = torrents.length > _virtualThreshold;

        var currentIds = torrents.map(function(t) { return t.id; });
        var idsChanged = !_arraysEqual(currentIds, _lastRenderedIds);

        if (_needsFullRender || idsChanged || _virtualScrollEnabled) {
            _fullRender(torrents, selectedIds, sort);
            _lastRenderedIds = currentIds;
            _needsFullRender = false;
        } else {
            _updateCells(torrents, selectedIds);
        }

        _updateFilterInfo(torrents.length);
    }

    function _arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function _fullRender(torrents, selectedIds, sort) {
        var $container = $('#torrent-list-container');

        var html = '<div style="position:relative;width:100%;height:100%;overflow:hidden">' +
            '<div class="twc-torrent-scroll" id="torrent-scroll" style="overflow:auto;height:100%;width:100%">' +
            '<table class="twc-torrent-table" id="torrent-table" style="table-layout:fixed">' +
            '<thead><tr>';

        for (var c = 0; c < _columns.length; c++) {
            var col = _columns[c];
            if (!col.visible) continue;
            var sortClass = '';
            if (sort.field === col.id) {
                sortClass = sort.order === 'asc' ? ' sorted-asc' : ' sorted-desc';
            }
            var sortIcon = '';
            if (col.sortable) {
                if (sort.field === col.id) {
                    sortIcon = sort.order === 'asc' ? ' <span class="sort-icon">▲</span>' : ' <span class="sort-icon">▼</span>';
                } else {
                    sortIcon = ' <span class="sort-icon" style="opacity:0.3">▲</span>';
                }
            }
            var align = col.align ? 'text-align:' + col.align + ';' : '';
            html += '<th style="width:' + col.width + 'px;' + align + '"' +
                ' data-sort-field="' + col.id + '"' +
                ' class="' + sortClass + '"' +
                (col.sortable ? '' : ' style="cursor:default;' + align + '"') + '>' +
                col.label + sortIcon +
                '<div class="col-resize" data-col-id="' + col.id + '"></div>' +
                '</th>';
        }

        html += '</tr></thead><tbody>';

        if (torrents.length === 0) {
            var colSpan = _columns.filter(function(c) { return c.visible; }).length;
            html += '<tr><td colspan="' + colSpan + '" style="text-align:center;padding:40px;color:var(--text-muted)">' +
                '<div class="twc-empty">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' +
                '暂无种子' +
                '</div>' +
                '</td></tr>';
        } else if (_virtualScrollEnabled) {
            html += '</tbody></table></div></div>';
            $container.html(html);
            _renderVirtualRows(torrents, selectedIds);
            _bindVirtualScroll(torrents);
        } else {
            for (var i = 0; i < torrents.length; i++) {
                var t = torrents[i];
                var isSelected = selectedIds.indexOf(t.id) !== -1;
                html += '<tr data-id="' + t.id + '"' + (isSelected ? ' class="selected"' : '') + '>';
                for (var j = 0; j < _columns.length; j++) {
                    var col2 = _columns[j];
                    if (!col2.visible) continue;
                    html += '<td class="td-' + col2.id + '"' +
                        (col2.align ? ' style="text-align:' + col2.align + '"' : '') + '>' +
                        _renderCell(t, col2.id) +
                        '</td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table></div></div>';
            $container.html(html);
        }

        if (!_virtualScrollEnabled) {
            _bindListEvents();
        }
    }

    function _updateCells(torrents, selectedIds) {
        var $tbody = $('#torrent-table tbody');
        if ($tbody.length === 0) return;

        var torrentMap = {};
        for (var i = 0; i < torrents.length; i++) {
            torrentMap[torrents[i].id] = torrents[i];
        }

        $tbody.find('tr[data-id]').each(function() {
            var $row = $(this);
            var id = parseInt($row.data('id'));
            var t = torrentMap[id];
            if (!t) return;

            var isSelected = selectedIds.indexOf(id) !== -1;
            if (isSelected) {
                $row.addClass('selected');
            } else {
                $row.removeClass('selected');
            }

            for (var j = 0; j < _columns.length; j++) {
                var col = _columns[j];
                if (!col.visible) continue;
                var $td = $row.find('.td-' + col.id);
                if ($td.length > 0) {
                    $td.html(_renderCell(t, col.id));
                }
            }
        });
    }

    function _renderVirtualRows(torrents, selectedIds) {
        var $scroll = $('#torrent-scroll');
        var viewHeight = $scroll.height();
        _scrollTop = $scroll.scrollTop();

        _visibleStart = Math.max(0, Math.floor(_scrollTop / _rowHeight) - _bufferRows);
        _visibleEnd = Math.min(torrents.length, Math.ceil((_scrollTop + viewHeight) / _rowHeight) + _bufferRows);

        var totalHeight = torrents.length * _rowHeight;
        var $table = $('#torrent-table');

        var $spacerTop = $table.find('.virtual-spacer-top');
        var $spacerBottom = $table.find('.virtual-spacer-bottom');
        var $tbody = $table.find('tbody');

        if ($spacerTop.length === 0) {
            $tbody.html('<tr class="virtual-spacer-top" style="height:0px"><td colspan="50"></td></tr>' +
                '<tr class="virtual-spacer-bottom" style="height:' + Math.max(0, totalHeight - _visibleEnd * _rowHeight) + 'px"><td colspan="50"></td></tr>');
            $spacerTop = $tbody.find('.virtual-spacer-top');
            $spacerBottom = $tbody.find('.virtual-spacer-bottom');
        }

        $spacerTop.css('height', (_visibleStart * _rowHeight) + 'px');
        $spacerBottom.css('height', Math.max(0, totalHeight - _visibleEnd * _rowHeight) + 'px');

        var rows = '';
        for (var i = _visibleStart; i < _visibleEnd; i++) {
            var t = torrents[i];
            var isSelected = selectedIds.indexOf(t.id) !== -1;
            rows += '<tr data-id="' + t.id + '"' + (isSelected ? ' class="selected"' : '') + '>';
            for (var j = 0; j < _columns.length; j++) {
                var col = _columns[j];
                if (!col.visible) continue;
                rows += '<td class="td-' + col.id + '"' +
                    (col.align ? ' style="text-align:' + col.align + '"' : '') + '>' +
                    _renderCell(t, col.id) +
                    '</td>';
            }
            rows += '</tr>';
        }

        $spacerTop.nextUntil($spacerBottom).remove();
        $spacerTop.after(rows);

        _bindListEvents();
    }

    function _bindVirtualScroll(torrents) {
        var $scroll = $('#torrent-scroll');
        $scroll.off('scroll.vlist').on('scroll.vlist', TWC.utils.throttle(function() {
            var currentSelectedIds = TWC.torrent.getSelectedIds();
            _renderVirtualRows(torrents, currentSelectedIds);
        }, 50));
    }

    function _bindColumnResize() {
        $(document).off('mousedown.colresize').on('mousedown.colresize', '.col-resize', function(e) {
            var colId = $(this).data('col-id');
            _resizingCol = null;
            for (var i = 0; i < _columns.length; i++) {
                if (_columns[i].id === colId) {
                    _resizingCol = _columns[i];
                    break;
                }
            }
            if (!_resizingCol) return;
            _resizeStartX = e.pageX;
            _resizeStartWidth = _resizingCol.width;
            e.preventDefault();
            e.stopPropagation();

            $(document).off('mousemove.colresizeDrag mouseup.colresizeDrag');
            $(document).on('mousemove.colresizeDrag', function(ev) {
                var diff = ev.pageX - _resizeStartX;
                var newWidth = Math.max(40, _resizeStartWidth + diff);
                _resizingCol.width = newWidth;
                $('th[data-sort-field="' + _resizingCol.id + '"]').css('width', newWidth + 'px');
            });

            $(document).on('mouseup.colresizeDrag', function() {
                $(document).off('mousemove.colresizeDrag mouseup.colresizeDrag');
                _saveColumnConfig();
                _resizingCol = null;
            });
        });

        $(document).off('contextmenu.thead').on('contextmenu.thead', '#torrent-table thead', function(e) {
            e.preventDefault();
            _showColumnMenu(e.pageX, e.pageY);
        });

        $(document).off('click.colmenu').on('click.colmenu', function(e) {
            if (!$(e.target).closest('.twc-column-popup').length) {
                $('.twc-column-popup').remove();
            }
        });

        $(document).off('change.colvis').on('change.colvis', '.col-visibility', function() {
            var colId = $(this).data('col-id');
            var visible = $(this).is(':checked');
            setColumnVisible(colId, visible);
            _needsFullRender = true;
            render();
        });
    }

    function _showColumnMenu(x, y) {
        $('.twc-column-popup').remove();

        var html = '<div class="twc-column-popup" style="position:fixed;left:' + x + 'px;top:' + y + 'px;z-index:10000">' +
            '<div class="twc-column-popup-title">列显示设置</div>';
        for (var i = 0; i < _columns.length; i++) {
            var col = _columns[i];
            html += '<label class="twc-column-popup-item">' +
                '<input type="checkbox" class="col-visibility" data-col-id="' + col.id + '"' + (col.visible ? ' checked' : '') + ' />' +
                col.label +
                '</label>';
        }
        html += '</div>';

        $('body').append(html);

        var $popup = $('.twc-column-popup');
        var pw = $popup.outerWidth();
        var ph = $popup.outerHeight();
        var ww = $(window).width();
        var wh = $(window).height();
        if (x + pw > ww) $popup.css('left', (ww - pw - 8) + 'px');
        if (y + ph > wh) $popup.css('top', (wh - ph - 8) + 'px');
    }

    function _renderCell(t, field) {
        switch (field) {
            case 'name':
                var statusIcon = '';
                if (t.error !== 0) statusIcon = '<span style="color:var(--color-danger-500);margin-right:4px">⚠</span>';
                else if (t.recheckProgress > 0 || t.status === 1 || t.status === 2) statusIcon = '<span style="color:var(--color-warning-500);margin-right:4px">🔍</span>';
                else if (t.isStalled) statusIcon = '<span style="color:var(--color-warning-500);margin-right:4px">⏸</span>';
                return statusIcon + '<span class="torrent-name" title="' + TWC.utils.escapeHtml(t.name) + '">' + TWC.utils.escapeHtml(t.name) + '</span>';
            case 'totalSize':
                var displaySize = t.sizeWhenDone || t.totalSize || 0;
                var tooltip = '总大小: ' + TWC.utils.formatBytes(t.totalSize || 0);
                return '<span title="' + TWC.utils.escapeAttr(tooltip) + '">' + TWC.utils.formatBytes(displaySize) + '</span>';
            case 'percentDone':
                return _renderProgressBar(t);
            case 'rateDownload':
                return t.rateDownload > 0 ? '<span class="text-info text-mono">' + TWC.utils.formatSpeed(t.rateDownload) + '</span>' : '<span class="text-muted">-</span>';
            case 'rateUpload':
                return t.rateUpload > 0 ? '<span class="text-success text-mono">' + TWC.utils.formatSpeed(t.rateUpload) + '</span>' : '<span class="text-muted">-</span>';
            case 'uploadRatio':
                return '<span class="' + TWC.utils.getRatioClass(t.uploadRatio) + ' text-mono">' + TWC.utils.formatRatio(t.uploadRatio) + '</span>';
            case 'uploadedEver':
                return '<span class="text-mono">' + TWC.utils.formatBytes(t.uploadedEver) + '</span>';
            case 'downloadedEver':
                return '<span class="text-mono">' + TWC.utils.formatBytes(t.downloadedEver) + '</span>';
            case 'eta':
                return (t.eta > 0) ? TWC.utils.formatETA(t.eta) : '<span class="text-muted">-</span>';
            case 'seeders':
                var seeders = _getSeederCount(t);
                return seeders >= 0 ? '<span class="text-mono">' + seeders + '</span>' : '<span class="text-muted">-</span>';
            case 'leechers':
                var leechers = _getLeecherCount(t);
                return leechers >= 0 ? '<span class="text-mono">' + leechers + '</span>' : '<span class="text-muted">-</span>';
            case 'peersConnected':
                return '<span class="text-mono">' + (t.peersConnected || 0) + '</span>';
            case 'status':
                return '<span class="twc-badge ' + _getStatusBadge(t.status) + '">' + TWC.utils.getStatusText(t.status) + '</span>';
            case 'addedDate':
                return TWC.utils.formatTimestamp(t.addedDate);
            case 'doneDate':
                return t.doneDate > 0 ? TWC.utils.formatTimestamp(t.doneDate) : '-';
            case 'downloadDir':
                return '<span title="' + TWC.utils.escapeHtml(t.downloadDir || '') + '">' + TWC.utils.escapeHtml(t.downloadDir || '-') + '</span>';
            case 'labels':
                if (!t.labels || t.labels.length === 0) return '<span class="text-muted">-</span>';
                var labelHtml = '';
                for (var li = 0; li < t.labels.length; li++) {
                    labelHtml += '<span class="twc-badge info" style="margin-right:3px">' + TWC.utils.escapeHtml(t.labels[li]) + '</span>';
                }
                return labelHtml;
            case 'queuePosition':
                return t.queuePosition;
            default:
                return '';
        }
    }

    function _renderProgressBar(t) {
        var pct = t.percentDone || 0;
        var pctStr = (pct * 100).toFixed(1);
        var status = t.status;
        var colorClass;
        var displayText = pctStr + '%';

        if (t.error !== 0) {
            colorClass = 'bg-red-500';
        } else if (t.recheckProgress > 0 || status === 1 || status === 2) {
            if (t.recheckProgress > 0) {
                pct = t.recheckProgress;
                pctStr = (pct * 100).toFixed(1);
                displayText = '校验中 ' + pctStr + '%';
            } else if (status === 1) {
                displayText = '等待校验';
            } else if (status === 2) {
                displayText = '校验中';
            }
            colorClass = 'bg-yellow-500';
        } else if (status === 0) {
            colorClass = 'bg-gray-400';
        } else if (status === 4 || status === 3) {
            colorClass = 'bg-blue-500';
        } else if (status === 6 || status === 5) {
            colorClass = 'bg-green-500';
        } else if (status === 1 || status === 2) {
            colorClass = 'bg-yellow-500';
        } else {
            colorClass = 'bg-gray-400';
        }

        return '<div class="twc-progress-bar">' +
            '<div class="twc-progress-fill ' + colorClass + '" style="width:' + pctStr + '%"></div>' +
            '<span class="twc-progress-text">' + displayText + '</span>' +
            '</div>';
    }

    function _getStatusBadge(status) {
        switch (status) {
            case 0: return 'info';
            case 1: case 2: return 'warning';
            case 3: case 4: return 'info';
            case 5: case 6: return 'success';
            default: return 'info';
        }
    }

    function _getSeederCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var maxSeeders = -1;
            for (var i = 0; i < t.trackerStats.length; i++) {
                var sc = t.trackerStats[i].seederCount;
                if (sc > maxSeeders) {
                    maxSeeders = sc;
                }
            }
            if (maxSeeders >= 0) return maxSeeders;
        }
        if (t.peersSendingToUs !== undefined && t.peersSendingToUs > 0) {
            return t.peersSendingToUs;
        }
        return -1;
    }

    function _getLeecherCount(t) {
        if (t.trackerStats && t.trackerStats.length > 0) {
            var maxLeechers = -1;
            for (var i = 0; i < t.trackerStats.length; i++) {
                var lc = t.trackerStats[i].leecherCount;
                if (lc > maxLeechers) {
                    maxLeechers = lc;
                }
            }
            if (maxLeechers >= 0) return maxLeechers;
        }
        if (t.peersGettingFromUs !== undefined && t.peersGettingFromUs > 0) {
            return t.peersGettingFromUs;
        }
        return -1;
    }

    function _bindListEvents() {
        var $table = $('#torrent-table');

        $table.find('thead th[data-sort-field]').off('click').on('click', function(e) {
            if ($(e.target).hasClass('col-resize')) return;
            var field = $(this).data('sort-field');
            if (field) TWC.torrent.toggleSort(field);
        });

        $table.find('tbody tr:not(.virtual-spacer-top,.virtual-spacer-bottom)').off('click.tlist').on('click.tlist', function(e) {
            var id = parseInt($(this).data('id'));
            if (!id) return;

            if (e.shiftKey && _lastShiftId !== null) {
                TWC.torrent.selectRange(_lastShiftId, id);
            } else if (e.ctrlKey || e.metaKey) {
                TWC.torrent.select(id, true);
            } else {
                TWC.torrent.select(id, false);
            }
            _lastShiftId = id;
            _highlightRows();
        });

        $table.find('tbody tr:not(.virtual-spacer-top,.virtual-spacer-bottom)').off('contextmenu.tlist').on('contextmenu.tlist', function(e) {
            var id = parseInt($(this).data('id'));
            if (!id) return;

            var selectedIds = TWC.torrent.getSelectedIds();
            if (selectedIds.indexOf(id) === -1) {
                TWC.torrent.select(id, false);
                _highlightRows();
            }
            _showContextMenu(e.pageX, e.pageY);
            e.preventDefault();
        });

        $table.find('tbody tr:not(.virtual-spacer-top,.virtual-spacer-bottom)').off('dblclick.tlist').on('dblclick.tlist', function() {
            var id = parseInt($(this).data('id'));
            if (id) {
                var t = TWC.torrent.getTorrent(id);
                if (t) {
                    if (t.status === 0) {
                        TWC.rpc.startTorrents([id], function() { TWC.ui.refreshData(true); });
                    } else {
                        TWC.rpc.stopTorrents([id], function() { TWC.ui.refreshData(true); });
                    }
                }
            }
        });
    }

    function _highlightRows() {
        var selectedIds = TWC.torrent.getSelectedIds();
        $('#torrent-table tbody tr:not(.virtual-spacer-top,.virtual-spacer-bottom)').each(function() {
            var id = parseInt($(this).data('id'));
            if (selectedIds.indexOf(id) !== -1) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });
        TWC.ui.updateToolbarState();
        TWC.uiDetail.update();
    }

    function _showContextMenu(x, y) {
        var ids = TWC.torrent.getSelectedIds();
        var single = ids.length === 1;
        var t = single ? TWC.torrent.getTorrent(ids[0]) : null;

        var items = [
            { label: '开始', action: 'start', icon: '<polygon points="5,3 19,12 5,21"/>', onClick: function() { TWC.rpc.startTorrents(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '立即开始', action: 'startNow', icon: '<polygon points="5,3 19,12 5,21"/><line x1="19" y1="3" x2="19" y2="21"/>', onClick: function() { TWC.rpc.startNowTorrents(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '暂停', action: 'stop', icon: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>', onClick: function() { TWC.rpc.stopTorrents(ids, function() { TWC.ui.refreshData(true); }); } },
            { separator: true },
            { label: '重新宣告', action: 'reannounce', onClick: function() { TWC.rpc.reannounceTorrents(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '校验', action: 'verify', onClick: function() { 
                TWC.rpc.verifyTorrents(ids, function(success) {
                    if (success) {
                        if (ids.length === 1) {
                            var t = TWC.torrent.getTorrent(ids[0]);
                            TWC.ui.showToast('已开始校验: ' + (t ? t.name : ids.length + ' 个种子'), 'success');
                        } else {
                            TWC.ui.showToast('已开始校验 ' + ids.length + ' 个种子', 'success');
                        }
                    }
                    TWC.ui.refreshData(true);
                }); 
            } },
            { separator: true },
            { label: '移至顶部', action: 'queueTop', onClick: function() { TWC.rpc.queueMoveTop(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '上移', action: 'queueUp', onClick: function() { TWC.rpc.queueMoveUp(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '下移', action: 'queueDown', onClick: function() { TWC.rpc.queueMoveDown(ids, function() { TWC.ui.refreshData(true); }); } },
            { label: '移至底部', action: 'queueBottom', onClick: function() { TWC.rpc.queueMoveBottom(ids, function() { TWC.ui.refreshData(true); }); } },
            { separator: true },
            { label: '修改下载目录', action: 'changeDir', onClick: function() { TWC.uiDialog.showChangeDir(ids); } },
            { label: '设置标签', action: 'setLabel', onClick: function() { TWC.uiDialog.showSetLabel(ids); } },
            { label: '限速设置', action: 'setSpeed', onClick: function() { TWC.uiDialog.showSetSpeedLimit(ids); } },
            { separator: true }
        ];

        if (single && t) {
            items.push({ label: '复制磁力链接', action: 'copyMagnet', onClick: function() { TWC.utils.copyToClipboard(t.magnetLink); } });
            items.push({ label: '复制Hash', action: 'copyHash', onClick: function() { TWC.utils.copyToClipboard(t.hashString); } });
            items.push({ separator: true });
            items.push({ label: '重命名文件', action: 'renameFile', onClick: function() { TWC.uiDialog.showRenameFile(ids); } });
            if (t.trackerStats && t.trackerStats.length > 0) {
                items.push({ label: '移除Tracker', action: 'removeTracker', onClick: function() { TWC.uiDialog.showRemoveTracker(ids); } });
            }
        }

        items.push({ separator: true });
        items.push({
            label: '删除种子', action: 'remove', danger: true,
            icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
            onClick: function() { TWC.uiDialog.showConfirmDelete(ids); }
        });
        items.push({
            label: '删除种子及数据', action: 'removeData', danger: true,
            onClick: function() { TWC.uiDialog.showConfirmDelete(ids, true); }
        });

        TWC.ui.showContextMenu(items, x, y);
    }

    function _updateFilterInfo(count) {
        var filterState = TWC.torrent.getFilterState();
        var text = '共 ' + count + ' 个种子';
        if (filterState.search) {
            text += ' (搜索: ' + filterState.search + ')';
        }
        $('#filter-info').text(text);
    }

    function _loadColumnConfig() {
        var saved = TWC.utils.storageGet('twc-columns', null);
        if (saved) {
            for (var i = 0; i < _columns.length; i++) {
                var col = _columns[i];
                if (saved[col.id]) {
                    if (saved[col.id].visible !== undefined) col.visible = saved[col.id].visible;
                    if (saved[col.id].width !== undefined) col.width = saved[col.id].width;
                }
            }
        }
    }

    function _saveColumnConfig() {
        var config = {};
        for (var i = 0; i < _columns.length; i++) {
            config[_columns[i].id] = {
                visible: _columns[i].visible,
                width: _columns[i].width
            };
        }
        TWC.utils.storageSet('twc-columns', config);
    }

    function getColumns() {
        return _columns;
    }

    function setColumnVisible(id, visible) {
        for (var i = 0; i < _columns.length; i++) {
            if (_columns[i].id === id) {
                _columns[i].visible = visible;
                break;
            }
        }
        _saveColumnConfig();
    }

    function getCountryFlag(ip) {
        if (_countryCache[ip]) return _countryCache[ip];
        var code = '';
        if (TWC.geoip.isPrivateIP(ip)) {
            code = 'local';
        } else if (TWC.geoip.isLoaded()) {
            var info = TWC.geoip.getCountryInfo(ip);
            code = info ? info.code : 'unknown';
        } else {
            code = 'unknown';
        }
        _countryCache[ip] = code;
        return code;
    }

    return {
        init: init,
        bindEvents: bindEvents,
        render: render,
        getColumns: getColumns,
        setColumnVisible: setColumnVisible
    };
})();
