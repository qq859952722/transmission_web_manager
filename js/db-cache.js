var TWC = TWC || {};

TWC.dbCache = (function() {
    var DB_NAME = 'twc_cache';
    var DB_VERSION = 1;
    var _db = null;

    var STORES = {
        geoip: 'geoip_cache',
        historyTorrents: 'history_torrents',
        historySnapshots: 'history_snapshots'
    };

    function init(callback) {
        if (_db) {
            if (callback) callback(true);
            return;
        }

        var request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(e) {
            var db = e.target.result;

            if (!db.objectStoreNames.contains(STORES.geoip)) {
                var geoipStore = db.createObjectStore(STORES.geoip, { keyPath: 'ip' });
                geoipStore.createIndex('cachedAt', 'cachedAt', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.historyTorrents)) {
                var histStore = db.createObjectStore(STORES.historyTorrents, { keyPath: 'hash_string' });
                histStore.createIndex('name', 'name', { unique: false });
                histStore.createIndex('deletedAt', 'deletedAt', { unique: false });
                histStore.createIndex('addedDate', 'addedDate', { unique: false });
                histStore.createIndex('downloadDir', 'download_dir', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.historySnapshots)) {
                var snapStore = db.createObjectStore(STORES.historySnapshots, { keyPath: 'id' });
                snapStore.createIndex('torrentHash', 'torrentHash', { unique: false });
                snapStore.createIndex('snapshotAt', 'snapshotAt', { unique: false });
            }
        };

        request.onsuccess = function(e) {
            _db = e.target.result;
            if (callback) callback(true);
        };

        request.onerror = function(e) {
            console.error('[dbCache] IndexedDB open failed:', e.target.error);
            if (callback) callback(false);
        };
    }

    function _tx(storeName, mode) {
        var tx = _db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    var geoip = {
        get: function(ip, callback) {
            if (!_db) { callback(null); return; }
            try {
                var store = _tx(STORES.geoip, 'readonly');
                var req = store.get(ip);
                req.onsuccess = function() {
                    var result = req.result;
                    if (result && result.cachedAt) {
                        var age = Date.now() - result.cachedAt;
                        if (age < 30 * 24 * 60 * 60 * 1000) {
                            callback(result.data);
                            return;
                        }
                    }
                    callback(null);
                };
                req.onerror = function() { callback(null); };
            } catch (e) { callback(null); }
        },

        put: function(ip, data) {
            if (!_db) return;
            try {
                var store = _tx(STORES.geoip, 'readwrite');
                store.put({ ip: ip, data: data, cachedAt: Date.now() });
            } catch (e) { console.error('[dbCache] geoip put error:', e); }
        }
    };

    var history = {
        archiveTorrent: function(torrentData, deleteData) {
            if (!_db) return;
            if (!torrentData || !torrentData.hash_string) return;

            try {
                var store = _tx(STORES.historyTorrents, 'readwrite');
                var req = store.get(torrentData.hash_string);
                req.onsuccess = function() {
                    var existing = req.result;
                    var record = _.assign({}, torrentData, {
                        deletedAt: Date.now() / 1000 | 0,
                        deleteLocalData: !!deleteData,
                        isActive: false
                    });

                    if (existing) {
                        record = _.assign({}, existing, record);
                        if (!record.firstDeletedAt) {
                            record.firstDeletedAt = record.deletedAt;
                        }
                    } else {
                        record.firstDeletedAt = record.deletedAt;
                    }

                    store.put(record);
                };
            } catch (e) { console.error('[dbCache] archiveTorrent error:', e); }
        },

        archiveSnapshot: function(torrentData) {
            if (!_db) return;
            if (!torrentData || !torrentData.hash_string) return;

            try {
                var store = _tx(STORES.historySnapshots, 'readwrite');
                var snapshot = {
                    id: torrentData.hash_string + '_' + (Date.now() / 1000 | 0),
                    torrentHash: torrentData.hash_string,
                    torrentName: torrentData.name,
                    snapshotAt: Date.now() / 1000 | 0,
                    status: torrentData.status,
                    percentDone: torrentData.percent_done,
                    rateDownload: torrentData.rate_download,
                    rateUpload: torrentData.rate_upload,
                    downloadedEver: torrentData.downloaded_ever,
                    uploadedEver: torrentData.uploaded_ever,
                    uploadRatio: torrentData.upload_ratio,
                    totalSize: torrentData.total_size,
                    peersConnected: torrentData.peers_connected,
                    labels: torrentData.labels || [],
                    downloadDir: torrentData.download_dir
                };
                store.put(snapshot);
            } catch (e) { console.error('[dbCache] archiveSnapshot error:', e); }
        },

        getAllTorrents: function(callback) {
            if (!_db) { callback([]); return; }
            try {
                var store = _tx(STORES.historyTorrents, 'readonly');
                var req = store.getAll();
                req.onsuccess = function() { callback(req.result || []); };
                req.onerror = function() { callback([]); };
            } catch (e) { callback([]); }
        },

        getTorrentsByIndex: function(indexName, value, callback) {
            if (!_db) { callback([]); return; }
            try {
                var store = _tx(STORES.historyTorrents, 'readonly');
                var index = store.index(indexName);
                var req = index.getAll(value);
                req.onsuccess = function() { callback(req.result || []); };
                req.onerror = function() { callback([]); };
            } catch (e) { callback([]); }
        },

        getSnapshots: function(torrentHash, callback) {
            if (!_db) { callback([]); return; }
            try {
                var store = _tx(STORES.historySnapshots, 'readonly');
                var index = store.index('torrentHash');
                var req = index.getAll(torrentHash);
                req.onsuccess = function() { callback(req.result || []); };
                req.onerror = function() { callback([]); };
            } catch (e) { callback([]); }
        },

        deleteTorrent: function(hashString, callback) {
            if (!_db) { if (callback) callback(false); return; }
            try {
                var tx = _db.transaction([STORES.historyTorrents, STORES.historySnapshots], 'readwrite');
                var torrentStore = tx.objectStore(STORES.historyTorrents);
                var snapStore = tx.objectStore(STORES.historySnapshots);
                var snapIndex = snapStore.index('torrentHash');

                torrentStore.delete(hashString);

                var snapReq = snapIndex.openCursor(hashString);
                snapReq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };

                tx.oncomplete = function() { if (callback) callback(true); };
                tx.onerror = function() { if (callback) callback(false); };
            } catch (e) { if (callback) callback(false); }
        },

        clearAll: function(callback) {
            if (!_db) { if (callback) callback(false); return; }
            try {
                var tx = _db.transaction([STORES.historyTorrents, STORES.historySnapshots], 'readwrite');
                tx.objectStore(STORES.historyTorrents).clear();
                tx.objectStore(STORES.historySnapshots).clear();
                tx.oncomplete = function() { if (callback) callback(true); };
                tx.onerror = function() { if (callback) callback(false); };
            } catch (e) { if (callback) callback(false); }
        },

        exportData: function(callback) {
            if (!_db) { callback(null); return; }
            try {
                var result = { torrents: [], snapshots: [], exportedAt: new Date().toISOString() };
                var tx = _db.transaction([STORES.historyTorrents, STORES.historySnapshots], 'readonly');

                var tReq = tx.objectStore(STORES.historyTorrents).getAll();
                tReq.onsuccess = function() { result.torrents = tReq.result || []; };

                var sReq = tx.objectStore(STORES.historySnapshots).getAll();
                sReq.onsuccess = function() { result.snapshots = sReq.result || []; };

                tx.oncomplete = function() { callback(result); };
                tx.onerror = function() { callback(null); };
            } catch (e) { callback(null); }
        },

        importData: function(data, callback) {
            if (!_db || !data) { if (callback) callback(false); return; }
            try {
                var tx = _db.transaction([STORES.historyTorrents, STORES.historySnapshots], 'readwrite');
                var tStore = tx.objectStore(STORES.historyTorrents);
                var sStore = tx.objectStore(STORES.historySnapshots);

                if (data.torrents) {
                    for (var i = 0; i < data.torrents.length; i++) {
                        tStore.put(data.torrents[i]);
                    }
                }
                if (data.snapshots) {
                    for (var j = 0; j < data.snapshots.length; j++) {
                        sStore.put(data.snapshots[j]);
                    }
                }

                tx.oncomplete = function() { if (callback) callback(true); };
                tx.onerror = function() { if (callback) callback(false); };
            } catch (e) { if (callback) callback(false); }
        },

        getCount: function(callback) {
            if (!_db) { callback(0); return; }
            try {
                var store = _tx(STORES.historyTorrents, 'readonly');
                var req = store.count();
                req.onsuccess = function() { callback(req.result); };
                req.onerror = function() { callback(0); };
            } catch (e) { callback(0); }
        }
    };

    return {
        init: init,
        geoip: geoip,
        history: history,
        STORES: STORES
    };
})();
