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
        <SettingsRow label={t('dialog.settings.random_port')} desc="Randomize port on startup">
          <SettingsSwitch checked={props.peerPortRandomOnStart()} onCheckedChange={props.setPeerPortRandomOnStart} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.port_forwarding')} desc="Enable UPnP/NAT-PMP port forwarding">
          <SettingsSwitch checked={props.portForwardingEnabled()} onCheckedChange={props.setPortForwardingEnabled} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.protocols')}>
        <SettingsRow label={t('dialog.settings.dht')} desc="Enable Distributed Hash Table (DHT)">
          <SettingsSwitch checked={props.dhtEnabled()} onCheckedChange={props.setDhtEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.pex')} desc="Enable Peer Exchange (PEX)">
          <SettingsSwitch checked={props.pexEnabled()} onCheckedChange={props.setPexEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.lpd')} desc="Enable Local Peer Discovery (LPD)">
          <SettingsSwitch checked={props.lpdEnabled()} onCheckedChange={props.setLpdEnabled} />
        </SettingsRow>
        <SettingsRow label={t('dialog.settings.utp')} desc="Enable Micro Transport Protocol (uTP)">
          <SettingsSwitch checked={props.utpEnabled()} onCheckedChange={props.setUtpEnabled} />
        </SettingsRow>
        
        <SettingsRow label={t('detail.peers.encryption')}>
          <SettingsSelect class="w-40" value={props.encryption()} onChange={(e) => props.setEncryption(e.currentTarget.value)}>
            <option value="required">{t('dialog.settings.enc_required')}</option>
            <option value="preferred">{t('dialog.settings.enc_preferred')}</option>
            <option value="tolerated">{t('dialog.settings.enc_tolerated')}</option>
          </SettingsSelect>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('dialog.settings.security')}>
        <SettingsRow label={t('dialog.settings.anti_brute')} desc="Enable anti brute force protection">
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
          <SettingsSelect class="w-40" value={props.preferredTransports()} onChange={(e) => props.setPreferredTransports(e.currentTarget.value)}>
            <option value="utp,tcp">{t('dialog.settings.pref_utp_tcp')}</option>
            <option value="tcp,utp">{t('dialog.settings.pref_tcp_utp')}</option>
            <option value="utp">{t('dialog.settings.pref_utp')}</option>
            <option value="tcp">{t('dialog.settings.pref_tcp')}</option>
          </SettingsSelect>
        </SettingsRow>
        <SettingsRow label={t('dialog.add.sequential')} desc="Download pieces in order">
          <SettingsSwitch checked={props.sequentialDownload()} onCheckedChange={props.setSequentialDownload} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
