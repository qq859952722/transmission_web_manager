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
    this.version(1).stores({
      history: '++id, &hash_string, name, added_date, deleted_date',
    });
    this.version(2).stores({
      history: '++id, &hash_string, name, added_date, deleted_date',
    }).upgrade(tx => {
      return tx.table('history').toCollection().modify(record => {
        if (record.avg_rate_download === undefined) record.avg_rate_download = 0;
        if (record.avg_rate_upload === undefined) record.avg_rate_upload = 0;
      });
    });
  }
}

export const db = new TrwmDatabase();
