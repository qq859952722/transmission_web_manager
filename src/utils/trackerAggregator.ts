import { rpcCall } from '../api/rpc';

const SUPPORTED_PROTOCOLS = ['http:', 'https:', 'udp:'];
const MAX_PER_TIER = 64;
const MAX_TIERS = 64;
const MAX_TOTAL = 1024;

export interface TrackerSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  type: 'remote' | 'manual';
}

export interface TrackerEntry {
  url: string;
  protocol: 'udp' | 'http' | 'https';
  latency: number;
}

export interface AggregationResult {
  tiers: string[][];
  trackerListStr: string;
  totalCount: number;
  tierCount: number;
  stats: {
    rawCount: number;
    afterProtocolFilter: number;
    afterDedup: number;
    removedUnsupported: number;
    removedDuplicates: number;
    mergedTiers: number;
  };
}

export const DEFAULT_REMOTE_SOURCES: TrackerSource[] = [
  {
    id: 'ngosang-best',
    name: 'ngosang/trackerslist (best)',
    url: 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_best.txt',
    enabled: true,
    type: 'remote'
  },
  {
    id: 'ngosang-all',
    name: 'ngosang/trackerslist (all)',
    url: 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all.txt',
    enabled: false,
    type: 'remote'
  },
  {
    id: 'xiu2-best',
    name: 'XIU2/TrackersListCollection (best)',
    url: 'https://cdn.jsdelivr.net/gh/XIU2/TrackersListCollection@master/best.txt',
    enabled: true,
    type: 'remote'
  },
  {
    id: 'xiu2-all',
    name: 'XIU2/TrackersListCollection (all)',
    url: 'https://cdn.jsdelivr.net/gh/XIU2/TrackersListCollection@master/all.txt',
    enabled: false,
    type: 'remote'
  }
];

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    if (u.pathname.endsWith('/') && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return `${u.protocol}//${u.host}${u.pathname}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function isSupportedProtocol(url: string): boolean {
  try {
    return SUPPORTED_PROTOCOLS.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function parseTrackerListText(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

export function parseTrackerListTiers(text: string): string[][] {
  return text
    .split('\n\n')
    .map(tier => tier.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(tier => tier.length > 0);
}

export function buildTrackerList(tiers: string[][]): string {
  return tiers.map(tier => tier.join('\n')).join('\n\n');
}

export async function fetchRemoteSource(source: TrackerSource): Promise<string> {
  const resp = await fetch(source.url, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return resp.text();
}

class UnionFind {
  private parent: Map<string, string> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
    }
    let root = x;
    while (this.parent.get(root)! !== root) {
      root = this.parent.get(root)!;
    }
    let current = x;
    while (current !== root) {
      const next = this.parent.get(current)!;
      this.parent.set(current, root);
      current = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(ra, rb);
    }
  }
}

export function mergeTiers(allTiers: string[][]): { tiers: string[][]; mergedCount: number; removedUnsupported: number; removedDuplicates: number } {
  const uf = new UnionFind();
  const normalizedToOriginal = new Map<string, string>();

  const filteredTiers: string[][] = [];
  let removedUnsupported = 0;
  let removedDuplicates = 0;

  for (const tier of allTiers) {
    const filtered: string[] = [];
    for (const url of tier) {
      if (!isSupportedProtocol(url)) {
        removedUnsupported++;
        continue;
      }
      const normalized = normalizeUrl(url);
      if (normalizedToOriginal.has(normalized)) {
        removedDuplicates++;
        continue;
      }
      normalizedToOriginal.set(normalized, url.trim());
      filtered.push(normalized);
    }
    if (filtered.length > 0) {
      filteredTiers.push(filtered);
    }
  }

  for (const tier of filteredTiers) {
    for (let i = 1; i < tier.length; i++) {
      uf.union(tier[0], tier[i]);
    }
  }

  const tierGroups = new Map<string, Set<string>>();
  for (const tier of filteredTiers) {
    for (const url of tier) {
      const root = uf.find(url);
      if (!tierGroups.has(root)) {
        tierGroups.set(root, new Set());
      }
      tierGroups.get(root)!.add(url);
    }
  }

  const mergedTiers: string[][] = [];
  for (const group of tierGroups.values()) {
    const tier: string[] = [];
    for (const normalized of group) {
      const original = normalizedToOriginal.get(normalized);
      if (original) tier.push(original);
    }
    if (tier.length > 0) {
      mergedTiers.push(tier);
    }
  }

  return {
    tiers: mergedTiers,
    mergedCount: allTiers.length - mergedTiers.length,
    removedUnsupported,
    removedDuplicates
  };
}

export function enforceLimits(tiers: string[][]): string[][] {
  const result = tiers
    .map(tier => tier.slice(0, MAX_PER_TIER))
    .filter(tier => tier.length > 0)
    .slice(0, MAX_TIERS);

  let total = result.reduce((sum, t) => sum + t.length, 0);
  while (total > MAX_TOTAL && result.length > 0) {
    const last = result[result.length - 1];
    last.pop();
    total--;
    if (last.length === 0) result.pop();
  }

  return result;
}

export async function aggregateTrackers(
  sources: TrackerSource[],
  manualTrackers: string
): Promise<AggregationResult> {
  const allTiers: string[][] = [];
  let rawCount = 0;

  if (manualTrackers.trim()) {
    const manualTiers = parseTrackerListTiers(manualTrackers);
    for (const tier of manualTiers) {
      rawCount += tier.length;
      allTiers.push(tier);
    }
  }

  const enabledSources = sources.filter(s => s.enabled);

  const fetchResults = await Promise.allSettled(
    enabledSources.map(async (source) => {
      try {
        const text = await fetchRemoteSource(source);
        return parseTrackerListTiers(text);
      } catch (e) {
        console.warn(`Failed to fetch ${source.name}:`, e);
        return [];
      }
    })
  );

  for (const res of fetchResults) {
    if (res.status === 'fulfilled' && res.value) {
      for (const tier of res.value) {
        rawCount += tier.length;
        allTiers.push(tier);
      }
    }
  }

  const { tiers: mergedTiers, mergedCount, removedUnsupported, removedDuplicates } = mergeTiers(allTiers);
  const finalTiers = enforceLimits(mergedTiers);
  const trackerListStr = buildTrackerList(finalTiers);
  const totalCount = finalTiers.reduce((sum, t) => sum + t.length, 0);
  const totalAfterDedup = mergedTiers.reduce((s, t) => s + t.length, 0);

  return {
    tiers: finalTiers,
    trackerListStr,
    totalCount,
    tierCount: finalTiers.length,
    stats: {
      rawCount,
      afterProtocolFilter: rawCount - removedUnsupported,
      afterDedup: totalAfterDedup,
      removedUnsupported,
      removedDuplicates,
      mergedTiers: mergedCount
    }
  };
}

export async function speedTestAndSort(
  tiers: string[][],
  topN: number,
  concurrency = 5,
  onProgress?: (done: number, total: number) => void
): Promise<{ tiers: string[][]; results: TrackerEntry[] }> {
  const allTrackers = tiers.flat();
  const httpTrackers = allTrackers.filter(u => {
    try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; }
  });

  const latencyMap = new Map<string, number>();
  let done = 0;
  const total = httpTrackers.length;

  for (let i = 0; i < httpTrackers.length; i += concurrency) {
    const batch = httpTrackers.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const latency = await measureHttpLatency(url);
        done++;
        onProgress?.(done, total);
        return { url, latency };
      })
    );
    for (const r of batchResults) {
      latencyMap.set(normalizeUrl(r.url), r.latency);
    }
  }

  const tierScores = tiers.map((tier, index) => {
    let reachableCount = 0;
    let totalLatency = 0;
    for (const url of tier) {
      const latency = latencyMap.get(normalizeUrl(url));
      if (latency !== undefined && latency > 0) {
        reachableCount++;
        totalLatency += latency;
      }
    }
    const avgLatency = reachableCount > 0 ? totalLatency / reachableCount : Infinity;
    return { index, avgLatency, reachableCount, tier };
  });

  tierScores.sort((a, b) => {
    if (a.reachableCount === 0 && b.reachableCount === 0) return 0;
    if (a.reachableCount === 0) return 1;
    if (b.reachableCount === 0) return -1;
    return a.avgLatency - b.avgLatency;
  });

  let sortedTiers = tierScores.map(s => s.tier);
  if (topN > 0 && topN < sortedTiers.length) {
    sortedTiers = sortedTiers.slice(0, topN);
  }

  const results: TrackerEntry[] = [];
  for (const [url, latency] of latencyMap.entries()) {
    try {
      const protocol = new URL(url).protocol.replace(':', '') as 'udp' | 'http' | 'https';
      results.push({ url, protocol, latency });
    } catch { /* skip */ }
  }
  results.sort((a, b) => {
    if (a.latency <= 0 && b.latency <= 0) return 0;
    if (a.latency <= 0) return 1;
    if (b.latency <= 0) return -1;
    return a.latency - b.latency;
  });

  return { tiers: enforceLimits(sortedTiers), results };
}

export async function applyToDefaultTrackers(trackerListStr: string): Promise<void> {
  await rpcCall('session_set', { default_trackers: trackerListStr });
}

export async function applyToTorrents(
  torrentIds: number[],
  trackerListStr: string
): Promise<void> {
  await rpcCall('torrent_set', {
    ids: torrentIds,
    tracker_list: trackerListStr
  });
}

export async function getDefaultTrackers(): Promise<string> {
  const result: any = await rpcCall('session_get', { fields: ['default_trackers'] });
  return result?.arguments?.default_trackers ?? '';
}

async function measureHttpLatency(
  url: string,
  timeout = 5000
): Promise<number> {
  const start = performance.now();
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(timeout)
    });
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}
