var TWC = TWC || {};

TWC.geoip = (function() {
    var _loaded = false;
    var _loading = false;
    var _reader = null;
    var _flagBasePath = 'assets/flags/';
    var _flagCache = {};
    var _availableFlags = {
        ae:1,am:1,ar:1,at:1,au:1,az:1,bd:1,be:1,bg:1,bh:1,br:1,bw:1,by:1,
        ca:1,ch:1,ci:1,cl:1,cm:1,cn:1,co:1,cz:1,de:1,dk:1,dz:1,ee:1,eg:1,
        es:1,et:1,fi:1,fr:1,gb:1,ge:1,gh:1,gr:1,hk:1,hr:1,hu:1,id:1,ie:1,
        il:1,in:1,iq:1,ir:1,it:1,jo:1,jp:1,ke:1,kh:1,kr:1,kw:1,kz:1,la:1,
        lb:1,lk:1,lt:1,lv:1,ly:1,ma:1,mg:1,mm:1,mn:1,mx:1,my:1,mz:1,na:1,
        ng:1,nl:1,no:1,nz:1,om:1,pe:1,ph:1,pk:1,pl:1,pt:1,qa:1,ro:1,ru:1,
        sa:1,se:1,sg:1,si:1,sk:1,sn:1,sy:1,th:1,tn:1,tr:1,tw:1,tz:1,ua:1,
        ug:1,us:1,uz:1,vn:1,ye:1,za:1,zw:1
    };

    var _countryNames = {
        ad:'安道尔',ae:'阿联酋',af:'阿富汗',ag:'安提瓜和巴布达',al:'阿尔巴尼亚',
        am:'亚美尼亚',ao:'安哥拉',ar:'阿根廷',at:'奥地利',au:'澳大利亚',
        az:'阿塞拜疆',ba:'波黑',bb:'巴巴多斯',bd:'孟加拉国',be:'比利时',
        bf:'布基纳法索',bg:'保加利亚',bh:'巴林',bi:'布隆迪',bj:'贝宁',
        bn:'文莱',bo:'玻利维亚',br:'巴西',bs:'巴哈马',bt:'不丹',
        bw:'博茨瓦纳',by:'白俄罗斯',bz:'伯利兹',ca:'加拿大',cd:'刚果(金)',
        cf:'中非',cg:'刚果(布)',ch:'瑞士',ci:'科特迪瓦',cl:'智利',
        cm:'喀麦隆',cn:'中国',co:'哥伦比亚',cr:'哥斯达黎加',cu:'古巴',
        cv:'佛得角',cy:'塞浦路斯',cz:'捷克',de:'德国',dj:'吉布提',
        dk:'丹麦',dm:'多米尼克',do:'多米尼加',dz:'阿尔及利亚',ec:'厄瓜多尔',
        ee:'爱沙尼亚',eg:'埃及',er:'厄立特里亚',es:'西班牙',et:'埃塞俄比亚',
        fi:'芬兰',fj:'斐济',fo:'法罗群岛',fr:'法国',ga:'加蓬',
        gb:'英国',gd:'格林纳达',ge:'格鲁吉亚',gh:'加纳',gi:'直布罗陀',
        gl:'格陵兰',gm:'冈比亚',gn:'几内亚',gq:'赤道几内亚',gr:'希腊',
        gt:'危地马拉',gu:'关岛',gw:'几内亚比绍',gy:'圭亚那',hk:'香港',
        hn:'洪都拉斯',hr:'克罗地亚',ht:'海地',hu:'匈牙利',id:'印度尼西亚',
        ie:'爱尔兰',il:'以色列',in:'印度',iq:'伊拉克',ir:'伊朗',
        is:'冰岛',it:'意大利',jm:'牙买加',jo:'约旦',jp:'日本',
        ke:'肯尼亚',kg:'吉尔吉斯斯坦',kh:'柬埔寨',ki:'基里巴斯',km:'科摩罗',
        kn:'圣基茨和尼维斯',kp:'朝鲜',kr:'韩国',kw:'科威特',ky:'开曼群岛',
        kz:'哈萨克斯坦',la:'老挝',lb:'黎巴嫩',lc:'圣卢西亚',li:'列支敦士登',
        lk:'斯里兰卡',lr:'利比里亚',ls:'莱索托',lt:'立陶宛',lu:'卢森堡',
        lv:'拉脱维亚',ly:'利比亚',ma:'摩洛哥',mc:'摩纳哥',md:'摩尔多瓦',
        me:'黑山',mg:'马达加斯加',mh:'马绍尔群岛',mk:'北马其顿',ml:'马里',
        mm:'缅甸',mn:'蒙古',mo:'澳门',mr:'毛里塔尼亚',mt:'马耳他',
        mu:'毛里求斯',mv:'马尔代夫',mw:'马拉维',mx:'墨西哥',my:'马来西亚',
        mz:'莫桑比克',na:'纳米比亚',ne:'尼日尔',ng:'尼日利亚',ni:'尼加拉瓜',
        nl:'荷兰',no:'挪威',np:'尼泊尔',nr:'瑙鲁',nz:'新西兰',
        om:'阿曼',pa:'巴拿马',pe:'秘鲁',pg:'巴布亚新几内亚',ph:'菲律宾',
        pk:'巴基斯坦',pl:'波兰',pt:'葡萄牙',pw:'帕劳',py:'巴拉圭',
        qa:'卡塔尔',ro:'罗马尼亚',rs:'塞尔维亚',ru:'俄罗斯',rw:'卢旺达',
        sa:'沙特阿拉伯',sb:'所罗门群岛',sc:'塞舌尔',sd:'苏丹',se:'瑞典',
        sg:'新加坡',si:'斯洛文尼亚',sk:'斯洛伐克',sl:'塞拉利昂',sm:'圣马力诺',
        sn:'塞内加尔',so:'索马里',sr:'苏里南',st:'圣多美和普林西比',sv:'萨尔瓦多',
        sy:'叙利亚',sz:'斯威士兰',td:'乍得',tg:'多哥',th:'泰国',
        tj:'塔吉克斯坦',tl:'东帝汶',tm:'土库曼斯坦',tn:'突尼斯',to:'汤加',
        tr:'土耳其',tt:'特立尼达和多巴哥',tv:'图瓦卢',tw:'台湾',tz:'坦桑尼亚',
        ua:'乌克兰',ug:'乌干达',us:'美国',uy:'乌拉圭',uz:'乌兹别克斯坦',
        va:'梵蒂冈',vc:'圣文森特和格林纳丁斯',ve:'委内瑞拉',vn:'越南',
        vu:'瓦努阿图',ws:'萨摩亚',ye:'也门',za:'南非',zm:'赞比亚',
        zw:'津巴布韦'
    };

    var METADATA_START_MARKER = [0xAB, 0xCD, 0xEF, 0x4D, 0x61, 0x78, 0x4D, 0x69, 0x6E, 0x64, 0x2E, 0x63, 0x6F, 0x6D];
    var DATA_SECTION_SEPARATOR_SIZE = 16;

    var TYPE_EXTENDED = 0;
    var TYPE_POINTER = 1;
    var TYPE_UTF8_STRING = 2;
    var TYPE_DOUBLE = 3;
    var TYPE_BYTES = 4;
    var TYPE_UINT16 = 5;
    var TYPE_UINT32 = 6;
    var TYPE_MAP = 7;
    var TYPE_INT32 = 8;
    var TYPE_UINT64 = 9;
    var TYPE_UINT128 = 10;
    var TYPE_ARRAY = 11;
    var TYPE_CONTAINER = 12;
    var TYPE_END_MARKER = 13;
    var TYPE_BOOLEAN = 14;
    var TYPE_FLOAT = 15;

    var _pointerValueOffset = [0, 2048, 526336, 0];
    var _textDecoder = new TextDecoder('utf-8');

    function _readUIntBE(db, offset, size) {
        var val = 0;
        for (var i = 0; i < size; i++) {
            val = (val << 8) | db[offset + i];
        }
        return val >>> 0;
    }

    function _findMetadataStart(db) {
        var found = 0;
        var fsize = db.length - 1;
        var mlen = METADATA_START_MARKER.length - 1;
        while (found <= mlen && fsize-- > 0) {
            found += db[fsize] === METADATA_START_MARKER[mlen - found] ? 1 : -found;
        }
        return fsize + found;
    }

    function _decode(db, baseOffset, offset, cache) {
        if (cache && cache[offset] !== undefined) {
            return cache[offset];
        }
        var result = _decodeInner(db, baseOffset, offset, cache);
        if (cache) {
            cache[offset] = result;
        }
        return result;
    }

    function _decodeInner(db, baseOffset, offset, cache) {
        var ctrlByte = db[offset++];
        var type = ctrlByte >> 5;

        if (type === TYPE_POINTER) {
            var ptr = _decodePointer(db, baseOffset, ctrlByte, offset);
            var inner = _decode(db, baseOffset, ptr.value, cache);
            return { value: inner.value, offset: ptr.offset };
        }

        if (type === TYPE_EXTENDED) {
            type = db[offset] + 7;
            if (type < 8) {
                throw new Error('Invalid Extended Type at offset ' + offset);
            }
            offset++;
        }

        var sizeInfo = _sizeFromCtrlByte(db, ctrlByte, offset);
        return _decodeByType(db, baseOffset, type, sizeInfo.offset, sizeInfo.value, cache);
    }

    function _sizeFromCtrlByte(db, ctrlByte, offset) {
        var size = ctrlByte & 0x1f;
        if (size < 29) {
            return { value: size, offset: offset };
        }
        if (size === 29) {
            return { value: 29 + db[offset], offset: offset + 1 };
        }
        if (size === 30) {
            return { value: 285 + _readUIntBE(db, offset, 2), offset: offset + 2 };
        }
        return { value: 65821 + _readUIntBE(db, offset, 3), offset: offset + 3 };
    }

    function _decodePointer(db, baseOffset, ctrlByte, offset) {
        var pointerSize = (ctrlByte >> 3) & 3;
        var pointer = baseOffset + _pointerValueOffset[pointerSize];
        var packed = 0;

        if (pointerSize === 0) {
            packed = ((ctrlByte & 7) << 8) | db[offset];
        } else if (pointerSize === 1) {
            packed = ((ctrlByte & 7) << 16) | _readUIntBE(db, offset, 2);
        } else if (pointerSize === 2) {
            packed = ((ctrlByte & 7) << 24) | _readUIntBE(db, offset, 3);
        } else {
            var view = new DataView(db.buffer, db.byteOffset, db.byteLength);
            packed = view.getUint32(offset);
        }

        offset += pointerSize + 1;
        return { value: (pointer + packed) >>> 0, offset: offset };
    }

    function _decodeByType(db, baseOffset, type, offset, size, cache) {
        var newOffset = offset + size;
        switch (type) {
            case TYPE_UTF8_STRING:
                return { value: _decodeString(db, offset, size), offset: newOffset };
            case TYPE_MAP:
                return _decodeMap(db, baseOffset, size, offset, cache);
            case TYPE_UINT32:
                return { value: _decodeUint(db, offset, size), offset: newOffset };
            case TYPE_DOUBLE:
                var dv = new DataView(db.buffer, db.byteOffset, db.byteLength);
                return { value: dv.getFloat64(offset), offset: newOffset };
            case TYPE_ARRAY:
                return _decodeArray(db, baseOffset, size, offset, cache);
            case TYPE_BOOLEAN:
                return { value: size !== 0, offset: offset };
            case TYPE_FLOAT:
                var fv = new DataView(db.buffer, db.byteOffset, db.byteLength);
                return { value: fv.getFloat32(offset), offset: newOffset };
            case TYPE_BYTES:
                return { value: db.subarray(offset, offset + size), offset: newOffset };
            case TYPE_UINT16:
                return { value: _decodeUint(db, offset, size), offset: newOffset };
            case TYPE_INT32:
                return { value: _decodeInt32(db, offset, size), offset: newOffset };
            case TYPE_UINT64:
                return { value: _decodeBigUint(db, offset, size), offset: newOffset };
            case TYPE_UINT128:
                return { value: _decodeBigUint(db, offset, size), offset: newOffset };
            default:
                throw new Error('Unknown type ' + type + ' at offset ' + offset);
        }
    }

    function _decodeString(db, offset, size) {
        if (size === 0) return '';
        var bytes = db.subarray(offset, offset + size);
        return _textDecoder.decode(bytes);
    }

    function _decodeMap(db, baseOffset, size, offset, cache) {
        var map = {};
        for (var i = 0; i < size; i++) {
            var keyResult = _decode(db, baseOffset, offset, cache);
            var valResult = _decode(db, baseOffset, keyResult.offset, cache);
            offset = valResult.offset;
            map[keyResult.value] = valResult.value;
        }
        return { value: map, offset: offset };
    }

    function _decodeArray(db, baseOffset, size, offset, cache) {
        var array = new Array(size);
        for (var i = 0; i < size; i++) {
            var result = _decode(db, baseOffset, offset, cache);
            offset = result.offset;
            array[i] = result.value;
        }
        return { value: array, offset: offset };
    }

    function _decodeUint(db, offset, size) {
        if (size === 0) return 0;
        if (size <= 4) return _readUIntBE(db, offset, size);
        throw new Error('Invalid size for unsigned integer: ' + size);
    }

    function _decodeInt32(db, offset, size) {
        if (size === 0) return 0;
        if (size < 4) return _readUIntBE(db, offset, size);
        var view = new DataView(db.buffer, db.byteOffset, db.byteLength);
        return view.getInt32(offset);
    }

    function _decodeBigUint(db, offset, size) {
        if (size > 16) {
            throw new Error('Invalid size for big unsigned integer: ' + size);
        }
        var integer = 0;
        for (var i = 0; i < size; i++) {
            integer = integer * 256 + db[offset + i];
        }
        return integer;
    }

    function _parseIPv4(input) {
        var parts = input.split('.', 4);
        return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])];
    }

    function _parseIPv6(input) {
        var addr = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        var ip = input;
        var dotIdx = ip.indexOf('.');
        if (dotIdx > -1) {
            ip = ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, function(m, a, b, c, d) {
                var h = function(v) { var s = parseInt(v, 10).toString(16); return s.length === 1 ? '0' + s : s; };
                return h(a) + h(b) + ':' + h(c) + h(d);
            });
        }
        var halves = ip.split('::', 2);
        var left = halves[0] ? halves[0].split(':') : [];
        var right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
        var i, chunk;
        for (i = 0; i < left.length; i++) {
            chunk = parseInt(left[i], 16);
            addr[i * 2] = chunk >> 8;
            addr[i * 2 + 1] = chunk & 0xff;
        }
        if (halves.length === 2) {
            var offset = 16 - right.length * 2;
            for (i = 0; i < right.length; i++) {
                chunk = parseInt(right[i], 16);
                addr[offset + i * 2] = chunk >> 8;
                addr[offset + i * 2 + 1] = chunk & 0xff;
            }
        }
        return addr;
    }

    function _bitAt(rawAddress, idx) {
        var bufIdx = idx >> 3;
        var bitIdx = 7 ^ (idx & 7);
        return (rawAddress[bufIdx] >>> bitIdx) & 1;
    }

    function MMDBReader(db) {
        this.db = db;
        this.view = new DataView(db.buffer, db.byteOffset, db.byteLength);
        this.metadata = this._parseMetadata();
        this.dataSectionOffset = this.metadata.searchTreeSize + DATA_SECTION_SEPARATOR_SIZE;
        this.cache = {};
        this._initWalker();
        this.ipv4StartNode = this._findIPv4Start();
    }

    MMDBReader.prototype._parseMetadata = function() {
        var offset = _findMetadataStart(this.db);
        var result = _decode(this.db, offset, offset, null);
        var m = result.value;

        if (!m) {
            throw new Error('Cannot parse MMDB metadata');
        }

        var recordSize = m.record_size;
        if ([24, 28, 32].indexOf(recordSize) === -1) {
            throw new Error('Unsupported record size: ' + recordSize);
        }

        return {
            nodeCount: m.node_count,
            recordSize: recordSize,
            ipVersion: m.ip_version,
            nodeByteSize: recordSize / 4,
            searchTreeSize: (m.node_count * recordSize) / 4,
            treeDepth: Math.pow(2, m.ip_version + 1),
            databaseType: m.database_type
        };
    };

    MMDBReader.prototype._initWalker = function() {
        var db = this.db;
        var recordSize = this.metadata.recordSize;
        var self = this;

        switch (recordSize) {
            case 24:
                this._readLeft = function(offset) { return _readUIntBE(db, offset, 3); };
                this._readRight = function(offset) { return _readUIntBE(db, offset + 3, 3); };
                break;
            case 28:
                this._readLeft = function(offset) {
                    return (((db[offset + 3] & 0xf0) << 20) | _readUIntBE(db, offset, 3)) >>> 0;
                };
                this._readRight = function(offset) {
                    return (((db[offset + 3] & 0x0f) << 24) | _readUIntBE(db, offset + 4, 3)) >>> 0;
                };
                break;
            case 32:
                this._readLeft = function(offset) { return self.view.getUint32(offset); };
                this._readRight = function(offset) { return self.view.getUint32(offset + 4); };
                break;
            default:
                throw new Error('Unsupported record size: ' + recordSize);
        }
    };

    MMDBReader.prototype._findIPv4Start = function() {
        if (this.metadata.ipVersion === 4) return 0;
        var nodeCount = this.metadata.nodeCount;
        var pointer = 0;
        for (var i = 0; i < 96 && pointer < nodeCount; i++) {
            var offset = pointer * this.metadata.nodeByteSize;
            pointer = this._readLeft(offset);
        }
        return pointer;
    };

    MMDBReader.prototype.lookup = function(ipStr) {
        var rawAddress;
        var nodeNumber;

        if (ipStr.indexOf(':') === -1) {
            rawAddress = _parseIPv4(ipStr);
            nodeNumber = this.ipv4StartNode;
        } else {
            rawAddress = _parseIPv6(ipStr);
            nodeNumber = 0;
        }

        var bitLength = rawAddress.length * 8;
        var nodeCount = this.metadata.nodeCount;
        var depth = 0;
        var bit, offset;

        for (; depth < bitLength && nodeNumber < nodeCount; depth++) {
            bit = _bitAt(rawAddress, depth);
            offset = nodeNumber * this.metadata.nodeByteSize;
            nodeNumber = bit ? this._readRight(offset) : this._readLeft(offset);
        }

        if (nodeNumber > nodeCount) {
            var dataOffset = (nodeNumber - nodeCount + this.metadata.searchTreeSize) >>> 0;
            var result = _decode(this.db, this.dataSectionOffset, dataOffset, this.cache);
            return result.value;
        }

        return null;
    };

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
        xhr.open('GET', 'assets/geo/dbip-country-lite-2026-05.mmdb', true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 60000;

        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    _reader = new MMDBReader(new Uint8Array(xhr.response));
                    _loaded = true;
                    _loading = false;
                    console.log('GeoIP: MMDB数据库加载成功, IP版本:', _reader.metadata.ipVersion,
                        '节点数:', _reader.metadata.nodeCount,
                        '记录大小:', _reader.metadata.recordSize,
                        '类型:', _reader.metadata.databaseType);
                    if (callback) callback(true);
                } catch (e) {
                    console.error('GeoIP: 解析MMDB数据库失败', e);
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

    function lookup(ipStr) {
        if (!_loaded) return null;

        if (ipStr.includes(':')) {
            var mappedIPv4 = _extractIPv4FromIPv6(ipStr);
            if (mappedIPv4) {
                return lookup(mappedIPv4);
            }
        }

        var data = _reader.lookup(ipStr);
        if (!data) return null;

        var code = null;
        var name = null;

        if (data.country && data.country.iso_code) {
            code = data.country.iso_code;
        } else if (data.registered_country && data.registered_country.iso_code) {
            code = data.registered_country.iso_code;
        } else if (data.continent && data.continent.code) {
            code = data.continent.code;
        }

        if (code) {
            name = _countryNames[code.toLowerCase()] || code;
            return { code: code, name: name };
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

    function hasFlag(code) {
        if (!code) return false;
        return _availableFlags[code.toLowerCase()] === 1;
    }

    function getCountryFlagHtml(code) {
        if (!code) return '';
        var lc = code.toLowerCase();
        if (_availableFlags[lc]) {
            var flagPath = _flagBasePath + lc + '.svg';
            return '<img class="twc-country-flag-img" src="' + flagPath + '" alt="' + code + '" title="' + code.toUpperCase() + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'" />' +
                '<span style="display:none;font-size:10px;background:var(--bg-tertiary);padding:0 3px;border-radius:2px;color:var(--text-muted)">' + code.toUpperCase() + '</span>';
        }
        return '<span style="font-size:10px;background:var(--bg-tertiary);padding:0 3px;border-radius:2px;color:var(--text-muted)">' + code.toUpperCase() + '</span>';
    }

    function isLoaded() {
        return _loaded;
    }

    function is_privateIP(ip) {
        if (!ip) return true;

        if (ip.includes(':')) {
            var mappedIPv4 = _extractIPv4FromIPv6(ip);
            if (mappedIPv4) {
                return is_privateIP(mappedIPv4);
            }
            return _is_privateIPv6(ip);
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

    function _is_privateIPv6(ip) {
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
        hasFlag: hasFlag,
        isLoaded: isLoaded,
        is_privateIP: is_privateIP
    };
})();
