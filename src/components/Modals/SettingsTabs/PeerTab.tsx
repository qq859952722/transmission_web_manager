import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';

interface PeerTabProps {
  peerLimitGlobal: () => number;
  setPeerLimitGlobal: (v: number) => void;
  peerLimitPerTorrent: () => number;
  setPeerLimitPerTorrent: (v: number) => void;
}

export const PeerTab: Component<PeerTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="form-grid">
        <div class="form-group">
          <label>{t('dialog.settings.global_peer_limit')}</label>
          <input
            type="number"
            value={props.peerLimitGlobal()}
            onInput={(e) => props.setPeerLimitGlobal(Number(e.currentTarget.value))}
          />
        </div>
        <div class="form-group">
          <label>{t('mobile.max_peers')}</label>
          <input
            type="number"
            value={props.peerLimitPerTorrent()}
            onInput={(e) => props.setPeerLimitPerTorrent(Number(e.currentTarget.value))}
          />
        </div>
      </div>
    </div>
  );
};
