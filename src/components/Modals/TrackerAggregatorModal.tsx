import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { closeTrackerAggregatorModal, showTrackerAggregatorModal } from '../../store/modalStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { createPersistedSignal } from '../../utils/persist';
import { selectedIds } from '../../store/torrentStore';
import {
  type TrackerSource,
  type AggregationResult,
  DEFAULT_REMOTE_SOURCES,
  aggregateTrackers,
  applyToDefaultTrackers,
  applyToTorrents,
  speedTestAndSort,
  buildTrackerList,
  enforceLimits
} from '../../utils/trackerAggregator';
import {
  ListPlus, Globe, Pencil, Zap, Download, Check,
  Loader2, AlertTriangle, Trash2, Plus, RefreshCw, Server, Layers
} from 'lucide-solid';
import { cn } from '../../lib/utils';

type ApplyTarget = 'default' | 'selected';

export const TrackerAggregatorModal: Component = () => {
  const [sources, setSources] = createPersistedSignal<TrackerSource[]>('trwm-tracker-sources', DEFAULT_REMOTE_SOURCES);
  const [manualTrackers, setManualTrackers] = createPersistedSignal<string>('trwm-manual-trackers', '');
  const [topN, setTopN] = createPersistedSignal<number>('trwm-tracker-topn', 0);

  const [aggregating, setAggregating] = createSignal(false);
  const [result, setResult] = createSignal<AggregationResult | null>(null);
  const [applying, setApplying] = createSignal(false);
  const [speedTesting, setSpeedTesting] = createSignal(false);
  const [speedProgress, setSpeedProgress] = createSignal({ done: 0, total: 0 });
  const [speedResults, setSpeedResults] = createSignal<{ url: string; latency: number }[]>([]);
  const [applyTarget, setApplyTarget] = createSignal<ApplyTarget>('default');

  const [editingSourceId, setEditingSourceId] = createSignal<string | null>(null);
  const [newSourceName, setNewSourceName] = createSignal('');
  const [newSourceUrl, setNewSourceUrl] = createSignal('');

  createEffect(() => {
    if (!showTrackerAggregatorModal()) {
      setResult(null);
      setSpeedResults([]);
      setSpeedProgress({ done: 0, total: 0 });
    }
  });

  const handleAggregate = async () => {
    setAggregating(true);
    setResult(null);
    setSpeedResults([]);
    try {
      const res = await aggregateTrackers(sources(), manualTrackers());
      setResult(res);
      showToast(
        t('tracker_agg.aggregate_success', { count: res.totalCount, tiers: res.tierCount }),
        'success'
      );
    } catch (e: any) {
      showToast(t('tracker_agg.aggregate_failed') + ': ' + e.message, 'error');
    } finally {
      setAggregating(false);
    }
  };

  const handleSpeedTest = async () => {
    const r = result();
    if (!r) return;

    setSpeedTesting(true);
    setSpeedResults([]);
    setSpeedProgress({ done: 0, total: 0 });

    try {
      const { tiers: sortedTiers, results: entries } = await speedTestAndSort(
        r.tiers,
        topN(),
        5,
        (done, total) => setSpeedProgress({ done, total })
      );

      const reachable = entries.filter(e => e.latency > 0);
      setSpeedResults(reachable.map(e => ({ url: e.url, latency: e.latency })));

      const newTrackerListStr = buildTrackerList(sortedTiers);
      const totalCount = sortedTiers.reduce((sum, t) => sum + t.length, 0);

      setResult({
        ...r,
        tiers: sortedTiers,
        trackerListStr: newTrackerListStr,
        totalCount,
        tierCount: sortedTiers.length
      });

      if (reachable.length > 0) {
        showToast(t('tracker_agg.speed_test_done', { count: reachable.length }), 'success');
      } else {
        showToast(t('tracker_agg.speed_test_no_result'), 'warning');
      }
    } catch (e: any) {
      showToast(t('tracker_agg.speed_test_failed') + ': ' + e.message, 'error');
    } finally {
      setSpeedTesting(false);
    }
  };

  const handleApply = async () => {
    const r = result();
    if (!r) return;

    setApplying(true);
    try {
      if (applyTarget() === 'default') {
        await applyToDefaultTrackers(r.trackerListStr);
        showToast(t('tracker_agg.apply_default_success'), 'success');
      } else {
        const ids = selectedIds();
        if (ids.length === 0) {
          showToast(t('tracker_agg.no_selected_torrents'), 'warning');
          return;
        }
        await applyToTorrents(ids, r.trackerListStr);
        showToast(t('tracker_agg.apply_selected_success', { count: ids.length }), 'success');
      }
      closeTrackerAggregatorModal();
    } catch (e: any) {
      showToast(t('tracker_agg.apply_failed') + ': ' + e.message, 'error');
    } finally {
      setApplying(false);
    }
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const addCustomSource = () => {
    const name = newSourceName().trim();
    const url = newSourceUrl().trim();
    if (!name || !url) return;
    const id = `custom-${Date.now()}`;
    setSources(prev => [...prev, { id, name, url, enabled: true, type: 'remote' }]);
    setNewSourceName('');
    setNewSourceUrl('');
    setEditingSourceId(null);
  };

  const handleOpen = (open: boolean) => {
    if (!open) closeTrackerAggregatorModal();
  };

  return (
    <Dialog open={showTrackerAggregatorModal()} onOpenChange={handleOpen}>
      <DialogContent class="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader class="px-5 pt-5 pb-3 border-b border-border/50">
          <DialogTitle class="flex items-center gap-2">
            <ListPlus size={20} class="text-primary" />
            {t('tracker_agg.title')}
          </DialogTitle>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Remote Sources */}
          <section>
            <h3 class="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
              <Globe size={14} class="text-primary" />
              {t('tracker_agg.remote_sources')}
            </h3>
            <div class="space-y-1.5">
              <For each={sources().filter(s => s.type === 'remote')}>
                {(source) => (
                  <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/40">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => toggleSource(source.id)}
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-foreground truncate">{source.name}</div>
                      <div class="text-[10px] text-muted-foreground truncate">{source.url}</div>
                    </div>
                    <Show when={!DEFAULT_REMOTE_SOURCES.some(d => d.id === source.id)}>
                      <button
                        class="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeSource(source.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </Show>
                  </div>
                )}
              </For>

              <Show
                when={editingSourceId() === 'new'}
                fallback={
                  <button
                    class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full"
                    onClick={() => setEditingSourceId('new')}
                  >
                    <Plus size={12} />
                    {t('tracker_agg.add_source')}
                  </button>
                }
              >
                <div class="px-3 py-2 rounded-lg bg-secondary/30 border border-primary/30 space-y-2">
                  <input
                    type="text"
                    class="w-full h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={t('tracker_agg.source_name_placeholder')}
                    value={newSourceName()}
                    onInput={(e) => setNewSourceName(e.currentTarget.value)}
                  />
                  <input
                    type="url"
                    class="w-full h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={t('tracker_agg.source_url_placeholder')}
                    value={newSourceUrl()}
                    onInput={(e) => setNewSourceUrl(e.currentTarget.value)}
                  />
                  <div class="flex gap-2">
                    <Button variant="default" size="sm" class="h-6 text-[10px] px-2" onClick={addCustomSource}>
                      <Check size={10} />
                      {t('common.yes')}
                    </Button>
                    <Button variant="ghost" size="sm" class="h-6 text-[10px] px-2" onClick={() => setEditingSourceId(null)}>
                      {t('common.no')}
                    </Button>
                  </div>
                </div>
              </Show>
            </div>
          </section>

          {/* Manual Trackers */}
          <section>
            <h3 class="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
              <Pencil size={14} class="text-primary" />
              {t('tracker_agg.manual_trackers')}
            </h3>
            <textarea
              class="w-full h-24 px-3 py-2 text-xs bg-secondary/30 border border-border/60 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              placeholder={t('tracker_agg.manual_placeholder')}
              value={manualTrackers()}
              onInput={(e) => setManualTrackers(e.currentTarget.value)}
            />
          </section>

          {/* TopN Setting */}
          <section>
            <h3 class="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
              <Layers size={14} class="text-primary" />
              {t('tracker_agg.strategy')}
            </h3>
            <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{t('tracker_agg.top_n')}</span>
              <input
                type="number"
                min="0"
                max="64"
                class="w-14 h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-center"
                value={topN() || ''}
                onInput={(e) => {
                  const v = parseInt(e.currentTarget.value);
                  setTopN(isNaN(v) || v <= 0 ? 0 : Math.min(v, 64));
                }}
              />
              <span class="text-[10px]">({t('tracker_agg.top_n_hint')})</span>
            </div>
          </section>

          {/* Action Buttons */}
          <section class="flex gap-2">
            <Button
              variant="default"
              class="flex-1 h-9 text-xs font-bold gap-1.5"
              onClick={handleAggregate}
              disabled={aggregating()}
            >
              <Show when={aggregating()} fallback={<RefreshCw size={14} />}>
                <Loader2 size={14} class="animate-spin" />
              </Show>
              {aggregating() ? t('tracker_agg.aggregating') : t('tracker_agg.aggregate')}
            </Button>
            <Button
              variant="outline"
              class="h-9 text-xs gap-1.5"
              onClick={handleSpeedTest}
              disabled={speedTesting() || !result()}
            >
              <Show when={speedTesting()} fallback={<Zap size={14} />}>
                <Loader2 size={14} class="animate-spin" />
              </Show>
              {speedTesting()
                ? t('tracker_agg.speed_testing_progress', { done: speedProgress().done, total: speedProgress().total })
                : t('tracker_agg.speed_test')
              }
            </Button>
          </section>

          {/* Results */}
          <Show when={result()}>
            {(r) => (
              <section class="space-y-3">
                {/* Stats */}
                <div class="grid grid-cols-6 gap-2">
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-primary">{r().stats.rawCount}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_raw')}</div>
                  </div>
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-warning">{r().stats.removedUnsupported}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_filtered')}</div>
                  </div>
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-warning">{r().stats.removedDuplicates}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_deduped')}</div>
                  </div>
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-warning">{r().stats.mergedTiers}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_merged')}</div>
                  </div>
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-success">{r().tierCount}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_tiers')}</div>
                  </div>
                  <div class="text-center p-2 rounded-lg bg-secondary/30 border border-border/40">
                    <div class="text-lg font-bold text-success">{r().totalCount}</div>
                    <div class="text-[10px] text-muted-foreground">{t('tracker_agg.stat_final')}</div>
                  </div>
                </div>

                {/* Tier Preview */}
                <div>
                  <div class="text-xs font-semibold text-foreground mb-1.5">
                    {t('tracker_agg.tier_preview', { tiers: r().tierCount, trackers: r().totalCount })}
                  </div>
                  <div class="max-h-40 overflow-y-auto bg-secondary/20 border border-border/40 rounded-lg p-2 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all">
                    {r().trackerListStr.substring(0, 2000)}{r().trackerListStr.length > 2000 ? '...' : ''}
                  </div>
                </div>

                {/* Speed Test Results */}
                <Show when={speedResults().length > 0}>
                  <div>
                    <div class="text-xs font-semibold text-foreground mb-1.5">
                      {t('tracker_agg.speed_results', { count: speedResults().length })}
                    </div>
                    <div class="max-h-32 overflow-y-auto space-y-0.5">
                      <For each={speedResults().slice(0, 30)}>
                        {(entry) => (
                          <div class="flex items-center gap-2 px-2 py-1 text-[10px] bg-secondary/20 rounded">
                            <span class={cn(
                              "font-mono font-bold w-12 text-right",
                              entry.latency < 200 ? "text-success" : entry.latency < 1000 ? "text-warning" : "text-destructive"
                            )}>
                              {entry.latency}ms
                            </span>
                            <span class="text-muted-foreground truncate flex-1">{entry.url}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Apply Section */}
                <div class="border-t border-border/40 pt-3 space-y-2">
                  <div class="text-xs font-semibold text-foreground">{t('tracker_agg.apply_to')}</div>
                  <div class="flex gap-2">
                    <button
                      class={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors",
                        applyTarget() === 'default'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border/60 hover:border-primary/40"
                      )}
                      onClick={() => setApplyTarget('default')}
                    >
                      <Server size={12} />
                      {t('tracker_agg.apply_default')}
                    </button>
                    <button
                      class={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors",
                        applyTarget() === 'selected'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border/60 hover:border-primary/40"
                      )}
                      onClick={() => setApplyTarget('selected')}
                    >
                      <Download size={12} />
                      {t('tracker_agg.apply_selected')}
                      <Show when={selectedIds().length > 0}>
                        <span class="ml-0.5 text-[10px] opacity-80">({selectedIds().length})</span>
                      </Show>
                    </button>
                  </div>
                  <Show when={applyTarget() === 'selected' && selectedIds().length === 0}>
                    <div class="flex items-center gap-1.5 text-[10px] text-warning">
                      <AlertTriangle size={10} />
                      {t('tracker_agg.no_selected_torrents')}
                    </div>
                  </Show>
                  <Button
                    variant="success"
                    class="w-full h-9 text-xs font-bold gap-1.5"
                    onClick={handleApply}
                    disabled={applying() || (applyTarget() === 'selected' && selectedIds().length === 0)}
                  >
                    <Show when={applying()} fallback={<Check size={14} />}>
                      <Loader2 size={14} class="animate-spin" />
                    </Show>
                    {applying() ? t('tracker_agg.applying') : t('tracker_agg.apply')}
                  </Button>
                </div>
              </section>
            )}
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  );
};
