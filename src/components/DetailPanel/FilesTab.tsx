import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes, formatPercent } from '../../utils/format';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents } from '../../store/torrentStore';
import { createResizableColumns } from '../../hooks/createResizableColumns';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { cn } from '../../lib/utils';
import { FileCode, File, CheckCircle2, Circle, Edit3, X, Save, ArrowDown, ArrowUp, Minus, Search } from 'lucide-solid';

export const FilesTab: Component<{ torrent: Torrent }> = (props) => {
  const [updatingId, setUpdatingId] = createSignal<number | null>(null);
  const [editingIdx, setEditingIdx] = createSignal<number | null>(null);
  const [newName, setNewName] = createSignal('');
  const [renaming, setRenaming] = createSignal(false);

  const { widths: colWidths, handleMouseDown } = createResizableColumns('trwm-files-widths', [
    { id: 'wanted', width: 40 },
    { id: 'name', width: 280 },
    { id: 'size', width: 85 },
    { id: 'progress', width: 140 },
    { id: 'priority', width: 140 },
  ]);

  const saveRename = async (oldPath: string) => {
    const val = newName().trim();
    const oldBasename = oldPath.split('/').pop() || oldPath;
    if (!val || val === oldBasename) {
      setEditingIdx(null);
      return;
    }
    setRenaming(true);
    try {
      await rpcCall('torrent_rename_path', { ids: [props.torrent.id], path: oldPath, name: val });
      await fetchTorrents(true);
      setEditingIdx(null);
    } catch (e) {
      showToast(t('dialog.rename.failed'), 'error');
    } finally {
      setRenaming(false);
    }
  };

  const toggleWanted = async (index: number, currentWanted: boolean) => {
    setUpdatingId(index);
    try {
      await rpcCall('torrent_set', {
        ids: [props.torrent.id],
        [currentWanted ? 'files_unwanted' : 'files_wanted']: [index],
      });
      await fetchTorrents(true);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const setPriority = async (index: number, priority: number) => {
    setUpdatingId(index);
    try {
      const args: Record<string, any> = { ids: [props.torrent.id] };
      if (priority === 1) args['priority_high'] = [index];
      else if (priority === -1) args['priority_low'] = [index];
      else args['priority_normal'] = [index];
      await rpcCall('torrent_set', args);
      await fetchTorrents(true);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div class="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="flex-1 overflow-auto bg-background/50 backdrop-blur-md rounded-xl border border-border shadow-sm">
        <table class="w-full min-w-max text-left border-collapse table-fixed text-[11px]">
          <thead class="sticky top-0 bg-secondary/90 backdrop-blur-md z-10 font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th class="py-0.5 px-1.5 font-semibold text-center relative group p-0" style={{ width: `${colWidths().wanted}px` }}>
                <CheckCircle2 size={13} class="inline-block" />
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'wanted')} />
              </th>
              <th class="py-0.5 px-1.5 font-semibold relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().name}px` }}>
                {t('columns.name')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'name')} />
              </th>
              <th class="py-0.5 px-1.5 font-semibold text-right relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().size}px` }}>
                {t('columns.size')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'size')} />
              </th>
              <th class="py-0.5 px-1.5 font-semibold relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().progress}px` }}>
                {t('columns.progress')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'progress')} />
              </th>
              <th class="py-0.5 px-1.5 font-semibold text-center relative group whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: `${colWidths().priority}px` }}>
                {t('detail.settings.priority')}
                <div class="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 group-hover:bg-border/50" onMouseDown={(e) => handleMouseDown(e, 'priority')} />
              </th>
            </tr>
          </thead>
          <tbody class="font-medium text-foreground divide-y divide-border/50">
            <Show
              when={props.torrent.files && props.torrent.files.length > 0}
              fallback={
                <tr>
                  <td colspan="5" class="py-12 text-center text-muted-foreground/60">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <Search size={32} class="opacity-50" />
                      <span>{t('status.no_files')}</span>
                    </div>
                  </td>
                </tr>
              }
            >
              <For each={props.torrent.files}>
                {(file, idx) => {
                  const stats = () => props.torrent.file_stats?.[idx()];
                  const isWanted = () => stats()?.wanted ?? true;
                  const priority = () => stats()?.priority ?? 0;
                  const progress = () => file.length > 0 ? (stats()?.bytes_completed ?? 0) / file.length : 0;

                  return (
                    <tr class={cn(
                      "transition-colors hover:bg-muted/50 group",
                      !isWanted() && "opacity-50 grayscale bg-muted/20"
                    )}>
                      <td class="py-0.5 px-1.5 text-center">
                        <button
                          type="button"
                          disabled={updatingId() === idx()}
                          onClick={() => toggleWanted(idx(), isWanted())}
                          class="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        >
                          {isWanted() ? <CheckCircle2 size={14} class="text-primary" /> : <Circle size={14} />}
                        </button>
                      </td>
                      <td class="py-0.5 px-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        <div class="flex items-center gap-2 max-w-[400px]">
                          <FileCode size={14} class={cn("shrink-0", isWanted() ? "text-blue-500" : "text-muted-foreground")} />
                          <Show
                            when={editingIdx() === idx()}
                            fallback={
                              <div class="flex items-center gap-2 w-full">
                                <span class="truncate select-text" title={file.name}>{file.name.split('/').pop() || file.name}</span>
                                <button
                                  type="button"
                                  class="opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                  onClick={() => { setEditingIdx(idx()); setNewName(file.name.split('/').pop() || file.name); }}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            }
                          >
                            <div class="flex items-center gap-1 w-full">
                              <input
                                type="text"
                                class="flex-1 bg-background border border-border rounded-md px-1.5 py-0.5 text-[11px] outline-none focus:border-primary disabled:opacity-50"
                                value={newName()}
                                onInput={(e) => setNewName(e.currentTarget.value)}
                                disabled={renaming()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(file.name);
                                  if (e.key === 'Escape') setEditingIdx(null);
                                }}
                                autofocus
                              />
                              <button type="button" class="p-0.5 rounded-md text-success hover:bg-success/20 transition-colors" disabled={renaming()} onClick={() => saveRename(file.name)}>
                                <Save size={13} />
                              </button>
                              <button type="button" class="p-0.5 rounded-md text-destructive hover:bg-destructive/20 transition-colors" disabled={renaming()} onClick={() => setEditingIdx(null)}>
                                <X size={13} />
                              </button>
                            </div>
                          </Show>
                        </div>
                      </td>
                      <td class="py-0.5 px-1.5 text-right font-mono text-[10px] text-muted-foreground">
                        {formatBytes(file.length)}
                      </td>
                      <td class="py-0.5 px-1.5">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              class={cn("h-full rounded-full transition-all duration-300", isWanted() ? "bg-primary" : "bg-muted-foreground/50")}
                              style={{ width: `${progress() * 100}%` }}
                            />
                          </div>
                          <span class="font-mono text-[9px] w-8 text-right text-muted-foreground">
                            {formatPercent(progress())}
                          </span>
                        </div>
                      </td>
                      <td class="py-0.5 px-1.5">
                        <div class="flex items-center justify-center p-0.5 bg-muted/50 rounded-lg border border-border/50">
                          <button
                            class={cn("flex-1 flex justify-center py-0.5 rounded-md transition-all", priority() === -1 ? "bg-background shadow-sm text-blue-500" : "text-muted-foreground hover:text-foreground")}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), -1)}
                            title={t('detail.settings.priority_low')}
                          >
                            <ArrowDown size={14} stroke-width={2.5} />
                          </button>
                          <button
                            class={cn("flex-1 flex justify-center py-0.5 rounded-md transition-all", priority() === 0 ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), 0)}
                            title={t('detail.settings.priority_normal')}
                          >
                            <Minus size={14} stroke-width={2.5} />
                          </button>
                          <button
                            class={cn("flex-1 flex justify-center py-0.5 rounded-md transition-all", priority() === 1 ? "bg-background shadow-sm text-red-500" : "text-muted-foreground hover:text-foreground")}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), 1)}
                            title={t('detail.settings.priority_high')}
                          >
                            <ArrowUp size={14} stroke-width={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  );
};
