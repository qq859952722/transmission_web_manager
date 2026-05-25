import { createQuery } from '@tanstack/solid-query';
import { rpcCall } from './rpc';
import { Session, SessionStats, BandwidthGroup } from '../types/transmission';

export function useSession() {
  return createQuery(() => ({
    queryKey: ['session'],
    queryFn: async () => {
      const data = await rpcCall<Session>('session_get');
      return data;
    },
    refetchInterval: 30000, // Poll session every 30s
  }));
}

export function useSessionStats() {
  return createQuery(() => ({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const data = await rpcCall<SessionStats>('session_stats');
      return data;
    },
    refetchInterval: 5000, // Poll stats every 5s (coordinated with torrent_get 2s polling)
  }));
}

export function useGroups() {
  return createQuery(() => ({
    queryKey: ['groups'],
    queryFn: async () => {
      const data = await rpcCall<{ group: BandwidthGroup[] }>('group_get');
      return data.group || [];
    },
    refetchInterval: 60000,
  }));
}

export function useFreeSpace(path: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ['free-space', path()],
    queryFn: async () => {
      const p = path();
      if (!p) return null;
      const data = await rpcCall<{ size_bytes: number }>('free_space', { path: p });
      return data.size_bytes;
    },
    enabled: !!path(),
    refetchInterval: 30000,
  }));
}
