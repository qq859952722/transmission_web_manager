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
        'percentDone', 'leftUntilDone',
        'eta', 'etaIdle',
        'rateDownload', 'rateUpload',
        'downloadedEver', 'uploadedEver',
        'corruptEver',
        'peersConnected', 'peersSendingToUs', 'peersGettingFromUs',
        'addedDate', 'doneDate', 'startDate', 'activityDate', 'editDate',
        'trackers', 'trackerStats',
        'files', 'fileStats',
        'peers', 'peersFrom',
        'comment', 'creator', 'dateCreated',
        'error', 'errorString',
        'isStalled', 'isFinished', 'isPrivate',
        'labels', 'magnetLink',
        'downloadDir',
        'pieceCount', 'pieceSize', 'pieces',
        'torrentFile', 'file-count',
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
        'isPrivate', 'pieceCount', 'pieceSize', 'pieces',
        'hashString', 'magnetLink', 'torrentFile',
        'webseeds', 'webseedsSendingToUs',
        'maxConnectedPeers', 'file-count',
        'corruptEver', 'secondsDownloading', 'secondsSeeding',
        'startDate', 'editDate', 'source', 'primary-mime-type',
        'desiredAvailable', 'haveUnchecked',
        'downloadLimited', 'downloadLimit',
        'uploadLimited', 'uploadLimit',
        'bandwidthPriority',
        'seedRatioMode', 'seedRatioLimit',
        'seedIdleMode', 'seedIdleLimit',
        'honorsSessionLimits',
        'queuePosition',
        'rateDownload', 'rateUpload',
        'downloadedEver', 'uploadedEver', 'uploadRatio',
        'downloadDir', 'availability', 'trackerList'
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
        'script-torrent-done-seeding-enabled', 'script-torrent-done-seeding-filename',
        'seed-queue-enabled', 'seed-queue-size',
        'seedRatioLimit', 'seedRatioLimited',
        'speed-limit-down', 'speed-limit-down-enabled',
        'speed-limit-up', 'speed-limit-up-enabled',
        'start-added-torrents', 'trash-original-torrent-files',
        'units', 'utp-enabled', 'version',
        'rpc-version', 'rpc-version-minimum', 'rpc-version-semver',
        'preferred_transports', 'tcp-enabled', 'sequential_download',
        'session-id', 'reqq'
    ];

    var _camelToSnakeMap = {
        'hashString': 'hash_string',
        'rateDownload': 'rate_download',
        'rateUpload': 'rate_upload',
        'percentDone': 'percent_done',
        'percentComplete': 'percent_complete',
        'totalSize': 'total_size',
        'leftUntilDone': 'left_until_done',
        'desiredAvailable': 'desired_available',
        'downloadDir': 'download_dir',
        'dateCreated': 'date_created',
        'errorString': 'error_string',
        'etaIdle': 'eta_idle',
        'fileCount': 'file_count',
        'isFinished': 'is_finished',
        'isPrivate': 'is_private',
        'isStalled': 'is_stalled',
        'magnetLink': 'magnet_link',
        'manualAnnounceTime': 'manual_announce_time',
        'maxConnectedPeers': 'max_connected_peers',
        'metadataPercentComplete': 'metadata_percent_complete',
        'haveValid': 'have_valid',
        'haveUnchecked': 'have_unchecked',
        'peersConnected': 'peers_connected',
        'peersGettingFromUs': 'peers_getting_from_us',
        'peersSendingToUs': 'peers_sending_to_us',
        'pieceCount': 'piece_count',
        'pieceSize': 'piece_size',
        'queuePosition': 'queue_position',
        'recheckProgress': 'recheck_progress',
        'secondsDownloading': 'seconds_downloading',
        'secondsSeeding': 'seconds_seeding',
        'seedIdleLimit': 'seed_idle_limit',
        'seedIdleMode': 'seed_idle_mode',
        'seedRatioLimit': 'seed_ratio_limit',
        'seedRatioMode': 'seed_ratio_mode',
        'seedRatioLimited': 'seed_ratio_limited',
        'sizeWhenDone': 'size_when_done',
        'startDate': 'start_date',
        'addedDate': 'added_date',
        'doneDate': 'done_date',
        'activityDate': 'activity_date',
        'editDate': 'edit_date',
        'uploadedEver': 'uploaded_ever',
        'downloadedEver': 'downloaded_ever',
        'corruptEver': 'corrupt_ever',
        'uploadLimit': 'upload_limit',
        'uploadLimited': 'upload_limited',
        'downloadLimit': 'download_limit',
        'downloadLimited': 'download_limited',
        'uploadRatio': 'upload_ratio',
        'bandwidthPriority': 'bandwidth_priority',
        'honorsSessionLimits': 'honors_session_limits',
        'webseedsSendingToUs': 'webseeds_sending_to_us',
        'fileStats': 'file_stats',
        'trackerStats': 'tracker_stats',
        'torrentFile': 'torrent_file',
        'file-count': 'file_count',
        'primary-mime-type': 'primary_mime_type',
        'peersFrom': 'peers_from',
        'isUTP': 'is_utp',
        'isEncrypted': 'is_encrypted',
        'isDownloadingFrom': 'is_downloading_from',
        'isUploadingTo': 'is_uploading_to',
        'isIncoming': 'is_incoming',
        'clientIsChoked': 'client_is_choked',
        'clientIsInterested': 'client_is_interested',
        'peerIsChoked': 'peer_is_choked',
        'peerIsInterested': 'peer_is_interested',
        'flagStr': 'flag_str',
        'rateToClient': 'rate_to_client',
        'rateToPeer': 'rate_to_peer',
        'clientName': 'client_name',
        'isBackup': 'is_backup',
        'announceState': 'announce_state',
        'downloadCount': 'download_count',
        'hasAnnounced': 'has_announced',
        'hasScraped': 'has_scraped',
        'lastAnnouncePeerCount': 'last_announce_peer_count',
        'lastAnnounceResult': 'last_announce_result',
        'lastAnnounceStartTime': 'last_announce_start_time',
        'lastAnnounceSucceeded': 'last_announce_succeeded',
        'lastAnnounceTime': 'last_announce_time',
        'lastAnnounceTimedOut': 'last_announce_timed_out',
        'lastScrapeResult': 'last_scrape_result',
        'lastScrapeStartTime': 'last_scrape_start_time',
        'lastScrapeSucceeded': 'last_scrape_succeeded',
        'lastScrapeTime': 'last_scrape_time',
        'lastScrapeTimedOut': 'last_scrape_timed_out',
        'leecherCount': 'leecher_count',
        'nextAnnounceTime': 'next_announce_time',
        'nextScrapeTime': 'next_scrape_time',
        'scrapeState': 'scrape_state',
        'seederCount': 'seeder_count',
        'activeTorrentCount': 'active_torrent_count',
        'pausedTorrentCount': 'paused_torrent_count',
        'torrentCount': 'torrent_count',
        'downloadSpeed': 'download_speed',
        'uploadSpeed': 'upload_speed',
        'bytesToClient': 'bytes_to_client',
        'bytesToPeer': 'bytes_to_peer',
        'connectionType': 'connection_type',
        'peerIsEncrypted': 'peer_is_encrypted',
        'bytesCompleted': 'bytes_completed'
    };

    function _convertResponseKeys(obj, depth) {
        if (depth === undefined) depth = 0;
        if (depth > 5 || !obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            var newArr = [];
            for (var i = 0; i < obj.length; i++) {
                newArr.push(_convertResponseKeys(obj[i], depth + 1));
            }
            return newArr;
        }

        var result = {};
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            var newKey = _camelToSnakeMap[key] || key;
            var val = obj[key];
            if (val && typeof val === 'object') {
                val = _convertResponseKeys(val, depth + 1);
            }
            result[newKey] = val;
        }
        return result;
    }

    function _exec(method, arguments_, callback, _409RetryCount) {
        _409RetryCount = _409RetryCount || 0;
        var rpcVersion = (TWC.config && TWC.config.getSessionValue('rpc-version')) || 0;
        var isLegacy = rpcVersion > 0 && rpcVersion < 16;

        var requestMethod = method;
        var requestArgs = arguments_ || {};

        if (isLegacy) {
            requestMethod = TWC.legacy.adaptMethod(method);
            requestArgs = TWC.legacy.adaptArguments(requestArgs);
            if (requestArgs.fields) {
                requestArgs.fields = TWC.legacy.adaptFields(requestArgs.fields);
            }
        }

        var requestData = {
            method: requestMethod,
            arguments: requestArgs
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

                if (isLegacy && data.arguments && data.arguments.torrents) {
                    for (var i = 0; i < data.arguments.torrents.length; i++) {
                        data.arguments.torrents[i] = TWC.legacy.adaptResponse(data.arguments.torrents[i]);
                    }
                }

                if (!isLegacy && data.arguments) {
                    if (data.arguments.torrents) {
                        var convertedTorrents = [];
                        for (var ti = 0; ti < data.arguments.torrents.length; ti++) {
                            convertedTorrents.push(_convertResponseKeys(data.arguments.torrents[ti]));
                        }
                        data.arguments.torrents = convertedTorrents;
                    }

                    if (method === 'torrent-add') {
                        if (data.arguments['torrent-added']) {
                            data.arguments['torrent-added'] = _convertResponseKeys(data.arguments['torrent-added']);
                        }
                        if (data.arguments['torrent-duplicate']) {
                            data.arguments['torrent-duplicate'] = _convertResponseKeys(data.arguments['torrent-duplicate']);
                        }
                    }

                    if (method === 'torrent-rename-path' && data.arguments) {
                        data.arguments = _convertResponseKeys(data.arguments);
                    }

                    if (method === 'session-stats' && data.arguments) {
                        data.arguments = _convertResponseKeys(data.arguments);
                    }
                }

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
                    if (callback) callback({result: TWC.i18n.t('status.auth_failed') || 'Authentication failed'}, false);
                    return;
                }

                if (jqXHR.status >= 400 && jqXHR.status < 500) {
                    _isConnected = false;
                    if (callback) callback({result: TWC.i18n.t('status.request_error') || ('Request error: ' + jqXHR.status)}, false);
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
                    if (callback) callback({result: TWC.i18n.t('status.timeout') || 'Connection timeout'}, false);
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
                    if (callback) callback({result: TWC.i18n.t('status.connection_failed') || ('Connection failed: ' + (errorThrown || textStatus))}, false);
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
                callback([], [], false, data ? data.result : TWC.i18n.t('status.request_failed') || 'Request failed');
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
                callback([], [], false, data ? data.result : TWC.i18n.t('status.request_failed') || 'Request failed');
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
        if (options['peer-limit']) args['peer-limit'] = options['peer-limit'];
        if (options.bandwidthPriority !== undefined) args.bandwidthPriority = options.bandwidthPriority;
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
                if (added && options.group) {
                    setTorrent([added.id], { group: options.group });
                }
                callback(true, added, duplicate);
            } else {
                callback(false, null, null, data ? data.result : TWC.i18n.t('status.add_failed') || 'Add failed');
            }
        });
    }

    var _torrentSetKeyMap = {
        downloadLimited: 'downloadLimited',
        downloadLimit: 'downloadLimit',
        uploadLimited: 'uploadLimited',
        uploadLimit: 'uploadLimit',
        bandwidthPriority: 'bandwidthPriority',
        peerLimit: 'peer-limit',
        seedRatioMode: 'seedRatioMode',
        seedRatioLimit: 'seedRatioLimit',
        seedIdleMode: 'seedIdleMode',
        seedIdleLimit: 'seedIdleLimit',
        honorsSessionLimits: 'honorsSessionLimits',
        sequential_download: 'sequential_download',
        labels: 'labels',
        trackerAdd: 'trackerAdd',
        trackerRemove: 'trackerRemove',
        trackerReplace: 'trackerReplace',
        filesWanted: 'files-wanted',
        filesUnwanted: 'files-unwanted',
        priorityHigh: 'priority-high',
        priorityLow: 'priority-low',
        priorityNormal: 'priority-normal'
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
                callback(false, null, data ? data.result : TWC.i18n.t('status.rename_failed') || 'Rename failed');
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
                callback(null, false, data ? data.result : TWC.i18n.t('status.session_failed') || 'Session get failed');
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
                callback(null, false, data ? data.result : TWC.i18n.t('status.stats_failed') || 'Stats get failed');
            }
        });
    }

    function updateBlocklist(callback) {
        _exec('blocklist-update', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                callback(data.arguments['blocklist-size'], true);
            } else {
                callback(0, false, data ? data.result : TWC.i18n.t('status.update_failed') || 'Update failed');
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
        var rpcVersion = (TWC.config && TWC.config.getSessionValue('rpc-version')) || 0;
        if (ipProtocol && rpcVersion >= 19) {
            args.ip_protocol = ipProtocol;
        }
        _exec('port-test', args, function(data, success) {
            if (success && data && data.result === 'success') {
                var portIsOpen = data.arguments['port-is-open'] !== undefined ? data.arguments['port-is-open'] : data.arguments.port_is_open;
                var ipProtocolResult = data.arguments.ip_protocol || data.arguments['ip-protocol'] || '';
                callback(portIsOpen, true, ipProtocolResult);
            } else {
                var errMsg = '';
                var ipProtocolResult = '';
                if (data && data.result && data.result !== 'success') {
                    errMsg = _translatePortTestError(data.result);
                    if (data.arguments) {
                        ipProtocolResult = data.arguments.ip_protocol || data.arguments['ip-protocol'] || '';
                    }
                }
                callback(false, false, errMsg, ipProtocolResult);
            }
        });
    }

    function getFreeSpace(path, callback) {
        _exec('free-space', {path: path}, function(data, success) {
            if (success && data && data.result === 'success') {
                var freeBytes = data.arguments['size-bytes'] !== undefined ? data.arguments['size-bytes'] : data.arguments.size_bytes;
                var totalBytes = data.arguments['total-size'] !== undefined ? data.arguments['total-size'] : data.arguments.total_size;
                callback(freeBytes, totalBytes, data.arguments.path, true);
            } else {
                callback(-1, -1, path, false, data ? data.result : TWC.i18n.t('status.query_failed') || 'Query failed');
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
        if (rpcVersion > 0 && rpcVersion < 17) {
            callback([], false, TWC.i18n.t('status.group_unsupported') || 'Bandwidth groups require Transmission 4.0+');
            return;
        }
        _exec('group-get', {}, function(data, success) {
            if (success && data && data.result === 'success') {
                var groups = data.arguments.group || data.arguments.groups || [];
                callback(groups, true);
            } else {
                callback([], false, data ? data.result : TWC.i18n.t('status.group_failed') || 'Group get failed');
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
                callback(false, data ? data.result : TWC.i18n.t('status.connection_failed') || 'Connection failed');
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
