import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './db';
import { analyzeUrl } from './analyzer';
import { inspectUrlWithGoogle } from './google-client';

const REDIS_URL = process.env.REDIS_URL;
let redisConnection: IORedis | null = null;
let useInMemoryFallback = true;

// Attempt Redis connection if REDIS_URL configured
if (REDIS_URL && !REDIS_URL.includes('mock') && !REDIS_URL.includes('disabled')) {
  try {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: () => null, // don't spam if redis is down
    });
    redisConnection.connect().then(() => {
      useInMemoryFallback = false;
      console.log('[Queue] Connected to Redis successfully');
    }).catch(() => {
      useInMemoryFallback = true;
      console.log('[Queue] Redis not reachable; running in resilient in-process worker mode');
    });
  } catch {
    useInMemoryFallback = true;
  }
}

export interface JobData {
  jobId: string;
  userId: string;
  projectId?: string;
  urlId?: string;
  operation: 'ANALYZE' | 'INSPECT' | 'SUBMIT_SUPPORTED' | 'SITEMAP_DISCOVERY';
  targetUrl: string;
  metadata?: any;
}

// In-process fallback task queue
const inProcessQueue: JobData[] = [];
let isProcessingInProcess = false;

async function processInProcessQueue() {
  if (isProcessingInProcess) return;
  isProcessingInProcess = true;

  while (inProcessQueue.length > 0) {
    const jobData = inProcessQueue.shift();
    if (!jobData) break;
    await executeJobHandler(jobData);
  }

  isProcessingInProcess = false;
}

/**
 * Universal Job Execution Handler
 */
export async function executeJobHandler(data: JobData): Promise<void> {
  const { jobId, urlId, operation, targetUrl, metadata } = data;

  // Mark job as PROCESSING
  await prisma.indexJob.update({
    where: { id: jobId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  try {
    if (operation === 'ANALYZE') {
      const result = await analyzeUrl(targetUrl);

      if (urlId) {
        // Save analysis to DB
        await prisma.urlAnalysis.create({
          data: {
            urlId,
            httpStatus: result.httpStatus,
            redirectChain: JSON.stringify(result.redirectChain),
            responseTimeMs: result.responseTimeMs,
            contentType: result.contentType,
            title: result.title,
            metaDescription: result.metaDescription,
            robotsMeta: result.robotsMeta,
            canonicalUrl: result.canonicalUrl,
            xRobotsTag: result.xRobotsTag,
            robotsTxtStatus: result.robotsTxtStatus,
            issues: JSON.stringify(result.issues),
            passedAudit: result.passedAudit,
            hasStructuredJob: result.hasStructuredJob,
          },
        });

        // Determine new status
        let newStatus = 'ANALYZED';
        if (result.issues.some((i) => i.issue === 'NOINDEX' || i.issue === 'ROBOTS_BLOCKED')) {
          newStatus = 'BLOCKED';
        } else if (result.httpStatus >= 400 || result.httpStatus === 0) {
          newStatus = 'ERROR';
        }

        await prisma.url.update({
          where: { id: urlId },
          data: {
            status: newStatus as any,
            httpStatus: result.httpStatus,
            lastAnalyzedAt: new Date(),
          },
        });

        await prisma.urlStatusHistory.create({
          data: {
            urlId,
            newStatus: newStatus as any,
            source: 'ANALYSIS',
            reason: `Technical analysis completed: HTTP ${result.httpStatus}, ${result.issues.length} issue(s)`,
          },
        });
      }
    } else if (operation === 'INSPECT') {
      const { googleAccountId, propertyUrl } = metadata || {};
      if (!googleAccountId || !propertyUrl) {
        throw new Error('Missing Google Account or Property for inspection');
      }

      const inspection = await inspectUrlWithGoogle(googleAccountId, targetUrl, propertyUrl);
      const ir = inspection.inspectionResult;

      if (urlId) {
        await prisma.googleInspection.create({
          data: {
            urlId,
            verdict: ir.verdict || 'NEUTRAL',
            coverageState: ir.coverageState || null,
            indexingState: ir.indexingState || null,
            robotsTxtState: ir.robotsTxtState || null,
            pageFetchState: ir.pageFetchState || null,
            googleCanonical: ir.googleCanonical || null,
            userCanonical: ir.userCanonical || null,
            crawledAs: ir.crawledAs || null,
            lastCrawlTime: ir.lastCrawlTime ? new Date(ir.lastCrawlTime) : null,
            rawResponse: JSON.stringify(inspection.raw),
          },
        });

        let newStatus = 'ANALYZED';
        if (ir.verdict === 'PASS' || (ir.coverageState && ir.coverageState.toLowerCase().includes('indexed'))) {
          newStatus = 'INDEXED';
        } else if (ir.verdict === 'FAIL' || (ir.coverageState && ir.coverageState.toLowerCase().includes('not indexed'))) {
          newStatus = 'NOT_INDEXED';
        }

        await prisma.url.update({
          where: { id: urlId },
          data: {
            status: newStatus as any,
            lastInspectedAt: new Date(),
            lastCrawl: ir.lastCrawlTime ? new Date(ir.lastCrawlTime) : undefined,
          },
        });

        await prisma.urlStatusHistory.create({
          data: {
            urlId,
            newStatus: newStatus as any,
            source: 'GOOGLE_INSPECTION',
            reason: `GSC inspection verdict: ${ir.verdict} (${ir.coverageState || 'No coverage state'})`,
          },
        });
      }
    }

    // Mark job as COMPLETED
    await prisma.indexJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Record attempt
    await prisma.indexAttempt.create({
      data: {
        jobId,
        attemptNumber: 1,
        status: 'SUCCESS',
      },
    });

  } catch (err: any) {
    // Record error on job
    await prisma.indexJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: err.message || 'Job execution error',
      },
    });

    await prisma.indexAttempt.create({
      data: {
        jobId,
        attemptNumber: 1,
        status: 'FAILED',
        error: err.message,
      },
    });
  }
}

/**
 * Enqueues a job into either BullMQ (if Redis connected) or resilient in-process queue
 */
export async function enqueueJob(data: JobData): Promise<void> {
  if (useInMemoryFallback || !redisConnection) {
    inProcessQueue.push(data);
    // Asynchronously process in background
    setTimeout(() => {
      processInProcessQueue();
    }, 10);
    return;
  }

  // BullMQ Enqueue
  const queue = new Queue('index-matrix-jobs', { connection: redisConnection });
  await queue.add(data.operation, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
