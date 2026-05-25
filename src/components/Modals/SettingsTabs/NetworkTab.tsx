import { Component } from 'solid-js';
import { t } from '../../../utils/i18n';

interface NetworkTabProps {
  peerPort: () => number;
  setPeerPort: (v: number) => void;
  peerPortRandomOnStart: () => boolean;
  setPeerPortRandomOnStart: (v: boolean) => void;
  portForwardingEnabled: () => boolean;
  setPortForwardingEnabled: (v: boolean) => void;
  dhtEnabled: () => boolean;
  setDhtEnabled: (v: boolean) => void;
  pexEnabled: () => boolean;
  setPexEnabled: (v: boolean) => void;
  lpdEnabled: () => boolean;
  setLpdEnabled: (v: boolean) => void;
  utpEnabled: () => boolean;
  setUtpEnabled: (v: boolean) => void;
  encryption: () => string;
  setEncryption: (v: string) => void;
  antiBruteForceEnabled: () => boolean;
  setAntiBruteForceEnabled: (v: boolean) => void;
  antiBruteForceThreshold: () => number;
  setAntiBruteForceThreshold: (v: number) => void;
  preferredTransports: () => string;
  setPreferredTransports: (v: string) => void;
  sequentialDownload: () => boolean;
  setSequentialDownload: (v: boolean) => void;
}

export const NetworkTab: Component<NetworkTabProps> = (props) => {
  return (
    <div class="settings-group">
      <div class="settings-section">
        <h4>{t('dialog.settings.port_settings')}</h4>
        <div class="form-row">
          <div class="form-group flex-1 min-w-[120px]">
            <label>{t('dialog.settings.listen_port')}</label>
            <input
              type="number"
              value={props.peerPort()}
              onInput={(e) => props.setPeerPort(Number(e.currentTarget.value))}
            />
          </div>
          <label class="checkbox-label mt-5">
            <input
              type="checkbox"
              id="rand-port"
              checked={props.peerPortRandomOnStart()}
              onChange={(e) => props.setPeerPortRandomOnStart(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.random_port')}</span>
          </label>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="port-fwd"
              checked={props.portForwardingEnabled()}
              onChange={(e) => props.setPortForwardingEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.port_forwarding')}</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.protocols')}</h4>
        <div class="checkbox-grid-2x2">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.dhtEnabled()}
              onChange={(e) => props.setDhtEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.dht')}</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.pexEnabled()}
              onChange={(e) => props.setPexEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.pex')}</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.lpdEnabled()}
              onChange={(e) => props.setLpdEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.lpd')}</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={props.utpEnabled()}
              onChange={(e) => props.setUtpEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.utp')}</span>
          </label>
        </div>

        <div class="form-group">
          <label>{t('detail.peers.encryption')}</label>
          <select
            value={props.encryption()}
            onChange={(e) => props.setEncryption(e.currentTarget.value)}
          >
            <option value="required">{t('dialog.settings.enc_required')}</option>
            <option value="preferred">{t('dialog.settings.enc_preferred')}</option>
            <option value="tolerated">{t('dialog.settings.enc_tolerated')}</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.security')}</h4>
        <div class="form-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="brute-en"
              checked={props.antiBruteForceEnabled()}
              onChange={(e) => props.setAntiBruteForceEnabled(e.currentTarget.checked)}
            />
            <span>{t('dialog.settings.anti_brute')}</span>
          </label>
          <input
            type="number"
            class="w-24 text-right"
            disabled={!props.antiBruteForceEnabled()}
            value={props.antiBruteForceThreshold()}
            onInput={(e) => props.setAntiBruteForceThreshold(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <div class="settings-section">
        <h4>{t('dialog.settings.transport_pref')}</h4>
        <div class="form-group">
          <label>{t('dialog.settings.pref_transports')}</label>
          <select
            value={props.preferredTransports()}
            onChange={(e) => props.setPreferredTransports(e.currentTarget.value)}
          >
            <option value="utp,tcp">{t('dialog.settings.pref_utp_tcp')}</option>
            <option value="tcp,utp">{t('dialog.settings.pref_tcp_utp')}</option>
            <option value="utp">{t('dialog.settings.pref_utp')}</option>
            <option value="tcp">{t('dialog.settings.pref_tcp')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="seq-dl"
              checked={props.sequentialDownload()}
              onChange={(e) => props.setSequentialDownload(e.currentTarget.checked)}
            />
            <span>{t('dialog.add.sequential')}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
