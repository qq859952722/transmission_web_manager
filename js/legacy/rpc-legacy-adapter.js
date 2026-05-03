var TWC = TWC || {};

TWC.legacy = (function() {
    var _torrentFieldMap = {
        'hash_string': 'hashString',
        'rate_download': 'rateDownload',
        'rate_upload': 'rateUpload',
        'percent_done': 'percentDone',
        'total_size': 'totalSize',
        'left_until_done': 'leftUntilDone',
        'desired_available': 'desiredAvailable',
        'download_dir': 'downloadDir',
        'date_created': 'dateCreated',
        'error_string': 'errorString',
        'eta_idle': 'etaIdle',
        'file_count': 'fileCount',
        'is_finished': 'isFinished',
        'is_private': 'isPrivate',
        'is_stalled': 'isStalled',
        'magnet_link': 'magnetLink',
        'manual_announce_time': 'manualAnnounceTime',
        'max_connected_peers': 'maxConnectedPeers',
        'metadata_percent_complete': 'metadataPercentComplete',
        'peer_limit': 'peer-limit',
        'peers_connected': 'peersConnected',
        'peers_getting_from_us': 'peersGettingFromUs',
        'peers_sending_to_us': 'peersSendingToUs',
        'percent_complete': 'percentComplete',
        'piece_count': 'pieceCount',
        'piece_size': 'pieceSize',
        'primary_mime_type': 'primary-mime-type',
        'queue_position': 'queuePosition',
        'recheck_progress': 'recheckProgress',
        'seconds_downloading': 'secondsDownloading',
        'seconds_seeding': 'secondsSeeding',
        'seed_idle_limit': 'seedIdleLimit',
        'seed_idle_mode': 'seedIdleMode',
        'seed_ratio_limit': 'seedRatioLimit',
        'seed_ratio_mode': 'seedRatioMode',
        'size_when_done': 'sizeWhenDone',
        'start_date': 'startDate',
        'added_date': 'addedDate',
        'done_date': 'doneDate',
        'activity_date': 'activityDate',
        'edit_date': 'editDate',
        'uploaded_ever': 'uploadedEver',
        'downloaded_ever': 'downloadedEver',
        'corrupt_ever': 'corruptEver',
        'upload_limit': 'uploadLimit',
        'upload_limited': 'uploadLimited',
        'download_limit': 'downloadLimit',
        'download_limited': 'downloadLimited',
        'upload_ratio': 'uploadRatio',
        'bandwidth_priority': 'bandwidthPriority',
        'honors_session_limits': 'honorsSessionLimits',
        'webseeds_sending_to_us': 'webseedsSendingToUs',
        'file_stats': 'fileStats',
        'tracker_stats': 'trackerStats',
        'peers_from': 'peersFrom',
        'sequential_download': 'sequential_download'
    };

    var _trackerFieldMap = {
        'announce_state': 'announceState',
        'download_count': 'downloadCount',
        'has_announced': 'hasAnnounced',
        'has_scraped': 'hasScraped',
        'last_announce_peer_count': 'lastAnnouncePeerCount',
        'last_announce_result': 'lastAnnounceResult',
        'last_announce_start_time': 'lastAnnounceStartTime',
        'last_announce_succeeded': 'lastAnnounceSucceeded',
        'last_announce_time': 'lastAnnounceTime',
        'last_announce_timed_out': 'lastAnnounceTimedOut',
        'last_scrape_result': 'lastScrapeResult',
        'last_scrape_start_time': 'lastScrapeStartTime',
        'last_scrape_succeeded': 'lastScrapeSucceeded',
        'last_scrape_time': 'lastScrapeTime',
        'last_scrape_timed_out': 'lastScrapeTimedOut',
        'leecher_count': 'leecherCount',
        'next_announce_time': 'nextAnnounceTime',
        'next_scrape_time': 'nextScrapeTime',
        'scrape_state': 'scrapeState',
        'seeder_count': 'seederCount',
        'is_backup': 'isBackup'
    };

    var _peerFieldMap = {
        'is_utp': 'isUTP',
        'is_encrypted': 'isEncrypted',
        'is_downloading_from': 'isDownloadingFrom',
        'is_uploading_to': 'isUploadingTo',
        'is_incoming': 'isIncoming',
        'client_is_choked': 'clientIsChoked',
        'client_is_interested': 'clientIsInterested',
        'peer_is_choked': 'peerIsChoked',
        'peer_is_interested': 'peerIsInterested',
        'flag_str': 'flagStr',
        'rate_to_client': 'rateToClient',
        'rate_to_peer': 'rateToPeer',
        'client_name': 'clientName'
    };

    var _statsFieldMap = {
        'active_torrent_count': 'activeTorrentCount',
        'paused_torrent_count': 'pausedTorrentCount',
        'torrent_count': 'torrentCount',
        'download_speed': 'downloadSpeed',
        'upload_speed': 'uploadSpeed'
    };

    var _methodMap = {
        'torrent_get': 'torrent-get',
        'torrent_add': 'torrent-add',
        'torrent_remove': 'torrent-remove',
        'torrent_start': 'torrent-start',
        'torrent_start_now': 'torrent-start-now',
        'torrent_stop': 'torrent-stop',
        'torrent_verify': 'torrent-verify',
        'torrent_reannounce': 'torrent-reannounce',
        'torrent_set': 'torrent-set',
        'torrent_set_location': 'torrent-set-location',
        'torrent_rename_path': 'torrent-rename-path',
        'session_get': 'session-get',
        'session_set': 'session-set',
        'session_stats': 'session-stats',
        'port_test': 'port-test',
        'blocklist_update': 'blocklist-update',
        'free_space': 'free-space',
        'group_get': 'group-get',
        'group_set': 'group-set',
        'queue_move_top': 'queue-move-top',
        'queue_move_bottom': 'queue-move-bottom',
        'queue_move_up': 'queue-move-up',
        'queue_move_down': 'queue-move-down'
    };

    var _allFieldMap = {};
    function _mergeMaps() {
        var maps = [_torrentFieldMap, _trackerFieldMap, _peerFieldMap, _statsFieldMap];
        for (var m = 0; m < maps.length; m++) {
            for (var key in maps[m]) {
                _allFieldMap[key] = maps[m][key];
            }
        }
    }
    _mergeMaps();

    var _reversedMap = null;
    function _getReversedMap() {
        if (!_reversedMap) {
            _reversedMap = {};
            for (var snake in _allFieldMap) {
                _reversedMap[_allFieldMap[snake]] = snake;
            }
        }
        return _reversedMap;
    }

    function adaptMethod(method) {
        return _methodMap[method] || method.replace(/_/g, '-');
    }

    function adaptFields(fields) {
        if (!fields) return fields;
        var adapted = [];
        for (var i = 0; i < fields.length; i++) {
            adapted.push(_allFieldMap[fields[i]] || fields[i]);
        }
        return adapted;
    }

    function adaptArguments(args) {
        if (!args) return args;
        var adapted = {};
        for (var key in args) {
            if (!args.hasOwnProperty(key)) continue;
            var newKey = _allFieldMap[key] || key;
            adapted[newKey] = args[key];
        }
        return adapted;
    }

    function adaptResponse(obj) {
        if (!obj) return obj;
        var revMap = _getReversedMap();
        var adapted = {};
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            var newKey = revMap[key] || key;
            var val = obj[key];
            if (val && typeof val === 'object') {
                if (Array.isArray(val)) {
                    var newArr = [];
                    for (var i = 0; i < val.length; i++) {
                        newArr.push(adaptResponse(val[i]));
                    }
                    adapted[newKey] = newArr;
                } else {
                    adapted[newKey] = adaptResponse(val);
                }
            } else {
                adapted[newKey] = val;
            }
        }
        return adapted;
    }

    function isLegacyRpc(rpcVersion) {
        return rpcVersion > 0 && rpcVersion < 16;
    }

    return {
        adaptMethod: adaptMethod,
        adaptFields: adaptFields,
        adaptArguments: adaptArguments,
        adaptResponse: adaptResponse,
        isLegacyRpc: isLegacyRpc
    };
})();
