var TWC = TWC || {};

TWC.config = (function() {
    var _sessionData = {};
    var _sessionStats = {};
    var _freeSpace = -1;
    var _totalSpace = -1;
    var _isPortOpen = null;
    var _ipProtocol = '';
    var _blocklistSize = 0;
    var _groups = [];
    var _listeners = [];
    var _isLoaded = false;

    var CONFIG_TABS = [
        { id: 'download', i18n: 'detail.tabs.files', icon: 'download' },
        { id: 'speed', i18n: 'detail.tabs.speed', icon: 'speed' },
        { id: 'groups', i18n: 'dialog.settings.bandwidth_groups', fallback: 'Bandwidth Groups', icon: 'groups' },
        { id: 'network', i18n: 'toolbar.network', fallback: 'Network', icon: 'network' },
        { id: 'peer', i18n: 'detail.peers.title', icon: 'peer' },
        { id: 'seeding', i18n: 'detail.settings.seed_ratio', icon: 'seeding' },
        { id: 'queue', i18n: 'sidebar.status_queued', icon: 'queue' },
        { id: 'labels', i18n: 'sidebar.labels', icon: 'labels' },
        { id: 'blocklist', i18n: 'dialog.settings.blocklist', icon: 'blocklist' },
        { id: 'rpc', fallback: 'RPC', icon: 'rpc' },
        { id: 'script', i18n: 'dialog.settings.script', fallback: 'Script', icon: 'script' },
        { id: 'advanced', i18n: 'dialog.settings.advanced', fallback: 'Advanced', icon: 'advanced' }
    ];

    var CONFIG_ITEMS = {
        download: [
            {
                i18nGroup: 'detail.settings.download_dir',
                items: [
                    { key: 'download_dir', i18nLabel: 'dialog.add.download_dir', type: 'folder', i18nHint: 'dialog.add.dir_placeholder' },
                    { key: 'incomplete_dir_enabled', i18nLabel: 'dialog.settings.incomplete_enabled', fallbackLabel: 'Enable Incomplete Dir', type: 'toggle', i18nHint: 'dialog.settings.incomplete_hint', fallbackHint: 'Save unfinished files to a temporary folder' },
                    { key: 'incomplete_dir', i18nLabel: 'dialog.settings.incomplete_dir', fallbackLabel: 'Incomplete Dir', type: 'folder', i18nHint: 'dialog.settings.incomplete_dir_hint', fallbackHint: 'Location for unfinished files', depends: 'incomplete_dir_enabled' }
                ]
            },
            {
                i18nGroup: 'dialog.settings.add_behavior', fallbackGroup: 'Add Behavior',
                items: [
                    { key: 'start_added_torrents', i18nLabel: 'dialog.settings.start_added', fallbackLabel: 'Start Added Torrents', type: 'toggle', i18nHint: 'dialog.add.paused' },
                    { key: 'rename_partial_files', i18nLabel: 'dialog.settings.rename_partial', fallbackLabel: 'Rename Partial Files', type: 'toggle', i18nHint: 'dialog.settings.rename_partial_hint', fallbackHint: 'Append .part to unfinished files' },
                    { key: 'trash_original_torrent_files', i18nLabel: 'dialog.settings.trash_torrent', fallbackLabel: 'Trash Original Torrent Files', type: 'toggle', i18nHint: 'dialog.settings.trash_torrent_hint', fallbackHint: 'Delete .torrent files after adding' }
                ]
            }
        ],
        speed: [
            {
                i18nGroup: 'dialog.settings.global_speed', fallbackGroup: 'Global Speed Limits',
                items: [
                    { key: 'speed_limit_down_enabled', i18nLabel: 'dialog.settings.dl_limit_enabled', fallbackLabel: 'Enable Download Limit', type: 'toggle' },
                    { key: 'speed_limit_down', i18nLabel: 'detail.settings.download_limit', type: 'number', unit: 'KB/s', depends: 'speed_limit_down_enabled', min: 0 },
                    { key: 'speed_limit_up_enabled', i18nLabel: 'dialog.settings.ul_limit_enabled', fallbackLabel: 'Enable Upload Limit', type: 'toggle' },
                    { key: 'speed_limit_up', i18nLabel: 'detail.settings.upload_limit', type: 'number', unit: 'KB/s', depends: 'speed_limit_up_enabled', min: 0 }
                ]
            },
            {
                i18nGroup: 'toolbar.alt_speed',
                items: [
                    { key: 'alt_speed_enabled', i18nLabel: 'dialog.settings.enabled', type: 'toggle', i18nHint: 'status.alt_speed_on' },
                    { key: 'alt_speed_down', i18nLabel: 'detail.speed.download', type: 'number', unit: 'KB/s', min: 0 },
                    { key: 'alt_speed_up', i18nLabel: 'detail.speed.upload', type: 'number', unit: 'KB/s', min: 0 },
                    { key: 'alt_speed_time_enabled', i18nLabel: 'dialog.settings.alt_speed_time', fallbackLabel: 'Enable Scheduled Alt Speed', type: 'toggle' },
                    { key: 'alt_speed_time_begin', i18nLabel: 'dialog.settings.start_time', fallbackLabel: 'Start Time', type: 'time', depends: 'alt_speed_time_enabled' },
                    { key: 'alt_speed_time_end', i18nLabel: 'dialog.settings.end_time', fallbackLabel: 'End Time', type: 'time', depends: 'alt_speed_time_enabled' },
                    { key: 'alt_speed_time_day', i18nLabel: 'dialog.settings.days', fallbackLabel: 'Days', type: 'daymask', depends: 'alt_speed_time_enabled' }
                ]
            }
        ],
        network: [
            {
                i18nGroup: 'dialog.settings.port_settings', fallbackGroup: 'Port Settings',
                items: [
                    { key: 'peer_port', i18nLabel: 'dialog.settings.listen_port', fallbackLabel: 'Listen Port', type: 'number', min: 1, max: 65535 },
                    { key: 'peer_port_random_on_start', i18nLabel: 'dialog.settings.random_port', fallbackLabel: 'Random Port on Start', type: 'toggle' },
                    { key: 'port_forwarding_enabled', i18nLabel: 'dialog.settings.port_forwarding', fallbackLabel: 'Enable Port Forwarding', type: 'toggle' }
                ]
            },
            {
                i18nGroup: 'dialog.settings.protocols', fallbackGroup: 'Protocols',
                items: [
                    { key: 'dht_enabled', i18nLabel: 'dialog.settings.dht', fallbackLabel: 'DHT', type: 'toggle', i18nHint: 'dialog.settings.dht_hint', fallbackHint: 'Distributed Hash Table' },
                    { key: 'pex_enabled', i18nLabel: 'dialog.settings.pex', fallbackLabel: 'PEX', type: 'toggle', i18nHint: 'dialog.settings.pex_hint', fallbackHint: 'Peer Exchange' },
                    { key: 'lpd_enabled', i18nLabel: 'dialog.settings.lpd', fallbackLabel: 'LPD', type: 'toggle', i18nHint: 'dialog.settings.lpd_hint', fallbackHint: 'Local Peer Discovery' },
                    { key: 'utp_enabled', i18nLabel: 'dialog.settings.utp', fallbackLabel: 'uTP', type: 'toggle', i18nHint: 'dialog.settings.utp_hint', fallbackHint: 'Micro Transport Protocol' },
                    { key: 'encryption', i18nLabel: 'detail.peers.encryption', type: 'select', options: [
                        { value: 'required', i18nLabel: 'dialog.settings.enc_required', fallbackLabel: 'Required' },
                        { value: 'preferred', i18nLabel: 'dialog.settings.enc_preferred', fallbackLabel: 'Preferred' },
                        { value: 'tolerated', i18nLabel: 'dialog.settings.enc_tolerated', fallbackLabel: 'Tolerated' }
                    ]}
                ]
            },
            {
                i18nGroup: 'dialog.settings.security', fallbackGroup: 'Security',
                items: [
                    { key: 'anti_brute_force_enabled', i18nLabel: 'dialog.settings.anti_brute', fallbackLabel: 'Enable Anti Brute Force', type: 'toggle' },
                    { key: 'anti_brute_force_threshold', i18nLabel: 'dialog.settings.anti_brute_threshold', fallbackLabel: 'Threshold', type: 'number', depends: 'anti_brute_force_enabled', min: 1 }
                ]
            },
            {
                i18nGroup: 'dialog.settings.transport_pref', fallbackGroup: 'Transport Preferences',
                items: [
                    { key: 'preferred_transports', i18nLabel: 'dialog.settings.pref_transports', fallbackLabel: 'Preferred Transports', type: 'select', valueType: 'array', options: [
                        { value: 'utp,tcp', i18nLabel: 'dialog.settings.pref_utp_tcp', fallbackLabel: 'uTP Preferred' },
                        { value: 'tcp,utp', i18nLabel: 'dialog.settings.pref_tcp_utp', fallbackLabel: 'TCP Preferred' },
                        { value: 'utp', i18nLabel: 'dialog.settings.pref_utp', fallbackLabel: 'uTP Only' },
                        { value: 'tcp', i18nLabel: 'dialog.settings.pref_tcp', fallbackLabel: 'TCP Only' }
                    ] },
                    { key: 'sequential_download', i18nLabel: 'dialog.add.sequential', type: 'toggle' }
                ]
            }
        ],
        peer: [
            {
                i18nGroup: 'dialog.settings.conn_limits', fallbackGroup: 'Connection Limits',
                items: [
                    { key: 'peer_limit_global', i18nLabel: 'dialog.settings.global_peer_limit', fallbackLabel: 'Global Max Peers', type: 'number', min: 1, max: 9999 },
                    { key: 'peer_limit_per_torrent', i18nLabel: 'dialog.add.peer_limit', fallbackLabel: 'Per Torrent Peer Limit', type: 'number', min: 1, max: 9999 }
                ]
            }
        ],
        seeding: [
            {
                i18nGroup: 'detail.settings.seed_ratio',
                items: [
                    { key: 'seed_ratio_limited', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'seed_ratio_limit', i18nLabel: 'detail.settings.seed_ratio', fallbackLabel: 'Seed Ratio Limit', type: 'number', step: '0.1', depends: 'seed_ratio_limited', min: 0 },
                    { key: 'idle_seeding_limit_enabled', i18nLabel: 'detail.settings.seed_idle', fallbackLabel: 'Idle Stop Limit', type: 'toggle' },
                    { key: 'idle_seeding_limit', i18nLabel: 'detail.settings.seed_idle', fallbackLabel: 'Idle Stop Limit', type: 'number', i18nUnit: 'times.min', fallbackUnit: 'm', depends: 'idle_seeding_limit_enabled', min: 0 }
                ]
            }
        ],
        queue: [
            {
                i18nGroup: 'dialog.settings.dl_queue', fallbackGroup: 'Download Queue',
                items: [
                    { key: 'download_queue_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'download_queue_size', i18nLabel: 'dialog.settings.max_dl', fallbackLabel: 'Max Active Downloads', type: 'number', depends: 'download_queue_enabled', min: 1 }
                ]
            },
            {
                i18nGroup: 'dialog.settings.seed_queue', fallbackGroup: 'Seed Queue',
                items: [
                    { key: 'seed_queue_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'seed_queue_size', i18nLabel: 'dialog.settings.max_seed', fallbackLabel: 'Max Active Seeds', type: 'number', depends: 'seed_queue_enabled', min: 1 }
                ]
            },
            {
                i18nGroup: 'dialog.settings.stalled_detection', fallbackGroup: 'Stalled Detection',
                items: [
                    { key: 'queue_stalled_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'queue_stalled_minutes', i18nLabel: 'dialog.settings.stalled_timeout', fallbackLabel: 'Stalled Timeout', type: 'number', i18nUnit: 'times.min', fallbackUnit: 'm', depends: 'queue_stalled_enabled', min: 1 }
                ]
            }
        ],
        labels: [
            {
                i18nGroup: 'dialog.label.saved_label', fallbackGroup: 'Saved Labels',
                items: [
                    { key: '_label-library', i18nLabel: 'dialog.label.input_label', fallbackLabel: 'Labels', type: 'label-manager' }
                ]
            }
        ],
        blocklist: [
            {
                i18nGroup: 'dialog.settings.blocklist', fallbackGroup: 'Blocklist',
                items: [
                    { key: 'blocklist_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'blocklist_url', i18nLabel: 'dialog.settings.blocklist_url', fallbackLabel: 'URL', type: 'text', depends: 'blocklist_enabled' },
                    { key: 'blocklist_size', i18nLabel: 'dialog.settings.rules_count', fallbackLabel: 'Rules Count', type: 'readonly' }
                ]
            }
        ],
        rpc: [
            {
                i18nGroup: 'dialog.settings.rpc_info',
                fallbackGroup: 'RPC',
                items: [
                    { key: 'rpc_version', i18nLabel: 'dialog.about.rpc_version', fallbackLabel: 'RPC Version', type: 'readonly' },
                    { key: 'rpc_version_semver', i18nLabel: 'dialog.settings.rpc_semver', fallbackLabel: 'RPC Semantic Version', type: 'readonly' },
                    { key: 'rpc_version_minimum', i18nLabel: 'dialog.settings.rpc_min_version', fallbackLabel: 'Min Version', type: 'readonly' },
                    { key: 'session_id', i18nLabel: 'dialog.settings.session_id', fallbackLabel: 'Session ID', type: 'readonly' }
                ]
            }
        ],
        script: [
            {
                i18nGroup: 'dialog.settings.script_added', fallbackGroup: 'Torrent Added Script',
                items: [
                    { key: 'script_torrent_added_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'script_torrent_added_filename', i18nLabel: 'dialog.settings.script_path', fallbackLabel: 'Script Path', type: 'file', depends: 'script_torrent_added_enabled' }
                ]
            },
            {
                i18nGroup: 'dialog.settings.script_done', fallbackGroup: 'Torrent Done Script',
                items: [
                    { key: 'script_torrent_done_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'script_torrent_done_filename', i18nLabel: 'dialog.settings.script_path', fallbackLabel: 'Script Path', type: 'file', depends: 'script_torrent_done_enabled' }
                ]
            },
            {
                i18nGroup: 'dialog.settings.script_done_seeding', fallbackGroup: 'Torrent Done Seeding Script',
                items: [
                    { key: 'script_torrent_done_seeding_enabled', i18nLabel: 'dialog.settings.enabled', fallbackLabel: 'Enabled', type: 'toggle' },
                    { key: 'script_torrent_done_seeding_filename', i18nLabel: 'dialog.settings.script_path', fallbackLabel: 'Script Path', type: 'file', depends: 'script_torrent_done_seeding_enabled' }
                ]
            }
        ],
        advanced: [
            {
                fallbackGroup: 'Tracker',
                items: [
                    { key: 'default_trackers', i18nLabel: 'dialog.tracker.add_label', fallbackLabel: 'Default Trackers', type: 'textarea', i18nHint: 'dialog.tracker.format_info', fallbackHint: 'One URL per line. Blank line = new group (tier). Same group = backup, different groups = priority. Supported: http/https/udp' }
                ]
            },
            {
                fallbackGroup: 'Cache',
                items: [
                    { key: 'cache_size_mib', i18nLabel: 'dialog.settings.cache_size', fallbackLabel: 'Cache Size', type: 'number', unit: 'MB', min: 1 }
                ]
            }
        ]
    };

    function loadSession(callback) {
        TWC.rpc.getSession(null, function(data, success) {
            if (success) {
                _sessionData = data;
                _isLoaded = true;
                _notifyListeners('session-loaded', data);
                if (callback) callback(true, data);
            } else {
                if (callback) callback(false, null);
            }
        });
    }

    function saveSession(properties, callback) {
        TWC.rpc.setSession(properties, function(success) {
            if (success) {
                for (var key in properties) {
                    _sessionData[key] = properties[key];
                }
                _notifyListeners('session-saved', properties);
                if (callback) callback(true);
            } else {
                if (callback) callback(false, TWC.i18n.t('dialog.settings.save_failed'));
            }
        });
    }

    function loadStats(callback) {
        TWC.rpc.getSessionStats(function(data, success) {
            if (success) {
                _sessionStats = data;
                _notifyListeners('stats-loaded', data);
                if (callback) callback(true, data);
            } else {
                if (callback) callback(false, null);
            }
        });
    }

    function checkPort(callback, ipProtocol) {
        TWC.rpc.testPort(function(isOpen, success, ipProtocolResult, ipProtocolFromError) {
            var errMsg = '';
            if (!success && typeof ipProtocolFromError === 'string' && ipProtocolFromError) {
                errMsg = ipProtocolResult;
                ipProtocolResult = ipProtocolFromError;
            } else if (!success) {
                errMsg = ipProtocolResult || '';
                ipProtocolResult = ipProtocolFromError || '';
            }
            _isPortOpen = isOpen;
            _ipProtocol = ipProtocolResult || '';
            _notifyListeners('port-tested', { isOpen: isOpen, ipProtocol: _ipProtocol, errMsg: errMsg });
            if (callback) callback(isOpen, success, _ipProtocol, errMsg);
        }, ipProtocol);
    }

    function updateBlocklist(callback) {
        TWC.rpc.updateBlocklist(function(size, success) {
            _blocklistSize = size;
            _sessionData.blocklist_size = size;
            _notifyListeners('blocklist-updated', size);
            if (callback) callback(size, success);
        });
    }

    function checkFreeSpace(path, callback) {
        TWC.rpc.getFreeSpace(path, function(freeBytes, totalBytes, pathResult, success) {
            _freeSpace = freeBytes;
            _totalSpace = totalBytes;
            if (callback) callback(freeBytes, totalBytes, success);
        });
    }

    function loadGroups(callback) {
        TWC.rpc.getGroups(function(groups, success) {
            if (success) {
                _groups = groups;
                _notifyListeners('groups-loaded', groups);
            }
            if (callback) callback(groups, success);
        });
    }

    function saveGroup(properties, callback) {
        TWC.rpc.setGroup(properties, function(success, data) {
            if (success) {
                loadGroups();
            }
            if (callback) callback(success, data);
        });
    }

    function getSessionData() {
        return _sessionData;
    }

    function getSessionValue(key) {
        return _sessionData[key];
    }

    function getSessionStats() {
        return _sessionStats;
    }

    function getFreeSpace() {
        return _freeSpace;
    }

    function isPortOpen() {
        return _isPortOpen;
    }

    function getIpProtocol() {
        return _ipProtocol;
    }

    function getGroups() {
        return _groups;
    }

    function getConfigTabs() {
        for (var i = 0; i < CONFIG_TABS.length; i++) {
            var tab = CONFIG_TABS[i];
            if (tab.i18n) tab.name = TWC.i18n.t(tab.i18n) || tab.fallback || tab.i18n;
            else if (!tab.name) tab.name = tab.fallback;
        }
        return CONFIG_TABS;
    }

    function getConfigItems() {
        for (var key in CONFIG_ITEMS) {
            var cat = CONFIG_ITEMS[key];
            for (var i = 0; i < cat.length; i++) {
                var group = cat[i];
                if (group.i18nGroup) group.group = TWC.i18n.t(group.i18nGroup) || group.fallbackGroup || group.i18nGroup;
                else if (!group.group) group.group = group.fallbackGroup;

                for (var j = 0; j < group.items.length; j++) {
                    var item = group.items[j];
                    if (item.i18nLabel) item.label = TWC.i18n.t(item.i18nLabel) || item.fallbackLabel || item.i18nLabel;
                    else if (!item.label) item.label = item.fallbackLabel;

                    if (item.i18nHint) item.hint = TWC.i18n.t(item.i18nHint) || item.fallbackHint || item.i18nHint;
                    else if (!item.hint) item.hint = item.fallbackHint;

                    if (item.i18nUnit) item.unit = TWC.i18n.t(item.i18nUnit) || item.fallbackUnit || item.i18nUnit;
                    else if (!item.unit) item.unit = item.fallbackUnit;

                    if (item.options) {
                        for (var k = 0; k < item.options.length; k++) {
                            var opt = item.options[k];
                            if (opt.i18nLabel) opt.label = TWC.i18n.t(opt.i18nLabel) || opt.fallbackLabel || opt.i18nLabel;
                            else if (!opt.label) opt.label = opt.fallbackLabel;
                        }
                    }
                }
            }
        }
        return CONFIG_ITEMS;
    }

    function isLoaded() {
        return _isLoaded;
    }

    function onEvent(callback) {
        _listeners.push(callback);
    }

    function _notifyListeners(eventType, data) {
        for (var i = 0; i < _listeners.length; i++) {
            _listeners[i](eventType, data);
        }
    }

    return {
        loadSession: loadSession,
        saveSession: saveSession,
        loadStats: loadStats,
        checkPort: checkPort,
        updateBlocklist: updateBlocklist,
        checkFreeSpace: checkFreeSpace,
        loadGroups: loadGroups,
        saveGroup: saveGroup,
        getSessionData: getSessionData,
        getSessionValue: getSessionValue,
        getSessionStats: getSessionStats,
        getFreeSpace: getFreeSpace,
        isPortOpen: isPortOpen,
        getIpProtocol: getIpProtocol,
        getGroups: getGroups,
        getConfigTabs: getConfigTabs,
        getConfigItems: getConfigItems,
        isLoaded: isLoaded,
        onEvent: onEvent,
        CONFIG_TABS: CONFIG_TABS,
        CONFIG_ITEMS: CONFIG_ITEMS
    };
})();
