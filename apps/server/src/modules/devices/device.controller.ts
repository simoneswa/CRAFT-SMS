import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { AuditService } from '../../services/AuditService';

const DEVICE_SECRET = process.env.SUPABASE_JWT_SECRET || 'institutional-device-secret';

export const registerDevice = async (req: AuthRequest, res: Response) => {
  const { deviceId, metadata } = req.body;
  const schoolId = req.user!.schoolId;
  const actorId = req.user!.id;

  try {
    // 1. Transactional Registration
    const device = await prisma.deviceRegistration.upsert({
      where: { deviceId },
      update: { 
        metadata, 
        schoolId,
        lastSyncAt: new Date()
      },
      create: {
        schoolId,
        deviceId,
        metadata,
        createdAt: new Date()
      }
    });

    // 2. Generate Signed Institutional Identity Token
    // This token is used to verify that the device is trusted for future syncs
    const registrationToken = jwt.sign(
      { deviceId: device.deviceId, schoolId: device.schoolId },
      DEVICE_SECRET,
      { expiresIn: '365d' }
    );

    // 3. Mandatory Institutional Audit
    await AuditService.log({
      schoolId,
      actorId,
      entityType: 'DEVICE',
      entityId: device.id,
      action: 'TRUST_DEVICE',
      newState: { deviceId: device.deviceId, status: 'TRUSTED' },
      metadata: { metadata }
    });

    res.json({
      ...device,
      registrationToken
    });
  } catch (error) {
    console.error('[DeviceController] Institutional registration failed:', error);
    res.status(500).json({ error: 'Failed to verify institutional device' });
  }
};

export const getMyDevices = async (req: AuthRequest, res: Response) => {
  const schoolId = req.user!.schoolId;

  try {
    const devices = await prisma.deviceRegistration.findMany({
      where: { schoolId }
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch institutional device registry' });
  }
};
