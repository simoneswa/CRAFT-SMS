import Dexie, { Table } from 'dexie';

export interface LocalAttendance {
  id?: string;
  student_id: string;
  date: string;
  status: string;
  school_id: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  lastModified: number;
}

export interface LocalGrade {
  id?: string;
  student_id: string;
  class_subject_id: string;
  category_id: string;
  score: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  lastModified: number;
}

export interface Mutation {
  id?: number;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  lastError?: string;
}

export class CraftOfflineDB extends Dexie {
  attendance!: Table<LocalAttendance>;
  grades!: Table<LocalGrade>;
  mutations!: Table<Mutation>;
  profiles!: Table<any>;
  schools!: Table<any>;

  constructor() {
    super('CraftSMS_Offline');
    this.version(1).stores({
      attendance: '++id, student_id, date, syncStatus',
      grades: '++id, student_id, class_subject_id, syncStatus',
      mutations: '++id, table, timestamp',
      profiles: 'id, full_name, role',
      schools: 'id, subdomain'
    });
  }
}

export const db = new CraftOfflineDB();
