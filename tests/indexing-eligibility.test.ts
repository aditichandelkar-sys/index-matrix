import { describe, it, expect } from 'vitest';
import { evaluateIndexingApiEligibility } from '@/lib/indexing-eligibility';

describe('Google Indexing API Eligibility Guard', () => {
  it('identifies JobPosting structured data as eligible', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": "Senior SEO Engineer",
            "description": "Lead search visibility and indexing pipeline"
          }
          </script>
        </head>
      </html>
    `;

    const result = evaluateIndexingApiEligibility(html);
    expect(result.isEligibleForDirectIndexingApi).toBe(true);
    expect(result.contentType).toBe('JOB_POSTING');
    expect(result.recommendedWorkflow).toBe('DIRECT_INDEXING_API');
  });

  it('identifies BroadcastEvent structured data as eligible', () => {
    const html = `
      <html>
        <body>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BroadcastEvent",
            "name": "Live Product Launch 2026",
            "isLiveBroadcast": true
          }
          </script>
        </body>
      </html>
    `;

    const result = evaluateIndexingApiEligibility(html);
    expect(result.isEligibleForDirectIndexingApi).toBe(true);
    expect(result.contentType).toBe('BROADCAST_EVENT');
    expect(result.recommendedWorkflow).toBe('DIRECT_INDEXING_API');
  });

  it('rejects standard blog and article pages from direct Indexing API calls', () => {
    const html = `
      <html>
        <head><title>Top 10 SEO Tips for 2026</title></head>
        <body>
          <article>
            <h1>SEO Tips</h1>
            <p>Here are the best ways to get crawled...</p>
          </article>
        </body>
      </html>
    `;

    const result = evaluateIndexingApiEligibility(html);
    expect(result.isEligibleForDirectIndexingApi).toBe(false);
    expect(result.contentType).toBe('STANDARD_WEB_PAGE');
    expect(result.recommendedWorkflow).toBe('SEARCH_CONSOLE_INSPECTION_AND_SITEMAP');
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
