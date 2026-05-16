import { Router } from 'express';
import { getGrades, upsertGrade } from './grades.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']), getGrades);
router.post('/upsert', authorize(['TEACHER', 'SCHOOL_ADMIN']), upsertGrade);

export default router;
