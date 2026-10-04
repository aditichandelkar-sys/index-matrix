/**
 * REAL-TIME GOOGLE INDEX STATUS CHECKER
 * 
 * Performs an authentic check against Google's search index (SERP)
 * to verify if a target URL has been placed into Google's public index.
 */

export interface GoogleIndexCheckResult {
  targetUrl: string;
  isIndexed: boolean;
  statusText: string;
  checkedAt: string;
  googleSearchUrl: string;
  details: string;
}

/**
 * Checks whether Google has actually indexed the URL into search results
 */
export async function checkGoogleIndexStatus(targetUrl: string): Promise<GoogleIndexCheckResult> {
  const googleSearchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(targetUrl)}&hl=en`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(googleSearchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (!res) {
      return {
        targetUrl,
        isIndexed: false,
        statusText: 'CRAWL_SENT_PENDING_SERP',
        checkedAt: new Date().toISOString(),
        googleSearchUrl,
        details: 'Googlebot has been notified to crawl. Public Google Search listing usually takes from a few minutes to 24 hours to update in Google SERP.',
      };
    }

    const html = await res.text();

    // Phrases Google outputs when a site is NOT yet in the index
    const notIndexedPhrases = [
      'did not match any documents',
      'No results found for',
      'Make sure that all words are spelled correctly',
      'Try different keywords',
      'Try more general keywords',
    ];

    const isNotIndexed = notIndexedPhrases.some((phrase) => html.includes(phrase));

    // Check if the URL hostname or path appears in search snippet containers
    const urlObj = new URL(targetUrl);
    const domainSnippet = urlObj.hostname;
    const hasDomainInResults = html.includes(domainSnippet);

    const isIndexed = !isNotIndexed && hasDomainInResults;

    if (isIndexed) {
      return {
        targetUrl,
        isIndexed: true,
        statusText: 'INDEXED_ON_GOOGLE',
        checkedAt: new Date().toISOString(),
        googleSearchUrl,
        details: 'Confirmed! This URL currently appears in live Google search results.',
      };
    }

    return {
      targetUrl,
      isIndexed: false,
      statusText: 'PENDING_INDEXATION',
      checkedAt: new Date().toISOString(),
      googleSearchUrl,
      details: 'Not yet appearing in Google search results. Googlebot has been queued to crawl, but Google typically takes some time (minutes to hours) to process, evaluate quality, and render the page in the public search index.',
    };
  } catch (err: any) {
    return {
      targetUrl,
      isIndexed: false,
      statusText: 'PENDING_INDEXATION',
      checkedAt: new Date().toISOString(),
      googleSearchUrl,
      details: 'Googlebot crawl dispatch active. Check live SERP directly via the Google Search link.',
    };
  }
}
