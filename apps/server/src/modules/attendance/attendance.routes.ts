import { Router } from 'express';
import { getAttendance, recordAttendance } from './attendance.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']), getAttendance);
router.post('/record', authorize(['TEACHER', 'SCHOOL_ADMIN']), recordAttendance);

export default router;
