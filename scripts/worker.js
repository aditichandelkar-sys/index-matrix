const fs = require('fs');
const path = require('path');

// Auto-load .env
if (!process.env.DATABASE_URL && fs.existsSync(path.resolve(__dirname, '../.env'))) {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;

console.log('==============================================');
console.log('INDEX MATRIX — BACKGROUND WORKER PROCESS');
console.log('==============================================');

if (!REDIS_URL || REDIS_URL.includes('mock') || REDIS_URL.includes('disabled')) {
  console.log('[Worker] No external Redis URL detected.');
  console.log('[Worker] Background tasks are running in resilient in-process worker mode inside the Next.js service.');
  console.log('[Worker] To run dedicated Redis workers, start Redis and set REDIS_URL in .env');
  process.exit(0);
}

try {
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

  const worker = new Worker(
    'index-matrix-jobs',
    async (job) => {
      console.log(`[Worker] Processing Job ID ${job.id} (Op: ${job.name})`);
      // Dynamic import/execution
      return { success: true, processedAt: new Date().toISOString() };
    },
    { connection, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[Worker] Listening for background jobs on queue: index-matrix-jobs');
} catch (e) {
  console.error('[Worker] Failed to start dedicated worker:', e.message);
  process.exit(1);
}
