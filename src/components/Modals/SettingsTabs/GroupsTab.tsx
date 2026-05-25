import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';

interface BandwidthGroup {
  name: string;
  speed_limit_down_enabled?: boolean;
  speed_limit_down?: number;
  speed_limit_up_enabled?: boolean;
  speed_limit_up?: number;
  honors_session_limits?: boolean;
  isNew?: boolean;
}

interface GroupsTabProps {
  bandwidthGroups: () => BandwidthGroup[];
  loadingGroups: () => boolean;
  editingGroup: () => BandwidthGroup | null;
  setEditingGroup: (v: BandwidthGroup | null) => void;
  groupName: () => string;
  setGroupName: (v: string) => void;
  groupDlEnabled: () => boolean;
  setGroupDlEnabled: (v: boolean) => void;
  groupDlLimit: () => number;
  setGroupDlLimit: (v: number) => void;
  groupUlEnabled: () => boolean;
  setGroupUlEnabled: (v: boolean) => void;
  groupUlLimit: () => number;
  setGroupUlLimit: (v: number) => void;
  groupHonors: () => boolean;
  setGroupHonors: (v: boolean) => void;
  onCreateGroup: () => void;
  onSaveGroup: (e: Event) => void;
  onDeleteGroup: (name: string) => void;
}

export const GroupsTab: Component<GroupsTabProps> = (props) => {
  return (
    <div class="settings-group">
      <Show
        when={props.editingGroup()}
        fallback={
          <div class="groups-manager-list">
            <div class="groups-header">
              <span class="groups-hint-text">{t('dialog.settings.groups_hint')}</span>
              <button
                type="button"
                class="trwm-btn primary"
                onClick={props.onCreateGroup}
              >
                {t('dialog.settings.group_add')}
              </button>
            </div>

            <Show when={props.loadingGroups()}>
              <div class="text-center text-secondary py-6">{t('common.loading')}</div>
            </Show>

            <Show
              when={!props.loadingGroups() && props.bandwidthGroups().length > 0}
              fallback={
                <Show when={!props.loadingGroups()}>
                  <div class="empty-list-note">{t('dialog.settings.no_groups')}</div>
                </Show>
              }
            >
              <div class="groups-cards-grid">
                <For each={props.bandwidthGroups()}>
                  {(g) => (
                    <div class="group-card">
                      <div class="group-card-header flex-row justify-between align-center">
                        <span class="group-card-title">{g.name}</span>
                        <div class="group-card-actions flex-row gap-2">
                          <button
                            type="button"
                            class="trwm-btn-sm"
                            onClick={() => props.setEditingGroup(g)}
                          >
                            {t('dialog.settings.group_edit')}
                          </button>
                          <button
                            type="button"
                            class="trwm-btn-sm danger"
                            onClick={() => props.onDeleteGroup(g.name)}
                          >
                            {t('dialog.settings.group_delete')}
                          </button>
                        </div>
                      </div>
                      <div class="group-card-body">
                        <div class="group-info-row">
                          <span>{t('dialog.settings.group_download_limit')}:</span>
                          <span class="text-mono">
                            {g.speed_limit_down_enabled
                              ? `${g.speed_limit_down} KB/s`
                              : t('dialog.settings.group_no_limit')}
                          </span>
                        </div>
                        <div class="group-info-row">
                          <span>{t('dialog.settings.group_upload_limit')}:</span>
                          <span class="text-mono">
                            {g.speed_limit_up_enabled
                              ? `${g.speed_limit_up} KB/s`
                              : t('dialog.settings.group_no_limit')}
                          </span>
                        </div>
                        <div class="group-info-row">
                          <span>{t('dialog.settings.group_honors_session')}:</span>
                          <span>{g.honors_session_limits ? '✓' : '✗'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        }
      >
        {/* Editor Sub-panel */}
        <div class="group-editor-panel">
          <h4>
            {props.editingGroup()?.isNew
              ? t('dialog.settings.group_add_title')
              : t('dialog.settings.group_edit_title', { name: props.editingGroup()?.name || '' })}
          </h4>
          <div class="form-group">
            <label>{t('dialog.settings.group_name')}</label>
            <input
              type="text"
              class={props.editingGroup()?.isNew ? '' : 'readonly-input'}
              value={props.groupName()}
              onInput={(e) => props.setGroupName(e.currentTarget.value)}
              readOnly={!props.editingGroup()?.isNew}
            />
          </div>

          <div class="form-group mt-4">
            <label>{t('dialog.settings.group_download_limit')}</label>
            <div class="flex-row align-center gap-4">
              <input
                type="checkbox"
                id="grp-dl-en"
                checked={props.groupDlEnabled()}
                onChange={(e) => props.setGroupDlEnabled(e.currentTarget.checked)}
              />
              <label for="grp-dl-en">{t('dialog.settings.dl_limit_enabled')}</label>
              <input
                type="number"
                class="w-32 text-right ml-auto"
                value={props.groupDlLimit()}
                disabled={!props.groupDlEnabled()}
                onInput={(e) => props.setGroupDlLimit(Number(e.currentTarget.value))}
              />
              <span>KB/s</span>
            </div>
          </div>

          <div class="form-group mt-4">
            <label>{t('dialog.settings.group_upload_limit')}</label>
            <div class="flex-row align-center gap-4">
              <input
                type="checkbox"
                id="grp-ul-en"
                checked={props.groupUlEnabled()}
                onChange={(e) => props.setGroupUlEnabled(e.currentTarget.checked)}
              />
              <label for="grp-ul-en">{t('dialog.settings.ul_limit_enabled')}</label>
              <input
                type="number"
                class="w-32 text-right ml-auto"
                value={props.groupUlLimit()}
                disabled={!props.groupUlEnabled()}
                onInput={(e) => props.setGroupUlLimit(Number(e.currentTarget.value))}
              />
              <span>KB/s</span>
            </div>
          </div>

          <div class="form-group flex-row align-center mt-4">
            <input
              type="checkbox"
              id="grp-honors"
              checked={props.groupHonors()}
              onChange={(e) => props.setGroupHonors(e.currentTarget.checked)}
            />
            <label for="grp-honors">{t('dialog.settings.group_honors_session')}</label>
          </div>

          <div class="flex-row gap-2 mt-6">
            <button
              type="button"
              class="trwm-btn primary"
              onClick={props.onSaveGroup}
              disabled={!props.groupName().trim()}
            >
              {t('dialog.settings.save')}
            </button>
            <button
              type="button"
              class="trwm-btn"
              onClick={() => props.setEditingGroup(null)}
            >
              {t('dialog.cancel')}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
