import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';
import { SettingsSection, SettingsRow, SettingsInput } from './SettingsUI';

interface PeerTabProps {
  peerLimitGlobal: () => number;
  setPeerLimitGlobal: (v: number) => void;
  peerLimitPerTorrent: () => number;
  setPeerLimitPerTorrent: (v: number) => void;
}

export const PeerTab: Component<PeerTabProps> = (props) => {
  return (
    <div class="animate-in fade-in duration-300">
      <SettingsSection title={t('dialog.settings.conn_limits')}>
        <SettingsRow label={t('dialog.settings.global_peer_limit')} desc="Maximum total number of peers across all torrents">
          <SettingsInput
            type="number"
            class="w-24"
            value={props.peerLimitGlobal()}
            onInput={(e) => props.setPeerLimitGlobal(Number(e.currentTarget.value))}
          />
        </SettingsRow>
        <SettingsRow label={t('mobile.max_peers')} desc="Maximum number of peers for a single torrent">
          <SettingsInput
            type="number"
            class="w-24"
            value={props.peerLimitPerTorrent()}
            onInput={(e) => props.setPeerLimitPerTorrent(Number(e.currentTarget.value))}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
