import { Component, Show, For } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch, SettingsButton } from './SettingsUI';

interface BandwidthGroup { name: string; speed_limit_down_enabled?: boolean; speed_limit_down?: number; speed_limit_up_enabled?: boolean; speed_limit_up?: number; honors_session_limits?: boolean; isNew?: boolean; }
interface GroupsTabProps { bandwidthGroups: () => BandwidthGroup[]; loadingGroups: () => boolean; editingGroup: () => BandwidthGroup | null; setEditingGroup: (v: BandwidthGroup | null) => void; groupName: () => string; setGroupName: (v: string) => void; groupDlEnabled: () => boolean; setGroupDlEnabled: (v: boolean) => void; groupDlLimit: () => number; setGroupDlLimit: (v: number) => void; groupUlEnabled: () => boolean; setGroupUlEnabled: (v: boolean) => void; groupUlLimit: () => number; setGroupUlLimit: (v: number) => void; groupHonors: () => boolean; setGroupHonors: (v: boolean) => void; onCreateGroup: () => void; onSaveGroup: (e: Event) => void; onDeleteGroup: (name: string) => void; }

export const GroupsTab: Component<GroupsTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <Show
        when={props.editingGroup()}
        fallback={
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between px-2">
              <span class="text-[12px] font-bold text-muted-foreground tracking-wide">{t('dialog.settings.groups_hint')}</span>
              <SettingsButton variant="primary" onClick={props.onCreateGroup}>{t('dialog.settings.group_add')}</SettingsButton>
            </div>

            <Show when={props.loadingGroups()}>
              <div class="text-center text-muted-foreground py-12 text-[13px]">{t('common.loading')}</div>
            </Show>

            <Show
              when={!props.loadingGroups() && props.bandwidthGroups().length > 0}
              fallback={<Show when={!props.loadingGroups()}><div class="text-center text-muted-foreground py-12 bg-secondary/30 rounded-xl border border-border text-[13px]">{t('dialog.settings.no_groups')}</div></Show>}
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <For each={props.bandwidthGroups()}>
                  {(g) => (
                    <div class="bg-secondary/30 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                        <span class="text-base font-bold text-foreground truncate">{g.name}</span>
                        <div class="flex items-center gap-2">
                          <SettingsButton onClick={() => props.setEditingGroup(g)}>{t('dialog.settings.group_edit')}</SettingsButton>
                          <SettingsButton variant="destructive" onClick={() => props.onDeleteGroup(g.name)}>{t('dialog.settings.group_delete')}</SettingsButton>
                        </div>
                      </div>
                      <div class="flex flex-col gap-2 text-[13px]">
                        <div class="flex items-center justify-between">
                          <span class="text-muted-foreground">{t('dialog.settings.group_download_limit')}:</span>
                          <span class="font-mono text-primary font-bold">{g.speed_limit_down_enabled ? `${g.speed_limit_down} KB/s` : t('dialog.settings.group_no_limit')}</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-muted-foreground">{t('dialog.settings.group_upload_limit')}:</span>
                          <span class="font-mono text-success font-bold">{g.speed_limit_up_enabled ? `${g.speed_limit_up} KB/s` : t('dialog.settings.group_no_limit')}</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-muted-foreground">{t('dialog.settings.group_honors_session')}:</span>
                          <span class="font-bold">{g.honors_session_limits ? t('common.yes') : t('common.no')}</span>
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
        <div class="flex flex-col gap-6 max-w-2xl mx-auto">
          <div class="flex items-center gap-4 border-b border-border/50 pb-4">
            <button type="button" class="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted" onClick={() => props.setEditingGroup(null)}>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 class="text-lg font-bold text-foreground m-0">
              {props.editingGroup()?.isNew ? t('dialog.settings.group_add_title') : t('dialog.settings.group_edit_title', { name: props.editingGroup()?.name || '' })}
            </h3>
          </div>

          <SettingsSection>
            <SettingsRow label={t('dialog.settings.group_name')}>
              <SettingsInput type="text" class="w-48 text-left" value={props.groupName()} onInput={(e) => props.setGroupName(e.currentTarget.value)} disabled={!props.editingGroup()?.isNew} />
            </SettingsRow>
            
            <SettingsRow label={t('dialog.settings.group_download_limit')}>
              <div class="flex items-center gap-4">
                <Show when={props.groupDlEnabled()}>
                  <div class="flex items-center gap-2">
                    <SettingsInput type="number" class="w-24" value={props.groupDlLimit()} onInput={(e) => props.setGroupDlLimit(Number(e.currentTarget.value))} />
                    <span class="text-xs text-muted-foreground font-mono">KB/s</span>
                  </div>
                </Show>
                <SettingsSwitch checked={props.groupDlEnabled()} onCheckedChange={props.setGroupDlEnabled} />
              </div>
            </SettingsRow>

            <SettingsRow label={t('dialog.settings.group_upload_limit')}>
              <div class="flex items-center gap-4">
                <Show when={props.groupUlEnabled()}>
                  <div class="flex items-center gap-2">
                    <SettingsInput type="number" class="w-24" value={props.groupUlLimit()} onInput={(e) => props.setGroupUlLimit(Number(e.currentTarget.value))} />
                    <span class="text-xs text-muted-foreground font-mono">KB/s</span>
                  </div>
                </Show>
                <SettingsSwitch checked={props.groupUlEnabled()} onCheckedChange={props.setGroupUlEnabled} />
              </div>
            </SettingsRow>

            <SettingsRow label={t('dialog.settings.group_honors_session')} desc={t('dialog.settings.group_honors_session_desc')}>
              <SettingsSwitch checked={props.groupHonors()} onCheckedChange={props.setGroupHonors} />
            </SettingsRow>
          </SettingsSection>

          <div class="flex justify-end gap-3">
            <SettingsButton onClick={() => props.setEditingGroup(null)}>{t('dialog.cancel')}</SettingsButton>
            <SettingsButton variant="primary" onClick={props.onSaveGroup} disabled={!props.groupName().trim()}>{t('dialog.settings.save')}</SettingsButton>
          </div>
        </div>
      </Show>
    </div>
  );
};
