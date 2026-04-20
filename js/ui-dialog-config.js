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

        var footer = '<button class="twc-btn twc-modal-cancel">取消</button>' +
            '<button class="twc-btn" id="config-reset-btn">重置</button>' +
            '<button class="twc-btn primary" id="config-save-btn">保存</button>';

        TWC.ui.showModal(bodyHtml, { title: 'Transmission 设置', size: 'xl', footer: footer });

        var currentTab = tabs[0].id;
        _renderTab(currentTab, items, data);

        $('.twc-config-tab').on('click', function() {
            $('.twc-config-tab').removeClass('active');
            $(this).addClass('active');
            currentTab = $(this).data('config-tab');
            _renderTab(currentTab, items, data);
        });

        $('#config-save-btn').on('click', function() {
            var props = _collectValues(items);
            TWC.config.saveSession(props, function(success, error) {
                if (success) {
                    TWC.ui.showToast('设置已保存', 'success');
                    TWC.ui.hideModal();
                    TWC.ui.refreshData(true);
                    TWC.ui.updateAltSpeedButton();
                    TWC.ui.updateAltSpeedStatus();
                } else {
                    TWC.ui.showToast('保存失败: ' + (error || ''), 'error');
                }
            });
        });

        $('#config-reset-btn').on('click', function() {
            _renderTab(currentTab, items, data);
        });
    }

    function _renderTab(tabId, items, data) {
        var tabItems = items[tabId];
        if (!tabItems) {
            $('#config-content').html('<div class="twc-empty">无配置项</div>');
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
                        html += '<input type="password" class="twc-input" data-config-key="' + item.key + '" value="" placeholder="输入新密码" />';
                        break;
                    case 'folder':
                    case 'file':
                        html += '<input type="text" class="twc-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(val || '') + '" />';
                        break;
                    case 'select':
                        html += '<select class="twc-select" data-config-key="' + item.key + '">';
                        for (var o = 0; o < item.options.length; o++) {
                            html += '<option value="' + item.options[o].value + '"' + (val === item.options[o].value ? ' selected' : '') + '>' + item.options[o].label + '</option>';
                        }
                        html += '</select>';
                        break;
                    case 'time':
                        var timeStr = TWC.utils.parseAltSpeedTime(val);
                        html += '<input type="time" class="twc-input" data-config-key="' + item.key + '" value="' + timeStr + '" />';
                        break;
                    case 'daymask':
                        html += '<input type="number" class="twc-input" data-config-key="' + item.key + '" value="' + (val || 127) + '" min="0" max="127" />' +
                            '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + TWC.utils.getDayMaskText(val || 127) + '</div>';
                        break;
                    case 'textarea':
                        html += '<textarea class="twc-input" data-config-key="' + item.key + '" rows="6" style="height:auto;resize:vertical;font-family:var(--font-mono)">' + TWC.utils.escapeHtml(val || '') + '</textarea>';
                        break;
                    case 'readonly':
                        html += '<input type="text" class="twc-input" data-config-key="' + item.key + '" value="' + TWC.utils.escapeHtml(String(val || '-')) + '" readonly style="opacity:0.7" />';
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
            html += '<div style="margin-top:12px">' +
                '<button class="twc-btn" id="update-blocklist-btn">更新屏蔽列表</button>' +
                '<button class="twc-btn" id="test-port-btn" style="margin-left:8px">测试端口</button>' +
                '<span id="port-test-result" style="margin-left:8px;font-size:12px"></span></div>';
        }

        $('#config-content').html(html);

        $('.twc-toggle[data-config-key]').on('click', function() {
            $(this).toggleClass('active');
        });

        if (tabId === 'blocklist') {
            $('#update-blocklist-btn').on('click', function() {
                TWC.config.updateBlocklist(function(size, success) {
                    if (success) {
                        TWC.ui.showToast('屏蔽列表已更新，共 ' + size + ' 条规则', 'success');
                        $('[data-config-key="blocklist-size"]').val(size);
                    } else {
                        TWC.ui.showToast('更新失败', 'error');
                    }
                });
            });

            $('#test-port-btn').on('click', function() {
                $('#port-test-result').text('测试中...').removeClass('text-success text-danger');
                TWC.config.checkPort(function(isOpen, success) {
                    if (success) {
                        $('#port-test-result').text(isOpen ? '端口开放 ✓' : '端口关闭 ✕')
                            .addClass(isOpen ? 'text-success' : 'text-danger');
                    } else {
                        $('#port-test-result').text('测试失败').addClass('text-danger');
                    }
                });
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
            '<input type="text" class="twc-input" id="label-add-input" placeholder="输入新标签名称" style="flex:1" />' +
            '<button class="twc-btn primary" id="label-add-btn" style="white-space:nowrap">添加</button>' +
            '</div>';

        if (allLabels.length === 0) {
            html += '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">暂无标签，请添加</div>';
        } else {
            html += '<div class="twc-label-manager-list">';
            for (var k = 0; k < allLabels.length; k++) {
                var isFromTorrent = torrentLabels.indexOf(allLabels[k]) !== -1;
                var isSaved = savedLabels.indexOf(allLabels[k]) !== -1;
                var source = isFromTorrent && isSaved ? '任务+自定义' : (isFromTorrent ? '来自任务' : '自定义');
                html += '<div class="twc-label-manager-item" data-label="' + TWC.utils.escapeHtml(allLabels[k]) + '">' +
                    '<span class="twc-label-manager-name">' + TWC.utils.escapeHtml(allLabels[k]) + '</span>' +
                    '<span class="twc-label-manager-source">' + source + '</span>' +
                    '<button class="twc-btn twc-btn-sm twc-label-manager-delete" data-label="' + TWC.utils.escapeHtml(allLabels[k]) + '" title="删除">&times;</button>' +
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
            if (!name) { TWC.ui.showToast('请输入标签名称', 'warning'); return; }
            var savedLabels = TWC.utils.storageGet('twc-label-library', []);
            if (savedLabels.indexOf(name) !== -1) { TWC.ui.showToast('标签已存在', 'warning'); return; }
            savedLabels.push(name);
            savedLabels.sort();
            TWC.utils.storageSet('twc-label-library', savedLabels);
            $('#label-add-input').val('');
            refreshLabelManager();
            TWC.ui.showToast('标签已添加: ' + name, 'success');
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
                TWC.ui.showToast('标签已删除: ' + name, 'success');
            }
            refreshLabelManager();
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
                    if (item.type === 'readonly') continue;

                    var $el = $('[data-config-key="' + item.key + '"]');
                    if ($el.length === 0) continue;

                    if (item.type === 'toggle') {
                        props[item.key] = $el.hasClass('active');
                    } else if (item.type === 'time') {
                        props[item.key] = TWC.utils.timeToMinutes($el.val());
                    } else if (item.type === 'number' || item.type === 'daymask') {
                        var numVal = $el.val();
                        if (item.step && item.step.indexOf('.') >= 0) {
                            props[item.key] = parseFloat(numVal) || 0;
                        } else {
                            props[item.key] = parseInt(numVal) || 0;
                        }
                    } else if (item.type === 'password') {
                        var pwd = $el.val();
                        if (pwd) props[item.key] = pwd;
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
