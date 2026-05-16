import Dexie, { Table } from 'dexie';

// Interfaces for our local tables
export interface LocalEvent {
  id?: number; // Auto-incremented primary key for local storage
  streamId: string;
  streamType: string;
  eventType: string;
  data: any;
  metadata?: any;
  tenantId: string;
  synced: boolean;
  createdAt: string; // ISO string
}

export interface LocalProfile {
  id: string; // uuid
  schoolId: string;
  fullName: string;
  role: string;
  customId: string;
  avatarUrl?: string;
  phoneNumber?: string;
  status: string;
}

export interface LocalSlip {
  id: string; // uuid
  schoolId: string;
  studentId: string;
  slipNumber: string;
  amount: number;
  status: string;
  imageUrl?: string;
  verifiedBy?: string;
}

export class CraftSmsDatabase extends Dexie {
  // Define tables
  events!: Table<LocalEvent, number>;
  profiles!: Table<LocalProfile, string>;
  slips!: Table<LocalSlip, string>;

  constructor() {
    super('CraftSmsOfflineDB');
    
    // Define the schema
    this.version(1).stores({
      events: '++id, streamId, eventType, tenantId, synced, createdAt',
      profiles: 'id, schoolId, role, customId',
      slips: 'id, schoolId, studentId, slipNumber, status'
    });
  }

  /**
   * Append an event locally and apply it to local projections.
   */
  async appendLocalEvent(eventData: Omit<LocalEvent, 'id' | 'synced' | 'createdAt'>) {
    const event = {
      ...eventData,
      synced: false,
      createdAt: new Date().toISOString(),
    };

    return this.transaction('rw', this.events, this.profiles, this.slips, async () => {
      // 1. Add to local event log
      await this.events.add(event);

      // 2. Apply to local projection
      await this.projectLocal(event);
    });
  }

  private async projectLocal(event: any) {
    switch (event.eventType) {
      case 'PROFILE_CREATED':
        await this.profiles.put({
          id: event.streamId,
          schoolId: event.data.schoolId,
          fullName: event.data.fullName,
          role: event.data.role,
          customId: event.data.customId,
          phoneNumber: event.data.phoneNumber,
          status: event.data.status || 'ACTIVE',
        });
        break;
      case 'SLIP_CREATED':
        await this.slips.put({
          id: event.streamId,
          schoolId: event.data.schoolId,
          studentId: event.data.studentId,
          slipNumber: event.data.slipNumber,
          amount: event.data.amount,
          status: 'PENDING',
          imageUrl: event.data.imageUrl,
        });
        break;
      case 'SLIP_VERIFIED':
        await this.slips.update(event.streamId, {
          status: 'VERIFIED',
          verifiedBy: event.data.verifiedBy,
        });
        break;
    }
  }

  /**
   * Get unsynced events to push to the server
   */
  async getUnsyncedEvents() {
    return this.events.where('synced').equals(0).toArray();
  }

  /**
   * Mark events as synced after successful push
   */
  async markAsSynced(eventIds: number[]) {
    await this.events.bulkUpdate(
      eventIds.map(id => ({ key: id, changes: { synced: true } }))
    );
  }
}

export const db = new CraftSmsDatabase();
