import 'dotenv/config';
import { EventAppendService } from '@craft-sms/events';
import { prisma } from '@craft-sms/database';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const tenantId = uuidv4();
  const streamId = uuidv4();
  
  console.log('Testing EventAppendService...');
  try {
    const event = await EventAppendService.append({
      streamId,
      streamType: 'SCHOOL',
      eventType: 'SCHOOL_CREATED',
      tenantId,
      data: {
        name: 'Test School',
        subdomain: 'test-school',
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
