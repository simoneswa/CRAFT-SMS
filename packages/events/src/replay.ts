import { prisma } from '@craft-sms/database';
import { EventAppendService } from './index';

export class ReplayService {
  /**
   * Replays all events from the Event Store to rebuild projections.
   * WARNING: This will TRUNCATE existing projection tables.
   */
  static async replayAll() {
    console.log('Starting full projection replay...');

    // 1. Delete from projection tables (order matters due to foreign keys)
    await prisma.$transaction([
      prisma.$executeRawUnsafe('DELETE FROM slips;'),
      prisma.$executeRawUnsafe('DELETE FROM profiles;'),
      prisma.$executeRawUnsafe('DELETE FROM schools;'),
    ]);

    console.log('Projection tables truncated.');

    // 2. Fetch all events ordered by global creation time
    const events = await prisma.eventStore.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${events.length} events to replay.`);

    // 3. Replay each event
    // Using a sequential replay to guarantee deterministic state reconstruction
    for (const event of events) {
      await prisma.$transaction(async (tx) => {
        // Accessing the private project method via any for the sake of the replay utility
        await (EventAppendService as any).project(event, tx);
      });
    }

    console.log('Replay completed successfully.');
  }

  /**
   * Replay events for a specific tenant.
   * Useful for targeted recovery or debugging.
   */
  static async replayTenant(tenantId: string) {
    console.log(`Starting replay for tenant: ${tenantId}...`);
    
    // Clean only tenant's data
    await prisma.$transaction([
      prisma.slip.deleteMany({ where: { schoolId: tenantId } }),
      prisma.profile.deleteMany({ where: { schoolId: tenantId } }),
      prisma.school.deleteMany({ where: { id: tenantId } }),
    ]);

    const events = await prisma.eventStore.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    for (const event of events) {
      await prisma.$transaction(async (tx) => {
        await (EventAppendService as any).project(event, tx);
      });
    }

    console.log(`Tenant replay completed: ${events.length} events processed.`);
  }
}
