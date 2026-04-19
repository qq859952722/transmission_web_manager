var TWC = TWC || {};

TWC.geoip = (function() {
    var _loaded = false;
    var _loading = false;
    var _countries = null;
    var _v4Ranges = null;
    var _v6Ranges = null;
    var _flagBasePath = 'assets/flags/';
    var _flagCache = {};

    function init(callback) {
        if (_loaded) {
            if (callback) callback(true);
            return;
        }
        if (_loading) {
            _waitLoad(callback);
            return;
        }

        _loading = true;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'assets/geoip/geoip.bin', true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 60000;

        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    _parse(new Uint8Array(xhr.response));
                    _loaded = true;
                    _loading = false;
                    console.log('GeoIP: 数据库加载成功, IPv4:', _v4Ranges.length, 'IPv6:', _v6Ranges.length, '国家:', _countries.length);
                    if (callback) callback(true);
                } catch (e) {
                    console.error('GeoIP: 解析数据库失败', e);
                    _loading = false;
                    if (callback) callback(false);
                }
            } else {
                _loading = false;
                if (callback) callback(false);
            }
        };

        xhr.onerror = function() { _loading = false; if (callback) callback(false); };
        xhr.ontimeout = function() { _loading = false; if (callback) callback(false); };
        xhr.send();
    }

    function _waitLoad(callback) {
        var check = setInterval(function() {
            if (_loaded) { clearInterval(check); if (callback) callback(true); }
            if (!_loading) { clearInterval(check); if (callback) callback(false); }
        }, 100);
    }

    function _parse(data) {
        var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        var offset = 0;

        var magic = String.fromCharCode(data[0], data[1], data[2], data[3], data[4], data[5]);
        if (magic !== 'GEOIP1') throw new Error('Invalid database format');
        offset += 6;

        var countryCount = view.getUint32(offset); offset += 4;
        var v4Count = view.getUint32(offset); offset += 4;
        var v6Count = view.getUint32(offset); offset += 4;

        _countries = [];
        for (var i = 0; i < countryCount; i++) {
            var code = String.fromCharCode(data[offset], data[offset + 1]);
            offset += 2;
            var nameLen = view.getUint16(offset); offset += 2;
            var nameBytes = data.slice(offset, offset + nameLen);
            var name = new TextDecoder('utf-8').decode(nameBytes);
            offset += nameLen;
            _countries.push({ code: code, name: name });
        }

        _v4Ranges = new Array(v4Count);
        for (var i = 0; i < v4Count; i++) {
            _v4Ranges[i] = {
                s: view.getUint32(offset),
                e: view.getUint32(offset + 4),
                c: view.getUint16(offset + 8)
            };
            offset += 10;
        }

        _v6Ranges = new Array(v6Count);
        for (var i = 0; i < v6Count; i++) {
            _v6Ranges[i] = {
                s0: view.getUint32(offset), s1: view.getUint32(offset + 4),
                s2: view.getUint32(offset + 8), s3: view.getUint32(offset + 12),
                e0: view.getUint32(offset + 16), e1: view.getUint32(offset + 20),
                e2: view.getUint32(offset + 24), e3: view.getUint32(offset + 28),
                c: view.getUint16(offset + 32)
            };
            offset += 34;
        }
    }

    function _parseIPv6(str) {
        var halves = str.split('::');
        var left = halves[0] ? halves[0].split(':') : [];
        var right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
        var missing = 8 - left.length - right.length;
        var parts = [];
        for (var i = 0; i < left.length; i++) parts.push(left[i]);
        for (var j = 0; j < missing; j++) parts.push('0');
        for (var k = 0; k < right.length; k++) parts.push(right[k]);

        var bytes = new Uint8Array(16);
        for (var m = 0; m < 8; m++) {
            var val = parseInt(parts[m] || '0', 16);
            if (isNaN(val)) return null;
            bytes[m * 2] = (val >>> 8) & 0xff;
            bytes[m * 2 + 1] = val & 0xff;
        }

        var v = new DataView(bytes.buffer);
        return { a: v.getUint32(0), b: v.getUint32(4), c: v.getUint32(8), d: v.getUint32(12) };
    }

    function _cmp4(a, b, c, d, a2, b2, c2, d2) {
        if (a !== a2) return a < a2 ? -1 : 1;
        if (b !== b2) return b < b2 ? -1 : 1;
        if (c !== c2) return c < c2 ? -1 : 1;
        if (d !== d2) return d < d2 ? -1 : 1;
        return 0;
    }

    function lookup(ipStr) {
        if (!_loaded) return null;

        if (ipStr.includes(':')) {
            var mappedIPv4 = _extractIPv4FromIPv6(ipStr);
            if (mappedIPv4) {
                return lookup(mappedIPv4);
            }
            return _lookupV6(ipStr);
        }

        return _lookupV4(ipStr);
    }

    function _lookupV4(ipStr) {
        var parts = ipStr.split('.');
        if (parts.length !== 4) return null;

        var ip = 0;
        for (var i = 0; i < 4; i++) {
            var octet = parseInt(parts[i], 10);
            if (isNaN(octet)) return null;
            ip = (ip << 8) | (octet & 0xff);
        }

        var lo = 0, hi = _v4Ranges.length - 1;
        while (lo <= hi) {
            var mid = (lo + hi) >>> 1;
            var r = _v4Ranges[mid];
            if (ip < r.s) {
                hi = mid - 1;
            } else if (ip > r.e) {
                lo = mid + 1;
            } else {
                var c = _countries[r.c];
                return { code: c.code, name: c.name };
            }
        }

        return null;
    }

    function _lookupV6(ipStr) {
        var ip = _parseIPv6(ipStr);
        if (!ip) return null;

        var lo = 0, hi = _v6Ranges.length - 1;
        while (lo <= hi) {
            var mid = (lo + hi) >>> 1;
            var r = _v6Ranges[mid];

            if (_cmp4(ip.a, ip.b, ip.c, ip.d, r.s0, r.s1, r.s2, r.s3) < 0) {
                hi = mid - 1;
                continue;
            }

            if (_cmp4(ip.a, ip.b, ip.c, ip.d, r.e0, r.e1, r.e2, r.e3) > 0) {
                lo = mid + 1;
                continue;
            }

            var c = _countries[r.c];
            return { code: c.code, name: c.name };
        }

        return null;
    }

    function getCountryCode(ip) {
        var result = lookup(ip);
        return result ? result.code : null;
    }

    function getCountryInfo(ip) {
        return lookup(ip);
    }

    function getCountryFlag(code) {
        if (!code) return '';
        code = code.toLowerCase();
        if (_flagCache[code] !== undefined) return _flagCache[code];

        var flagPath = _flagBasePath + code + '.svg';
        _flagCache[code] = flagPath;
        return flagPath;
    }

    function getCountryFlagHtml(code) {
        if (!code) return '';
        var lc = code.toLowerCase();
        var flagPath = _flagBasePath + lc + '.svg';
        return '<img class="twc-country-flag-img" src="' + flagPath + '" alt="' + code + '" title="' + code.toUpperCase() + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'" />' +
            '<span style="display:none;font-size:10px;background:var(--bg-tertiary);padding:0 3px;border-radius:2px;color:var(--text-muted)">' + code.toUpperCase() + '</span>';
    }

    function isLoaded() {
        return _loaded;
    }

    function isPrivateIP(ip) {
        if (!ip) return true;

        if (ip.includes(':')) {
            var mappedIPv4 = _extractIPv4FromIPv6(ip);
            if (mappedIPv4) {
                return isPrivateIP(mappedIPv4);
            }
            return _isPrivateIPv6(ip);
        }

        var parts = ip.split('.');
        if (parts.length !== 4) return true;
        var first = parseInt(parts[0], 10);
        var second = parseInt(parts[1], 10);
        if (first === 10) return true;
        if (first === 172 && second >= 16 && second <= 31) return true;
        if (first === 192 && second === 168) return true;
        if (first === 127) return true;
        if (first === 0) return true;
        return false;
    }

    function _isPrivateIPv6(ip) {
        var lowerIp = ip.toLowerCase();
        if (lowerIp === '::1') return true;
        if (lowerIp === '::') return true;
        if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) return true;
        if (lowerIp.startsWith('fe8') || lowerIp.startsWith('fe9') ||
            lowerIp.startsWith('fea') || lowerIp.startsWith('feb')) return true;
        if (lowerIp.startsWith('ff')) return true;
        return false;
    }

    function _extractIPv4FromIPv6(ipStr) {
        var lowerIp = ipStr.toLowerCase();
        if (lowerIp.startsWith('::ffff:')) {
            var ipv4Part = lowerIp.substring(7);
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipv4Part)) {
                return ipv4Part;
            }
        }
        return null;
    }

    return {
        init: init,
        lookup: lookup,
        getCountryCode: getCountryCode,
        getCountryInfo: getCountryInfo,
        getCountryFlag: getCountryFlag,
        getCountryFlagHtml: getCountryFlagHtml,
        isLoaded: isLoaded,
        isPrivateIP: isPrivateIP
    };
})();
