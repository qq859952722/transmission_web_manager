var TWC = TWC || {};

TWC.rpc = (function() {
    var _sessionId = '';
    var _rpcUrl = '/transmission/rpc';
    var _username = '';
    var _password = '';
    var _isConnected = false;
    var _retryCount = 0;
    var _maxRetries = 2;
    var _retryDelay = 1000;

    var TORRENT_FIELDS = [
        'id', 'name', 'status', 'hashString', 'totalSize',
        'percentDone', 'remaining', 'leftUntilDone',
        'eta', 'etaIdle',
        'rateDownload', 'rateUpload',
        'downloadedEver', 'uploadedEver',
        'corruptEver',
        'peersConnected', 'peersSendingToUs', 'peersGettingFromUs',
        'seeders', 'leechers',
        'addedDate', 'doneDate', 'startDate', 'activityDate', 'editDate',
        'trackers', 'trackerStats',
        'files', 'fileStats',
        'peers', 'peersFrom',
        'comment', 'creator', 'dateCreated',
        'error', 'errorString',
        'isStalled', 'isFinished', 'isPrivate',
        'labels', 'magnetLink',
        'downloadDir',
        'pieceCount', 'pieceSize',
        'recheckProgress',
        'uploadRatio',
        'webseeds', 'webseedsSendingToUs',
        'bandwidthPriority',
        'seedIdleLimit', 'seedIdleMode',
        'seedRatioLimit', 'seedRatioMode',
        'downloadLimited', 'downloadLimit',
        'uploadLimited', 'uploadLimit',
        'honorsSessionLimits',
        'queuePosition',
        'maxConnectedPeers',
        'secondsDownloading', 'secondsSeeding',
        'sizeWhenDone', 'desiredAvailable',
        'haveValid', 'haveUnchecked',
        'metadataPercentComplete',
        'group', 'source', 'primary-mime-type',
        'percentComplete', 'manualAnnounceTime',
        'sequential_download'
    ];

    var LIST_FIELDS = [
        'id', 'name', 'status', 'hashString', 'totalSize',
        'percentDone', 'leftUntilDone',
        'eta', 'etaIdle',
        'rateDownload', 'rateUpload',
        'downloadedEver', 'uploadedEver', 'uploadRatio',
        'peersConnected', 'peersSendingToUs', 'peersGettingFromUs',
        'addedDate', 'doneDate', 'activityDate',
        'error', 'errorString',
        'isStalled', 'isFinished',
        'labels', 'downloadDir',
        'recheckProgress',
        'queuePosition',
        'downloadLimited', 'downloadLimit',
        'uploadLimited', 'uploadLimit',
        'bandwidthPriority',
        'group', 'sizeWhenDone', 'haveValid',
        'metadataPercentComplete', 'percentComplete',
        'trackerStats',
        'seedRatioLimit', 'seedRatioMode',
        'seedIdleLimit', 'seedIdleMode',
        'honorsSessionLimits',
        'manualAnnounceTime'
    ];

    var DETAIL_FIELDS = [
        'id', 'trackers', 'trackerStats',
        'files', 'fileStats',
        'peers', 'peersFrom',
        'comment', 'creator', 'dateCreated',
        'isPrivate', 'pieceCount', 'pieceSize',
        'hashString', 'magnetLink',
        'webseeds', 'webseedsSendingToUs',
        'maxConnectedPeers',
        'corruptEver', 'secondsDownloading', 'secondsSeeding',
        'startDate', 'editDate', 'source', 'primary-mime-type',
        'desiredAvailable', 'haveUnchecked', 'remaining',
        'downloadLimited', 'downloadLimit',
        'uploadLimited', 'uploadLimit',
        'bandwidthPriority',
        'seedRatioMode', 'seedRatioLimit',
        'seedIdleMode', 'seedIdleLimit',
        'honorsSessionLimits',
        'rateDownload', 'rateUpload',
        'downloadedEver', 'uploadedEver', 'uploadRatio',
        'downloadDir'
    ];

    var SESSION_FIELDS = [
        'alt-speed-down', 'alt-speed-enabled', 'alt-speed-time-begin',
        'alt-speed-time-day', 'alt-speed-time-enabled', 'alt-speed-time-end',
        'alt-speed-up', 'anti-brute-force-enabled', 'anti-brute-force-threshold',
        'blocklist-enabled', 'blocklist-size', 'blocklist-url',
        'config-dir', 'default-trackers',
        'dht-enabled', 'download-dir', 'download-dir-free-space',
        'download-queue-enabled', 'download-queue-size',
        'encryption', 'idle-seeding-limit-enabled', 'idle-seeding-limit',
        'incomplete-dir', 'incomplete-dir-enabled',
        'lpd-enabled', 'peer-limit-global', 'peer-limit-per-torrent',
        'peer-port', 'peer-port-random-on-start',
        'pex-enabled', 'port-forwarding-enabled',
        'queue-stalled-enabled', 'queue-stalled-minutes',
        'rename-partial-files', 'rpc-authentication-required',
        'rpc-bind-address', 'rpc-enabled', 'rpc-host-whitelist',
        'rpc-host-whitelist-enabled', 'rpc-password', 'rpc-port',
        'rpc-socket-path', 'rpc-url', 'rpc-username',
        'rpc-whitelist', 'rpc-whitelist-enabled',
        'script-torrent-added-enabled', 'script-torrent-added-filename',
        'script-torrent-done-enabled', 'script-torrent-done-filename',
        'seed-queue-enabled', 'seed-queue-size',
        'seedRatioLimit', 'seedRatioLimited',
        'speed-limit-down', 'speed-limit-down-enabled',
        'speed-limit-up', 'speed-limit-up-enabled',
        'start-added-torrents', 'trash-original-torrent-files',
        'units', 'utp-enabled', 'version',
        'rpc-version', 'rpc-version-minimum', 'rpc-version-semver'
    ];

    function _exec(method, arguments_, callback, _409RetryCount) {
        _409RetryCount = _409RetryCount || 0;
        var requestData = {
            method: method,
            arguments: arguments_ || {}
        };

        var ajaxOptions = {
            url: _rpcUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            timeout: 15000,
            headers: {},
            success: function(data) {
                _retryCount = 0;
                _isConnected = true;
                if (callback) callback(data, true);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (textStatus === 'abort') {
                    return;
                }
                
                if (jqXHR.status === 409) {
                    var newSessionId = jqXHR.getResponseHeader('X-Transmission-Session-Id');
                    if (newSessionId && _409RetryCount < 3) {
                        _sessionId = newSessionId;
                        _exec(method, arguments_, callback, _409RetryCount + 1);
                        return;
                    }
                }
                
                if (jqXHR.status === 401) {
                    _isConnected = false;
                    if (callback) callback({result: '认证失败'}, false);
                    return;
                }
                
                if (jqXHR.status >= 400 && jqXHR.status < 500) {
                    _isConnected = false;
                    if (callback) callback({result: '请求错误: ' + jqXHR.status}, false);
                    return;
                }
                
                if (jqXHR.status === 0 && textStatus === 'timeout') {
                    _retryCount++;
                    if (_retryCount <= _maxRetries) {
                        setTimeout(function() {
                            _exec(method, arguments_, callback);
                        }, _retryDelay * _retryCount);
                        return;
                    }
                    _isConnected = false;
                    if (callback) callback({result: '连接超时'}, false);
                    return;
                }
                
                _retryCount++;
                if (_retryCount <= _maxRetries) {
                    var delay = _retryDelay * Math.pow(2, _retryCount - 1);
                    setTimeout(function() {
                        _exec(method, arguments_, callback);
                    }, delay);
                } else {
                    _retryCount = 0;
                    _isConnected = false;
                    if (callback) callback({result: '连接失败: ' + (errorThrown || textStatus)}, false);
                }
            }
        };

        if (_sessionId) {
            ajaxOptions.headers['X-Transmission-Session-Id'] = _sessionId;
        }
        if (_username && _password) {
            ajaxOptions.headers['Authorization'] = 'Basic ' + btoa(_username + ':' + _password);
        }

        $.ajax(ajaxOptions);
    }

    function setConfig(url, username, password) {
        if (url) _rpcUrl = url;
        if (username !== undefined) _username = username;
        if (password !== undefined) _password = password;
    }

    function getRpcUrl() {
        return _rpcUrl;
    }

    function getSessionId() {
        return _sessionId;
    }

    function isConnected() {
        return _isConnected;
    }

    function getTorrents(ids, fields, callback) {
        var args = {
            fields: fields || TORRENT_FIELDS
        };
        if (ids) args.ids = ids;
        _exec('torrent-get', args, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments.torrents, data.arguments.removed || [], true);
            } else {
                callback([], [], false, data ? data.result : '请求失败');
            }
        });
    }

    function getRecentlyActiveTorrents(fields, callback) {
        var args = {
            ids: 'recently-active',
            fields: fields || TORRENT_FIELDS
        };
        _exec('torrent-get', args, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments.torrents, data.arguments.removed, true);
            } else {
                callback([], [], false, data ? data.result : '请求失败');
            }
        });
    }

    function startTorrents(ids, callback) {
        _exec('torrent-start', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function startNowTorrents(ids, callback) {
        _exec('torrent-start-now', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function stopTorrents(ids, callback) {
        _exec('torrent-stop', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function verifyTorrents(ids, callback) {
        _exec('torrent-verify', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function reannounceTorrents(ids, callback) {
        _exec('torrent-reannounce', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function removeTorrents(ids, deleteData, callback) {
        _exec('torrent-remove', {ids: ids, 'delete-local-data': !!deleteData}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function addTorrent(options, callback) {
        var args = {};
        if (options.filename) args.filename = options.filename;
        if (options.metainfo) args.metainfo = options.metainfo;
        if (options['download-dir']) args['download-dir'] = options['download-dir'];
        if (options.paused !== undefined) args.paused = options.paused;
        if (options.cookies) args.cookies = options.cookies;
        if (options['peer-limit']) args.peer_limit = options['peer-limit'];
        if (options.bandwidthPriority !== undefined) args.bandwidth_priority = options.bandwidthPriority;
        if (options.labels) args.labels = options.labels;
        if (options.files_wanted) args['files-wanted'] = options.files_wanted;
        if (options.files_unwanted) args['files-unwanted'] = options.files_unwanted;
        if (options.priority_high) args['priority-high'] = options.priority_high;
        if (options.priority_low) args['priority-low'] = options.priority_low;
        if (options.priority_normal) args['priority-normal'] = options.priority_normal;
        if (options.sequential_download !== undefined) args.sequential_download = options.sequential_download;

        _exec('torrent-add', args, function(data, success) {
            if (success && data && data.result === 'success') {
                var added = data.arguments['torrent-added'];
                var duplicate = data.arguments['torrent-duplicate'];
                callback(true, added, duplicate);
            } else {
                callback(false, null, null, data ? data.result : '添加失败');
            }
        });
    }

    var _torrentSetKeyMap = {
        downloadLimited: 'download_limited',
        downloadLimit: 'download_limit',
        uploadLimited: 'upload_limited',
        uploadLimit: 'upload_limit',
        bandwidthPriority: 'bandwidth_priority',
        peerLimit: 'peer_limit',
        seedRatioMode: 'seed_ratio_mode',
        seedRatioLimit: 'seed_ratio_limit',
        seedIdleMode: 'seed_idle_mode',
        seedIdleLimit: 'seed_idle_limit',
        honorsSessionLimits: 'honors_session_limits',
        sequential_download: 'sequential_download',
        labels: 'labels',
        trackerAdd: 'tracker_add',
        trackerRemove: 'tracker_remove',
        trackerReplace: 'tracker_replace',
        filesWanted: 'files_wanted',
        filesUnwanted: 'files_unwanted',
        priorityHigh: 'priority_high',
        priorityLow: 'priority_low',
        priorityNormal: 'priority_normal'
    };

    function setTorrent(ids, properties, callback) {
        var args = {ids: ids};
        for (var key in properties) {
            if (!properties.hasOwnProperty(key)) continue;
            var mapped = _torrentSetKeyMap[key] || key;
            args[mapped] = properties[key];
        }
        _exec('torrent-set', args, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function setTorrentSequential(ids, sequential, callback) {
        _exec('torrent-set', {ids: ids, sequential_download: !!sequential}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function setTorrentLocation(ids, location, move, callback) {
        _exec('torrent-set-location', {ids: ids, location: location, move: !!move}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function renamePath(ids, path, name, callback) {
        _exec('torrent-rename-path', {ids: ids, path: path, name: name}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(true, data.arguments);
            } else {
                callback(false, null, data ? data.result : '重命名失败');
            }
        });
    }

    function queueMoveTop(ids, callback) {
        _exec('queue-move-top', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function queueMoveUp(ids, callback) {
        _exec('queue-move-up', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function queueMoveDown(ids, callback) {
        _exec('queue-move-down', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function queueMoveBottom(ids, callback) {
        _exec('queue-move-bottom', {ids: ids}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function getSession(fields, callback) {
        var args = {};
        if (fields && fields.length > 0) {
            args.fields = fields;
        }
        _exec('session-get', args, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments, true);
            } else {
                callback(null, false, data ? data.result : '获取会话失败');
            }
        });
    }

    function setSession(properties, callback) {
        _exec('session-set', properties, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function getSessionStats(callback) {
        _exec('session-stats', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments, true);
            } else {
                callback(null, false, data ? data.result : '获取统计失败');
            }
        });
    }

    function updateBlocklist(callback) {
        _exec('blocklist-update', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments['blocklist-size'], true);
            } else {
                callback(0, false, data ? data.result : '更新失败');
            }
        });
    }

    function testPort(callback) {
        _exec('port-test', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments['port-is-open'], true);
            } else {
                callback(false, false, data ? data.result : '测试失败');
            }
        });
    }

    function getFreeSpace(path, callback) {
        _exec('free-space', {path: path}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments['size-bytes'], data.arguments['total-size'], data.arguments.path, true);
            } else {
                callback(-1, -1, path, false, data ? data.result : '查询失败');
            }
        });
    }

    function closeSession(callback) {
        _exec('session-close', {}, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function getGroups(callback) {
        var rpcVersion = TWC.config.getSessionValue('rpc-version') || 0;
        if (rpcVersion < 17) {
            callback([], false, '当前 Transmission 版本不支持带宽组（需要 4.0+）');
            return;
        }
        _exec('group-get', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments.group, true);
            } else {
                callback([], false, data ? data.result : '获取分组失败');
            }
        });
    }

    function setGroup(properties, callback) {
        _exec('group-set', properties, function(data, success) {
            if (callback) callback(success && data && data.result === 'success');
        });
    }

    function testConnection(callback) {
        _exec('session-get', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                _isConnected = true;
                callback(true, data.arguments);
            } else {
                _isConnected = false;
                callback(false, data ? data.result : '连接失败');
            }
        });
    }

    return {
        TORRENT_FIELDS: TORRENT_FIELDS,
        LIST_FIELDS: LIST_FIELDS,
        DETAIL_FIELDS: DETAIL_FIELDS,
        SESSION_FIELDS: SESSION_FIELDS,
        setConfig: setConfig,
        getRpcUrl: getRpcUrl,
        getSessionId: getSessionId,
        isConnected: isConnected,
        getTorrents: getTorrents,
        getRecentlyActiveTorrents: getRecentlyActiveTorrents,
        startTorrents: startTorrents,
        startNowTorrents: startNowTorrents,
        stopTorrents: stopTorrents,
        verifyTorrents: verifyTorrents,
        reannounceTorrents: reannounceTorrents,
        removeTorrents: removeTorrents,
        addTorrent: addTorrent,
        setTorrent: setTorrent,
        setTorrentSequential: setTorrentSequential,
        setTorrentLocation: setTorrentLocation,
        renamePath: renamePath,
        queueMoveTop: queueMoveTop,
        queueMoveUp: queueMoveUp,
        queueMoveDown: queueMoveDown,
        queueMoveBottom: queueMoveBottom,
        getSession: getSession,
        setSession: setSession,
        getSessionStats: getSessionStats,
        updateBlocklist: updateBlocklist,
        testPort: testPort,
        getFreeSpace: getFreeSpace,
        closeSession: closeSession,
        getGroups: getGroups,
        setGroup: setGroup,
        testConnection: testConnection
    };
})();
