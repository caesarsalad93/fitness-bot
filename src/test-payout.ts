import { testWeeklyPayout } from './drizzle/queries.js';

async function runTest() {
  try {
    await testWeeklyPayout();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();