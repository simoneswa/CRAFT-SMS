import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AuditService } from '../../services/AuditService';
import { TimeService } from '../../services/TimeService';

export const getAttendance = async (req: AuthRequest, res: Response) => {
  const { date, studentId } = req.query;
  const schoolId = req.user!.schoolId;

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        schoolId,
        ...(date ? { date: new Date(date as string) } : {}),
        ...(studentId ? { studentId: studentId as string } : {}),
      },
      include: {
        student: { select: { fullName: true, customId: true } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const recordAttendance = async (req: AuthRequest, res: Response) => {
  const { studentId, status, date, reason, clientTimestamp } = req.body;
  const schoolId = req.user!.schoolId;
  const actorId = req.user!.id;

  try {
    // 1. Authoritative Chronology
    const { normalizedTime, isDisputed } = TimeService.normalize(clientTimestamp || new Date());
    const recordDate = date ? new Date(date) : normalizedTime;
    
    // 2. Transaction: State Update + Immutable Event + Institutional Audit
    const result = await prisma.$transaction(async (tx) => {
      // Find or Create the daily record anchor
      const attendance = await tx.attendance.upsert({
        where: {
          id: (await tx.attendance.findFirst({
            where: { schoolId, studentId, date: recordDate }
          }))?.id || 'new-uuid' // Use valid placeholder or handle separately
        },
        update: { status, recordedBy: actorId, updatedAt: normalizedTime },
        create: {
          schoolId,
          studentId,
          status,
          date: recordDate,
          recordedBy: actorId,
          createdAt: normalizedTime,
          updatedAt: normalizedTime
        }
      });

      // 3. Append-Only Event
      const event = await tx.attendanceEvent.create({
        data: {
          attendanceId: attendance.id,
          status,
          actorId,
          reason: reason || (attendance.createdAt.getTime() === normalizedTime.getTime() ? 'Initial entry' : 'Amendment'),
          eventType: attendance.createdAt.getTime() === normalizedTime.getTime() ? 'INITIAL' : 'AMENDMENT',
          createdAt: normalizedTime
        }
      });

      // 4. Institutional Audit Chain
      await AuditService.log({
        schoolId,
        actorId,
        entityType: 'ATTENDANCE',
        entityId: attendance.id,
        action: event.eventType === 'INITIAL' ? 'CREATE' : 'UPDATE',
        newState: { status, eventId: event.id },
        metadata: {
          clientTimestamp,
          normalizedTime,
          isDisputed,
          reason
        }
      });

      return attendance;
    });

    res.json(result);
  } catch (error) {
    console.error('[AttendanceController] Institutional mutation failed:', error);
    res.status(500).json({ error: 'Failed to record institutional attendance event' });
  }
};
