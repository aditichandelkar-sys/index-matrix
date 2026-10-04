import { describe, it, expect } from 'vitest';
import { dispatchFastIndexing } from '@/lib/fast-indexer';

describe('Fast Indexer Multi-Vector Googlebot Crawl Engine', () => {
  it('dispatches multi-vector crawl triggers for 3rd-party forum thread URLs', async () => {
    const forumUrl = 'https://gb32.proboards.com/thread/4903/emergency-conditioner-repair-number-help';

    const result = await dispatchFastIndexing(forumUrl, {
      appBaseUrl: 'http://localhost:3000',
    });

    expect(result).toBeDefined();
    expect(result.targetUrl).toBe(forumUrl);
    expect(result.totalVectors).toBe(5);
    expect(result.successfulVectors).toBeGreaterThanOrEqual(4);
    expect(result.overallStatus).toBe('DISPATCHED');

    // Verify all 5 vectors exist
    const vectorKeys = result.vectors.map((v) => v.vector);
    expect(vectorKeys).toContain('GOOGLE_TRANSLATE_PROXY');
    expect(vectorKeys).toContain('GOOGLE_PUBSUBHUBBUB');
    expect(vectorKeys).toContain('SITEMAP_PING');
    expect(vectorKeys).toContain('INDEXNOW_API');
    expect(vectorKeys).toContain('RELAY_GATEWAY');
  });

  it('dispatches multi-vector crawl triggers for 3rd-party uploaded PDF documents', async () => {
    const pdfUrl = 'https://exceptionalhh.com/wp-content/uploads/everest_forms_uploads/tmp/c93a9f5a0463d286267606fbc9472cb1.pdf';

    const result = await dispatchFastIndexing(pdfUrl, {
      appBaseUrl: 'http://localhost:3000',
    });

    expect(result).toBeDefined();
    expect(result.targetUrl).toBe(pdfUrl);
    expect(result.totalVectors).toBe(5);
    expect(result.successfulVectors).toBeGreaterThanOrEqual(4);
    expect(result.overallStatus).toBe('DISPATCHED');
    expect(result.dispatchDurationMs).toBeGreaterThan(0);
  });
});
