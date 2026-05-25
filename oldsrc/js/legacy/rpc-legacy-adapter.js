var TWC = TWC || {};

TWC.legacy = (function() {
    var _methodMap = {
        session_get: 'session-get',
        session_set: 'session-set',
        session_stats: 'session-stats',
        session_close: 'session-close',
        torrent_get: 'torrent-get',
        torrent_set: 'torrent-set',
        torrent_add: 'torrent-add',
        torrent_remove: 'torrent-remove',
        torrent_start: 'torrent-start',
        torrent_start_now: 'torrent-start-now',
        torrent_stop: 'torrent-stop',
        torrent_verify: 'torrent-verify',
        torrent_reannounce: 'torrent-reannounce',
        torrent_set_location: 'torrent-set-location',
        torrent_rename_path: 'torrent-rename-path',
        group_get: 'group-get',
        group_set: 'group-set',
        port_test: 'port-test',
        blocklist_update: 'blocklist-update',
        free_space: 'free-space',
        queue_move_top: 'queue-move-top',
        queue_move_up: 'queue-move-up',
        queue_move_down: 'queue-move-down',
        queue_move_bottom: 'queue-move-bottom'
    };

    var _reverseMethodMap = {};
    for (var k in _methodMap) {
        if (_methodMap.hasOwnProperty(k)) {
            _reverseMethodMap[_methodMap[k]] = k;
        }
    }

    var _fieldToKebab = {
        hash_string: 'hashString',
        total_size: 'totalSize',
        percent_done: 'percentDone',
        left_until_done: 'leftUntilDone',
        eta_idle: 'etaIdle',
        rate_download: 'rateDownload',
        rate_upload: 'rateUpload',
        downloaded_ever: 'downloadedEver',
        uploaded_ever: 'uploadedEver',
        corrupt_ever: 'corruptEver',
        peers_connected: 'peersConnected',
        peers_sending_to_us: 'peersSendingToUs',
        peers_getting_from_us: 'peersGettingFromUs',
        added_date: 'addedDate',
        done_date: 'doneDate',
        start_date: 'startDate',
        activity_date: 'activityDate',
        edit_date: 'editDate',
        tracker_stats: 'trackerStats',
        file_stats: 'fileStats',
        peers_from: 'peersFrom',
        date_created: 'dateCreated',
        error_string: 'errorString',
        is_stalled: 'isStalled',
        is_finished: 'isFinished',
        is_private: 'isPrivate',
        magnet_link: 'magnetLink',
        download_dir: 'downloadDir',
        piece_count: 'pieceCount',
        piece_size: 'pieceSize',
        torrent_file: 'torrentFile',
        file_count: 'fileCount',
        recheck_progress: 'recheckProgress',
        upload_ratio: 'uploadRatio',
        webseeds_sending_to_us: 'webseedsSendingToUs',
        bandwidth_priority: 'bandwidthPriority',
        seed_idle_limit: 'seedIdleLimit',
        seed_idle_mode: 'seedIdleMode',
        seed_ratio_limit: 'seedRatioLimit',
        seed_ratio_mode: 'seedRatioMode',
        download_limited: 'downloadLimited',
        download_limit: 'downloadLimit',
        upload_limited: 'uploadLimited',
        upload_limit: 'uploadLimit',
        honors_session_limits: 'honorsSessionLimits',
        queue_position: 'queuePosition',
        max_connected_peers: 'maxConnectedPeers',
        seconds_downloading: 'secondsDownloading',
        seconds_seeding: 'secondsSeeding',
        size_when_done: 'sizeWhenDone',
        desired_available: 'desiredAvailable',
        have_valid: 'haveValid',
        have_unchecked: 'haveUnchecked',
        metadata_percent_complete: 'metadataPercentComplete',
        primary_mime_type: 'primaryMimeType',
        percent_complete: 'percentComplete',
        sequential_download: 'sequentialDownload',
        sequential_download_from_piece: 'sequentialDownloadFromPiece',
        peer_limit: 'peerLimit',
        files_wanted: 'filesWanted',
        files_unwanted: 'filesUnwanted',
        priority_high: 'priorityHigh',
        priority_low: 'priorityLow',
        priority_normal: 'priorityNormal',
        tracker_list: 'trackerList',
        delete_local_data: 'deleteLocalData',
        download_dir_free_space: 'downloadDirFreeSpace',
        ip_protocol: 'ipProtocol',
        torrent_added: 'torrentAdded',
        torrent_duplicate: 'torrentDuplicate'
    };

    var _kebabToField = {};
    for (var kf in _fieldToKebab) {
        if (_fieldToKebab.hasOwnProperty(kf)) {
            _kebabToField[_fieldToKebab[kf]] = kf;
        }
    }

    var _legacyKebabVariants = {
        'peer-limit': 'peer_limit',
        'files-wanted': 'files_wanted',
        'files-unwanted': 'files_unwanted',
        'priority-high': 'priority_high',
        'priority-low': 'priority_low',
        'priority-normal': 'priority_normal',
        'delete-local-data': 'delete_local_data',
        'download-dir-free-space': 'download_dir_free_space',
        'ip-protocol': 'ip_protocol',
        'torrent-added': 'torrent_added',
        'torrent-duplicate': 'torrent_duplicate'
    };
    for (var kv in _legacyKebabVariants) {
        if (_legacyKebabVariants.hasOwnProperty(kv)) {
            _kebabToField[kv] = _legacyKebabVariants[kv];
        }
    }

    function adaptMethod(method) {
        return _methodMap[method] || method.replace(/_/g, '-');
    }

    function adaptArguments(args) {
        if (!args || typeof args !== 'object') return args;
        var result = {};
        for (var key in args) {
            if (!args.hasOwnProperty(key)) continue;
            var mapped = _fieldToKebab[key];
            if (mapped) {
                result[mapped] = args[key];
            } else {
                result[key] = args[key];
            }
        }
        return result;
    }

    function adaptFields(fields) {
        if (!fields || !Array.isArray(fields)) return fields;
        var result = [];
        for (var i = 0; i < fields.length; i++) {
            result.push(_fieldToKebab[fields[i]] || fields[i]);
        }
        return result;
    }

    function adaptResponse(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            var arr = [];
            for (var i = 0; i < obj.length; i++) {
                arr.push(adaptResponse(obj[i]));
            }
            return arr;
        }
        var result = {};
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            var snakeKey = _kebabToField[key] || key;
            result[snakeKey] = adaptResponse(obj[key]);
        }
        return result;
    }

    return {
        adaptMethod: adaptMethod,
        adaptArguments: adaptArguments,
        adaptFields: adaptFields,
        adaptResponse: adaptResponse
    };
})();
