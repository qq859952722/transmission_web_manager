import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch, SettingsSelect, SettingsButton } from './SettingsUI';

interface BlocklistTabProps { blocklistEnabled: () => boolean; setBlocklistEnabled: (v: boolean) => void; blocklistUrl: () => string; setBlocklistUrl: (v: string) => void; blocklistSize: () => number; onUpdateBlocklist: () => void; rpcVersion: () => number; ipProtocol: () => string; setIpProtocol: (v: string) => void; portTesting: () => boolean; portTestResult: () => string; portTestClass: () => string; onTestPort: () => void; }

export const BlocklistTab: Component<BlocklistTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.blocklist')}>
        <SettingsRow label={t('dialog.settings.enabled')} desc={t('dialog.settings.blocklist_desc')}>
          <SettingsSwitch checked={props.blocklistEnabled()} onCheckedChange={props.setBlocklistEnabled} />
        </SettingsRow>
        
        <SettingsRow label={t('dialog.settings.blocklist_url')}>
          <SettingsInput type="text" class="w-64 text-left" value={props.blocklistUrl()} onInput={(e) => props.setBlocklistUrl(e.currentTarget.value)} disabled={!props.blocklistEnabled()} />
        </SettingsRow>

        <SettingsRow label={t('dialog.settings.rules_count')} desc={t('dialog.settings.rules_count_desc')}>
          <span class="font-mono text-primary font-bold">{props.blocklistSize()}</span>
        </SettingsRow>

        <SettingsRow label={t('dialog.settings.action')} desc={t('dialog.settings.update_blocklist_desc')}>
          <SettingsButton variant="primary" onClick={props.onUpdateBlocklist} disabled={!props.blocklistEnabled()}>
            {t('dialog.settings.update_blocklist')}
          </SettingsButton>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.test_port')}>
        <Show when={props.rpcVersion() >= 19}>
          <SettingsRow label={t('dialog.settings.ip_protocol')}>
            <SettingsSelect
              class="w-32"
              value={props.ipProtocol()}
              onChange={(val) => props.setIpProtocol(String(val))}
              options={[
                { value: "", label: t('dialog.settings.ip_protocol_auto') },
                { value: "ipv4", label: "IPv4" },
                { value: "ipv6", label: "IPv6" }
              ]}
            />
          </SettingsRow>
        </Show>

        <SettingsRow label={t('dialog.settings.test')} desc={t('dialog.settings.test_port_desc')}>
          <div class="flex items-center gap-3">
            <Show when={props.portTestResult()}>
              <span class={`text-[11px] font-bold px-2 py-1 rounded-md ${props.portTestClass() === 'stat-port-open' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                {props.portTestResult()}
              </span>
            </Show>
            <SettingsButton variant="outline" onClick={props.onTestPort} disabled={props.portTesting()}>
              {props.portTesting() ? t('dialog.settings.testing') : t('dialog.settings.test_port')}
            </SettingsButton>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
