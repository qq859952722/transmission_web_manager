import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput } from './SettingsUI';

interface RpcTabProps {
  rpcVersion: () => number;
  rpcVersionSemver: () => string;
  rpcVersionMinimum: () => number;
  sessionId: () => string;
}

export const RpcTab: Component<RpcTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.rpc_info')}>
        <SettingsRow label={t('dialog.about.rpc_version')}>
          <SettingsInput type="text" readOnly value={props.rpcVersion()} class="w-48 text-muted-foreground cursor-default bg-secondary/50 border-transparent focus:ring-0" />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.rpc_semver')}>
          <SettingsInput type="text" readOnly value={props.rpcVersionSemver() || '-'} class="w-48 text-muted-foreground cursor-default bg-secondary/50 border-transparent focus:ring-0" />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.rpc_min_version')}>
          <SettingsInput type="text" readOnly value={props.rpcVersionMinimum()} class="w-48 text-muted-foreground cursor-default bg-secondary/50 border-transparent focus:ring-0" />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.session_id')}>
          <SettingsInput type="text" readOnly value={props.sessionId()} class="w-64 font-mono text-[11px] text-muted-foreground cursor-default bg-secondary/50 border-transparent focus:ring-0" />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
