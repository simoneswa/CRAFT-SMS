import prisma from '../lib/prisma';

export interface AuditEvent {
  schoolId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FINALIZE' | 'EXPORT' | 'RBAC_CHANGE' | 'TRUST_DEVICE';
  previousState?: any;
  newState?: any;
  metadata?: any;
}

export class AuditService {
  static async log(event: AuditEvent) {
    try {
      return await prisma.auditChain.create({
        data: {
          schoolId: event.schoolId,
          actorId: event.actorId,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          previousState: event.previousState,
          newState: event.newState,
          metadata: {
            ...event.metadata,
            serverTimestamp: new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      console.error('[AuditService] Failed to log institutional event:', error);
      // In a production environment, we would also log this to a secondary buffer (Redis/Sentry)
    }
  }
}
