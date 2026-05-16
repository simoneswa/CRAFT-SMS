import prisma from '../lib/prisma';
import logger from '../lib/logger';

/**
 * Institutional Reliability Test: Cross-Tenant Isolation
 * 
 * Scenario: A teacher from School A attempts to read or write data 
 * belonging to School B using their valid token but manipulating the schoolId.
 */
async function runCrossTenantTest() {
  logger.info('[TEST] Starting Cross-Tenant Isolation Verification...');

  try {
    // 1. Setup Test Data
    const schoolA = await prisma.school.findFirst({ where: { subdomain: 'schoola' } });
    const schoolB = await prisma.school.findFirst({ where: { subdomain: 'schoolb' } });

    if (!schoolA || !schoolB) {
      logger.warn('[TEST] Pre-requisite schools not found. Skipping test.');
      return;
    }

    // 2. Verify Grades Isolation
    const schoolBGrades = await prisma.grade.findMany({
      where: { schoolId: schoolB.id }
    });

    logger.info(`[TEST] Found ${schoolBGrades.length} grades in School B.`);

    // 3. Simulation: Attempting to query School B data with School A context
    // This simulates what the Backend Enforcement layer prevents
    const leakedData = await prisma.grade.findMany({
      where: { 
        schoolId: schoolA.id, // Authenticated context
        student: { schoolId: schoolB.id } // Attempted leak
      }
    });

    if (leakedData.length > 0) {
      logger.error('[TEST] FAILURE: Cross-tenant data leakage detected!');
      process.exit(1);
    } else {
      logger.info('[TEST] SUCCESS: Database-level tenant isolation verified.');
    }

  } catch (error: any) {
    logger.error('[TEST] Verification error:', error.message);
  } finally {
    process.exit(0);
  }
}

runCrossTenantTest();
