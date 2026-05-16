import { prisma } from '@craft-sms/database';
import { z } from 'zod';

export const EventSchema = z.object({
  streamId: z.string().uuid(),
  streamType: z.string(),
  eventType: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  tenantId: z.string().uuid(),
});

export type AppEvent = z.infer<typeof EventSchema>;

export class EventAppendService {
  /**
   * Appends an event to the Event Store and triggers projections.
   * This is the ONLY way to write to the system.
   */
  static async append(event: AppEvent) {
    // 1. Validate
    const validated = EventSchema.parse(event);

    return await prisma.$transaction(async (tx) => {
      // 2. Get latest version for stream (Optimistic Concurrency)
      const lastEvent = await tx.eventStore.findFirst({
        where: { streamId: validated.streamId },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (lastEvent?.version || 0) + 1;

      // 3. Append to Event Store
      const newEvent = await tx.eventStore.create({
        data: {
          ...validated,
          data: JSON.stringify(validated.data),
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : "{}",
          version: nextVersion,
        },
      });

      // 4. Update Projections (In a real system, this might be async/out-of-band)
      // For Phase A, we'll implement a simple synchronous projection update for core domains.
      await this.project(newEvent, tx);

      return newEvent;
    });
  }

  private static async project(event: any, tx: any) {
    // Projection logic
    console.log(`Projecting event: ${event.eventType} for stream: ${event.streamId}`);
    
    switch (event.eventType) {
      case 'SCHOOL_CREATED':
        await tx.school.create({
          data: {
            id: event.streamId,
            name: JSON.parse(event.data).name,
            subdomain: JSON.parse(event.data).subdomain,
            isActive: true,
          },
        });
        break;
      case 'PROFILE_CREATED':
        const profileData = JSON.parse(event.data);
        await tx.profile.create({
          data: {
            id: event.streamId,
            schoolId: profileData.schoolId,
            fullName: profileData.fullName,
            role: profileData.role,
            customId: profileData.customId,
            phoneNumber: profileData.phoneNumber,
            status: profileData.status || 'ACTIVE',
          },
        });
        break;
      case 'SLIP_CREATED':
        const slipData = JSON.parse(event.data);
        await tx.slip.create({
          data: {
            id: event.streamId,
            schoolId: slipData.schoolId,
            studentId: slipData.studentId,
            slipNumber: slipData.slipNumber,
            amount: slipData.amount,
            status: 'PENDING',
            imageUrl: slipData.imageUrl,
            notes: slipData.notes,
          },
        });
        break;
      case 'SLIP_VERIFIED':
        const verifyData = JSON.parse(event.data);
        await tx.slip.update({
          where: { id: event.streamId },
          data: {
            status: 'VERIFIED',
            verifiedBy: verifyData.verifiedBy,
            verifiedAt: new Date(event.createdAt || Date.now()),
            notes: verifyData.notes,
          },
        });
        break;
      // Add more projection cases...
    }
  }
}
