import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AuditService } from '../../services/AuditService';
import { TimeService } from '../../services/TimeService';

export const getGrades = async (req: AuthRequest, res: Response) => {
  const { studentId, subject, term } = req.query;
  const schoolId = req.user!.schoolId;

  try {
    const grades = await prisma.grade.findMany({
      where: {
        schoolId,
        ...(studentId ? { studentId: studentId as string } : {}),
        ...(subject ? { subject: subject as string } : {}),
        ...(term ? { term: term as string } : {}),
      },
      include: {
        student: { select: { fullName: true, customId: true } },
        history: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
};

export const upsertGrade = async (req: AuthRequest, res: Response) => {
  const { studentId, subject, score, term, changeReason, clientTimestamp } = req.body;
  const schoolId = req.user!.schoolId;
  const actorId = req.user!.id;

  try {
    // 1. Authoritative Chronology
    const { normalizedTime, isDisputed } = TimeService.normalize(clientTimestamp || new Date());
    
    // 2. State Verification
    const existingGrade = await prisma.grade.findFirst({
      where: { schoolId, studentId, subject, term }
    });

    if (existingGrade && existingGrade.status === 'FINALIZED') {
      return res.status(403).json({ error: 'Institutional constraint: Cannot modify finalized academic records' });
    }

    // 3. Atomic Mutation & Audit
    const result = await prisma.$transaction(async (tx) => {
      const grade = await tx.grade.upsert({
        where: { id: existingGrade?.id || 'new-id' },
        update: { score, gradedBy: actorId, updatedAt: normalizedTime },
        create: { 
          schoolId, 
          studentId, 
          subject, 
          score, 
          term, 
          gradedBy: actorId,
          createdAt: normalizedTime,
          updatedAt: normalizedTime
        }
      });

      // 4. Immutable Grade History
      if (!existingGrade || existingGrade.score?.toNumber() !== score) {
        await tx.gradeHistory.create({
          data: {
            gradeId: grade.id,
            oldScore: existingGrade?.score || null,
            newScore: score,
            changedBy: actorId,
            changeReason: changeReason || (existingGrade ? 'Score update' : 'Initial entry'),
            createdAt: normalizedTime
          }
        });
      }

      // 5. Mandatory Institutional Audit Chain
      await AuditService.log({
        schoolId,
        actorId,
        entityType: 'GRADE',
        entityId: grade.id,
        action: existingGrade ? 'UPDATE' : 'CREATE',
        previousState: existingGrade ? { score: existingGrade.score } : null,
        newState: { score: grade.score },
        metadata: {
          clientTimestamp,
          normalizedTime,
          isDisputed,
          deviceAttributionId: req.headers['x-device-id'] // Phase 2: Verified Device Identity
        }
      });

      return grade;
    });

    res.json(result);
  } catch (error) {
    console.error('[GradesController] Institutional mutation failed:', error);
    res.status(500).json({ error: 'Failed to record institutional grade entry' });
  }
};
