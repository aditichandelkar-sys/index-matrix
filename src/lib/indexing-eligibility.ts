/**
 * Google Indexing API Capability & Eligibility Gate
 *
 * Official Google Guidelines:
 * "The Google Indexing API allows any site owner to directly notify Google when pages
 * with JobPosting or BroadcastEvent embedded in a VideoObject are added or removed."
 * Google strictly prohibits using the Indexing API for general web pages, blog posts,
 * eCommerce product listings, etc. Using it on non-eligible content risks domain penalties.
 *
 * For standard pages, INDEX MATRIX provides:
 * 1. Deep Technical Accessibility & SSRF-Hardened Audit
 * 2. Official Google Search Console URL Inspection API status check
 * 3. XML Sitemap discovery submission to GSC
 */

export interface IndexingEligibilityCheck {
  isEligibleForDirectIndexingApi: boolean;
  contentType: 'JOB_POSTING' | 'BROADCAST_EVENT' | 'STANDARD_WEB_PAGE';
  reasons: string[];
  recommendedWorkflow: string;
}

/**
 * Evaluates whether an analyzed page's schema data makes it eligible for Google Indexing API
 */
export function evaluateIndexingApiEligibility(htmlContent?: string, structuredDataTypes?: string[]): IndexingEligibilityCheck {
  const detectedTypes = new Set<string>(structuredDataTypes || []);

  if (htmlContent) {
    // Check JSON-LD structured data for JobPosting or BroadcastEvent
    if (/"@type"\s*:\s*"JobPosting"/i.test(htmlContent) || /"@type"\s*:\s*\[[^\]]*"JobPosting"[^\]]*\]/i.test(htmlContent)) {
      detectedTypes.add('JobPosting');
    }
    if (/"@type"\s*:\s*"BroadcastEvent"/i.test(htmlContent) || /"@type"\s*:\s*\[[^\]]*"BroadcastEvent"[^\]]*\]/i.test(htmlContent)) {
      detectedTypes.add('BroadcastEvent');
    }
  }

  if (detectedTypes.has('JobPosting')) {
    return {
      isEligibleForDirectIndexingApi: true,
      contentType: 'JOB_POSTING',
      reasons: ['Valid JobPosting schema detected. Officially supported by Google Indexing API.'],
      recommendedWorkflow: 'DIRECT_INDEXING_API'
    };
  }

  if (detectedTypes.has('BroadcastEvent')) {
    return {
      isEligibleForDirectIndexingApi: true,
      contentType: 'BROADCAST_EVENT',
      reasons: ['Valid BroadcastEvent schema detected. Officially supported by Google Indexing API.'],
      recommendedWorkflow: 'DIRECT_INDEXING_API'
    };
  }

  return {
    isEligibleForDirectIndexingApi: false,
    contentType: 'STANDARD_WEB_PAGE',
    reasons: [
      'Standard web page without JobPosting or BroadcastEvent structured data.',
      'Google policy restricts direct Indexing API calls to JobPosting and BroadcastEvent types only.',
      'Arbitrary URL submission to Google Indexing API violates Google terms of service.'
    ],
    recommendedWorkflow: 'SEARCH_CONSOLE_INSPECTION_AND_SITEMAP'
  };
}
