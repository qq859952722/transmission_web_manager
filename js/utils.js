var TWC = TWC || {};

TWC.utils = (function() {
    function formatBytes(bytes, decimals) {
        if (decimals === undefined) decimals = 2;
        if (bytes === 0) return '0 B';
        if (bytes < 0) return '0 B';
        var k = 1024;
        var dm = decimals < 0 ? 0 : decimals;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function formatSpeed(bytesPerSec, decimals) {
        if (decimals === undefined) decimals = 2;
        if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
        return formatBytes(bytesPerSec, decimals) + '/s';
    }

    function formatETA(seconds) {
        if (!seconds || seconds < 0) return '∞';
        if (seconds === -1) return '∞';
        if (seconds === -2) return '未知';
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = Math.floor(seconds % 60);
        var parts = [];
        if (days > 0) parts.push(days + '天');
        if (hours > 0) parts.push(hours + '时');
        if (minutes > 0) parts.push(minutes + '分');
        if (secs > 0 && days === 0) parts.push(secs + '秒');
        return parts.join('') || '0秒';
    }

    function formatTimestamp(timestamp) {
        if (!timestamp || timestamp === 0) return '-';
        var d = new Date(timestamp * 1000);
        var year = d.getFullYear();
        var month = padZero(d.getMonth() + 1);
        var day = padZero(d.getDate());
        var hour = padZero(d.getHours());
        var min = padZero(d.getMinutes());
        var sec = padZero(d.getSeconds());
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    }

    function formatTime(timestamp) {
        if (!timestamp || timestamp === 0) return '-';
        var d = new Date(timestamp * 1000);
        return padZero(d.getHours()) + ':' + padZero(d.getMinutes());
    }

    function padZero(num) {
        return num < 10 ? '0' + num : '' + num;
    }

    function formatPercent(value) {
        if (value === undefined || value === null) return '0%';
        return (value * 100).toFixed(2) + '%';
    }

    function formatRatio(ratio) {
        if (ratio === undefined || ratio === null || ratio < 0) return '∞';
        return ratio.toFixed(2);
    }

    function getRatioClass(ratio) {
        if (ratio < 0.5) return 'text-red-500';
        if (ratio < 1.0) return 'text-yellow-500';
        if (ratio < 2.0) return 'text-green-500';
        return 'text-emerald-400';
    }

    function getStatusText(status) {
        var map = {
            0: '已停止',
            1: '等待校验',
            2: '校验中',
            3: '等待下载',
            4: '下载中',
            5: '等待做种',
            6: '做种中'
        };
        return map[status] || '未知';
    }

    function getStatusClass(status) {
        var map = {
            0: 'status-stopped',
            1: 'status-check-wait',
            2: 'status-check',
            3: 'status-download-wait',
            4: 'status-download',
            5: 'status-seed-wait',
            6: 'status-seed'
        };
        return map[status] || '';
    }

    function getStatusColor(status) {
        var map = {
            0: '#6b7280',
            1: '#f59e0b',
            2: '#f59e0b',
            3: '#3b82f6',
            4: '#3b82f6',
            5: '#10b981',
            6: '#10b981'
        };
        return map[status] || '#6b7280';
    }

    function getProgressBarClass(status) {
        var map = {
            0: 'bg-gray-400',
            1: 'bg-yellow-500',
            2: 'bg-yellow-500',
            3: 'bg-blue-500',
            4: 'bg-blue-500',
            5: 'bg-green-500',
            6: 'bg-green-500'
        };
        return map[status] || 'bg-gray-400';
    }

    var SUPPORTED_TRACKER_SCHEMES = ['http://', 'https://', 'udp://'];

    function isValidTrackerUrl(url) {
        if (!url || typeof url !== 'string') return false;
        var trimmed = url.trim();
        if (!trimmed) return false;
        var schemeMatch = false;
        for (var i = 0; i < SUPPORTED_TRACKER_SCHEMES.length; i++) {
            if (trimmed.substring(0, SUPPORTED_TRACKER_SCHEMES[i].length).toLowerCase() === SUPPORTED_TRACKER_SCHEMES[i]) {
                schemeMatch = true;
                break;
            }
        }
        if (!schemeMatch) return false;
        var rest = trimmed.replace(/^(https?|udp):\/\//i, '');
        if (!rest || rest.length < 3) return false;
        var hostPort = rest.split('/')[0].split('?')[0];
        if (!hostPort) return false;
        return true;
    }

    function validateTrackerList(text) {
        if (!text || !text.trim()) return { valid: true, urls: [], warnings: [], errors: [] };
        var lines = text.split('\n');
        var urls = [];
        var warnings = [];
        var errors = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            if (isValidTrackerUrl(line)) {
                urls.push(line);
            } else {
                var lowerLine = line.toLowerCase();
                if (lowerLine.substring(0, 5) === 'ws://' || lowerLine.substring(0, 6) === 'wss://') {
                    errors.push('第 ' + (i + 1) + ' 行: WebSocket 协议 (' + line.substring(0, line.indexOf(':') + 2) + ') 不受 Transmission 支持，请移除');
                } else if (lowerLine.substring(0, 6) === 'tcp://') {
                    errors.push('第 ' + (i + 1) + ' 行: tcp:// 不是有效的 Tracker 协议，请使用 http://、https:// 或 udp://');
                } else if (lowerLine.indexOf('://') > 0) {
                    var scheme = line.substring(0, line.indexOf('://') + 3);
                    errors.push('第 ' + (i + 1) + ' 行: 不支持的协议 ' + scheme + '，仅支持 http://、https://、udp://');
                } else {
                    errors.push('第 ' + (i + 1) + ' 行: 无效的 Tracker URL，必须以 http://、https:// 或 udp:// 开头');
                }
            }
        }
        return { valid: errors.length === 0, urls: urls, warnings: warnings, errors: errors };
    }

    function getTrackerDomain(announceUrl) {
        if (!announceUrl) return '';
        try {
            var match = announceUrl.match(/^https?:\/\/([^\/:]+)/i);
            if (match) return match[1];
            match = announceUrl.match(/^udp:\/\/([^\/:]+)/i);
            if (match) return match[1];
        } catch (e) {
            return announceUrl;
        }
        return announceUrl;
    }

    function debounce(fn, delay) {
        var timer = null;
        return function() {
            var context = this;
            var args = arguments;
            if (timer) clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    }

    function throttle(fn, delay) {
        var last = 0;
        return function() {
            var now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                TWC.ui.showToast('已复制到剪贴板', 'success');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            TWC.ui.showToast('已复制到剪贴板', 'success');
        } catch (e) {
            TWC.ui.showToast('复制失败', 'error');
        }
        document.body.removeChild(textarea);
    }

    function arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        var chunkSize = 8192;
        for (var i = 0; i < bytes.length; i += chunkSize) {
            var chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binary);
    }

    function formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '-';
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var parts = [];
        if (days > 0) parts.push(days + '天');
        if (hours > 0) parts.push(hours + '时');
        if (minutes > 0) parts.push(minutes + '分');
        return parts.join('') || '< 1分';
    }

    function parseAltSpeedTime(minutes) {
        if (minutes === undefined || minutes === null) return '00:00';
        var h = Math.floor(minutes / 60);
        var m = minutes % 60;
        return padZero(h) + ':' + padZero(m);
    }

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        var parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    }

    function getDayMaskText(mask) {
        var days = [];
        if (mask & 1) days.push('周日');
        if (mask & 2) days.push('周一');
        if (mask & 4) days.push('周二');
        if (mask & 8) days.push('周三');
        if (mask & 16) days.push('周四');
        if (mask & 32) days.push('周五');
        if (mask & 64) days.push('周六');
        if (mask === 127) return '每天';
        if (mask === 62) return '工作日';
        if (mask === 65) return '周末';
        return days.join('、') || '无';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    function escapeAttr(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function truncateText(text, maxLen) {
        if (!text) return '';
        if (maxLen === undefined) maxLen = 50;
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '...';
    }

    function generateId() {
        return 'twc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function storageGet(key, defaultValue) {
        try {
            var val = localStorage.getItem(key);
            if (val === null) return defaultValue;
            return JSON.parse(val);
        } catch (e) {
            return defaultValue;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('localStorage写入失败:', e);
        }
    }

    function getCountryFlag(ip) {
        return '';
    }

    function formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString();
    }

    function getEncryptionText(enc) {
        var map = {
            'required': '强制加密',
            'preferred': '首选加密',
            'tolerated': '允许明文'
        };
        return map[enc] || enc;
    }

    function getPriorityText(priority) {
        var map = {
            '-1': '低',
            '0': '正常',
            '1': '高'
        };
        return map[String(priority)] || '正常';
    }

    function getFilePriorityText(priority) {
        var map = { '-1': '低', '0': '正常', '1': '高' };
        return map[String(priority)] || '正常';
    }

    function getSeedRatioModeText(mode) {
        var map = {
            0: '使用全局设置',
            1: '使用自定义值',
            2: '不限制'
        };
        return map[mode] || '未知';
    }

    function getSeedIdleModeText(mode) {
        var map = {
            0: '使用全局设置',
            1: '使用自定义值',
            2: '不限制'
        };
        return map[mode] || '未知';
    }

    return {
        formatBytes: formatBytes,
        formatSpeed: formatSpeed,
        formatETA: formatETA,
        formatTimestamp: formatTimestamp,
        formatTime: formatTime,
        padZero: padZero,
        formatPercent: formatPercent,
        formatRatio: formatRatio,
        getRatioClass: getRatioClass,
        getStatusText: getStatusText,
        getStatusClass: getStatusClass,
        getStatusColor: getStatusColor,
        getProgressBarClass: getProgressBarClass,
        getTrackerDomain: getTrackerDomain,
        isValidTrackerUrl: isValidTrackerUrl,
        validateTrackerList: validateTrackerList,
        debounce: debounce,
        throttle: throttle,
        copyToClipboard: copyToClipboard,
        formatDuration: formatDuration,
        parseAltSpeedTime: parseAltSpeedTime,
        timeToMinutes: timeToMinutes,
        getDayMaskText: getDayMaskText,
        escapeHtml: escapeHtml,
        escapeAttr: escapeAttr,
        truncateText: truncateText,
        generateId: generateId,
        storageGet: storageGet,
        storageSet: storageSet,
        getCountryFlag: getCountryFlag,
        formatNumber: formatNumber,
        getEncryptionText: getEncryptionText,
        getPriorityText: getPriorityText,
        getFilePriorityText: getFilePriorityText,
        getSeedRatioModeText: getSeedRatioModeText,
        getSeedIdleModeText: getSeedIdleModeText,
        arrayBufferToBase64: arrayBufferToBase64
    };
})();
