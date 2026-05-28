import { Component, For, Show } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { t } from '../../utils/i18n';
import { Globe } from 'lucide-solid';

export const WebseedsTab: Component<{ torrent: Torrent }> = (props) => {
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
        <div class="flex items-center gap-2">
          <Globe size={18} class="text-primary" />
          <span class="text-sm font-semibold">{t('detail.webseeds.title')}</span>
        </div>
        <div class="text-xs font-mono bg-background px-2 py-1 rounded border border-border">
          {t('detail.webseeds.active')}: {props.torrent.webseeds_sending_to_us ?? 0}
        </div>
      </div>

      <Show
        when={props.torrent.webseeds && props.torrent.webseeds.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center py-10 text-muted-foreground/60 border border-dashed border-border/50 rounded-lg bg-muted/10">
            <Globe size={32} class="opacity-20 mb-2" />
            <span class="text-sm">{t('detail.webseeds.empty')}</span>
          </div>
        }
      >
        <div class="border border-border/50 rounded-lg overflow-hidden">
          <table class="w-full text-sm text-left">
            <thead class="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th class="px-4 py-2.5 font-medium">URL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              <For each={props.torrent.webseeds}>
                {(url) => (
                  <tr class="hover:bg-muted/30 transition-colors">
                    <td class="px-4 py-2.5 font-mono text-xs truncate max-w-[200px] sm:max-w-[400px] md:max-w-[600px]" title={url}>
                      {url}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};
