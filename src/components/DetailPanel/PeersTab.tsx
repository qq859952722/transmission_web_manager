import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent, Peer } from '../../types/transmission';
import { formatBytes, formatSpeed, formatPercent } from '../../utils/format';
import { t } from '../../utils/i18n';
import * as geoip from '../../utils/geoip';
import { cn } from '../../lib/utils';
import { Info, ChevronDown, Activity, Globe2, ShieldCheck, Zap, Users } from 'lucide-solid';

const FLAG_DESCRIPTIONS: Record<string, string> = {
  'D': t('detail.peers.flag_D'), 'd': t('detail.peers.flag_d'), 'U': t('detail.peers.flag_U'),
  'u': t('detail.peers.flag_u'), 'K': t('detail.peers.flag_K'), '?': t('detail.peers.flag_?'),
  'E': t('detail.peers.flag_E'), 'H': t('detail.peers.flag_H'), 'X': t('detail.peers.flag_X'),
  'I': t('detail.peers.flag_I'), 'T': t('detail.peers.flag_T'), 'L': t('detail.peers.flag_L'),
  'S': t('detail.peers.flag_S'),
};

function buildFlagTooltip(flagStr: string): string {
  if (!flagStr) return '';
  const lines: string[] = [];
  for (const ch of flagStr) {
    if (FLAG_DESCRIPTIONS[ch]) lines.push(`${ch}: ${FLAG_DESCRIPTIONS[ch]}`);
  }
  return lines.join('\n');
}

function truncateClient(name: string | undefined, maxLen: number): string {
  if (!name) return '-';
  return name.length > maxLen ? name.substring(0, maxLen) + '…' : name;
}

const PeerDetailModal: Component<{ peer: Peer; onClose: () => void }> = (props) => {
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/50">
          <div class="flex items-center gap-3">
            <Globe2 size={20} class="text-primary" />
            <span class="text-base font-bold text-foreground font-mono tracking-tight">{props.peer.address}</span>
          </div>
          <button class="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-colors" onClick={props.onClose}>
            ✕
          </button>
        </div>
        
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
          {/* Connection */}
          <div class="flex flex-col gap-2">
            <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> {t('detail.peers.detail_connection')}
            </h4>
            <div class="grid grid-cols-2 gap-2 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
              <span class="text-muted-foreground">{t('detail.peers.port')}</span><span class="font-mono text-right">{props.peer.port}</span>
              <span class="text-muted-foreground">{t('detail.peers.protocol')}</span><span class="font-mono text-right text-primary font-bold">{props.peer.is_utp ? 'uTP' : 'TCP'}</span>
              <span class="text-muted-foreground">{t('detail.peers.encryption')}</span><span class="text-right text-success font-bold">{props.peer.is_encrypted ? '✔' : '✘'}</span>
              <span class="text-muted-foreground">{t('detail.peers.detail_incoming')}</span><span class="text-right">{props.peer.is_incoming ? '✔' : '✘'}</span>
            </div>
          </div>

          {/* Transfer */}
          <div class="flex flex-col gap-2">
            <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} /> {t('detail.peers.detail_transfer')}
            </h4>
            <div class="grid grid-cols-2 gap-2 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
              <span class="text-muted-foreground">{t('detail.peers.progress')}</span><span class="font-mono text-right font-bold text-success">{formatPercent(props.peer.progress)}</span>
              <span class="text-muted-foreground">{t('detail.peers.rate_to_client')}</span><span class="font-mono text-right text-blue-500">{props.peer.rate_to_client > 0 ? formatSpeed(props.peer.rate_to_client) : '-'}</span>
              <span class="text-muted-foreground">{t('detail.peers.rate_to_peer')}</span><span class="font-mono text-right text-green-500">{props.peer.rate_to_peer > 0 ? formatSpeed(props.peer.rate_to_peer) : '-'}</span>
              <span class="text-muted-foreground">{t('detail.peers.downloaded')}</span><span class="font-mono text-right">{props.peer.client_is_choked ? '-' : formatBytes(props.peer.bytes_to_client ?? 0)}</span>
              <span class="text-muted-foreground">{t('detail.peers.uploaded')}</span><span class="font-mono text-right">{formatBytes(props.peer.bytes_to_peer ?? 0)}</span>
            </div>
          </div>

          {/* Client & Flags */}
          <div class="flex flex-col gap-2 md:col-span-2">
            <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> {t('detail.peers.detail_client')}
            </h4>
            <div class="grid grid-cols-[1fr_2fr] gap-2 text-sm bg-secondary/30 p-3 rounded-xl border border-border/50">
              <span class="text-muted-foreground">{t('detail.peers.client')}</span><span class="text-right select-text font-medium">{props.peer.client_name || '-'}</span>
              <span class="text-muted-foreground">Peer ID</span><span class="font-mono text-right select-text opacity-70">{props.peer.peer_id || '-'}</span>
              <span class="text-muted-foreground">{t('detail.peers.flags')}</span>
              <div class="flex flex-wrap justify-end gap-1">
                <For each={props.peer.flag_str?.split('')}>
                  {(f) => <span class="bg-primary/20 text-primary border border-primary/30 rounded px-1.5 font-mono text-[10px]" title={FLAG_DESCRIPTIONS[f]}>{f}</span>}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { createResizableColumns } from '../../hooks/createResizableColumns';

