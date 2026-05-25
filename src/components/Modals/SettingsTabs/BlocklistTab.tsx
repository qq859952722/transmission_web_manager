import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';

interface BlocklistTabProps {
  blocklistEnabled: () => boolean;
  setBlocklistEnabled: (v: boolean) => void;
  blocklistUrl: () => string;
  setBlocklistUrl: (v: string) => void;
  blocklistSize: () => number;
  onUpdateBlocklist: () => void;
  rpcVersion: () => number;
  ipProtocol: () => string;
  setIpProtocol: (v: string) => void;
  portTesting: () => boolean;
  portTestResult: () => string;
  portTestClass: () => string;
  onTestPort: () => void;
}

export const BlocklistTab: Component<BlocklistTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('dialog.settings.blocklist')}</h4>
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="bl-en"
              checked={props.blocklistEnabled()}
              onChange={(e) => props.setBlocklistEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.enabled')}</span>
          </label>
        </div>
        <div class="form-group">
          <label>{t('dialog.settings.blocklist_url')}</label>
          <input
            type="text"
            value={props.blocklistUrl()}
            onInput={(e) => props.setBlocklistUrl(e.currentTarget.value)}
            disabled={!props.blocklistEnabled()}
          />
        </div>
        <div class="form-group">
          <span class="text-sm text-secondary">
            {t('dialog.settings.rules_count')}:{' '}
            <strong class="text-mono text-primary">{props.blocklistSize()}</strong>
          </span>
        </div>
        <div class="flex-row gap-2">
          <button
            type="button"
            class="trwm-btn"
            onClick={props.onUpdateBlocklist}
            disabled={!props.blocklistEnabled()}
          >
            {t('dialog.settings.update_blocklist')}
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.test_port')}</h4>
        <div class="form-row flex-wrap gap-4">
          <Show when={props.rpcVersion() >= 19}>
            <div class="form-row gap-2">
              <label class="text-sm text-secondary">{t('dialog.settings.ip_protocol')}:</label>
              <select
                value={props.ipProtocol()}
                onChange={(e) => props.setIpProtocol(e.currentTarget.value)}
                class="p-1 rounded"
              >
                <option value="">{t('dialog.settings.ip_protocol_auto')}</option>
                <option value="ipv4">IPv4</option>
                <option value="ipv6">IPv6</option>
              </select>
            </div>
          </Show>

          <button
            type="button"
            class="trwm-btn"
            onClick={props.onTestPort}
            disabled={props.portTesting()}
          >
            {props.portTesting() ? t('dialog.settings.testing') : t('dialog.settings.test_port')}
          </button>

          <Show when={props.portTestResult()}>
            <span class={`port-result-badge ${props.portTestClass()}`}>
              {props.portTestResult()}
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
};
