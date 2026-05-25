import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent, Peer } from '../../types/transmission';
import { formatBytes, formatSpeed, formatPercent } from '../../utils/format';
import { t } from '../../utils/i18n';
import * as geoip from '../../utils/geoip';
import './PeersTab.css';

const FLAG_DESCRIPTIONS: Record<string, string> = {
  'D': t('detail.peers.flag_D'),
  'd': t('detail.peers.flag_d'),
  'U': t('detail.peers.flag_U'),
  'u': t('detail.peers.flag_u'),
  'K': t('detail.peers.flag_K'),
  '?': t('detail.peers.flag_?'),
  'E': t('detail.peers.flag_E'),
  'H': t('detail.peers.flag_H'),
  'X': t('detail.peers.flag_X'),
  'I': t('detail.peers.flag_I'),
  'T': t('detail.peers.flag_T'),
  'L': t('detail.peers.flag_L'),
  'S': t('detail.peers.flag_S'),
};

function buildFlagTooltip(flagStr: string): string {
  if (!flagStr) return '';
  const lines: string[] = [];
  for (const ch of flagStr) {
    const desc = FLAG_DESCRIPTIONS[ch];
    if (desc) {
      lines.push(`${ch}: ${desc}`);
    }
  }
  return lines.join('\n');
}

function truncateClient(name: string | undefined, maxLen: number): string {
  if (!name) return '-';
  return name.length > maxLen ? name.substring(0, maxLen) + '…' : name;
}