export const PeersTab: Component<{ torrent: Torrent }> = (props) => {
  const [showLegend, setShowLegend] = createSignal(false);
  const [showSources, setShowSources] = createSignal(false);
  const [detailPeer, setDetailPeer] = createSignal<Peer | null>(null);

  const { widths: colWidths, handleMouseDown } = createResizableColumns('trwm-peers-widths', [
    { id: 'flag', width: 40 },
    { id: 'address', width: 180 },
    { id: 'client', width: 150 },
    { id: 'progress', width: 120 },
    { id: 'rate_dl', width: 80 },
    { id: 'rate_ul', width: 80 },
    { id: 'protocol', width: 60 },
    { id: 'flags', width: 80 },
    { id: 'actions', width: 40 },
  ]);

  const legends = [
    { key: 'D', desc: t('detail.peers.flag_D') }, { key: 'd', desc: t('detail.peers.flag_d') },
    { key: 'U', desc: t('detail.peers.flag_U') }, { key: 'u', desc: t('detail.peers.flag_u') },
    { key: 'K', desc: t('detail.peers.flag_K') }, { key: '? ', desc: t('detail.peers.flag_?') },
    { key: 'E', desc: t('detail.peers.flag_E') }, { key: 'H', desc: t('detail.peers.flag_H') },
    { key: 'X', desc: t('detail.peers.flag_X') }, { key: 'I', desc: t('detail.peers.flag_I') },
    { key: 'T', desc: t('detail.peers.flag_T') }, { key: 'L', desc: t('detail.peers.flag_L') },
    { key: 'S', desc: t('detail.peers.flag_S') },
  ];

  return (
    <div class="flex flex-col h-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="flex-1 overflow-auto bg-background/50 backdrop-blur-md rounded-xl border border-border shadow-sm relative">
        <table class="w-full min-w-max text-left border-collapse table-fixed text-[11px]">
          <thead class="sticky top-0 bg-secondary/90 backdrop-blur-md z-10 font-bold text-muted-foreground uppercase tracking-wider shadow-sm">
            <tr>
              <th class="py-1 px-1.5 text-center relative group p-0" style={{ width: `${colWidths().flag}px` }}>
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'flag')} />
              </th>
              <th class="py-1 px-1.5 relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().address}px` }}>
                {t('detail.peers.address')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'address')} />
              </th>
              <th class="py-1 px-1.5 relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().client}px` }}>
                {t('detail.peers.client')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'client')} />
              </th>
              <th class="py-1 px-1.5 relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().progress}px` }}>
                {t('detail.peers.progress')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'progress')} />
              </th>
              <th class="py-1 px-1.5 text-right relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().rate_dl}px` }}>
                {t('detail.peers.rate_dl')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'rate_dl')} />
              </th>
              <th class="py-1 px-1.5 text-right relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().rate_ul}px` }}>
                {t('detail.peers.rate_ul')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'rate_ul')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().protocol}px` }}>
                {t('detail.peers.protocol')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'protocol')} />
              </th>
              <th class="py-1 px-1.5 text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().flags}px` }}>
                {t('detail.peers.flags')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'flags')} />
              </th>
              <th class="py-1 px-1.5 relative group p-0" style={{ width: `${colWidths().actions}px` }}>
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'actions')} />
              </th>
            </tr>
          </thead>
          <tbody class="font-medium text-foreground divide-y divide-border/50">
            <Show
              when={props.torrent.peers && props.torrent.peers.length > 0}
              fallback={
                <tr>
                  <td colspan="9" class="py-12 text-center text-muted-foreground/60">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <Users size={32} class="opacity-50" />
                      <span>{t('detail.peers.empty')}</span>
                    </div>
                  </td>
                </tr>
              }
            >
              <For each={props.torrent.peers}>
                {(peer) => (
                  <tr class="transition-colors hover:bg-muted/50 group">
                    <td class="py-0.5 px-1.5 text-center text-[14px] leading-none opacity-80" innerHTML={geoip.getCountryDisplayHtml(peer.address)} />
                    <td class="py-0.5 px-1.5 font-mono text-muted-foreground group-hover:text-foreground transition-colors select-text text-[10px]">
                      {peer.address}<span class="opacity-50 text-[9px] ml-0.5">:{peer.port}</span>
                    </td>
                    <td class="py-0.5 px-1.5 select-text whitespace-nowrap overflow-hidden text-ellipsis text-[10px]" title={peer.client_name || ''}>
                      {truncateClient(peer.client_name, 20)}
                    </td>
                    <td class="py-0.5 px-1.5">
                      <div class="flex items-center gap-1.5">
                        <div class="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div class="h-full bg-success rounded-full" style={{ width: `${peer.progress * 100}%` }} />
                        </div>
                        <span class="font-mono text-[9px] w-8 text-right text-success">{formatPercent(peer.progress)}</span>
                      </div>
                    </td>
                    <td class="py-0.5 px-1.5 text-right font-mono text-blue-500 font-bold text-[10px]">{peer.rate_to_client > 0 ? formatSpeed(peer.rate_to_client) : '-'}</td>
                    <td class="py-0.5 px-1.5 text-right font-mono text-green-500 font-bold text-[10px]">{peer.rate_to_peer > 0 ? formatSpeed(peer.rate_to_peer) : '-'}</td>
                    <td class="py-0.5 px-1.5 text-center font-mono text-[9px]">
                      <span class={cn("px-1 py-0.5 rounded", peer.is_utp ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        {peer.is_utp ? 'uTP' : 'TCP'}
                      </span>
                    </td>
                    <td class="py-0.5 px-1.5 text-center font-mono text-[10px] tracking-widest text-muted-foreground" title={buildFlagTooltip(peer.flag_str)}>
                      {peer.flag_str}
                    </td>
                    <td class="py-0.5 px-1.5 text-center">
                      <button class="p-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100" onClick={() => setDetailPeer(peer)}>
                        <Info size={14} />
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

      {/* Stats Drawer */}
      <div class="flex flex-col gap-2">
        <Show when={props.torrent.peers_from}>
          <div class="bg-secondary/30 border border-border rounded-xl overflow-hidden backdrop-blur-md">
            <button class="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-foreground hover:bg-muted/50 transition-colors" onClick={() => setShowSources(!showSources())}>
              <span class="flex items-center gap-2"><Globe2 size={12} class="text-primary" /> {t('detail.peers.source_stats')}</span>
              <ChevronDown size={14} class={cn("transition-transform duration-300", showSources() && "rotate-180")} />
            </button>
            <Show when={showSources()}>
              <div class="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 pt-0 border-t border-border/50 bg-background/50">
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">{t('detail.peers.source_tracker')}</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_tracker}</span></div>
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">DHT</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_dht}</span></div>
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">PEX</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_pex}</span></div>
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">{t('detail.peers.getting')}</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_incoming}</span></div>
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">LPD</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_lpd}</span></div>
                <div class="flex flex-col"><span class="text-[10px] text-muted-foreground">LTEP</span><span class="font-mono font-bold">{props.torrent.peers_from!.from_ltep}</span></div>
              </div>
            </Show>
          </div>
        </Show>

        <div class="bg-secondary/30 border border-border rounded-xl overflow-hidden backdrop-blur-md">
          <button class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/50 transition-colors" onClick={() => setShowLegend(!showLegend())}>
            <span class="flex items-center gap-2"><Info size={12} class="text-primary" /> {t('detail.peers.flags_legend')}</span>
            <ChevronDown size={14} class={cn("transition-transform duration-300", showLegend() && "rotate-180")} />
          </button>
          <Show when={showLegend()}>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 p-4 pt-0 border-t border-border/50 bg-background/50 text-xs">
              <For each={legends}>
                {(l) => (
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded min-w-[20px] text-center">{l.key}</span>
                    <span class="text-muted-foreground truncate" title={l.desc}>{l.desc}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
