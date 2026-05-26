import { Component, Show, createMemo } from 'solid-js';
import { Torrent } from '../../types/transmission';
import {
  formatBytes,
  formatETA,
  formatPercent,
  formatRatio,
  getStatusText,
  formatTimestamp,
  formatDuration,
  getRatioClass,
  formatSpeed,
  getStatusTextColorClass
} from '../../utils/format';
import { t } from '../../utils/i18n';

export const GeneralTab: Component<{ torrents: Torrent[] }> = (props) => {
  const isMulti = () => props.torrents.length > 1;
  const single = () => props.torrents[0];

  const multiStats = createMemo(() => {
    if (!isMulti()) return null;
    let total_size = 0;
    let downloaded = 0;
    let rate_download = 0;
    let rate_upload = 0;
    let peers_connected = 0;

    for (const t of props.torrents) {
      total_size += t.total_size;
      downloaded += t.total_size - t.left_until_done;
      rate_download += t.rate_download;
      rate_upload += t.rate_upload;
      peers_connected += t.peers_connected;
    }

    return {
      total_size,
      progress: total_size > 0 ? downloaded / total_size : 0,
      rate_download,
      rate_upload,
      peers_connected,
    };
  });

  const Section = (props: { title: string; children: any }) => (
    <div class="flex flex-col gap-1.5 bg-secondary/50 border border-border p-2.5 rounded-xl shadow-sm">
      <h3 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5 mb-0.5 m-0">
        {props.title}
      </h3>
      <div class="flex flex-col gap-0">{props.children}</div>
    </div>
  );

  const InfoGroup = (props: { label: string; value: any; class?: string; valueClass?: string }) => (
    <div class={`flex justify-between items-start text-xs gap-2 py-0.5 ${props.class || ''}`}>
      <span class="text-muted-foreground font-medium shrink-0">{props.label}:</span>
      <span class={`text-foreground text-right break-all ${props.valueClass || ''}`}>{props.value}</span>
    </div>
  );

  return (
    <div class="flex flex-col gap-4 h-full">
      <Show
        when={isMulti()}
        fallback={
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Section title={t('detail.general.pieces_progress')}>
              <InfoGroup label={t('detail.general.name')} value={single().name} valueClass="select-text font-medium" />
              <InfoGroup label={t('detail.general.hash')} value={single().hash_string} valueClass="select-text font-mono text-[10px] text-muted-foreground" />
              <InfoGroup label={t('detail.general.id')} value={single().id} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.status')} value={getStatusText(single().status)} valueClass={`font-semibold ${getStatusTextColorClass(single().status)}`} />
              <InfoGroup label={t('detail.general.progress')} value={formatPercent(single().percent_done)} valueClass="font-mono" />
              <InfoGroup label={t('detail.general.download_dir')} value={single().download_dir} valueClass="select-text text-muted-foreground" />
              <InfoGroup label={t('detail.general.torrent_file')} value={single().torrent_file || '-'} valueClass="select-text text-muted-foreground" />
              <Show when={single().primary_mime_type}>
                <InfoGroup label={t('detail.general.mime')} value={single().primary_mime_type} valueClass="font-mono text-muted-foreground" />
              </Show>
              <Show when={single().error_string}>
                <InfoGroup 
                  label={t('filter.error')} 
                  value={single().error_string} 
                  class="text-destructive" 
                  valueClass="text-destructive select-text text-left font-medium" 
                />
              </Show>
            </Section>

            <Section title={t('stats.title')}>
              <InfoGroup label={t('detail.general.size')} value={formatBytes(single().total_size)} valueClass="font-mono" />
              <InfoGroup label={t('detail.general.left')} value={formatBytes(single().left_until_done)} valueClass="font-mono" />
              <InfoGroup label={t('detail.general.downloaded')} value={formatBytes(single().downloaded_ever)} valueClass="font-mono text-primary" />
              <InfoGroup label={t('detail.general.uploaded')} value={formatBytes(single().uploaded_ever)} valueClass="font-mono text-success" />
              <InfoGroup 
                label={t('detail.general.ratio')} 
                value={formatRatio(single().upload_ratio)} 
                valueClass={`font-mono font-medium ${getRatioClass(single().upload_ratio)}`} 
              />
              <InfoGroup label={t('detail.general.corrupt')} value={formatBytes(single().corrupt_ever)} valueClass="font-mono text-destructive" />
              <InfoGroup label={t('detail.general.eta')} value={formatETA(single().eta)} valueClass="font-mono" />
              <InfoGroup label={t('detail.general.download_time')} value={formatDuration(single().seconds_downloading)} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.upload_time')} value={formatDuration(single().seconds_seeding)} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.activity')} value={single().activity_date ? formatTimestamp(single().activity_date) : '-'} valueClass="font-mono text-muted-foreground" />
            </Section>

            <Section title={t('sidebar.status')}>
              <InfoGroup label={t('detail.general.added_date')} value={formatTimestamp(single().added_date)} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.done_date')} value={single().done_date ? formatTimestamp(single().done_date) : '-'} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.creator')} value={single().creator || '-'} valueClass="select-text text-muted-foreground" />
              <InfoGroup label={t('detail.general.source')} value={single().source || '-'} valueClass="select-text text-muted-foreground" />
              <InfoGroup label={t('detail.general.comment')} value={single().comment || '-'} valueClass="select-text text-muted-foreground italic" />
              <InfoGroup label={t('detail.general.private')} value={single().is_private ? t('common.yes') : t('common.no')} valueClass="font-medium" />
              <InfoGroup label={t('detail.general.piece_count')} value={single().piece_count} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.piece_size')} value={formatBytes(single().piece_size)} valueClass="font-mono text-muted-foreground" />
              <InfoGroup label={t('detail.general.file_count')} value={single().files?.length ?? single().file_count ?? 0} valueClass="font-mono text-muted-foreground" />
              <InfoGroup 
                label={t('detail.general.sequential')} 
                value={
                  <>
                    {single().sequential_download ? t('common.yes') : t('common.no')}
                    <Show when={single().sequential_download && single().sequential_download_from_piece > 0}>
                      <span class="font-mono ml-1 text-muted-foreground">
                        {t('detail.general.sequential_from', { piece: single().sequential_download_from_piece })}
                      </span>
                    </Show>
                  </>
                } 
              />
              <InfoGroup label={t('columns.labels')} value={single().labels?.join(', ') || '-'} valueClass="select-text font-medium text-primary" />
              <InfoGroup label={t('dialog.settings.group')} value={single().group || '-'} valueClass="select-text font-medium" />
            </Section>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Section title={t('stats.title')}>
            <InfoGroup label={t('detail.general.size')} value={formatBytes(multiStats()!.total_size)} valueClass="font-mono" />
            <InfoGroup label={t('detail.general.progress')} value={formatPercent(multiStats()!.progress)} valueClass="font-mono font-medium" />
            <InfoGroup label={t('detail.general.rate_dl')} value={formatSpeed(multiStats()!.rate_download)} valueClass="font-mono text-primary font-bold" />
            <InfoGroup label={t('detail.general.rate_ul')} value={formatSpeed(multiStats()!.rate_upload)} valueClass="font-mono text-success font-bold" />
            <InfoGroup label={t('detail.peers.title')} value={multiStats()!.peers_connected} valueClass="font-mono text-muted-foreground" />
          </Section>
        </div>
      </Show>
    </div>
  );
};