const PeerDetailModal: Component<{ peer: Peer; onClose: () => void }> = (props) => {
  const handleOverlayClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('peer-detail-overlay')) {
      props.onClose();
    }
  };

  return (
    <div class="peer-detail-overlay" onClick={handleOverlayClick}>
      <div class="peer-detail-modal">
        <div class="peer-detail-header">
          <span class="peer-detail-title">{props.peer.address}</span>
          <button class="peer-detail-close" onClick={props.onClose}>×</button>
        </div>
        <div class="peer-detail-body">
          <div class="peer-detail-section">
            <div class="peer-detail-section-title">{t('detail.peers.detail_connection')}</div>
            <div class="peer-detail-grid">
              <span class="detail-label">{t('detail.peers.port')}</span>
              <span class="detail-value text-mono">{props.peer.port}</span>
              <span class="detail-label">{t('detail.peers.protocol')}</span>
              <span class="detail-value text-mono">{props.peer.is_utp ? 'uTP' : 'TCP'}</span>
              <span class="detail-label">{t('detail.peers.encryption')}</span>
              <span class="detail-value">{props.peer.is_encrypted ? '✔' : '✘'}</span>
              <span class="detail-label">{t('detail.peers.detail_incoming')}</span>
              <span class="detail-value">{props.peer.is_incoming ? '✔' : '✘'}</span>
            </div>
          </div>

          <div class="peer-detail-section">
            <div class="peer-detail-section-title">{t('detail.peers.detail_transfer')}</div>
            <div class="peer-detail-grid">
              <span class="detail-label">{t('detail.peers.progress')}</span>
              <span class="detail-value text-mono">{formatPercent(props.peer.progress)}</span>
              <span class="detail-label">{t('detail.peers.rate_to_client')}</span>
              <span class="detail-value text-mono active-download">{props.peer.rate_to_client > 0 ? formatSpeed(props.peer.rate_to_client) : '-'}</span>
              <span class="detail-label">{t('detail.peers.rate_to_peer')}</span>
              <span class="detail-value text-mono active-upload">{props.peer.rate_to_peer > 0 ? formatSpeed(props.peer.rate_to_peer) : '-'}</span>
              <span class="detail-label">{t('detail.peers.downloaded')}</span>
              <span class="detail-value text-mono">{props.peer.client_is_choked ? '-' : formatBytes(props.peer.bytes_to_client ?? 0)}</span>
              <span class="detail-label">{t('detail.peers.uploaded')}</span>
              <span class="detail-value text-mono">{formatBytes(props.peer.bytes_to_peer ?? 0)}</span>
              <span class="detail-label">{t('detail.peers.detail_downloading')}</span>
              <span class="detail-value">{props.peer.is_downloading_from ? '✔' : '✘'}</span>
              <span class="detail-label">{t('detail.peers.detail_uploading')}</span>
              <span class="detail-value">{props.peer.is_uploading_to ? '✔' : '✘'}</span>
            </div>
          </div>

          <div class="peer-detail-section">
            <div class="peer-detail-section-title">{t('detail.peers.detail_choking')}</div>
            <div class="peer-detail-grid">
              <span class="detail-label">{t('detail.peers.detail_client_choked')}</span>
              <span class="detail-value">{props.peer.client_is_choked ? '✔' : '✘'}</span>
              <span class="detail-label">{t('detail.peers.detail_client_interested')}</span>
              <span class="detail-value">{props.peer.client_is_interested ? '✔' : '✘'}</span>
              <span class="detail-label">{t('detail.peers.detail_peer_choked')}</span>
              <span class="detail-value">{props.peer.peer_is_choked ? '✔' : '✘'}</span>
              <span class="detail-label">{t('detail.peers.detail_peer_interested')}</span>
              <span class="detail-value">{props.peer.peer_is_interested ? '✔' : '✘'}</span>
            </div>
          </div>

          <div class="peer-detail-section">
            <div class="peer-detail-section-title">{t('detail.peers.detail_client')}</div>
            <div class="peer-detail-grid">
              <span class="detail-label">{t('detail.peers.client')}</span>
              <span class="detail-value selectable-text">{props.peer.client_name || '-'}</span>
              <span class="detail-label">{t('detail.peers.flags')}</span>
              <span class="detail-value text-mono">{props.peer.flag_str}</span>
              <span class="detail-label">Peer ID</span>
              <span class="detail-value text-mono selectable-text">{props.peer.peer_id || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PeersTab: Component<{ torrent: Torrent }> = (props) => {
  const [showLegend, setShowLegend] = createSignal(false);
  const [showSources, setShowSources] = createSignal(false);
  const [detailPeer, setDetailPeer] = createSignal<Peer | null>(null);

  const legends = [
    { key: 'D', desc: t('detail.peers.flag_D') },
    { key: 'd', desc: t('detail.peers.flag_d') },
    { key: 'U', desc: t('detail.peers.flag_U') },
    { key: 'u', desc: t('detail.peers.flag_u') },
    { key: 'K', desc: t('detail.peers.flag_K') },
    { key: '? ', desc: t('detail.peers.flag_?') },
    { key: 'E', desc: t('detail.peers.flag_E') },
    { key: 'H', desc: t('detail.peers.flag_H') },
    { key: 'X', desc: t('detail.peers.flag_X') },
    { key: 'I', desc: t('detail.peers.flag_I') },
    { key: 'T', desc: t('detail.peers.flag_T') },
    { key: 'L', desc: t('detail.peers.flag_L') },
    { key: 'S', desc: t('detail.peers.flag_S') },
  ];

  const COLSPAN = 11;

  return (
    <div class="trwm-peers-tab">
      <div class="peers-table-container">
        <table class="peers-table">
          <thead>
            <tr>
              <th>{t('detail.peers.country')}</th>
              <th>{t('detail.peers.address')}</th>
              <th>{t('detail.peers.port')}</th>
              <th>{t('detail.peers.client')}</th>
              <th>{t('detail.peers.progress')}</th>
              <th>{t('detail.peers.rate_dl')}</th>
              <th>{t('detail.peers.rate_ul')}</th>
              <th>{t('detail.peers.downloaded')}</th>
              <th>{t('detail.peers.uploaded')}</th>
              <th>{t('detail.peers.protocol')}</th>
              <th>{t('detail.peers.flags')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <Show
              when={props.torrent.peers && props.torrent.peers.length > 0}
              fallback={
                <tr>
                  <td colspan={COLSPAN} class="empty-row">
                    {t('detail.peers.empty')}
                  </td>
                </tr>
              }
            >
              <For each={props.torrent.peers}>
                {(peer) => (
                  <tr>
                    <td innerHTML={geoip.getCountryDisplayHtml(peer.address)} />
                    <td class="text-mono selectable-text">{peer.address}</td>
                    <td class="text-mono text-center">{peer.port}</td>
                    <td class="selectable-text" title={peer.client_name || ''}>
                      {truncateClient(peer.client_name, 20)}
                    </td>
                    <td>
                      <div class="peer-progress-container">
                        <div class="peer-progress-bar">
                          <div
                            class="peer-progress-fill"
                            style={{
                              width: `${peer.progress * 100}%`,
                              'background-color': 'var(--color-success-500)',
                            }}
                          />
                        </div>
                        <span class="peer-progress-text text-mono">
                          {formatPercent(peer.progress)}
                        </span>
                      </div>
                    </td>
                    <td class="text-mono text-right active-download">
                      {peer.rate_to_client > 0 ? formatSpeed(peer.rate_to_client) : '-'}
                    </td>
                    <td class="text-mono text-right active-upload">
                      {peer.rate_to_peer > 0 ? formatSpeed(peer.rate_to_peer) : '-'}
                    </td>
                    <td class="text-mono text-right">
                      {peer.client_is_choked ? '-' : formatBytes(peer.bytes_to_client ?? 0)}
                    </td>
                    <td class="text-mono text-right">
                      {formatBytes(peer.bytes_to_peer ?? 0)}
                    </td>
                    <td class="text-mono text-center">{peer.is_utp ? 'uTP' : 'TCP'}</td>
                    <td class="text-center font-bold text-mono" title={buildFlagTooltip(peer.flag_str)}>
                      {peer.flag_str}
                    </td>
                    <td class="text-center">
                      <button
                        class="peer-detail-btn"
                        title={t('detail.peers.detail_btn')}
                        onClick={() => setDetailPeer(peer)}
                      >
                        ⓘ
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <Show when={detailPeer()}>
        <PeerDetailModal peer={detailPeer()!} onClose={() => setDetailPeer(null)} />
      </Show>

      <div class="peers-bottom-drawer">
        <Show when={props.torrent.peers_from}>
          <button class="drawer-toggle-btn" onClick={() => setShowSources(!showSources())}>
            <span>{t('detail.peers.source_stats')}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class={`chevron-icon ${showSources() ? 'expanded' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <Show when={showSources()}>
            <div class="drawer-content peers-source-grid">
              <div class="source-item"><span class="source-label">{t('detail.peers.source_tracker')}:</span><span class="source-count">{props.torrent.peers_from!.from_tracker}</span></div>
              <div class="source-item"><span class="source-label">DHT:</span><span class="source-count">{props.torrent.peers_from!.from_dht}</span></div>
              <div class="source-item"><span class="source-label">PEX:</span><span class="source-count">{props.torrent.peers_from!.from_pex}</span></div>
              <div class="source-item"><span class="source-label">{t('detail.peers.getting')}:</span><span class="source-count">{props.torrent.peers_from!.from_incoming}</span></div>
              <div class="source-item"><span class="source-label">LPD:</span><span class="source-count">{props.torrent.peers_from!.from_lpd}</span></div>
              <div class="source-item"><span class="source-label">LTEP:</span><span class="source-count">{props.torrent.peers_from!.from_ltep}</span></div>
            </div>
          </Show>
        </Show>

        <button class="drawer-toggle-btn" onClick={() => setShowLegend(!showLegend())}>
          <span>{t('detail.peers.flags_legend')}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class={`chevron-icon ${showLegend() ? 'expanded' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <Show when={showLegend()}>
          <div class="drawer-content legend-grid">
            <For each={legends}>
              {(l) => (
                <div class="legend-item">
                  <span class="legend-key">{l.key}</span>
                  <span class="legend-desc">{l.desc}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>


    </div>
  );
};
