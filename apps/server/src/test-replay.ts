import 'dotenv/config';
import { prisma } from '@craft-sms/database';
import { ReplayService } from '@craft-sms/events/src/replay';

async function main() {
  console.log('Starting automated replay test...');
  
  // 1. Check current counts
  const initialSchools = await prisma.school.count();
  const initialEvents = await prisma.eventStore.count();
  
  console.log(`Current state: ${initialEvents} events, ${initialSchools} schools.`);

  // 2. Perform Replay
  await ReplayService.replayAll();

  // 3. Verify
  const postReplaySchools = await prisma.school.count();
  
  console.log(`Post-replay state: ${postReplaySchools} schools.`);
  
  if (initialSchools === postReplaySchools) {
    console.log('✅ Replay validation PASSED. Projections successfully rebuilt from EventStore.');
  } else {
    console.error('❌ Replay validation FAILED. Projection counts mismatch.');
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
