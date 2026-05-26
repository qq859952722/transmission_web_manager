import { Component, Show } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput, SettingsSwitch, SettingsSelect } from './SettingsUI';

interface NetworkTabProps { peerPort: () => number; setPeerPort: (v: number) => void; peerPortRandomOnStart: () => boolean; setPeerPortRandomOnStart: (v: boolean) => void; portForwardingEnabled: () => boolean; setPortForwardingEnabled: (v: boolean) => void; dhtEnabled: () => boolean; setDhtEnabled: (v: boolean) => void; pexEnabled: () => boolean; setPexEnabled: (v: boolean) => void; lpdEnabled: () => boolean; setLpdEnabled: (v: boolean) => void; utpEnabled: () => boolean; setUtpEnabled: (v: boolean) => void; encryption: () => string; setEncryption: (v: string) => void; antiBruteForceEnabled: () => boolean; setAntiBruteForceEnabled: (v: boolean) => void; antiBruteForceThreshold: () => number; setAntiBruteForceThreshold: (v: number) => void; preferredTransports: () => string; setPreferredTransports: (v: string) => void; sequentialDownload: () => boolean; setSequentialDownload: (v: boolean) => void; }

export const NetworkTab: Component<NetworkTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.port_settings')}>
        <SettingsRow label={t('dialog.settings.listen_port')}>
          <SettingsInput type="number" class="w-24" value={props.peerPort()} onInput={(e) => props.setPeerPort(Number(e.currentTarget.value))} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.random_port')} desc={t('dialog.settings.random_port_desc')}>
          <SettingsSwitch checked={props.peerPortRandomOnStart()} onCheckedChange={props.setPeerPortRandomOnStart} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.port_forwarding')} desc={t('dialog.settings.port_forwarding_desc')}>
          <SettingsSwitch checked={props.portForwardingEnabled()} onCheckedChange={props.setPortForwardingEnabled} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.protocols')}>
        <SettingsRow label={t('dialog.settings.dht')} desc={t('dialog.settings.dht_desc')}>
          <SettingsSwitch checked={props.dhtEnabled()} onCheckedChange={props.setDhtEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.pex')} desc={t('dialog.settings.pex_desc')}>
          <SettingsSwitch checked={props.pexEnabled()} onCheckedChange={props.setPexEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.lpd')} desc={t('dialog.settings.lpd_desc')}>
          <SettingsSwitch checked={props.lpdEnabled()} onCheckedChange={props.setLpdEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.utp')} desc="Enable Micro Transport Protocol (uTP)">
          <SettingsSwitch checked={props.utpEnabled()} onCheckedChange={props.setUtpEnabled} />
        </SettingsRow>
        
        <SettingsRow label={t('detail.peers.encryption')}>
          <SettingsSelect
            class="w-40"
            value={props.encryption()}
            onChange={(val) => props.setEncryption(String(val))}
            options={[
              { value: "tolerated", label: t('dialog.settings.enc_tolerated') },
              { value: "preferred", label: t('dialog.settings.enc_preferred') },
              { value: "required", label: t('dialog.settings.enc_required') }
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.security')}>
        <SettingsRow label={t('dialog.settings.anti_brute')} desc={t('dialog.settings.anti_brute_desc')}>
          <div class="flex items-center gap-4">
            <Show when={props.antiBruteForceEnabled()}>
              <SettingsInput type="number" class="w-16" value={props.antiBruteForceThreshold()} onInput={(e) => props.setAntiBruteForceThreshold(Number(e.currentTarget.value))} />
            </Show>
            <SettingsSwitch checked={props.antiBruteForceEnabled()} onCheckedChange={props.setAntiBruteForceEnabled} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.transport_pref')}>
        <SettingsRow label={t('dialog.settings.pref_transports')}>
          <SettingsSelect
            class="w-40"
            value={props.preferredTransports()}
            onChange={(val) => props.setPreferredTransports(String(val))}
            options={[
              { value: "utp,tcp", label: t('dialog.settings.pref_utp_tcp') },
              { value: "tcp,utp", label: t('dialog.settings.pref_tcp_utp') },
              { value: "utp", label: t('dialog.settings.pref_utp') },
              { value: "tcp", label: t('dialog.settings.pref_tcp') }
            ]}
          />
        </SettingsRow>
        <SettingsRow label={t('dialog.add.sequential')} desc={t('dialog.settings.sequential_desc')}>
          <SettingsSwitch checked={props.sequentialDownload()} onCheckedChange={props.setSequentialDownload} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
