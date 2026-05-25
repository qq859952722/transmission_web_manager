import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';

interface RpcTabProps {
  rpcVersion: () => number;
  rpcVersionSemver: () => string;
  rpcVersionMinimum: () => number;
  sessionId: () => string;
}

export const RpcTab: Component<RpcTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="settings-section">
        <h4>RPC</h4>
        <div class="form-group">
          <label>{t('dialog.about.rpc_version')}</label>
          <input type="text" class="readonly-input" readOnly value={props.rpcVersion()} />
        </div>
        <div class="form-group">
          <label>{t('dialog.settings.rpc_semver')}</label>
          <input type="text" class="readonly-input" readOnly value={props.rpcVersionSemver() || '-'} />
        </div>
        <div class="form-group">
          <label>{t('dialog.settings.rpc_min_version')}</label>
          <input type="text" class="readonly-input" readOnly value={props.rpcVersionMinimum()} />
        </div>
        <div class="form-group">
          <label>{t('dialog.settings.session_id')}</label>
          <input type="text" class="readonly-input text-mono text-xs" readOnly value={props.sessionId()} />
        </div>
      </div>
    </div>
  );
};
