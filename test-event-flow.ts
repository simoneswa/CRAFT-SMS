import { EventAppendService } from '@craft-sms/events';
import { prisma, DbUtility } from '@craft-sms/database';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const tenantId = uuidv4();
  const streamId = uuidv4();
  
  console.log('Testing EventAppendService...');
  try {
    // Clear event flow tables to ensure clean run
    await DbUtility.clearTables(['schools', 'event_store', 'audit_chain']);
    console.log('Database cleared.');

    const event = await EventAppendService.append({
      streamId,
      streamType: 'SCHOOL',
      eventType: 'SCHOOL_CREATED',
      tenantId,
      data: {
        name: 'Test School',
        subdomain: `test-school-${uuidv4().slice(0, 8)}`,
      },
    });

    console.log('Event appended:', event);

    const school = await prisma.school.findUnique({
      where: { id: streamId },
    });

    console.log('Projected School:', school);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
