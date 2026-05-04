var TWC = TWC || {};

TWC.uiDialogConfig = (function() {

    function render() {
        var tabs = TWC.config.getConfigTabs();
        var items = TWC.config.getConfigItems();
        var data = TWC.config.getSessionData();

        var tabsHtml = '<div class="twc-config-tabs" id="config-tabs">';
        for (var i = 0; i < tabs.length; i++) {
            tabsHtml += '<div class="twc-config-tab' + (i === 0 ? ' active' : '') + '" data-config-tab="' + tabs[i].id + '">' + tabs[i].name + '</div>';
        }
        tabsHtml += '</div>';

        var contentHtml = '<div class="twc-config-content" id="config-content"></div>';
        var bodyHtml = '<div style="display:flex;height:60vh">' + tabsHtml + contentHtml + '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button>' +
            '<button class="twc-btn" id="config-reset-btn">' + TWC.i18n.t('dialog.settings.reset') + '</button>' +
            '<button class="twc-btn primary" id="config-save-btn">' + TWC.i18n.t('dialog.settings.save') + '</button>';

        TWC.ui.showModal(bodyHtml, { title: TWC.i18n.t('dialog.settings.title'), size: 'xl', footer: footer });

        var currentTab = tabs[0].id;
        _renderTab(currentTab, items, data);

        $('.twc-config-tab').on('click', function() {
            $('.twc-config-tab').removeClass('active');
            $(this).addClass('active');
            currentTab = $(this).data('config-tab');
            _renderTab(currentTab, items, data);
        });

        $('#config-save-btn').on('click', function() {
            var defaultTrackers = $('[data-config-key="default-trackers"]').val();
            if (defaultTrackers && defaultTrackers.trim()) {
                var trackerResult = TWC.utils.validateTrackerList(defaultTrackers);
                if (!trackerResult.valid) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.tracker.invalid_warn'), 'warning');
                    return;
                }
            }
            var props = _collectValues(items);
            TWC.config.saveSession(props, function(success, error) {
                if (success) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_success'), 'success');
                    TWC.ui.hideModal();
                    TWC.ui.refreshData(true);
                    TWC.ui.updateAltSpeedButton();
                    TWC.ui.updateAltSpeedStatus();
                } else {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.save_failed') + ': ' + (error || ''), 'error');
                }
            });
        });

        $('#config-reset-btn').on('click', function() {
            _renderTab(currentTab, items, data);
        });
    }

    function _renderTab(tabId, items, data) {
        if (tabId === 'groups') {
            _renderGroupsTab();
            return;
        }
        var tabItems = items[tabId];
        if (!tabItems) {
            $('#config-content').html('<div class="twc-empty">' + TWC.i18n.t('dialog.settings.no_items') + '</div>');
            return;
        }

        var html = '';
        for (var g = 0; g < tabItems.length; g++) {
            var group = tabItems[g];
            html += '<div class="twc-config-section">';
            html += '<div class="twc-config-section-title">' + group.group + '</div>';
            html += '<div class="twc-config-grid">';

            for (var i = 0; i < group.items.length; i++) {
                var item = group.items[i];
                var val = data[item.key];
                html += '<div class="twc-form-group"' + (item.type === 'textarea' ? ' style="grid-column:1/-1"' : '') + '>';
                html += '<label>' + item.label + '</label>';

                switch (item.type) {
                    case 'toggle':
                        html += '<div class="twc-toggle' + (val ? ' active' : '') + '" data-config-key="' + item.key + '">' +
                            '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div></div>';
                        break;
                    case 'number':
                        html += '<div style="display:flex;gap:4px;align-items:center">' +
                            '<input type="number" class="twc-input" data-config-key="' + item.key + '" value="' + (val || 0) + '"' +
                            (item.min !== undefined ? ' min="' + item.min + '"' : '') +
                            (item.max !== undefined ? ' max="' + item.max + '"' : '') +
                            (item.step ? ' step="' + item.step + '"' : '') + ' />' +
                            (item.unit ? '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">' + item.unit + '</span>' : '') +
                            '</div>';
                        break;
                    case 'text':
                        html += '<input type="text" class="twc-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(val || '') + '" />';
                        break;
                    case 'password':
                        html += '<input type="password" class="twc-input" data-config-key="' + item.key + '" value="" placeholder="' + TWC.i18n.t('dialog.settings.pwd_placeholder') + '" />';
                        break;
                    case 'folder':
                    case 'file':
                        html += '<input type="text" class="twc-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(val || '') + '" />';
                        break;
                    case 'select':
                        var selectVal = (Array.isArray(val)) ? val.join(',') : val;
                        html += '<select class="twc-select" data-config-key="' + item.key + '">';
                        for (var o = 0; o < item.options.length; o++) {
                            html += '<option value="' + item.options[o].value + '"' + (selectVal === item.options[o].value ? ' selected' : '') + '>' + item.options[o].label + '</option>';
                        }
                        html += '</select>';
                        break;
                    case 'time':
                        var timeStr = TWC.utils.parseAltSpeedTime(val);
                        html += '<input type="time" class="twc-input" data-config-key="' + item.key + '" value="' + timeStr + '" />';
                        break;
                    case 'daymask':
                        var maskVal = parseInt(val) || 127;
                        html += '<div class="twc-daymask-group" data-config-key="' + item.key + '">';
                        var days = [
                            { val: 1, label: TWC.i18n.t('days.sun') },
                            { val: 2, label: TWC.i18n.t('days.mon') },
                            { val: 4, label: TWC.i18n.t('days.tue') },
                            { val: 8, label: TWC.i18n.t('days.wed') },
                            { val: 16, label: TWC.i18n.t('days.thu') },
                            { val: 32, label: TWC.i18n.t('days.fri') },
                            { val: 64, label: TWC.i18n.t('days.sat') }
                        ];
                        html += '<div style="margin-bottom:8px;display:flex;gap:6px;">' +
                                '<button type="button" class="twc-btn twc-btn-sm" onclick="$(this).closest(\'.twc-daymask-group\').find(\'input[type=checkbox]\').prop(\'checked\', true)">' + TWC.i18n.t('days.every') + '</button>' +
                                '<button type="button" class="twc-btn twc-btn-sm" onclick="$(this).closest(\'.twc-daymask-group\').find(\'input\').prop(\'checked\', false); $(this).closest(\'.twc-daymask-group\').find(\'input[value=2], input[value=4], input[value=8], input[value=16], input[value=32]\').prop(\'checked\', true)">' + TWC.i18n.t('days.work') + '</button>' +
                                '<button type="button" class="twc-btn twc-btn-sm" onclick="$(this).closest(\'.twc-daymask-group\').find(\'input\').prop(\'checked\', false); $(this).closest(\'.twc-daymask-group\').find(\'input[value=1], input[value=64]\').prop(\'checked\', true)">' + TWC.i18n.t('days.weekend') + '</button>' +
                                '</div>';
                        html += '<div style="display:flex; flex-wrap:wrap; gap:12px;">';
                        for (var dm = 0; dm < days.length; dm++) {
                            var checked = (maskVal & days[dm].val) ? ' checked' : '';
                            html += '<label style="display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer;">' +
                                    '<input type="checkbox" value="' + days[dm].val + '"' + checked + ' /> ' + days[dm].label +
                                    '</label>';
                        }
                        html += '</div></div>';
                        break;
                    case 'textarea':
                        html += '<textarea class="twc-input" data-config-key="' + item.key + '" rows="6" style="height:auto;resize:vertical;font-family:var(--font-mono)">' + TWC.utils.escapeHtml(val || '') + '</textarea>';
                        if (item.key === 'default-trackers') {
                            html += '<div class="twc-tracker-validation" data-tracker-validation="' + item.key + '" style="display:none;font-size:12px;color:var(--color-danger-500);margin-top:4px"></div>';
                        }
                        break;
                    case 'readonly':
                        html += '<input type="text" class="twc-input twc-readonly-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(String(val !== undefined && val !== null ? val : '-')) + '" readonly tabindex="-1" />';
                        break;
                    case 'readonly-text':
                        html += '<div class="twc-readonly-text" data-config-key="' + item.key + '">' + TWC.utils.escapeHtml(item.value || '') + '</div>';
                        break;
                    case 'readonly-bytes':
                        var bytesVal = val || 0;
                        var bytesStr = TWC.utils.formatBytes(bytesVal);
                        html += '<input type="text" class="twc-input twc-readonly-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(bytesStr) + '" readonly tabindex="-1" />';
                        break;
                    case 'label-manager':
                        html += _renderLabelManager();
                        break;
                }

                if (item.hint) {
                    html += '<div class="twc-form-hint">' + item.hint + '</div>';
                }
                html += '</div>';
            }

            html += '</div></div>';
        }

        if (tabId === 'blocklist') {
            var rpcVersion = TWC.config.getSessionValue('rpc-version') || 0;
            var ipProtocolSelect = '';
            if (rpcVersion >= 19) {
                ipProtocolSelect = '<select id="ip-protocol-select" style="margin-left:8px;padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-primary);color:var(--text-primary);font-size:12px">' +
                    '<option value="">' + TWC.i18n.t('dialog.settings.ip_protocol_auto') + '</option>' +
                    '<option value="ipv4">IPv4</option>' +
                    '<option value="ipv6">IPv6</option>' +
                    '</select>';
            }
            html += '<div style="margin-top:12px">' +
                '<button class="twc-btn" id="update-blocklist-btn">' + TWC.i18n.t('dialog.settings.update_blocklist') + '</button>' +
                '<button class="twc-btn" id="test-port-btn" style="margin-left:8px">' + TWC.i18n.t('dialog.settings.test_port') + '</button>' +
                ipProtocolSelect +
                '<span id="port-test-result" style="margin-left:8px;font-size:12px"></span></div>';
        }

        $('#config-content').html(html);

        $('.twc-toggle[data-config-key]').on('click', function() {
            $(this).toggleClass('active');
        });

        $('[data-config-key="default-trackers"]').on('input', function() {
            var val = $(this).val().trim();
            var $validation = $('[data-tracker-validation="default-trackers"]');
            if (!val) { $validation.hide().text(''); return; }
            var result = TWC.utils.validateTrackerList(val);
            if (!result.valid) {
                $validation.html(result.errors.join('<br/>')).show();
            } else {
                $validation.hide().text('');
            }
        });

        if (tabId === 'blocklist') {
            $('#update-blocklist-btn').on('click', function() {
                TWC.config.updateBlocklist(function(size, success) {
                    if (success) {
                        TWC.ui.showToast(TWC.i18n.t('dialog.settings.blocklist_updated').replace('{n}', size), 'success');
                        $('[data-config-key="blocklist-size"]').val(size);
                    } else {
                        TWC.ui.showToast(TWC.i18n.t('dialog.settings.update_failed'), 'error');
                    }
                });
            });

            $('#test-port-btn').on('click', function() {
                var ipProtocol = $('#ip-protocol-select').val() || '';
                $('#port-test-result').text(TWC.i18n.t('dialog.settings.testing')).removeClass('text-success text-danger');
                TWC.config.checkPort(function(isOpen, success, ipProtocolResult, errMsg) {
                    if (success) {
                        var resultText = isOpen ? (TWC.i18n.t('dialog.settings.port_open') + ' ✓') : (TWC.i18n.t('dialog.settings.port_closed') + ' ✕');
                        if (ipProtocolResult) {
                            resultText += ' (' + ipProtocolResult.toUpperCase() + ')';
                        }
                        $('#port-test-result').text(resultText)
                            .addClass(isOpen ? 'text-success' : 'text-danger');
                    } else {
                        var failText = errMsg || TWC.i18n.t('dialog.settings.test_failed');
                        $('#port-test-result').text(failText + ' ✕').addClass('text-danger');
                    }
                }, ipProtocol || undefined);
            });
        }

        if (tabId === 'labels') {
            _bindLabelManagerEvents();
        }
    }

    function _renderLabelManager() {
        var savedLabels = TWC.utils.storageGet('twc-label-library', []);
        var torrentLabels = TWC.torrent.getAllLabels();
        var labelSet = {};
        for (var i = 0; i < torrentLabels.length; i++) labelSet[torrentLabels[i]] = true;
        for (var j = 0; j < savedLabels.length; j++) labelSet[savedLabels[j]] = true;
        var allLabels = Object.keys(labelSet).sort();

        var html = '<div class="twc-label-manager" id="label-manager" data-config-key="_label-manager">';
        html += '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<input type="text" class="twc-input" id="label-add-input" placeholder="' + TWC.i18n.t('dialog.label.placeholder') + '" style="flex:1" />' +
            '<button class="twc-btn primary" id="label-add-btn" style="white-space:nowrap">' + TWC.i18n.t('dialog.add.submit') + '</button>' +
            '</div>';

        if (allLabels.length === 0) {
            html += '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">' + TWC.i18n.t('dialog.label.no_labels') + '</div>';
        } else {
            html += '<div class="twc-label-manager-list">';
            for (var k = 0; k < allLabels.length; k++) {
                var isFromTorrent = torrentLabels.indexOf(allLabels[k]) !== -1;
                var isSaved = savedLabels.indexOf(allLabels[k]) !== -1;
                var source = isFromTorrent && isSaved ? TWC.i18n.t('dialog.label.source_both') : (isFromTorrent ? TWC.i18n.t('dialog.label.source_torrent') : TWC.i18n.t('dialog.label.source_custom'));
                html += '<div class="twc-label-manager-item" data-label="' + TWC.utils.escapeHtml(allLabels[k]) + '">' +
                    '<span class="twc-label-manager-name">' + TWC.utils.escapeHtml(allLabels[k]) + '</span>' +
                    '<span class="twc-label-manager-source">' + source + '</span>' +
                    '<button class="twc-btn twc-btn-sm twc-label-manager-delete" data-label="' + TWC.utils.escapeHtml(allLabels[k]) + '" title="' + TWC.i18n.t('dialog.delete.submit') + '">&times;</button>' +
                    '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function _bindLabelManagerEvents() {
        function refreshLabelManager() {
            $('#label-manager').replaceWith(_renderLabelManager());
            _bindLabelManagerEvents();
            TWC.uiLayout.updateSidebar();
        }

        $('#label-add-btn').off('click.labeladd').on('click.labeladd', function() {
            var name = $('#label-add-input').val().trim();
            if (!name) { TWC.ui.showToast(TWC.i18n.t('dialog.label.empty_warn'), 'warning'); return; }
            var savedLabels = TWC.utils.storageGet('twc-label-library', []);
            if (savedLabels.indexOf(name) !== -1) { TWC.ui.showToast(TWC.i18n.t('dialog.label.exists_warn'), 'warning'); return; }
            savedLabels.push(name);
            savedLabels.sort();
            TWC.utils.storageSet('twc-label-library', savedLabels);
            $('#label-add-input').val('');
            refreshLabelManager();
            TWC.ui.showToast(TWC.i18n.t('dialog.label.add_success').replace('{name}', name), 'success');
        });

        $('#label-add-input').off('keydown.labelinput').on('keydown.labelinput', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                $('#label-add-btn').click();
            }
        });

        $('#label-manager').off('click.labeldelete').on('click', '.twc-label-manager-delete', function(e) {
            e.stopPropagation();
            var name = $(this).data('label');
            var savedLabels = TWC.utils.storageGet('twc-label-library', []);
            var idx = savedLabels.indexOf(name);
            if (idx !== -1) {
                savedLabels.splice(idx, 1);
                TWC.utils.storageSet('twc-label-library', savedLabels);
                TWC.ui.showToast(TWC.i18n.t('dialog.label.delete_success').replace('{name}', name), 'success');
            }
            refreshLabelManager();
        });
    }

    function _renderGroupsTab() {
        var $content = $('#config-content');
        $content.html('<div class="twc-groups-loading">' + TWC.i18n.t('dialog.settings.loading') + '</div>');

        TWC.config.loadGroups(function(groups, success) {
            if (!success) {
                var rpcVersion = TWC.config.getSessionValue('rpc-version') || 0;
                if (rpcVersion > 0 && rpcVersion < 17) {
                    $content.html('<div class="twc-empty">' + TWC.i18n.t('status.group_unsupported') + '</div>');
                } else {
                    $content.html('<div class="twc-empty">' + TWC.i18n.t('status.group_failed') + '</div>');
                }
                return;
            }

            var html = '<div class="twc-groups-manager" id="groups-manager">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
            html += '<span style="font-size:13px;color:var(--text-muted)">' + TWC.i18n.t('dialog.settings.groups_hint') + '</span>';
            html += '<button class="twc-btn primary" id="group-add-btn">' + TWC.i18n.t('dialog.settings.group_add') + '</button>';
            html += '</div>';

            if (!groups || groups.length === 0) {
                html += '<div class="twc-empty" style="padding:40px">' + TWC.i18n.t('dialog.settings.no_groups') + '</div>';
            } else {
                html += '<div class="twc-groups-list" id="groups-list">';
                for (var i = 0; i < groups.length; i++) {
                    html += _renderGroupCard(groups[i]);
                }
                html += '</div>';
            }

            html += '</div>';
            $content.html(html);

            _bindGroupsEvents();
        });
    }

    function _renderGroupCard(g) {
        var dlEnabled = g['speed-limit-down-enabled'] || false;
        var ulEnabled = g['speed-limit-up-enabled'] || false;
        var dlLimit = g['speed-limit-down'] || 0;
        var ulLimit = g['speed-limit-up'] || 0;
        var honorsSession = g.honorsSessionLimits !== false;

        var html = '<div class="twc-group-card" data-group-name="' + TWC.utils.escapeAttr(g.name) + '">';
        html += '<div class="twc-group-card-header">';
        html += '<span class="twc-group-name">' + TWC.utils.escapeHtml(g.name) + '</span>';
        html += '<div class="twc-group-actions">';
        html += '<button class="twc-btn twc-btn-sm twc-group-edit" data-group-name="' + TWC.utils.escapeAttr(g.name) + '">' + TWC.i18n.t('dialog.settings.group_edit') + '</button>';
        html += '<button class="twc-btn twc-btn-sm twc-btn-danger twc-group-delete" data-group-name="' + TWC.utils.escapeAttr(g.name) + '">' + TWC.i18n.t('dialog.settings.group_delete') + '</button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="twc-group-card-body">';
        html += '<div class="twc-group-info-row">';
        html += '<span>' + TWC.i18n.t('dialog.settings.group_download_limit') + '</span>';
        html += '<span>' + (dlEnabled ? TWC.utils.formatSpeed(dlLimit * 1024) : TWC.i18n.t('dialog.settings.group_no_limit')) + '</span>';
        html += '</div>';
        html += '<div class="twc-group-info-row">';
        html += '<span>' + TWC.i18n.t('dialog.settings.group_upload_limit') + '</span>';
        html += '<span>' + (ulEnabled ? TWC.utils.formatSpeed(ulLimit * 1024) : TWC.i18n.t('dialog.settings.group_no_limit')) + '</span>';
        html += '</div>';
        html += '<div class="twc-group-info-row">';
        html += '<span>' + TWC.i18n.t('dialog.settings.group_honors_session') + '</span>';
        html += '<span>' + (honorsSession ? '✓' : '✗') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function _bindGroupsEvents() {
        $('#group-add-btn').off('click').on('click', function() {
            _showGroupEditor(null);
        });

        $('#groups-list').off('click').on('click', '.twc-group-edit', function() {
            var name = $(this).data('group-name');
            var groups = TWC.config.getGroups() || [];
            var group = null;
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].name === name) { group = groups[i]; break; }
            }
            if (group) _showGroupEditor(group);
        });

        $('#groups-list').off('click.groupdelete').on('click.groupdelete', '.twc-group-delete', function() {
            var name = $(this).data('group-name');
            if (confirm(TWC.i18n.t('dialog.settings.group_delete_confirm').replace('{name}', name))) {
                TWC.rpc.setGroup({
                    name: name,
                    'speed-limit-down-enabled': false,
                    'speed-limit-up-enabled': false,
                    'speed-limit-down': 0,
                    'speed-limit-up': 0,
                    honorsSessionLimits: true
                }, function(success) {
                    if (success) {
                        TWC.ui.showToast(TWC.i18n.t('dialog.settings.group_delete_success').replace('{name}', name), 'success');
                        _renderGroupsTab();
                    } else {
                        TWC.ui.showToast(TWC.i18n.t('dialog.settings.group_delete_failed'), 'error');
                    }
                });
            }
        });
    }

    function _showGroupEditor(existingGroup) {
        var isEdit = !!existingGroup;
        var name = isEdit ? existingGroup.name : '';
        var dlEnabled = isEdit ? (existingGroup['speed-limit-down-enabled'] || false) : false;
        var ulEnabled = isEdit ? (existingGroup['speed-limit-up-enabled'] || false) : false;
        var dlLimit = isEdit ? (existingGroup['speed-limit-down'] || 0) : 0;
        var ulLimit = isEdit ? (existingGroup['speed-limit-up'] || 0) : 0;
        var honorsSession = isEdit ? (existingGroup.honorsSessionLimits !== false) : true;

        var html = '<div class="twc-group-editor">';
        html += '<div class="twc-form-group">';
        html += '<label>' + TWC.i18n.t('dialog.settings.group_name') + '</label>';
        html += '<input type="text" class="twc-input" id="group-editor-name" value="' + TWC.utils.escapeHtml(name) + '"' + (isEdit ? ' readonly' : '') + ' />';
        html += '</div>';

        html += '<div class="twc-form-group">';
        html += '<label>' + TWC.i18n.t('dialog.settings.group_download_limit') + '</label>';
        html += '<div style="display:flex;gap:8px;align-items:center">';
        html += '<div class="twc-toggle' + (dlEnabled ? ' active' : '') + '" id="group-editor-dl-enabled">';
        html += '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div></div>';
        html += '<input type="number" class="twc-input" id="group-editor-dl-limit" value="' + dlLimit + '" min="0" style="width:120px" />';
        html += '<span style="font-size:11px;color:var(--text-muted)">' + TWC.i18n.t('dialog.settings.group_speed_unit') + '</span>';
        html += '</div></div>';

        html += '<div class="twc-form-group">';
        html += '<label>' + TWC.i18n.t('dialog.settings.group_upload_limit') + '</label>';
        html += '<div style="display:flex;gap:8px;align-items:center">';
        html += '<div class="twc-toggle' + (ulEnabled ? ' active' : '') + '" id="group-editor-ul-enabled">';
        html += '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div></div>';
        html += '<input type="number" class="twc-input" id="group-editor-ul-limit" value="' + ulLimit + '" min="0" style="width:120px" />';
        html += '<span style="font-size:11px;color:var(--text-muted)">' + TWC.i18n.t('dialog.settings.group_speed_unit') + '</span>';
        html += '</div></div>';

        html += '<div class="twc-form-group">';
        html += '<label>' + TWC.i18n.t('dialog.settings.group_honors_session') + '</label>';
        html += '<div class="twc-toggle' + (honorsSession ? ' active' : '') + '" id="group-editor-honors-session">';
        html += '<div class="twc-toggle-track"><div class="twc-toggle-thumb"></div></div></div>';
        html += '</div>';

        html += '</div>';

        var footer = '<button class="twc-btn twc-modal-cancel">' + TWC.i18n.t('dialog.cancel') + '</button>' +
            '<button class="twc-btn primary" id="group-editor-save">' + TWC.i18n.t('dialog.settings.save') + '</button>';

        TWC.ui.showModal(html, {
            title: isEdit ? TWC.i18n.t('dialog.settings.group_edit_title').replace('{name}', name) : TWC.i18n.t('dialog.settings.group_add_title'),
            size: 'md',
            footer: footer
        });

        $('#group-editor-dl-enabled, #group-editor-ul-enabled, #group-editor-honors-session').on('click', function() {
            $(this).toggleClass('active');
        });

        $('#group-editor-save').on('click', function() {
            var groupName = $('#group-editor-name').val().trim();
            if (!groupName) {
                TWC.ui.showToast(TWC.i18n.t('dialog.settings.group_name_required'), 'warning');
                return;
            }

            var props = {
                name: groupName,
                'speed-limit-down-enabled': $('#group-editor-dl-enabled').hasClass('active'),
                'speed-limit-up-enabled': $('#group-editor-ul-enabled').hasClass('active'),
                'speed-limit-down': parseInt($('#group-editor-dl-limit').val()) || 0,
                'speed-limit-up': parseInt($('#group-editor-ul-limit').val()) || 0,
                honorsSessionLimits: $('#group-editor-honors-session').hasClass('active')
            };

            TWC.rpc.setGroup(props, function(success) {
                if (success) {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.group_save_success'), 'success');
                    TWC.ui.hideModal();
                    _renderGroupsTab();
                } else {
                    TWC.ui.showToast(TWC.i18n.t('dialog.settings.group_save_failed'), 'error');
                }
            });
        });
    }

    function _collectValues(items) {
        var props = {};

        for (var tabId in items) {
            var tabItems = items[tabId];
            for (var g = 0; g < tabItems.length; g++) {
                var group = tabItems[g];
                for (var i = 0; i < group.items.length; i++) {
                    var item = group.items[i];
                    if (item.type === 'readonly' || item.type === 'readonly-text' || item.type === 'readonly-bytes' || item.type === 'label-manager') continue;
                    if (item.key && item.key.charAt(0) === '_') continue;

                    var $el = $('[data-config-key="' + item.key + '"]');
                    if ($el.length === 0) continue;

                    if (item.type === 'toggle') {
                        props[item.key] = $el.hasClass('active');
                    } else if (item.type === 'time') {
                        props[item.key] = TWC.utils.timeToMinutes($el.val());
                    } else if (item.type === 'daymask') {
                        var finalMask = 0;
                        $el.find('input[type=checkbox]:checked').each(function() {
                            finalMask += parseInt($(this).val());
                        });
                        props[item.key] = finalMask;
                    } else if (item.type === 'number') {
                        var numVal = $el.val();
                        if (item.step && item.step.indexOf('.') >= 0) {
                            props[item.key] = parseFloat(numVal) || 0;
                        } else {
                            props[item.key] = parseInt(numVal) || 0;
                        }
                    } else if (item.type === 'password') {
                        var pwd = $el.val();
                        if (pwd) props[item.key] = pwd;
                    } else if (item.valueType === 'array') {
                        props[item.key] = $el.val() ? $el.val().split(',') : [];
                    } else {
                        props[item.key] = $el.val();
                    }
                }
            }
        }

        return props;
    }

    return {
        render: render
    };
})();
