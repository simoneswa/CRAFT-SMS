import { Router } from 'express';
import { registerDevice, getMyDevices } from './device.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getMyDevices);
router.post('/register', registerDevice); // Any authenticated user can register their device

export default router;
