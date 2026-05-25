var TWC = TWC || {};

TWC.rpc = (function() {
    var _sessionId = '';
    var _rpcUrl = '/transmission/rpc';
    var _username = '';
    var _password = '';
    var _isConnected = false;
    var _maxRetries = 2;
    var _retryDelay = 1000;
    var _requestId = 0;
    var _rpcVersionSemver = '';
    var _rpcVersion = 0;
    var _protocolDetected = false;
    var _useJsonRpc20 = true;

    var BASE_FIELDS = [
        'id', 'name', 'status', 'hash_string', 'total_size',
        'percent_done', 'left_until_done',
        'eta', 'eta_idle',
        'rate_download', 'rate_upload',
        'downloaded_ever', 'uploaded_ever', 'upload_ratio',
        'peers_connected', 'peers_sending_to_us', 'peers_getting_from_us',
        'added_date', 'done_date', 'activity_date',
        'error', 'error_string',
        'is_stalled', 'is_finished',
        'labels', 'magnet_link', 'download_dir',
        'recheck_progress',
        'queue_position',
        'download_limited', 'download_limit',
        'upload_limited', 'upload_limit',
        'bandwidth_priority',
        'group', 'size_when_done', 'have_valid',
        'metadata_percent_complete', 'percent_complete',
        'tracker_stats',
        'seed_ratio_limit', 'seed_ratio_mode',
        'seed_idle_limit', 'seed_idle_mode',
        'honors_session_limits',
        'sequential_download'
    ];

    var LIST_FIELDS = BASE_FIELDS;

    var TORRENT_FIELDS = BASE_FIELDS.concat([
        'corrupt_ever',
        'start_date', 'edit_date',
        'trackers',
        'files', 'file_stats',
        'peers', 'peers_from',
        'comment', 'creator', 'date_created',
        'is_private',
        'piece_count', 'piece_size', 'pieces',
        'torrent_file', 'file_count',
        'webseeds_sending_to_us',
        'max_connected_peers',
        'seconds_downloading', 'seconds_seeding',
        'desired_available', 'have_unchecked',
        'source', 'primary_mime_type',
        'sequential_download_from_piece',
        'availability', 'tracker_list'
    ]);

    var DETAIL_FIELDS = TORRENT_FIELDS.concat([
        'sequential_download_from_piece'
    ]);

    var SESSION_FIELDS = [
        'alt_speed_down', 'alt_speed_enabled', 'alt_speed_time_begin',
        'alt_speed_time_day', 'alt_speed_time_enabled', 'alt_speed_time_end',
        'alt_speed_up', 'anti_brute_force_enabled', 'anti_brute_force_threshold',
        'blocklist_enabled', 'blocklist_size', 'blocklist_url',
        'config_dir', 'default_trackers',
        'dht_enabled', 'download_dir',
        'download_dir_free_space',
        'download_queue_enabled', 'download_queue_size',
        'encryption', 'idle_seeding_limit_enabled', 'idle_seeding_limit',
        'incomplete_dir', 'incomplete_dir_enabled',
        'lpd_enabled', 'peer_limit_global', 'peer_limit_per_torrent',
        'peer_port', 'peer_port_random_on_start',
        'pex_enabled', 'port_forwarding_enabled',
        'queue_stalled_enabled', 'queue_stalled_minutes',
        'rename_partial_files',
        'script_torrent_added_enabled', 'script_torrent_added_filename',
        'script_torrent_done_enabled', 'script_torrent_done_filename',
        'script_torrent_done_seeding_enabled', 'script_torrent_done_seeding_filename',
        'seed_queue_enabled', 'seed_queue_size',
        'seed_ratio_limit', 'seed_ratio_limited',
        'speed_limit_down', 'speed_limit_down_enabled',
        'speed_limit_up', 'speed_limit_up_enabled',
        'start_added_torrents', 'trash_original_torrent_files',
        'units',
        'utp_enabled',
        'version',
        'rpc_version', 'rpc_version_minimum', 'rpc_version_semver',
        'preferred_transports',
        'tcp_enabled',
        'sequential_download',
        'session_id', 'reqq',
        'cache_size_mib',
        'scrape_paused_torrents_enabled'
    ];

    function _parseTableFormat(torrents) {
        if (!torrents || !torrents.length) return [];
        if (!Array.isArray(torrents[0])) return torrents;
        var keys = torrents[0];
        var result = [];
        for (var i = 1; i < torrents.length; i++) {
            var obj = {};
            for (var j = 0; j < keys.length; j++) {
                obj[keys[j]] = torrents[i][j];
            }
            result.push(obj);
        }
        return result;
    }

    function _supportsJsonRpc20() {
        if (_protocolDetected) return _useJsonRpc20;
        return true;
    }

    var _eventBus = {};
    
    function on(event, fn) {
        if (!_eventBus[event]) _eventBus[event] = [];
        _eventBus[event].push(fn);
        return function() {
            var idx = _eventBus[event].indexOf(fn);
            if (idx >= 0) _eventBus[event].splice(idx, 1);
        };
    }
    
    function emit(event, data) {
        var handlers = _eventBus[event];
        if (handlers) {
            for (var i = 0; i < handlers.length; i++) handlers[i](data);
        }
    }
    
    function _updateRpcVersion(dataObj) {
        if (dataObj) {
            if (dataObj.rpc_version_semver) _rpcVersionSemver = dataObj.rpc_version_semver;
            else if (dataObj['rpc-version-semver']) _rpcVersionSemver = dataObj['rpc-version-semver'];
            if (dataObj.rpc_version) _rpcVersion = dataObj.rpc_version;
            else if (dataObj['rpc-version']) _rpcVersion = dataObj['rpc-version'];
        }
    }

    function _detectProtocol(data) {
        if (_protocolDetected) return;
        _protocolDetected = true;
        if (data && data.jsonrpc === '2.0') {
            _useJsonRpc20 = true;
            if (data.result) _updateRpcVersion(data.result);
        } else {
            _useJsonRpc20 = false;
            if (data && data.arguments) {
                _updateRpcVersion(data.arguments);
            }
        }
    }

    function _exec(method, arguments_, callback, _409RetryCount, _requestRetryCount) {
        _409RetryCount = _409RetryCount || 0;
        _requestRetryCount = _requestRetryCount || 0;
        var useJsonRpc20 = _supportsJsonRpc20();
        var requestMethod = method;
        var requestArgs = arguments_ || {};

        if (!useJsonRpc20) {
            requestMethod = TWC.legacy.adaptMethod(method);
            requestArgs = TWC.legacy.adaptArguments(requestArgs);
            if (requestArgs.fields) {
                requestArgs.fields = TWC.legacy.adaptFields(requestArgs.fields);
            }
            if (requestArgs.format) {
                delete requestArgs.format;
            }
        }

        var requestData;
        if (useJsonRpc20) {
            requestData = {
                jsonrpc: '2.0',
                method: requestMethod,
                params: requestArgs,
                id: ++_requestId
            };
        } else {
            requestData = {
                method: requestMethod,
                arguments: requestArgs
            };
        }

        var fetchHeaders = { 'Content-Type': 'application/json' };
        if (_sessionId) fetchHeaders['X-Transmission-Session-Id'] = _sessionId;
        if (_username && _password) fetchHeaders['Authorization'] = 'Basic ' + btoa(_username + ':' + _password);

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 15000);

        fetch(_rpcUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(requestData),
            signal: controller.signal
        }).then(function(response) {
            clearTimeout(timeoutId);

            if (response.status === 409) {
                var newSid = response.headers.get('X-Transmission-Session-Id');
                if (newSid && _409RetryCount < 3) {
                    _sessionId = newSid;
                    _exec(method, arguments_, callback, _409RetryCount + 1);
                    return;
                }
            }

            if (response.status === 401) {
                _isConnected = false;
                if (callback) callback({error: {message: TWC.i18n.t('status.auth_failed') || 'Authentication failed'}}, false);
                return;
            }

            if (response.status >= 400 && response.status !== 409) {
                _isConnected = false;
                if (callback) callback({error: {message: TWC.i18n.t('status.request_error') || ('Request error: ' + response.status)}}, false);
                return;
            }

            return response.json().catch(function() {
                return response.text().then(function(text) {
                    throw new Error('Invalid JSON: ' + text.substring(0, 100));
                });
            });
        }).then(function(data) {
            if (!data) return;

            _isConnected = true;

            _detectProtocol(data);

            if (_useJsonRpc20) {
                if (data.error) {
                    if (callback) callback(data, false);
                    return;
                }
                var result = data.result;
                if (result && result.torrents) {
                    if (Array.isArray(result.torrents) && result.torrents.length > 0 && Array.isArray(result.torrents[0])) {
                        result.torrents = _parseTableFormat(result.torrents);
                    }
                }
                if (callback) callback(data, true);
            } else {
                if (data.arguments && data.arguments.torrents) {
                    if (!Array.isArray(data.arguments.torrents[0])) {
                        var convertedTorrents = [];
                        for (var ti = 0; ti < data.arguments.torrents.length; ti++) {
                            convertedTorrents.push(TWC.legacy.adaptResponse(data.arguments.torrents[ti]));
                        }
                        data.arguments.torrents = convertedTorrents;
                    }
                }
                if (method === 'torrent_add' && data.arguments) {
                    if (data.arguments['torrent-added']) {
                        data.arguments['torrent-added'] = TWC.legacy.adaptResponse(data.arguments['torrent-added']);
                    }
                    if (data.arguments['torrent-duplicate']) {
                        data.arguments['torrent-duplicate'] = TWC.legacy.adaptResponse(data.arguments['torrent-duplicate']);
                    }
                }
                if (method === 'torrent_rename_path' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                if (method === 'session_stats' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                if (method === 'session_get' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                if (method === 'free_space' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                if (method === 'port_test' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                if (method === 'group_get' && data.arguments) {
                    data.arguments = TWC.legacy.adaptResponse(data.arguments);
                }
                var legacySuccess = data.result === 'success';
                var normalizedData = {
                    jsonrpc: '2.0',
                    result: data.arguments || {},
                    id: _requestId
                };
                if (callback) callback(normalizedData, legacySuccess);
            }
        }).catch(function(err) {
            clearTimeout(timeoutId);

            _requestRetryCount++;

            if (err.name === 'AbortError') {
                if (_requestRetryCount <= _maxRetries) {
                    setTimeout(function() {
                        _exec(method, arguments_, callback, _409RetryCount, _requestRetryCount);
                    }, _retryDelay * _requestRetryCount);
                    return;
                }
                _isConnected = false;
                if (callback) callback({error: {message: TWC.i18n.t('status.timeout') || 'Connection timeout'}}, false);
                return;
            }

            if (_requestRetryCount <= _maxRetries) {
                var delay = _retryDelay * Math.pow(2, _requestRetryCount - 1);
                setTimeout(function() {
                    _exec(method, arguments_, callback, _409RetryCount, _requestRetryCount);
                }, delay);
            } else {
                _isConnected = false;
                if (callback) callback({error: {message: TWC.i18n.t('status.connection_failed') || ('Connection failed: ' + (err.message || 'Unknown error'))}}, false);
            }
        });
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

    function getRpcVersionSemver() {
        return _rpcVersionSemver;
    }

    function getTorrents(ids, fields, callback) {
        var args = {
            fields: fields || TORRENT_FIELDS,
            format: 'table'
        };
        if (ids) args.ids = ids;
        _exec('torrent_get', args, function(data, success) {
            if (success) {
                var result = data.result;
                callback(result.torrents || [], result.removed || [], true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.request_failed') || 'Request failed');
                callback([], [], false, errMsg);
            }
        });
    }

    function getRecentlyActiveTorrents(fields, callback) {
        var args = {
            ids: 'recently-active',
            fields: fields || TORRENT_FIELDS,
            format: 'table'
        };
        _exec('torrent_get', args, function(data, success) {
            if (success) {
                var result = data.result;
                callback(result.torrents || [], result.removed || [], true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.request_failed') || 'Request failed');
                callback([], [], false, errMsg);
            }
        });
    }

    function startTorrents(ids, callback) {
        _exec('torrent_start', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function startNowTorrents(ids, callback) {
        _exec('torrent_start_now', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function stopTorrents(ids, callback) {
        _exec('torrent_stop', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function verifyTorrents(ids, callback) {
        _exec('torrent_verify', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function reannounceTorrents(ids, callback) {
        _exec('torrent_reannounce', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function removeTorrents(ids, deleteData, callback) {
        _exec('torrent_remove', {ids: ids, delete_local_data: !!deleteData}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function addTorrent(options, callback) {
        var args = {};
        if (options.filename) args.filename = options.filename;
        if (options.metainfo) args.metainfo = options.metainfo;
        if (options.download_dir) args.download_dir = options.download_dir;
        if (options.paused !== undefined) args.paused = options.paused;
        if (options.cookies) args.cookies = options.cookies;
        if (options.peer_limit) args.peer_limit = options.peer_limit;
        if (options.bandwidth_priority !== undefined) args.bandwidth_priority = options.bandwidth_priority;
        if (options.labels) args.labels = options.labels;
        if (options.files_wanted) args.files_wanted = options.files_wanted;
        if (options.files_unwanted) args.files_unwanted = options.files_unwanted;
        if (options.priority_high) args.priority_high = options.priority_high;
        if (options.priority_low) args.priority_low = options.priority_low;
        if (options.priority_normal) args.priority_normal = options.priority_normal;
        if (options.sequential_download !== undefined) args.sequential_download = options.sequential_download;

        _exec('torrent_add', args, function(data, success) {
            if (success) {
                var result = data.result;
                var added = result['torrent_added'] || result['torrent-added'];
                var duplicate = result['torrent_duplicate'] || result['torrent-duplicate'];
                if (added && options.group) {
                    setTorrent([added.id], { group: options.group });
                }
                callback(true, added, duplicate);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.add_failed') || 'Add failed');
                callback(false, null, null, errMsg);
            }
        });
    }

    function setTorrent(ids, properties, callback) {
        var args = {ids: ids};
        for (var key in properties) {
            if (!properties.hasOwnProperty(key)) continue;
            args[key] = properties[key];
        }
        _exec('torrent_set', args, function(data, success) {
            if (callback) callback(success);
        });
    }

    function setTorrentSequential(ids, sequential, callback) {
        _exec('torrent_set', {ids: ids, sequential_download: !!sequential}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function setTorrentLocation(ids, location, move, callback) {
        _exec('torrent_set_location', {ids: ids, location: location, move: !!move}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function renamePath(ids, path, name, callback) {
        _exec('torrent_rename_path', {ids: ids, path: path, name: name}, function(data, success) {
            if (success) {
                callback(true, data.result);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.rename_failed') || 'Rename failed');
                callback(false, null, errMsg);
            }
        });
    }

    function queueMoveTop(ids, callback) {
        _exec('queue_move_top', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function queueMoveUp(ids, callback) {
        _exec('queue_move_up', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function queueMoveDown(ids, callback) {
        _exec('queue_move_down', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function queueMoveBottom(ids, callback) {
        _exec('queue_move_bottom', {ids: ids}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function getSession(fields, callback) {
        var args = {};
        if (fields && fields.length > 0) {
            args.fields = fields;
        }
        _exec('session_get', args, function(data, success) {
            if (success) {
                _updateRpcVersion(data.result);
                callback(data.result, true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.session_failed') || 'Session get failed');
                callback(null, false, errMsg);
            }
        });
    }

    function setSession(properties, callback) {
        _exec('session_set', properties, function(data, success) {
            if (callback) callback(success);
        });
    }

    var STATS_KEY_MAP = {
        'downloaded_bytes': 'downloadedBytes',
        'uploaded_bytes': 'uploadedBytes',
        'seconds_active': 'secondsActive',
        'files_added': 'filesAdded',
        'session_count': 'sessionCount'
    };

    function _normalizeStatsMap(statsObj) {
        if (!statsObj) return;
        for (var key in STATS_KEY_MAP) {
            if (statsObj.hasOwnProperty(key)) {
                statsObj[STATS_KEY_MAP[key]] = statsObj[key];
                delete statsObj[key];
            }
        }
    }

    function getSessionStats(callback) {
        _exec('session_stats', {}, function(data, success) {
            if (success) {
                var result = data.result;
                _normalizeStatsMap(result.cumulative_stats);
                _normalizeStatsMap(result.current_stats);
                callback(result, true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.stats_failed') || 'Stats get failed');
                callback(null, false, errMsg);
            }
        });
    }

    function updateBlocklist(callback) {
        _exec('blocklist_update', {}, function(data, success) {
            if (success) {
                callback(data.result.blocklist_size, true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.update_failed') || 'Update failed');
                callback(0, false, errMsg);
            }
        });
    }

    function _translatePortTestError(errMsg) {
        if (!errMsg) return TWC.i18n.t('status.test_failed') || 'Test failed';
        var lower = errMsg.toLowerCase();
        if (lower.indexOf('no response') !== -1) {
            return TWC.i18n.t('status.port_test_no_response') || 'No Response';
        }
        if (lower.indexOf('couldn\'t test port') !== -1) {
            return TWC.i18n.t('status.port_test_failed') || 'Couldn\'t test port';
        }
        return errMsg;
    }

    function testPort(callback, ipProtocol) {
        var args = {};
        if (ipProtocol && _rpcVersion >= 19) {
            args.ip_protocol = ipProtocol;
        }
        _exec('port_test', args, function(data, success) {
            if (success) {
                var result = data.result;
                var portIsOpen = result.port_is_open !== undefined ? result.port_is_open : false;
                var ipProtocolResult = result.ip_protocol || '';
                callback(portIsOpen, true, ipProtocolResult);
            } else {
                var errMsg = '';
                var ipProtocolResult = '';
                if (data.error) {
                    errMsg = _translatePortTestError(data.error.message);
                    if (data.error.data && data.error.data.result) {
                        ipProtocolResult = data.error.data.result.ip_protocol || '';
                    }
                }
                callback(false, false, errMsg, ipProtocolResult);
            }
        });
    }

    function getFreeSpace(path, callback) {
        _exec('free_space', {path: path}, function(data, success) {
            if (success) {
                var result = data.result;
                callback(result.size_bytes, result.total_size, result.path, true);
            } else {
                if (data.error && _.get(data, 'error.data.result')) {
                    var errResult = data.error.data.result;
                    callback(errResult.size_bytes, errResult.total_size, errResult.path, false,
                        data.error.data.error_string || data.error.message);
                } else {
                    var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.query_failed') || 'Query failed');
                    callback(-1, -1, path, false, errMsg);
                }
            }
        });
    }

    function closeSession(callback) {
        _exec('session_close', {}, function(data, success) {
            if (callback) callback(success);
        });
    }

    function getGroups(callback) {
        if (_rpcVersion > 0 && _rpcVersion < 17) {
            callback([], false, TWC.i18n.t('status.group_unsupported') || 'Bandwidth groups require Transmission 4.0+');
            return;
        }
        _exec('group_get', {}, function(data, success) {
            if (success) {
                var groups = data.result.group || data.result.groups || [];
                callback(groups, true);
            } else {
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.group_failed') || 'Group get failed');
                callback([], false, errMsg);
            }
        });
    }

    function setGroup(properties, callback) {
        _exec('group_set', properties, function(data, success) {
            if (callback) callback(success);
        });
    }

    function testConnection(callback) {
        _exec('session_get', {}, function(data, success) {
            if (success) {
                _isConnected = true;
                _updateRpcVersion(data.result);
                callback(true, data.result);
            } else {
                _isConnected = false;
                var errMsg = data.error ? data.error.message : (TWC.i18n.t('status.connection_failed') || 'Connection failed');
                callback(false, errMsg);
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
        getRpcVersionSemver: getRpcVersionSemver,
        on: on,
        emit: emit,
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
