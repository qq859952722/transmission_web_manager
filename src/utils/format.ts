import { t } from './i18n';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number, decimals = 2): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  return formatBytes(bytesPerSec, decimals) + '/s';
}

export function formatETA(seconds: number): string {
  if (typeof seconds !== 'number' || seconds < 0) return '∞';
  if (seconds === 0) return '0' + t('times.sec');
  if (seconds === -1) return '∞';
  if (seconds === -2) return t('times.unknown');
  
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
  if (ratio === -1 || ratio === -2) return '∞';
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
  if (!timestamp || timestamp === 0) return '-';
  const d = new Date(timestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
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
    0: 'var(--text-muted)',
    1: 'var(--color-warning-500)',
    2: 'var(--color-warning-500)',
    3: 'var(--color-primary-500)',
    4: 'var(--color-primary-500)',
    5: 'var(--color-success-500)',
    6: 'var(--color-success-500)',
  };
  return map[status] || 'var(--text-muted)';
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
    0: t('dialog.add.default'),
    1: t('dialog.label.source_custom'),
    2: t('dialog.add.unlimited'),
  };
  return map[mode] || t('common.unknown');
}

export function getSeedIdleModeText(mode: number): string {
  const map: Record<number, string> = {
    0: t('dialog.add.default'),
    1: t('dialog.label.source_custom'),
    2: t('dialog.add.unlimited'),
  };
  return map[mode] || t('common.unknown');
}
