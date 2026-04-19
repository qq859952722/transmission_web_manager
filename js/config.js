var TWC = TWC || {};

TWC.config = (function() {
    var _sessionData = {};
    var _sessionStats = {};
    var _freeSpace = -1;
    var _totalSpace = -1;
    var _isPortOpen = null;
    var _blocklistSize = 0;
    var _groups = [];
    var _listeners = [];
    var _isLoaded = false;

    var CONFIG_TABS = [
        { id: 'download', name: '下载', icon: 'download' },
        { id: 'speed', name: '速度限制', icon: 'speed' },
        { id: 'network', name: '网络', icon: 'network' },
        { id: 'peer', name: '连接', icon: 'peer' },
        { id: 'seeding', name: '做种', icon: 'seeding' },
        { id: 'queue', name: '队列', icon: 'queue' },
        { id: 'labels', name: '标签管理', icon: 'labels' },
        { id: 'blocklist', name: '屏蔽列表', icon: 'blocklist' },
        { id: 'rpc', name: 'RPC', icon: 'rpc' },
        { id: 'script', name: '脚本', icon: 'script' },
        { id: 'advanced', name: '高级', icon: 'advanced' }
    ];

    var CONFIG_ITEMS = {
        download: [
            {
                group: '下载目录',
                items: [
                    { key: 'download-dir', label: '默认下载目录', type: 'folder', hint: '新种子的默认保存位置' },
                    { key: 'incomplete-dir-enabled', label: '启用临时目录', type: 'toggle', hint: '未完成的文件保存到临时目录' },
                    { key: 'incomplete-dir', label: '临时目录', type: 'folder', hint: '未完成文件的保存位置', depends: 'incomplete-dir-enabled' }
                ]
            },
            {
                group: '添加行为',
                items: [
                    { key: 'start-added-torrents', label: '自动开始下载', type: 'toggle', hint: '添加种子后自动开始下载' },
                    { key: 'rename-partial-files', label: '未完成文件加后缀', type: 'toggle', hint: '为未完成的文件添加 .part 后缀' },
                    { key: 'trash-original-torrent-files', label: '删除原始种子文件', type: 'toggle', hint: '添加后删除原始 .torrent 文件' }
                ]
            }
        ],
        speed: [
            {
                group: '全局速度限制',
                items: [
                    { key: 'speed-limit-down-enabled', label: '启用下载限速', type: 'toggle' },
                    { key: 'speed-limit-down', label: '下载限速', type: 'number', unit: 'KB/s', depends: 'speed-limit-down-enabled', min: 0 },
                    { key: 'speed-limit-up-enabled', label: '启用上传限速', type: 'toggle' },
                    { key: 'speed-limit-up', label: '上传限速', type: 'number', unit: 'KB/s', depends: 'speed-limit-up-enabled', min: 0 }
                ]
            },
            {
                group: '备用速度限制（时段限速）',
                items: [
                    { key: 'alt-speed-enabled', label: '启用备用限速', type: 'toggle', hint: '立即启用备用速度限制' },
                    { key: 'alt-speed-down', label: '备用下载限速', type: 'number', unit: 'KB/s', min: 0 },
                    { key: 'alt-speed-up', label: '备用上传限速', type: 'number', unit: 'KB/s', min: 0 },
                    { key: 'alt-speed-time-enabled', label: '启用定时备用限速', type: 'toggle' },
                    { key: 'alt-speed-time-begin', label: '开始时间', type: 'time', depends: 'alt-speed-time-enabled', hint: '备用限速开始时间' },
                    { key: 'alt-speed-time-end', label: '结束时间', type: 'time', depends: 'alt-speed-time-enabled', hint: '备用限速结束时间' },
                    { key: 'alt-speed-time-day', label: '生效日', type: 'daymask', depends: 'alt-speed-time-enabled', hint: '位掩码：周日=1,周一=2...周六=64' }
                ]
            }
        ],
        network: [
            {
                group: '端口设置',
                items: [
                    { key: 'peer-port', label: '监听端口', type: 'number', min: 1, max: 65535 },
                    { key: 'peer-port-random-on-start', label: '启动时随机端口', type: 'toggle' },
                    { key: 'port-forwarding-enabled', label: '启用端口转发(UPnP/NAT-PMP)', type: 'toggle' }
                ]
            },
            {
                group: '协议',
                items: [
                    { key: 'dht-enabled', label: '启用 DHT', type: 'toggle', hint: '分布式哈希表，用于无Tracker发现Peer' },
                    { key: 'pex-enabled', label: '启用 PEX', type: 'toggle', hint: '对等交换，用于发现更多Peer' },
                    { key: 'lpd-enabled', label: '启用 LPD', type: 'toggle', hint: '本地对等发现' },
                    { key: 'utp-enabled', label: '启用 uTP', type: 'toggle', hint: 'Micro Transport Protocol' },
                    { key: 'encryption', label: '加密策略', type: 'select', options: [
                        { value: 'required', label: '强制加密' },
                        { value: 'preferred', label: '首选加密' },
                        { value: 'tolerated', label: '允许明文' }
                    ]}
                ]
            }
        ],
        peer: [
            {
                group: '连接限制',
                items: [
                    { key: 'peer-limit-global', label: '全局最大连接数', type: 'number', min: 1, max: 9999 },
                    { key: 'peer-limit-per-torrent', label: '每种子最大连接数', type: 'number', min: 1, max: 9999 }
                ]
            }
        ],
        seeding: [
            {
                group: '做种限制',
                items: [
                    { key: 'seedRatioLimited', label: '启用做种比例限制', type: 'toggle' },
                    { key: 'seedRatioLimit', label: '做种比例限制', type: 'number', step: '0.1', depends: 'seedRatioLimited', min: 0 },
                    { key: 'idle-seeding-limit-enabled', label: '启用空闲做种超时', type: 'toggle' },
                    { key: 'idle-seeding-limit', label: '空闲做种超时', type: 'number', unit: '分钟', depends: 'idle-seeding-limit-enabled', min: 0 }
                ]
            }
        ],
        queue: [
            {
                group: '下载队列',
                items: [
                    { key: 'download-queue-enabled', label: '启用下载队列', type: 'toggle' },
                    { key: 'download-queue-size', label: '最大同时下载数', type: 'number', depends: 'download-queue-enabled', min: 1 }
                ]
            },
            {
                group: '做种队列',
                items: [
                    { key: 'seed-queue-enabled', label: '启用做种队列', type: 'toggle' },
                    { key: 'seed-queue-size', label: '最大同时做种数', type: 'number', depends: 'seed-queue-enabled', min: 1 }
                ]
            },
            {
                group: '停滞检测',
                items: [
                    { key: 'queue-stalled-enabled', label: '启用停滞检测', type: 'toggle' },
                    { key: 'queue-stalled-minutes', label: '停滞超时', type: 'number', unit: '分钟', depends: 'queue-stalled-enabled', min: 1 }
                ]
            }
        ],
        labels: [
            {
                group: '标签库',
                items: [
                    { key: '_label-library', label: '自定义标签', type: 'label-manager' }
                ]
            }
        ],
        blocklist: [
            {
                group: '屏蔽列表',
                items: [
                    { key: 'blocklist-enabled', label: '启用屏蔽列表', type: 'toggle' },
                    { key: 'blocklist-url', label: '屏蔽列表 URL', type: 'text', depends: 'blocklist-enabled' },
                    { key: 'blocklist-size', label: '当前规则数', type: 'readonly' }
                ]
            }
        ],
        rpc: [
            {
                group: 'RPC 设置',
                items: [
                    { key: 'rpc-enabled', label: '启用 RPC', type: 'toggle', hint: '修改后需重启 Transmission 才能生效' },
                    { key: 'rpc-port', label: 'RPC 端口', type: 'number', min: 1, max: 65535, hint: '修改后需重启 Transmission 才能生效' },
                    { key: 'rpc-url', label: 'RPC URL 路径', type: 'text', hint: '修改后需重启 Transmission 才能生效' },
                    { key: 'rpc-bind-address', label: '绑定地址', type: 'text', hint: '修改后需重启 Transmission 才能生效' },
                    { key: 'rpc-socket-path', label: 'Unix 域套接字路径', type: 'text', hint: '4.1.x+ 新增，修改后需重启' },
                    { key: 'rpc-whitelist-enabled', label: '启用 IP 白名单', type: 'toggle' },
                    { key: 'rpc-whitelist', label: 'IP 白名单', type: 'text', depends: 'rpc-whitelist-enabled' },
                    { key: 'rpc-host-whitelist-enabled', label: '启用主机白名单', type: 'toggle' },
                    { key: 'rpc-host-whitelist', label: '主机白名单', type: 'text', depends: 'rpc-host-whitelist-enabled' }
                ]
            },
            {
                group: '认证',
                items: [
                    { key: 'rpc-authentication-required', label: '需要认证', type: 'toggle' },
                    { key: 'rpc-username', label: '用户名', type: 'text', depends: 'rpc-authentication-required' },
                    { key: 'rpc-password', label: '密码', type: 'password', depends: 'rpc-authentication-required', hint: '密码以哈希形式存储，输入新密码将覆盖旧密码' }
                ]
            },
            {
                group: '安全',
                items: [
                    { key: 'anti-brute-force-enabled', label: '启用防暴力破解', type: 'toggle' },
                    { key: 'anti-brute-force-threshold', label: '失败次数阈值', type: 'number', depends: 'anti-brute-force-enabled', min: 1 }
                ]
            }
        ],
        script: [
            {
                group: '种子添加脚本',
                items: [
                    { key: 'script-torrent-added-enabled', label: '启用添加脚本', type: 'toggle' },
                    { key: 'script-torrent-added-filename', label: '脚本路径', type: 'file', depends: 'script-torrent-added-enabled', hint: '脚本需有执行权限' }
                ]
            },
            {
                group: '下载完成脚本',
                items: [
                    { key: 'script-torrent-done-enabled', label: '启用完成脚本', type: 'toggle' },
                    { key: 'script-torrent-done-filename', label: '脚本路径', type: 'file', depends: 'script-torrent-done-enabled', hint: '脚本需有执行权限' }
                ]
            }
        ],
        advanced: [
            {
                group: '默认 Tracker',
                items: [
                    { key: 'default-trackers', label: '默认 Tracker 列表', type: 'textarea', hint: '每行一个 Tracker，空行分隔组' }
                ]
            },
            {
                group: '只读信息',
                items: [
                    { key: 'version', label: 'Transmission 版本', type: 'readonly' },
                    { key: 'rpc-version', label: 'RPC 版本', type: 'readonly' },
                    { key: 'rpc-version-semver', label: 'RPC 语义版本', type: 'readonly' },
                    { key: 'rpc-version-minimum', label: '最低 RPC 版本', type: 'readonly' },
                    { key: 'config-dir', label: '配置目录', type: 'readonly' }
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
                if (callback) callback(false, '保存失败');
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

    function checkPort(callback) {
        TWC.rpc.testPort(function(isOpen, success) {
            _isPortOpen = isOpen;
            _notifyListeners('port-tested', isOpen);
            if (callback) callback(isOpen, success);
        });
    }

    function updateBlocklist(callback) {
        TWC.rpc.updateBlocklist(function(size, success) {
            _blocklistSize = size;
            _sessionData['blocklist-size'] = size;
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

    function getGroups() {
        return _groups;
    }

    function getConfigTabs() {
        return CONFIG_TABS;
    }

    function getConfigItems() {
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
        getGroups: getGroups,
        getConfigTabs: getConfigTabs,
        getConfigItems: getConfigItems,
        isLoaded: isLoaded,
        onEvent: onEvent,
        CONFIG_TABS: CONFIG_TABS,
        CONFIG_ITEMS: CONFIG_ITEMS
    };
})();
