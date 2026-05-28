import { t } from './i18n';

// Dynamic unit base: defaults to 1024 (binary), can be set to 1000 (decimal)
// based on session's units.size_bytes field.
// NOTE: unitBase is a module-level mutable variable, not a SolidJS signal. This means
// changing it via setUnitBase() will not trigger reactive updates on its own. However,
// since formatBytes/formatSpeed are called inside component templates that re-render on
// each polling cycle (every 2s), the new value is naturally picked up on the next render.
// This is an acceptable trade-off: a full signal-based approach would require every consumer
// to be in a reactive context, which is impractical for utility functions.
let unitBase = 1024;

export function setUnitBase(base: number) {
  if (base === 1000 || base === 1024) {
    unitBase = base;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = unitBase;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = unitBase === 1000
    ? ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  i = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number, decimals = 2): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  return formatBytes(bytesPerSec, decimals) + '/s';
}

export function formatETA(seconds: number): string {
  if (seconds === -1) return '∞';
  if (seconds === -2) return t('times.unknown');
  if (typeof seconds !== 'number' || seconds < 0) return '∞';
  if (seconds === 0) return '0' + t('times.sec');
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(days + t('times.day'));
  if (hours > 0) parts.push(hours + t('times.hour'));
  if (minutes > 0) parts.push(minutes + t('times.min'));
  if (secs > 0 && days === 0) parts.push(secs + t('times.sec'));
  
  return parts.join('') || ('0' + t('times.sec'));
}

export function formatPercent(value: number): string {
  if (value === undefined || value === null) return '0%';
  return (value * 100).toFixed(2) + '%';
}

export function formatRatio(ratio: number): string {
  if (ratio === -2) return t('common.none') || 'N/A';
  if (ratio === -1) return '∞';
  if (ratio < 0) return t('common.none');
  return ratio.toFixed(2);
}

export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

export function getRatioClass(ratio: number): string {
  if (ratio < 0.5) return 'text-danger';
  if (ratio < 1.0) return 'text-warning';
  if (ratio < 2.0) return 'text-success';
  return 'text-success';
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp || timestamp === 0) return t('common.unknown');
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date(timestamp * 1000));
}

export function formatTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) return '-';
  const d = new Date(timestamp * 1000);
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(days + t('times.day'));
  if (hours > 0) parts.push(hours + t('times.hour'));
  if (minutes > 0) parts.push(minutes + t('times.min'));
  
  return parts.join('') || (`< 1` + t('times.min'));
}

export function getStatusText(status: number): string {
  const map: Record<number, string> = {
    0: t('status.stopped'),
    1: t('status.check_wait'),
    2: t('status.checking'),
    3: t('status.download_wait'),
    4: t('status.downloading'),
    5: t('status.seed_wait'),
    6: t('status.seeding'),
  };
  return map[status] || t('times.unknown');
}

export function getStatusClass(status: number): string {
  const map: Record<number, string> = {
    0: 'status-stopped',
    1: 'status-check-wait',
    2: 'status-checking',
    3: 'status-download-wait',
    4: 'status-downloading',
    5: 'status-seed-wait',
    6: 'status-seeding',
  };
  return map[status] || '';
}

export function getStatusColor(status: number): string {
  const map: Record<number, string> = {
    0: '#71717a', // stopped (zinc-500)
    1: '#d946ef', // check_wait (fuchsia-500)
    2: '#8b5cf6', // checking (violet-500)
    3: '#0ea5e9', // download_wait (sky-500)
    4: '#3b82f6', // downloading (blue-500)
    5: '#10b981', // seed_wait (emerald-500)
    6: '#22c55e', // seeding (green-500)
  };
  return map[status] || '#71717a';
}

export function getStatusTextColorClass(status: number): string {
  const map: Record<number, string> = {
    0: 'text-zinc-500',
    1: 'text-fuchsia-500',
    2: 'text-violet-500',
    3: 'text-sky-500',
    4: 'text-blue-500',
    5: 'text-emerald-500',
    6: 'text-green-500',
  };
  return map[status] || 'text-muted-foreground';
}

export function getPriorityText(priority: number): string {
  const map: Record<number, string> = {
    '-1': t('detail.settings.priority_low'),
    '0': t('detail.settings.priority_normal'),
    '1': t('detail.settings.priority_high'),
  };
  return map[priority] || t('detail.settings.priority_normal');
}

export function getSeedRatioModeText(mode: number): string {
  const map: Record<number, string> = {
    0: t('status.ratio_default'),
    1: t('status.ratio_custom'),
    2: t('status.ratio_unlimited'),
  };
  return map[mode] || t('common.unknown');
}

export function getSeedIdleModeText(mode: number): string {
  const map: Record<number, string> = {
    0: t('status.idle_default'),
    1: t('status.idle_custom'),
    2: t('status.idle_unlimited'),
  };
  return map[mode] || t('common.unknown');
}
