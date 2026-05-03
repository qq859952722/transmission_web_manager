var TWC = TWC || {};

TWC.uiDialog = (function() {

    function showAddTorrent() {
        var session = TWC.config.getSessionData();
        var download_dir = session['download-dir'] || '';
        var peerLimit = session['peer-limit-per-torrent'] || '';

        var html = '<div class="twc-form-group">' +
            '<label>' + TWC.i18n.t('dialog.add.url_label') + '</label>' +
            '<textarea class="twc-input" id="add-url" rows="3" style="height:auto;resize:vertical" placeholder="' + TWC.i18n.t('dialog.add.url_placeholder') + '"></textarea>' +
            '</div>' +
            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.add.file_label') + '</label>' +
            '<input type="file" id="add-file" accept=".torrent" multiple style="font-size:12px" /></div>' +

            '<div class="twc-form-divider"></div>' +

            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.add.download_dir') + '</label>' +
            '<input type="text" class="twc-input" id="add-download-dir" value="' + TWC.utils.escapeHtml(download_dir) + '" placeholder="' + TWC.i18n.t('dialog.add.dir_placeholder') + '" /></div>' +

            '<div class="twc-form-row">' +
            '<div class="twc-form-group twc-form-half"><label>' + TWC.i18n.t('dialog.add.peer_limit') + '</label>' +
            '<input type="number" class="twc-input" id="add-peer-limit" min="0" max="9999" placeholder="' + TWC.i18n.t('dialog.add.default') + '" value="' + peerLimit + '" /></div>' +
            '<div class="twc-form-group twc-form-half"><label>' + TWC.i18n.t('dialog.add.priority') + '</label>' +
            '<select class="twc-input" id="add-priority">' +
            '<option value="-1">' + TWC.i18n.t('detail.settings.priority_low') + '</option>' +
            '<option value="0" selected>' + TWC.i18n.t('detail.settings.priority_normal') + '</option>' +
            '<option value="1">' + TWC.i18n.t('detail.settings.priority_high') + '</option>' +
            '</select></div>' +
            '</div>' +

            '<div class="twc-form-row">' +
            '<div class="twc-form-group twc-form-half"><label>' + TWC.i18n.t('dialog.add.download_limit') + ' (kB/s)</label>' +
            '<input type="number" class="twc-input" id="add-download-limit" min="0" placeholder="' + TWC.i18n.t('dialog.add.unlimited') + '" /></div>' +
            '<div class="twc-form-group twc-form-half"><label>' + TWC.i18n.t('dialog.add.upload_limit') + ' (kB/s)</label>' +
            '<input type="number" class="twc-input" id="add-upload-limit" min="0" placeholder="' + TWC.i18n.t('dialog.add.unlimited') + '" /></div>' +
            '</div>' +

            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.add.labels') + ' <span style="font-weight:normal;color:var(--text-muted);font-size:12px">(' + TWC.i18n.t('dialog.add.labels_hint') + ')</span></label>' +
            '<input type="text" class="twc-input" id="add-labels" placeholder="e.g. Movie, HD" />';

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

            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.add.group') + '</label>' +
            '<select class="twc-select" id="add-group"><option value="">' + TWC.i18n.t('dialog.add.group_default') + '</option>';

        var groups = TWC.config.getGroups() || [];
        for (var gi = 0; gi < groups.length; gi++) {
            html += '<option value="' + TWC.utils.escapeAttr(groups[gi].name) + '">' + TWC.utils.escapeHtml(groups[gi].name) + '</option>';
        }
        html += '</select></div>' +

            '<div class="twc-form-divider"></div>' +

            '<div class="twc-form-row" style="flex-wrap:wrap;gap:8px 20px">' +
            '<label class="twc-checkbox"><input type="checkbox" id="add-paused" /> ' + TWC.i18n.t('dialog.add.paused') + '</label>' +
            '<label class="twc-checkbox"><input type="checkbox" id="add-sequential" /> ' + TWC.i18n.t('dialog.add.sequential') + '</label>' +
            '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button>' +
            '<button class="twc-btn primary" id="add-submit">' + TWC.i18n.t('dialog.add.submit') + '</button>';

        TWC.ui.showModal(html, { title: TWC.i18n.t('dialog.add.title'), size: 'md', footer: footer });

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
            var download_limit = $('#add-download-limit').val().trim();
            var upload_limit = $('#add-upload-limit').val().trim();
            var labelsStr = $('#add-labels').val().trim();
            var sequential = $('#add-sequential').is(':checked');
            var group = $('#add-group').val() || '';

            var opts = {
                'download-dir': dir || undefined,
                paused: paused,
                bandwidth_priority: priority !== 1 ? priority : undefined,
                sequential_download: sequential ? true : undefined
            };

            if (peerLimit && parseInt(peerLimit, 10) > 0) {
                opts['peer-limit'] = parseInt(peerLimit, 10);
            }

            if (labelsStr) {
                opts.labels = labelsStr.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
            }

            if (group) {
                opts.group = group;
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

            if (totalToAdd === 0) { TWC.ui.showToast(TWC.i18n.t('dialog.add.empty_warn'), 'warning'); return; }

            var progressToast = TWC.ui.showProgressToast(TWC.i18n.t('dialog.add.adding_progress').replace('{n}', 0).replace('{total}', totalToAdd));

            function addCompleted(success, errorMsg) {
                completedCount++;
                if (!success && errorMsg) addErrors.push(errorMsg);
                TWC.ui.updateProgressToast(progressToast, TWC.i18n.t('dialog.add.adding_progress').replace('{n}', completedCount).replace('{total}', totalToAdd));
                if (completedCount >= totalToAdd) {
                    TWC.ui.removeProgressToast(progressToast);
                    if (addErrors.length > 0) {
                        TWC.ui.showToast(TWC.i18n.t('dialog.add.add_partial_failed').replace('{n}', addErrors.length), 'warning');
                    } else {
                        TWC.ui.showToast(TWC.i18n.t('dialog.add.add_success').replace('{n}', totalToAdd), 'success');
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
                                if (addedId && download_limit) {
                                    TWC.rpc.setTorrent([addedId], {
                                        download_limit: parseInt(download_limit, 10),
                                        download_limited: true
                                    });
                                }
                                if (addedId && upload_limit) {
                                    TWC.rpc.setTorrent([addedId], {
                                        upload_limit: parseInt(upload_limit, 10),
                                        upload_limited: true
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
                            var base64 = TWC.utils.arrayBufferToBase64(e.target.result);
                            count++;
                            var fileOpts = $.extend({ metainfo: base64 }, opts);
                            TWC.rpc.addTorrent(fileOpts,
                                function(success, added, duplicate) {
                                    var addedId = added ? added.id : null;
                                    if (success) {
                                        addCompleted(true, null);
                                        if (addedId) {
                                            if (download_limit) {
                                                TWC.rpc.setTorrent([addedId], {
                                                    download_limit: parseInt(download_limit, 10),
                                                    download_limited: true
                                                });
                                            }
                                            if (upload_limit) {
                                                TWC.rpc.setTorrent([addedId], {
                                                    upload_limit: parseInt(upload_limit, 10),
                                                    upload_limited: true
                                                });
                                            }
                                        }
                                    } else {
                                        addCompleted(false, TWC.i18n.t('dialog.add.add_failed'));
                                    }
                                });
                        };
                        reader.onerror = function() {
                            addCompleted(false, TWC.i18n.t('dialog.add.read_failed'));
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
            TWC.i18n.t('dialog.delete.confirm_data').replace('{n}', ids.length) :
            TWC.i18n.t('dialog.delete.confirm').replace('{n}', ids.length);

        var html = '<div style="text-align:center;padding:10px">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-500)" stroke-width="2" style="width:48px;height:48px;margin:0 auto 12px;display:block">' +
            '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
            '<p style="font-size:14px;color:var(--text-primary);margin-bottom:8px">' + TWC.utils.escapeHtml(msg) + '</p>' +
            (deleteData ? '' : '<div class="twc-form-group" style="text-align:left;margin-top:12px"><label class="twc-checkbox"><input type="checkbox" id="delete-data-check" /> ' + TWC.i18n.t('dialog.delete.also_data') + '</label></div>') +
            '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button>' +
            '<button class="twc-btn danger" id="delete-confirm-btn" style="background:var(--color-danger-500);color:#fff;border-color:var(--color-danger-500)">' + TWC.i18n.t('dialog.delete.submit') + '</button>';

        TWC.ui.showModal(html, { title: TWC.i18n.t('dialog.delete.title'), size: 'sm', footer: footer });

        $('#delete-confirm-btn').on('click', function() {
            var shouldDeleteData = deleteData || $('#delete-data-check').is(':checked');
            var deletedIds = ids.slice();
            TWC.torrent.clearSelection();
            TWC.ui.hideModal();
            TWC.rpc.removeTorrents(deletedIds, shouldDeleteData, function(success) {
                if (success) {
                    TWC.torrent.updateData([], deletedIds);
                    TWC.ui.showToast(TWC.i18n.t('status.deleted').replace('{n}', deletedIds.length), 'success');
                    TWC.uiList.render();
                    TWC.uiLayout.updateSidebar();
                    TWC.ui.refreshData(true);
                }
                else { TWC.ui.showToast(TWC.i18n.t('status.delete_failed'), 'error'); }
            });
        });
    }

    function showSettings() {
        TWC.config.loadSession(function(success) {
            if (!success) { TWC.ui.showToast(TWC.i18n.t('dialog.settings.load_failed'), 'error'); return; }
            TWC.uiDialogConfig.render();
        });
    }

    function showChangeDir(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        var currentDir = t ? t.download_dir : (TWC.config.getSessionValue('download-dir') || '');

        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.change_dir.label') + '</label>' +
            '<input type="text" class="twc-input" id="change-dir-input" value="' + TWC.utils.escapeHtml(currentDir) + '" /></div>' +
            '<div class="twc-form-group"><label class="twc-checkbox"><input type="checkbox" id="change-dir-move" checked /> ' + TWC.i18n.t('dialog.change_dir.move_data') + '</label></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="change-dir-submit">' + TWC.i18n.t('dialog.ok') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('context.change_dir'), size: 'md', footer: footer });

        $('#change-dir-submit').on('click', function() {
            var newDir = $('#change-dir-input').val().trim();
            var move = $('#change-dir-move').is(':checked');
            if (!newDir) { TWC.ui.showToast(TWC.i18n.t('dialog.change_dir.empty_warn'), 'warning'); return; }
            TWC.rpc.setTorrentLocation(ids, newDir, move, function(s) {
                if (s) { TWC.ui.showToast(TWC.i18n.t('dialog.change_dir.success'), 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.change_dir.failed'), 'error'); }
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

        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.label.input_label') + '</label>' +
            '<input type="text" class="twc-input" id="set-label-input" value="' + TWC.utils.escapeHtml(currentLabels.join(', ')) + '" placeholder="' + TWC.i18n.t('dialog.add.labels_hint') + '" /></div>';

        if (mergedLabels.length > 0) {
            html += '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.label.saved_label') + '</label>' +
                '<div class="twc-label-picker" id="label-picker">';
            for (var k = 0; k < mergedLabels.length; k++) {
                var isActive = currentLabels.indexOf(mergedLabels[k]) !== -1;
                html += '<span class="twc-label-tag' + (isActive ? ' active' : '') + '" data-label="' + TWC.utils.escapeHtml(mergedLabels[k]) + '">' +
                    TWC.utils.escapeHtml(mergedLabels[k]) + '</span>';
            }
            html += '</div></div>';
        }

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="set-label-submit">' + TWC.i18n.t('dialog.ok') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('context.set_label'), size: 'sm', footer: footer });

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
                    TWC.ui.showToast(TWC.i18n.t('dialog.label.success'), 'success');
                    TWC.ui.refreshData(true);
                }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.label.failed'), 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showSetSpeedLimit(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        var dlLimited = t ? t.download_limited : false;
        var dlLimit = t ? t.download_limit : 0;
        var ulLimited = t ? t.upload_limited : false;
        var ulLimit = t ? t.upload_limit : 0;

        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('detail.settings.download_limit') + '</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="speed-dl-limited"' + (dlLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="speed-dl-limit" value="' + dlLimit + '" style="width:100px" min="0" /> KB/s</div></div>' +
            '<div class="twc-form-group"><label>' + TWC.i18n.t('detail.settings.upload_limit') + '</label>' +
            '<div style="display:flex;gap:4px;align-items:center">' +
            '<input type="checkbox" id="speed-ul-limited"' + (ulLimited ? ' checked' : '') + ' style="accent-color:var(--color-primary-500)" />' +
            '<input type="number" class="twc-input" id="speed-ul-limit" value="' + ulLimit + '" style="width:100px" min="0" /> KB/s</div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="speed-submit">' + TWC.i18n.t('dialog.ok') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('context.set_speed'), size: 'sm', footer: footer });

        $('#speed-submit').on('click', function() {
            TWC.rpc.setTorrent(ids, {
                download_limited: $('#speed-dl-limited').is(':checked'), download_limit: parseInt($('#speed-dl-limit').val()) || 0,
                upload_limited: $('#speed-ul-limited').is(':checked'), upload_limit: parseInt($('#speed-ul-limit').val()) || 0
            }, function(s) {
                if (s) { TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_success'), 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_failed'), 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showAddTracker(ids) {
        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.tracker.add_label') + '</label>' +
            '<textarea class="twc-input" id="add-tracker-input" rows="5" style="height:auto;resize:vertical" placeholder="udp://tracker.example.com:1337/announce\nhttps://tracker2.example.com/announce"></textarea>' +
            '<div id="add-tracker-error" style="color:var(--color-danger-500);font-size:12px;margin-top:4px;display:none"></div>' +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + TWC.i18n.t('dialog.tracker.hint') + '</div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="add-tracker-submit">' + TWC.i18n.t('dialog.add.submit') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('dialog.tracker.add_title'), size: 'md', footer: footer });

        $('#add-tracker-input').on('input', function() {
            var val = $(this).val().trim();
            var $err = $('#add-tracker-error');
            if (!val) { $err.hide().text(''); return; }
            var result = TWC.utils.validateTrackerList(val);
            if (!result.valid) {
                $err.html(result.errors.join('<br/>')).show();
            } else {
                $err.hide().text('');
            }
        });

        $('#add-tracker-submit').on('click', function() {
            var trackerList = $('#add-tracker-input').val().trim();
            if (!trackerList) return;
            var result = TWC.utils.validateTrackerList(trackerList);
            if (!result.valid) {
                TWC.ui.showToast(result.errors[0], 'warning');
                return;
            }
            if (result.urls.length === 0) {
                TWC.ui.showToast(TWC.i18n.t('dialog.trackers.enter_url'), 'warning');
                return;
            }
            TWC.rpc.setTorrent(ids, { trackerAdd: result.urls }, function(s) {
                if (s) { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.add_success'), 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.add_failed'), 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showRenameFile(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        if (!t || !t.files || t.files.length === 0) {
            TWC.ui.showToast(TWC.i18n.t('status.no_files'), 'error');
            return;
        }

        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.rename.select_label') + '</label>' +
            '<select class="twc-select" id="rename-file-select" style="width:100%;max-height:200px">';
        for (var i = 0; i < t.files.length; i++) {
            html += '<option value="' + i + '">' + TWC.utils.escapeHtml(t.files[i].name) + '</option>';
        }
        html += '</select></div>' +
            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.rename.new_name') + '</label>' +
            '<input type="text" class="twc-input" id="rename-file-input" placeholder="' + TWC.i18n.t('dialog.rename.placeholder') + '" /></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="rename-file-submit">' + TWC.i18n.t('dialog.ok') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('context.rename'), size: 'md', footer: footer });

        $('#rename-file-submit').on('click', function() {
            var fileIdx = parseInt($('#rename-file-select').val());
            var newName = $('#rename-file-input').val().trim();
            if (!newName) { TWC.ui.showToast(TWC.i18n.t('dialog.rename.enter_new_name'), 'warning'); return; }

            var oldPath = t.files[fileIdx].name;
            TWC.rpc.renamePath(ids, oldPath, newName, function(success, args, error) {
                if (success) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.rename.success'), 'success');
                    TWC.ui.refreshData(true);
                } else {
                    TWC.ui.showToast(TWC.i18n.t('dialog.rename.failed') + ': ' + (error || ''), 'error');
                }
            });
            TWC.ui.hideModal();
        });
    }

    function showRemoveTracker(ids) {
        var t = ids.length === 1 ? TWC.torrent.getTorrent(ids[0]) : null;
        if (!t || !t.tracker_stats || t.tracker_stats.length === 0) {
            TWC.ui.showToast(TWC.i18n.t('status.no_trackers'), 'error');
            return;
        }

        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.tracker.remove_label') + '</label>' +
            '<div class="twc-tracker-list" style="max-height:300px;overflow-y:auto">';
        for (var i = 0; i < t.tracker_stats.length; i++) {
            html += '<label class="twc-checkbox" style="display:block;margin-bottom:4px">' +
                '<input type="checkbox" class="remove-tracker-check" data-tracker-id="' + t.tracker_stats[i].id + '" /> ' +
                TWC.utils.escapeHtml(t.tracker_stats[i].announce) +
                '</label>';
        }
        html += '</div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn danger" id="remove-tracker-submit" style="background:var(--color-danger-500);color:#fff;border-color:var(--color-danger-500)">' + TWC.i18n.t('dialog.delete.submit') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('context.remove_tracker'), size: 'md', footer: footer });

        $('#remove-tracker-submit').on('click', function() {
            var trackerIdsToRemove = [];
            $('.remove-tracker-check:checked').each(function() {
                trackerIdsToRemove.push(parseInt($(this).data('tracker-id')));
            });
            if (trackerIdsToRemove.length === 0) { TWC.ui.showToast(TWC.i18n.t('dialog.trackers.select_remove'), 'warning'); return; }

            TWC.rpc.setTorrent(ids, { trackerRemove: trackerIdsToRemove }, function(s) {
                if (s) { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.remove_success').replace('{n}', trackerIdsToRemove.length), 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.remove_failed'), 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showReplaceTracker(ids) {
        var html = '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.tracker.old_url') + '</label>' +
            '<input type="text" class="twc-input" id="replace-tracker-old" placeholder="https://old.tracker.com/announce" /></div>' +
            '<div class="twc-form-group"><label>' + TWC.i18n.t('dialog.tracker.new_url') + '</label>' +
            '<input type="text" class="twc-input" id="replace-tracker-new" placeholder="https://new.tracker.com/announce" />' +
            '<div id="replace-tracker-error" style="color:var(--color-danger-500);font-size:12px;margin-top:4px;display:none"></div></div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button><button class="twc-btn primary" id="replace-tracker-submit">' + TWC.i18n.t('dialog.tracker.replace_submit') + '</button>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('dialog.tracker.replace_title'), size: 'md', footer: footer });

        $('#replace-tracker-new').on('input', function() {
            var val = $(this).val().trim();
            var $err = $('#replace-tracker-error');
            if (!val) { $err.hide().text(''); return; }
            var schemeMatch = val.match(/^([a-z0-9]+):\/\//i);
            var scheme = schemeMatch ? schemeMatch[1].toLowerCase() : null;

            if (!TWC.utils.isValidTrackerUrl(val)) {
                if (scheme === 'ws' || scheme === 'wss') {
                    $err.text(TWC.i18n.t('dialog.trackers.no_ws_support')).show();
                } else if (scheme === 'tcp') {
                    $err.text(TWC.i18n.t('dialog.trackers.no_tcp_support')).show();
                } else if (scheme) {
                    $err.text(TWC.i18n.t('dialog.trackers.unsupported_scheme').replace('{scheme}', scheme + '://')).show();
                } else {
                    $err.text(TWC.i18n.t('dialog.trackers.invalid_format')).show();
                }
            } else {
                $err.hide().text('');
            }
        });

        $('#replace-tracker-submit').on('click', function() {
            var oldUrl = $('#replace-tracker-old').val().trim();
            var newUrl = $('#replace-tracker-new').val().trim();
            if (!oldUrl || !newUrl) { TWC.ui.showToast(TWC.i18n.t('dialog.trackers.enter_both'), 'warning'); return; }
            if (!newUrl.match(/^(http|https|udp):\/\//)) {
                TWC.ui.showToast(TWC.i18n.t('dialog.trackers.invalid_format'), 'warning');
                return;
            }

            var t = TWC.torrent.getTorrent(ids[0]);
            if (!t || !t.tracker_stats) return;

            var replaceList = [];
            for (var i = 0; i < t.tracker_stats.length; i++) {
                if (t.tracker_stats[i].announce.indexOf(oldUrl) >= 0) replaceList.push([t.tracker_stats[i].id, newUrl]);
            }
            if (replaceList.length === 0) { TWC.ui.showToast(TWC.i18n.t('dialog.trackers.not_found'), 'warning'); return; }

            TWC.rpc.setTorrent(ids, { trackerReplace: replaceList }, function(s) {
                if (s) { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.replace_success').replace('{n}', replaceList.length), 'success'); TWC.ui.refreshData(true); }
                else { TWC.ui.showToast(TWC.i18n.t('dialog.tracker.replace_failed'), 'error'); }
            });
            TWC.ui.hideModal();
        });
    }

    function showAbout() {
        var version = TWC.config.getSessionValue('version') || '-';
        var rpcVersion = TWC.config.getSessionValue('rpc-version') || '-';
        var html = '<div style="text-align:center;padding:20px">' +
            '<h2 style="font-size:20px;font-weight:700;color:var(--color-primary-500);margin-bottom:4px">Transmission Web Control</h2>' +
            '<p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">' + TWC.i18n.t('dialog.about.desc') + '</p>' +
            '<div style="font-size:12px;color:var(--text-secondary);line-height:2">' +
            '<div>' + TWC.i18n.t('dialog.about.version') + ': ' + version + '</div>' +
            '<div>' + TWC.i18n.t('dialog.about.rpc_version') + ': ' + rpcVersion + '</div>' +
            '<div>' + TWC.i18n.t('dialog.about.tech') + ': HTML5 + Vanilla CSS + JavaScript</div></div></div>';
        TWC.ui.showModal(html, { title: TWC.i18n.t('dialog.about.title'), size: 'sm' });
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
