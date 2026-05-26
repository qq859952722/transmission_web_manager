import Dexie, { type Table } from 'dexie';

export interface HistoryRecord {
  id?: number;
  hash_string: string;
  name: string;
  total_size: number;
  download_dir: string;
  labels: string[];
  added_date: number;
  done_date: number;
  deleted_date: number;
  upload_ratio: number;
  downloaded_ever: number;
  uploaded_ever: number;
  avg_rate_download: number;
  avg_rate_upload: number;
  status: number;
  error?: number;
  magnet_link?: string;
  comment?: string;
  creator?: string;
  files?: { name: string; length: number }[];
}

export class TrwmDatabase extends Dexie {
  history!: Table<HistoryRecord, number>;

  constructor() {
    super('TrwmDatabase');
    this.version(2).stores({
      // Primary key is auto-increment id, we index hash_string and name for search
      history: '++id, hash_string, name, added_date, deleted_date',
    });
  }
}

export const db = new TrwmDatabase();
