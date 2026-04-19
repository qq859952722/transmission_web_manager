var TWC = TWC || {};

TWC.uiDialog = (function() {

    function showAddTorrent() {
        var session = TWC.config.getSessionData();
        var downloadDir = session['download-dir'] || '';
        var peerLimit = session['peer-limit-per-torrent'] || '';
        var incompleteDir = session['incomplete-dir'] || '';
        var incompleteDirEnabled = session['incomplete-dir-enabled'] || false;

        var html = '<div class="twc-form-group">' +
            '<label>种子链接 / 磁力链接</label>' +
            '<textarea class="twc-input" id="add-url" rows="3" style="height:auto;resize:vertical" placeholder="输入种子URL或磁力链接，每行一个"></textarea>' +
            '</div>' +
            '<div class="twc-form-group"><label>种子文件</label>' +
            '<input type="file" id="add-file" accept=".torrent" multiple style="font-size:12px" /></div>' +

            '<div class="twc-form-divider"></div>' +

            '<div class="twc-form-group"><label>下载目录</label>' +
            '<input type="text" class="twc-input" id="add-download-dir" value="' + TWC.utils.escapeHtml(downloadDir) + '" placeholder="留空使用默认目录" /></div>' +

            '<div class="twc-form-row">' +
            '<div class="twc-form-group twc-form-half"><label>最大连接数</label>' +
            '<input type="number" class="twc-input" id="add-peer-limit" min="0" max="9999" placeholder="默认" value="' + peerLimit + '" /></div>' +
            '<div class="twc-form-group twc-form-half"><label>优先级</label>' +
            '<select class="twc-input" id="add-priority">' +
            '<option value="0">低</option>' +
            '<option value="1" selected>正常</option>' +
            '<option value="2">高</option>' +
            '</select></div>' +
            '</div>' +

            '<div class="twc-form-row">' +
            '<div class="twc-form-group twc-form-half"><label>下载限速 (kB/s)</label>' +
            '<input type="number" class="twc-input" id="add-download-limit" min="0" placeholder="不限" /></div>' +
            '<div class="twc-form-group twc-form-half"><label>上传限速 (kB/s)</label>' +
            '<input type="number" class="twc-input" id="add-upload-limit" min="0" placeholder="不限" /></div>' +
            '</div>' +

            '<div class="twc-form-group"><label>标签 <span style="font-weight:normal;color:var(--text-muted);font-size:12px">(逗号分隔)</span></label>' +
            '<input type="text" class="twc-input" id="add-labels" placeholder="例如: 电影, 高清" />';

        var allLabels = TWC.torrent.getAllLabels();
        var savedLabels = TWC.utils.storageGet('twc-label-library', []);
        var labelSet = {};
        for (var li = 0; li < allLabels.length; li++) labelSet[allLabels[li]] = true;
        for (var lj = 0; lj < savedLabels.length; lj++) labelSet[savedLabels[lj]] = true;
        var mergedLabels = Object.keys(labelSet).sort();
        if (mergedLabels.length > 0) {
            html += '<div class="twc-label-picker" id="add-label-picker">';
            for (var lk = 0; lk < mergedLabels.length; lk++) {
                html += '<span class="twc-label-tag" data-label="' + TWC.utils.escapeHtml(mergedLabels[lk]) + '">' +
                    TWC.utils.escapeHtml(mergedLabels[lk]) + '</span>';
            }
            html += '</div>';
        }

        html += '</div>' +

            '<div class="twc-form-divider"></div>' +

            '<div class="twc-form-row" style="flex-wrap:wrap;gap:8px 20px">' +
            '<label class="twc-checkbox"><input type="checkbox" id="add-paused" /> 暂停启动</label>' +
            '<label class="twc-checkbox"><input type="checkbox" id="add-sequential" /> 顺序下载</label>' +
            '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button>' +
            '<button class="twc-btn primary" id="add-submit">添加</button>';

        TWC.ui.showModal(html, { title: '添加种子', size: 'md', footer: footer });

        $(document).off('click.addlabeltag').on('click.addlabeltag', '#add-label-picker .twc-label-tag', function() {
            $(this).toggleClass('active');
            var selected = [];
            $('#add-label-picker .twc-label-tag.active').each(function() {
                selected.push($(this).data('label'));
            });
            var existing = $('#add-labels').val().trim();
            var parts = existing ? existing.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l; }) : [];
            for (var si = 0; si < selected.length; si++) {
                if (parts.indexOf(selected[si]) === -1) parts.push(selected[si]);
            }
            $('#add-labels').val(parts.join(', '));
        });

        $('#add-submit').off('click').on('click', function() {
            var urls = $('#add-url').val().trim();
            var files = $('#add-file')[0].files;
            var dir = $('#add-download-dir').val().trim();
            var paused = $('#add-paused').is(':checked');
            var peerLimit = $('#add-peer-limit').val().trim();
            var priority = parseInt($('#add-priority').val(), 10);
            var downloadLimit = $('#add-download-limit').val().trim();
            var uploadLimit = $('#add-upload-limit').val().trim();
            var labelsStr = $('#add-labels').val().trim();
            var sequential = $('#add-sequential').is(':checked');

            var opts = {
                'download-dir': dir || undefined,
                paused: paused,
                bandwidthPriority: priority !== 1 ? priority : undefined,
                sequential_download: sequential ? true : undefined
            };

            if (peerLimit && parseInt(peerLimit, 10) > 0) {
                opts['peer-limit'] = parseInt(peerLimit, 10);
            }

            if (labelsStr) {
                opts.labels = labelsStr.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
            }

            var count = 0;
            var completedCount = 0;
            var totalToAdd = 0;
            var addErrors = [];

            if (urls) {
                var urlList = urls.split('\n').filter(function(u) { return u.trim(); });
                totalToAdd += urlList.length;
            }
            if (files && files.length > 0) {
                totalToAdd += files.length;
            }

            if (totalToAdd === 0) { TWC.ui.showToast('请输入种子链接或选择文件', 'warning'); return; }

            var progressToast = TWC.ui.showProgressToast('添加中: 0/' + totalToAdd);

            function addCompleted(success, errorMsg) {
                completedCount++;
                if (!success && errorMsg) addErrors.push(errorMsg);
                TWC.ui.updateProgressToast(progressToast, '添加中: ' + completedCount + '/' + totalToAdd);
                if (completedCount >= totalToAdd) {
                    TWC.ui.removeProgressToast(progressToast);
                    if (addErrors.length > 0) {
                        TWC.ui.showToast('添加完成，但有 ' + addErrors.length + ' 个失败', 'warning');
                    } else {
                        TWC.ui.showToast('成功添加 ' + totalToAdd + ' 个种子', 'success');
                    }
                    TWC.ui.refreshData(true);
                }
            }

            if (urls) {
                var urlList = urls.split('\n');
                for (var i = 0; i < urlList.length; i++) {
                    var url = urlList[i].trim();
                    if (!url) continue;
                    count++;
                    var urlOpts = $.extend({ filename: url }, opts);
                    TWC.rpc.addTorrent(urlOpts,
                        function(success, added, duplicate, error) {
                            if (success) {
                                var addedId = added ? added.id : null;
                                if (duplicate) {
                                    addCompleted(true, null);
                                } else {
                                    addCompleted(true, null);
                                }
                                if (addedId && downloadLimit) {
                                    TWC.rpc.setTorrent([addedId], {
                                        'download-limit': parseInt(downloadLimit, 10),
                                        'download-limited': true
                                    });
                                }
                                if (addedId && uploadLimit) {
                                    TWC.rpc.setTorrent([addedId], {
                                        'upload-limit': parseInt(uploadLimit, 10),
                                        'upload-limited': true
                                    });
                                }
                            } else { addCompleted(false, error || ''); }
                        });
                }
            }
            if (files && files.length > 0) {
                for (var j = 0; j < files.length; j++) {
                    (function(file) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var base64 = btoa(new Uint8Array(e.target.result).reduce(function(d, b) { return d + String.fromCharCode(b); }, ''));
                            count++;
                            var fileOpts = $.extend({ metainfo: base64 }, opts);
                            TWC.rpc.addTorrent(fileOpts,
                                function(success, added, duplicate) {
                                    var addedId = added ? added.id : null;
                                    if (success) {
                                        addCompleted(true, null);
                                        if (addedId) {
                                            if (downloadLimit) {
                                                TWC.rpc.setTorrent([addedId], {
                                                    'download-limit': parseInt(downloadLimit, 10),
                                                    'download-limited': true
                                                });
                                            }
                                            if (uploadLimit) {
                                                TWC.rpc.setTorrent([addedId], {
                                                    'upload-limit': parseInt(uploadLimit, 10),
                                                    'upload-limited': true
                                                });
                                            }
                                        }
                                    } else {
                                        addCompleted(false, '添加失败');
                                    }
                                });
                        };
                        reader.onerror = function() {
                            addCompleted(false, '文件读取失败');
                        };
                        reader.readAsArrayBuffer(file);
                    })(files[j]);
                }
            }
            TWC.ui.hideModal();
        });
    }

    function showConfirmDelete(ids, deleteData) {
        var msg = deleteData ?
            '确定要删除 ' + ids.length + ' 个种子及其数据吗？此操作不可撤销！' :
            '确定要删除 ' + ids.length + ' 个种子吗？';

        var html = '<div style="text-align:center;padding:10px">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-500)" stroke-width="2" style="width:48px;height:48px;margin:0 auto 12px;display:block">' +
            '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
            '<p style="font-size:14px;color:var(--text-primary);margin-bottom:8px">' + msg + '</p>' +
            (deleteData ? '' : '<div class="twc-form-group" style="text-align:left;margin-top:12px"><label class="twc-checkbox"><input type="checkbox" id="delete-data-check" /> 同时删除数据</label></div>') +
            '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button>' +
            '<button class="twc-btn danger" id="delete-confirm-btn" style="background:var(--color-danger-500);color:#fff;border-color:var(--color-danger-500)">删除</button>';

        TWC.ui.showModal(html, { title: '确认删除', size: 'sm', footer: footer });

        $('#delete-confirm-btn').on('click', function() {
            var shouldDeleteData = deleteData || $('#delete-data-check').is(':checked');
            TWC.rpc.removeTorrents(ids, shouldDeleteData, function(success) {
                if (success) { TWC.ui.showToast('已删除 ' + ids.length + ' 个种子', 'success'); TWC.torrent.clearSelection(); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('删除失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showSettings() {
        TWC.config.loadSession(function(success) {
            if (!success) { TWC.ui.showToast('加载配置失败', 'error'); return; }
            TWC.uiDialogConfig.render();
        });
    }

    function showChangeDir(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        var currentDir = t ? t.downloadDir : (TWC.config.getSessionValue('download-dir') || '');

        var html = '<div class="twc-form-group"><label>新下载目录</label>' +
            '<input type="text" class="twc-input" id="change-dir-input" value="' + TWC.utils.escapeHtml(currentDir) + '" /></div>' +
            '<div class="twc-form-group"><label class="twc-checkbox"><input type="checkbox" id="change-dir-move" checked /> 移动已有数据到新位置</label></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="change-dir-submit">确定</button>';
        TWC.ui.showModal(html, { title: '修改下载目录', size: 'md', footer: footer });

        $('#change-dir-submit').on('click', function() {
            var newDir = $('#change-dir-input').val().trim();
            var move = $('#change-dir-move').is(':checked');
            if (!newDir) { TWC.ui.showToast('请输入目录路径', 'warning'); return; }
            TWC.rpc.setTorrentLocation(ids, newDir, move, function(s) {
                if (s) { TWC.ui.showToast('目录已修改', 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('修改失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showSetLabel(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        var currentLabels = t && t.labels ? t.labels : [];
        var allLabels = TWC.torrent.getAllLabels();
        var savedLabels = TWC.utils.storageGet('twc-label-library', []);
        var labelSet = {};
        for (var i = 0; i < allLabels.length; i++) labelSet[allLabels[i]] = true;
        for (var j = 0; j < savedLabels.length; j++) labelSet[savedLabels[j]] = true;
        var mergedLabels = Object.keys(labelSet).sort();

        var html = '<div class="twc-form-group"><label>标签（多个标签用逗号分隔）</label>' +
            '<input type="text" class="twc-input" id="set-label-input" value="' + TWC.utils.escapeHtml(currentLabels.join(', ')) + '" placeholder="标签1, 标签2" /></div>';

        if (mergedLabels.length > 0) {
            html += '<div class="twc-form-group"><label>选择已有标签</label>' +
                '<div class="twc-label-picker" id="label-picker">';
            for (var k = 0; k < mergedLabels.length; k++) {
                var isActive = currentLabels.indexOf(mergedLabels[k]) !== -1;
                html += '<span class="twc-label-tag' + (isActive ? ' active' : '') + '" data-label="' + TWC.utils.escapeHtml(mergedLabels[k]) + '">' +
                    TWC.utils.escapeHtml(mergedLabels[k]) + '</span>';
            }
            html += '</div></div>';
        }

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="set-label-submit">确定</button>';
        TWC.ui.showModal(html, { title: '设置标签', size: 'sm', footer: footer });

        $(document).off('click.labeltag').on('click.labeltag', '.twc-label-tag', function() {
            $(this).toggleClass('active');
            _syncLabelInput();
        });

        function _syncLabelInput() {
            var selected = [];
            $('.twc-label-tag.active').each(function() {
                selected.push($(this).data('label'));
            });
            $('#set-label-input').val(selected.join(', '));
        }

        $('#set-label-input').on('input', function() {
            var val = $(this).val().trim();
            var parts = val ? val.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l; }) : [];
            $('.twc-label-tag').each(function() {
                var label = $(this).data('label');
                if (parts.indexOf(label) !== -1) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        });

        $('#set-label-submit').on('click', function() {
            var labelStr = $('#set-label-input').val().trim();
            var labels = labelStr ? labelStr.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l; }) : [];
            TWC.rpc.setTorrent(ids, { labels: labels }, function(s) {
                if (s) {
                    TWC.ui.showToast('标签已设置', 'success');
                    TWC.ui.refreshData(true);
                }
                else { TWC.ui.showToast('设置失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showSetSpeedLimit(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        var dlLimited = t ? t.downloadLimited : false;
        var dlLimit = t ? t.downloadLimit : 0;
        var ulLimited = t ? t.uploadLimited : false;
        var ulLimit = t ? t.uploadLimit : 0;

        var html = '<div class="twc-form-group"><label>下载限速</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="speed-dl-limited"' + (dlLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="speed-dl-limit" value="' + dlLimit + '" style="width:100px" min="0" /> KB/s</div></div>' +
            '<div class="twc-form-group"><label>上传限速</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="speed-ul-limited"' + (ulLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="speed-ul-limit" value="' + ulLimit + '" style="width:100px" min="0" /> KB/s</div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="speed-submit">确定</button>';
        TWC.ui.showModal(html, { title: '限速设置', size: 'sm', footer: footer });

        $('#speed-submit').on('click', function() {
            TWC.rpc.setTorrent(ids, {
                downloadLimited: $('#speed-dl-limited').is(':checked'), downloadLimit: parseInt($('#speed-dl-limit').val()) || 0,
                uploadLimited: $('#speed-ul-limited').is(':checked'), uploadLimit: parseInt($('#speed-ul-limit').val()) || 0
            }, function(s) {
                if (s) { TWC.ui.showToast('限速已设置', 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('设置失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showAddTracker(ids) {
        var html = '<div class="twc-form-group"><label>添加 Tracker（每行一个）</label>' +
            '<textarea class="twc-input" id="add-tracker-input" rows="5" style="height:auto;resize:vertical" placeholder="https://tracker.example.com/announce"></textarea></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="add-tracker-submit">添加</button>';
        TWC.ui.showModal(html, { title: '添加 Tracker', size: 'md', footer: footer });

        $('#add-tracker-submit').on('click', function() {
            var trackerList = $('#add-tracker-input').val().trim();
            if (!trackerList) return;
            var trackers = trackerList.split('\n').map(function(t) { return t.trim(); }).filter(function(t) { return t; });
            TWC.rpc.setTorrent(ids, { trackerAdd: trackers }, function(s) {
                if (s) { TWC.ui.showToast('Tracker 已添加', 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('添加失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showRenameFile(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        if (!t || !t.files || t.files.length === 0) {
            TWC.ui.showToast('无法获取文件信息', 'error');
            return;
        }

        var html = '<div class="twc-form-group"><label>选择要重命名的文件</label>' +
            '<select class="twc-select" id="rename-file-select" style="width:100%;max-height:200px">';
        for (var i = 0; i < t.files.length; i++) {
            var fileName = t.files[i].name.split('/').pop();
            html += '<option value="' + i + '">' + TWC.utils.escapeHtml(t.files[i].name) + '</option>';
        }
        html += '</select></div>' +
            '<div class="twc-form-group"><label>新文件名</label>' +
            '<input type="text" class="twc-input" id="rename-file-input" placeholder="输入新文件名" /></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="rename-file-submit">确定</button>';
        TWC.ui.showModal(html, { title: '重命名文件', size: 'md', footer: footer });

        $('#rename-file-submit').on('click', function() {
            var fileIdx = parseInt($('#rename-file-select').val());
            var newName = $('#rename-file-input').val().trim();
            if (!newName) { TWC.ui.showToast('请输入新文件名', 'warning'); return; }

            var oldPath = t.files[fileIdx].name;
            TWC.rpc.renamePath(ids, oldPath, newName, function(success, args, error) {
                if (success) {
                    TWC.ui.showToast('文件已重命名', 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast('重命名失败: ' + (error || ''), 'error');
                }
            });
            TWC.ui.hideModal();
        });
    }

    function showRemoveTracker(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        if (!t || !t.trackerStats || t.trackerStats.length === 0) {
            TWC.ui.showToast('无法获取Tracker信息', 'error');
            return;
        }

        var html = '<div class="twc-form-group"><label>选择要移除的Tracker</label>' +
            '<div class="twc-tracker-list" style="max-height:300px;overflow-y:auto">';
        for (var i = 0; i < t.trackerStats.length; i++) {
            html += '<label class="twc-checkbox" style="display:block;margin-bottom:4px">' +
                '<input type="checkbox" class="remove-tracker-check" data-tracker-id="' + t.trackerStats[i].id + '" /> ' +
                TWC.utils.escapeHtml(t.trackerStats[i].announce) +
                '</label>';
        }
        html += '</div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn danger" id="remove-tracker-submit" style="background:var(--color-danger-500);color:#fff;border-color:var(--color-danger-500)">移除</button>';
        TWC.ui.showModal(html, { title: '移除Tracker', size: 'md', footer: footer });

        $('#remove-tracker-submit').on('click', function() {
            var trackerIdsToRemove = [];
            $('.remove-tracker-check:checked').each(function() {
                trackerIdsToRemove.push(parseInt($(this).data('tracker-id')));
            });
            if (trackerIdsToRemove.length === 0) { TWC.ui.showToast('请选择要移除的Tracker', 'warning'); return; }

            TWC.rpc.setTorrent(ids, { trackerRemove: trackerIdsToRemove }, function(s) {
                if (s) { TWC.ui.showToast('已移除 ' + trackerIdsToRemove.length + ' 个Tracker', 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('移除失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showReplaceTracker(ids) {
        var html = '<div class="twc-form-group"><label>旧 Tracker URL</label>' +
            '<input type="text" class="twc-input" id="replace-tracker-old" placeholder="https://old.tracker.com/announce" /></div>' +
            '<div class="twc-form-group"><label>新 Tracker URL</label>' +
            '<input type="text" class="twc-input" id="replace-tracker-new" placeholder="https://new.tracker.com/announce" /></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button><button class="twc-btn primary" id="replace-tracker-submit">替换</button>';
        TWC.ui.showModal(html, { title: '替换 Tracker', size: 'md', footer: footer });

        $('#replace-tracker-submit').on('click', function() {
            var oldUrl = $('#replace-tracker-old').val().trim();
            var newUrl = $('#replace-tracker-new').val().trim();
            if (!oldUrl || !newUrl) { TWC.ui.showToast('请输入旧和新 Tracker URL', 'warning'); return; }

            var t = TWC.torrent.getTorrent(ids[0]);
            if (!t || !t.trackerStats) return;

            var replaceList = [];
            for (var i = 0; i < t.trackerStats.length; i++) {
                if (t.trackerStats[i].announce.indexOf(oldUrl) >= 0) replaceList.push([t.trackerStats[i].id, newUrl]);
            }
            if (replaceList.length === 0) { TWC.ui.showToast('未找到匹配的 Tracker', 'warning'); return; }

            TWC.rpc.setTorrent(ids, { trackerReplace: replaceList }, function(s) {
                if (s) { TWC.ui.showToast('已替换 ' + replaceList.length + ' 个 Tracker', 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast('替换失败', 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showAbout() {
        var version = TWC.config.getSessionValue('version') || '-';
        var rpcVersion = TWC.config.getSessionValue('rpc-version') || '-';
        var html = '<div style="text-align:center;padding:20px">' +
            '<h2 style="font-size:20px;font-weight:700;color:var(--color-primary-500);margin-bottom:4px">Transmission Web Control</h2>' +
            '<p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">现代化 Transmission Web 管理界面</p>' +
            '<div style="font-size:12px;color:var(--text-secondary);line-height:2">' +
            '<div>Transmission 版本: ' + version + '</div>' +
            '<div>RPC 版本: ' + rpcVersion + '</div>' +
            '<div>技术栈: jQuery 3.x + Tailwind CSS 3.x</div></div></div>';
        TWC.ui.showModal(html, { title: '关于', size: 'sm' });
    }

    return {
        showAddTorrent: showAddTorrent,
        showConfirmDelete: showConfirmDelete,
        showSettings: showSettings,
        showChangeDir: showChangeDir,
        showSetLabel: showSetLabel,
        showSetSpeedLimit: showSetSpeedLimit,
        showAddTracker: showAddTracker,
        showRemoveTracker: showRemoveTracker,
        showRenameFile: showRenameFile,
        showReplaceTracker: showReplaceTracker,
        showAbout: showAbout
    };
})();
