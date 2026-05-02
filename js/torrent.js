var TWC = TWC || {};

TWC.torrent = (function() {
    var _torrents = {};
    var _torrentIds = [];
    var _selectedIds = [];
    var _filterType = 'all';
    var _filterTracker = '';
    var _filterDir = '';
    var _filterLabel = '';
    var _searchText = '';
    var _sortField = 'name';
    var _sortOrder = 'asc';
    var _trackerGroups = {};
    var _dirGroups = {};
    var _labelGroups = {};
    var _statusCounts = {all:0, downloading:0, seeding:0, stopped:0, checking:0, active:0, error:0, queued:0};
    var _listeners = [];
    var _isFirstLoad = true;

    function init() {
        _loadSortConfig();
    }

    function updateData(torrents, removedIds) {
        var needsFullRebuild = false;

        if (removedIds && removedIds.length > 0) {
            var needsIdRebuild = false;
            for (var j = 0; j < removedIds.length; j++) {
                var rid = removedIds[j];
                if (_torrents[rid]) {
                    _removeFromIndex(_torrents[rid], rid);
                    delete _torrents[rid];
                    needsIdRebuild = true;
                }
            }
            if (needsIdRebuild) needsFullRebuild = true;
        }

        if (torrents && torrents.length > 0) {
            for (var i = 0; i < torrents.length; i++) {
                var t = torrents[i];
                var isNew = !_torrents[t.id];
                var oldTorrent = _torrents[t.id];

                if (oldTorrent) {
                    _removeFromIndex(oldTorrent, t.id);
                }

                _torrents[t.id] = t;
                _addToIndex(t);

                if (isNew) {
                    needsFullRebuild = true;
                }
            }
        }

        if (needsFullRebuild) {
            _torrentIds = Object.keys(_torrents).map(function(id) { return parseInt(id, 10); });
        }

        _notifyListeners('data-updated');
    }

    function _removeFromIndex(t, id) {
        _statusCounts.all--;
        if (isDownloading(t)) _statusCounts.downloading--;
        if (isSeeding(t)) _statusCounts.seeding--;
        if (isStopped(t)) _statusCounts.stopped--;
        if (isChecking(t)) _statusCounts.checking--;
        if (isActive(t)) _statusCounts.active--;
        if (isError(t)) _statusCounts.error--;
        if (isQueued(t)) _statusCounts.queued--;

        if (t.trackerStats) {
            for (var i = 0; i < t.trackerStats.length; i++) {
                var domain = TWC.utils.getTrackerDomain(t.trackerStats[i].announce);
                if (domain && _trackerGroups[domain]) {
                    var idx = _trackerGroups[domain].indexOf(id);
                    if (idx !== -1) _trackerGroups[domain].splice(idx, 1);
                    if (_trackerGroups[domain].length === 0) delete _trackerGroups[domain];
                }
            }
        }

        if (t.downloadDir && _dirGroups[t.downloadDir]) {
            var dirIdx = _dirGroups[t.downloadDir].indexOf(id);
            if (dirIdx !== -1) _dirGroups[t.downloadDir].splice(dirIdx, 1);
            if (_dirGroups[t.downloadDir].length === 0) delete _dirGroups[t.downloadDir];
        }

        if (t.labels && t.labels.length > 0) {
            for (var j = 0; j < t.labels.length; j++) {
                if (_labelGroups[t.labels[j]]) {
                    var labelIdx = _labelGroups[t.labels[j]].indexOf(id);
                    if (labelIdx !== -1) _labelGroups[t.labels[j]].splice(labelIdx, 1);
                    if (_labelGroups[t.labels[j]].length === 0) delete _labelGroups[t.labels[j]];
                }
            }
        } else if (_labelGroups['未标签']) {
            var noLabelIdx = _labelGroups['未标签'].indexOf(id);
            if (noLabelIdx !== -1) _labelGroups['未标签'].splice(noLabelIdx, 1);
            if (_labelGroups['未标签'].length === 0) delete _labelGroups['未标签'];
        }
    }

    function _addToIndex(t) {
        _statusCounts.all++;
        if (isDownloading(t)) _statusCounts.downloading++;
        if (isSeeding(t)) _statusCounts.seeding++;
        if (isStopped(t)) _statusCounts.stopped++;
        if (isChecking(t)) _statusCounts.checking++;
        if (isActive(t)) _statusCounts.active++;
        if (isError(t)) _statusCounts.error++;
        if (isQueued(t)) _statusCounts.queued++;

        _indexTracker(t);
        _indexDir(t);
        _indexLabel(t);
    }

    function _rebuildIndex() {
        _torrentIds = [];
        _trackerGroups = {};
        _dirGroups = {};
        _labelGroups = {};
        _statusCounts = {all:0, downloading:0, seeding:0, stopped:0, checking:0, active:0, error:0, queued:0};

        var ids = Object.keys(_torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = _torrents[ids[i]];
            _torrentIds.push(t.id);
            _statusCounts.all++;

            if (isDownloading(t)) _statusCounts.downloading++;
            if (isSeeding(t)) _statusCounts.seeding++;
            if (isStopped(t)) _statusCounts.stopped++;
            if (isChecking(t)) _statusCounts.checking++;
            if (isActive(t)) _statusCounts.active++;
            if (isError(t)) _statusCounts.error++;
            if (isQueued(t)) _statusCounts.queued++;

            _indexTracker(t);
            _indexDir(t);
            _indexLabel(t);
        }
    }

    function _indexTracker(t) {
        if (!t.trackerStats) return;
        for (var i = 0; i < t.trackerStats.length; i++) {
            var domain = TWC.utils.getTrackerDomain(t.trackerStats[i].announce);
            if (!domain) continue;
            if (!_trackerGroups[domain]) {
                _trackerGroups[domain] = [];
            }
            if (_trackerGroups[domain].indexOf(t.id) === -1) {
                _trackerGroups[domain].push(t.id);
            }
        }
    }

    function _indexDir(t) {
        if (!t.downloadDir) return;
        var dir = t.downloadDir;
        if (!_dirGroups[dir]) {
            _dirGroups[dir] = [];
        }
        if (_dirGroups[dir].indexOf(t.id) === -1) {
            _dirGroups[dir].push(t.id);
        }
    }

    function _indexLabel(t) {
        if (!t.labels || t.labels.length === 0) {
            if (!_labelGroups['未标签']) {
                _labelGroups['未标签'] = [];
            }
            if (_labelGroups['未标签'].indexOf(t.id) === -1) {
                _labelGroups['未标签'].push(t.id);
            }
            return;
        }
        for (var i = 0; i < t.labels.length; i++) {
            var label = t.labels[i];
            if (!_labelGroups[label]) {
                _labelGroups[label] = [];
            }
            if (_labelGroups[label].indexOf(t.id) === -1) {
                _labelGroups[label].push(t.id);
            }
        }
    }

    function isDownloading(t) {
        return t.status === 4;
    }

    function isSeeding(t) {
        return t.status === 6;
    }

    function isStopped(t) {
        return t.status === 0;
    }

    function isChecking(t) {
        return t.status === 1 || t.status === 2;
    }

    function isActive(t) {
        return (t.rateDownload > 0 || t.rateUpload > 0);
    }

    function isError(t) {
        return t.error !== 0;
    }

    function isQueued(t) {
        return t.status === 3 || t.status === 5;
    }

    function isSequential(t) {
        return t.sequential_download === true;
    }

    function getFilteredTorrents() {
        var results = [];
        var ids = Object.keys(_torrents);

        for (var i = 0; i < ids.length; i++) {
            var t = _torrents[ids[i]];
            if (_matchFilter(t)) {
                results.push(t);
            }
        }

        results.sort(function(a, b) {
            return _compare(a, b);
        });

        return results;
    }

    function _matchFilter(t) {
        if (_filterType !== 'all') {
            switch (_filterType) {
                case 'downloading': if (!isDownloading(t)) return false; break;
                case 'seeding': if (!isSeeding(t)) return false; break;
                case 'stopped': if (!isStopped(t)) return false; break;
                case 'checking': if (!isChecking(t)) return false; break;
                case 'active': if (!isActive(t)) return false; break;
                case 'error': if (!isError(t)) return false; break;
                case 'queued': if (!isQueued(t)) return false; break;
            }
        }
        if (_filterTracker) {
            var trackerIds = _trackerGroups[_filterTracker];
            if (!trackerIds || trackerIds.indexOf(t.id) === -1) return false;
        }
        if (_filterDir) {
            var dirIds = _dirGroups[_filterDir];
            if (!dirIds || dirIds.indexOf(t.id) === -1) return false;
        }
        if (_filterLabel) {
            var labelIds = _labelGroups[_filterLabel];
            if (!labelIds || labelIds.indexOf(t.id) === -1) return false;
        }
        if (_searchText) {
            var search = _searchText.toLowerCase();
            var name = (t.name || '').toLowerCase();
            var hash = (t.hashString || '').toLowerCase();
            var comment = (t.comment || '').toLowerCase();
            var creator = (t.creator || '').toLowerCase();
            var downloadDir = (t.downloadDir || '').toLowerCase();
            var group = (t.group || '').toLowerCase();

            if (name.indexOf(search) === -1 &&
                hash.indexOf(search) === -1 &&
                comment.indexOf(search) === -1 &&
                creator.indexOf(search) === -1 &&
                downloadDir.indexOf(search) === -1 &&
                group.indexOf(search) === -1) {
                var hasMatchingLabel = false;
                if (t.labels && t.labels.length > 0) {
                    for (var li = 0; li < t.labels.length; li++) {
                        if ((t.labels[li] || '').toLowerCase().indexOf(search) !== -1) {
                            hasMatchingLabel = true;
                            break;
                        }
                    }
                }
                if (!hasMatchingLabel) return false;
            }
        }
        return true;
    }

    function _compare(a, b) {
        var field = _sortField;
        var order = _sortOrder === 'asc' ? 1 : -1;
        var valA = a[field];
        var valB = b[field];

        if (field === 'name') {
            return valA.localeCompare(valB, 'zh-CN') * order;
        }
        if (typeof valA === 'string') {
            return valA.localeCompare(valB) * order;
        }
        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;
        return (valA - valB) * order;
    }

    function setFilter(type, value) {
        switch (type) {
            case 'status':
                if (_filterType === value && value !== 'all') {
                    _filterType = 'all';
                } else {
                    _filterType = value || 'all';
                }
                break;
            case 'tracker':
                if (_filterTracker === value) {
                    _filterTracker = '';
                } else {
                    _filterTracker = value || '';
                }
                break;
            case 'dir':
                if (_filterDir === value) {
                    _filterDir = '';
                } else {
                    _filterDir = value || '';
                }
                break;
            case 'label':
                if (_filterLabel === value) {
                    _filterLabel = '';
                } else {
                    _filterLabel = value || '';
                }
                break;
            case 'search':
                _searchText = value || '';
                break;
        }
        _notifyListeners('filter-changed');
    }

    function setSort(field, order) {
        _sortField = field || 'name';
        _sortOrder = order || 'asc';
        _saveSortConfig();
        _notifyListeners('sort-changed');
    }

    function toggleSort(field) {
        if (_sortField === field) {
            _sortOrder = _sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            _sortField = field;
            _sortOrder = 'asc';
        }
        _saveSortConfig();
        _notifyListeners('sort-changed');
    }

    function getSort() {
        return { field: _sortField, order: _sortOrder };
    }

    function select(id, multi) {
        if (multi) {
            var idx = _selectedIds.indexOf(id);
            if (idx === -1) {
                _selectedIds.push(id);
            } else {
                _selectedIds.splice(idx, 1);
            }
        } else {
            _selectedIds = [id];
        }
        _notifyListeners('selection-changed');
    }

    function selectRange(fromId, toId) {
        var allTorrents = getFilteredTorrents();
        var allIds = allTorrents.map(function(t) { return t.id; });
        var fromIdx = allIds.indexOf(fromId);
        var toIdx = allIds.indexOf(toId);
        if (fromIdx === -1 || toIdx === -1) return;
        var start = Math.min(fromIdx, toIdx);
        var end = Math.max(fromIdx, toIdx);
        _selectedIds = allIds.slice(start, end + 1);
        _notifyListeners('selection-changed');
    }

    function selectAll() {
        var filtered = getFilteredTorrents();
        _selectedIds = filtered.map(function(t) { return t.id; });
        _notifyListeners('selection-changed');
    }

    function clearSelection() {
        _selectedIds = [];
        _notifyListeners('selection-changed');
    }

    function getSelectedIds() {
        return _selectedIds.slice();
    }

    function getSelectedTorrents() {
        var result = [];
        for (var i = 0; i < _selectedIds.length; i++) {
            var t = _torrents[_selectedIds[i]];
            if (t) result.push(t);
        }
        return result;
    }

    function getTorrent(id) {
        return _torrents[id] || null;
    }

    function getAllTorrents() {
        return _torrents;
    }

    function getCount() {
        return Object.keys(_torrents).length;
    }

    function getStatusCounts() {
        return _statusCounts;
    }

    function getTrackerGroups() {
        return _trackerGroups;
    }

    function getDirGroups() {
        return _dirGroups;
    }

    function getLabelGroups() {
        return _labelGroups;
    }

    function getAllLabels() {
        var labels = [];
        for (var key in _labelGroups) {
            if (key !== '未标签') {
                labels.push(key);
            }
        }
        labels.sort();
        return labels;
    }

    function getFilterState() {
        return {
            type: _filterType,
            tracker: _filterTracker,
            dir: _filterDir,
            label: _filterLabel,
            search: _searchText
        };
    }

    function onEvent(callback) {
        _listeners.push(callback);
    }

    function _notifyListeners(eventType, data) {
        for (var i = 0; i < _listeners.length; i++) {
            _listeners[i](eventType, data);
        }
    }

    function _saveSortConfig() {
        TWC.utils.storageSet('twc-sort-field', _sortField);
        TWC.utils.storageSet('twc-sort-order', _sortOrder);
    }

    function _loadSortConfig() {
        _sortField = TWC.utils.storageGet('twc-sort-field', 'name');
        _sortOrder = TWC.utils.storageGet('twc-sort-order', 'asc');
    }

    function isFirstLoad() {
        return _isFirstLoad;
    }

    function setFirstLoad(val) {
        _isFirstLoad = val;
    }

    function getGlobalStats() {
        var totalDownload = 0;
        var totalUpload = 0;
        var totalPeers = 0;
        var totalDownloaded = 0;
        var totalUploaded = 0;
        var ids = Object.keys(_torrents);
        for (var i = 0; i < ids.length; i++) {
            var t = _torrents[ids[i]];
            totalDownload += t.rateDownload || 0;
            totalUpload += t.rateUpload || 0;
            totalPeers += t.peersConnected || 0;
            totalDownloaded += t.downloadedEver || 0;
            totalUploaded += t.uploadedEver || 0;
        }
        return {
            downloadSpeed: totalDownload,
            uploadSpeed: totalUpload,
            totalPeers: totalPeers,
            totalDownloaded: totalDownloaded,
            totalUploaded: totalUploaded
        };
    }

    return {
        init: init,
        updateData: updateData,
        getFilteredTorrents: getFilteredTorrents,
        setFilter: setFilter,
        setSort: setSort,
        toggleSort: toggleSort,
        getSort: getSort,
        select: select,
        selectRange: selectRange,
        selectAll: selectAll,
        clearSelection: clearSelection,
        getSelectedIds: getSelectedIds,
        getSelectedTorrents: getSelectedTorrents,
        getTorrent: getTorrent,
        getAllTorrents: getAllTorrents,
        getCount: getCount,
        getStatusCounts: getStatusCounts,
        getTrackerGroups: getTrackerGroups,
        getDirGroups: getDirGroups,
        getLabelGroups: getLabelGroups,
        getAllLabels: getAllLabels,
        getFilterState: getFilterState,
        getGlobalStats: getGlobalStats,
        onEvent: onEvent,
        isFirstLoad: isFirstLoad,
        setFirstLoad: setFirstLoad,
        isDownloading: isDownloading,
        isSeeding: isSeeding,
        isStopped: isStopped,
        isChecking: isChecking,
        isActive: isActive,
        isError: isError,
        isQueued: isQueued
    };
})();
