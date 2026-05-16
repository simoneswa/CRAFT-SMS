import Dexie, { Table } from 'dexie';

export interface PendingMutation {
  id: string; // UUID
  tenantId: string;
  deviceId: string;
  entityType: string; // 'grade' | 'attendance'
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  errorMessage?: string;
  version: number;
  checksum: string;
}

export interface CachedGrade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  term: string;
  updatedAt: number;
}

export interface CachedAttendance {
  id: string;
  studentId: string;
  date: string;
  status: string;
  updatedAt: number;
}

export class CraftDB extends Dexie {
  pendingMutations!: Table<PendingMutation>;
  grades!: Table<CachedGrade>;
  attendance!: Table<CachedAttendance>;

  constructor() {
    super('CraftOfflineDB');
    this.version(1).stores({
      pendingMutations: 'id, status, timestamp, entityType',
      grades: 'id, studentId, subject, term',
      attendance: 'id, studentId, date'
    });
  }

  // Helper to clear old cache (Offline Governance)
  async clearOldCache() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    await this.attendance.where('updatedAt').below(thirtyDaysAgo).delete();
  }
}

export const db = new CraftDB();
