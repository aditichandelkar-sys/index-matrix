import * as cheerio from 'cheerio';
import { validateUrlForSSRF } from './ssrf';
import { evaluateIndexingApiEligibility } from './indexing-eligibility';

export interface AuditIssue {
  issue: 'INVALID_URL' | 'HTTP_ERROR' | 'REDIRECT' | 'UNAVAILABLE' | 'NON_HTML' | 'NOINDEX' | 'ROBOTS_BLOCKED' | 'CANONICAL_MISMATCH' | 'HTTPS_PROBLEM' | 'TIMEOUT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  explanation: string;
  recommendedFix: string;
}

export interface RedirectHop {
  url: string;
  statusCode: number;
}

export interface AnalysisResult {
  url: string;
  normalizedUrl: string;
  httpStatus: number;
  responseTimeMs: number;
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  robotsMeta: string | null;
  xRobotsTag: string | null;
  canonicalUrl: string | null;
  robotsTxtStatus: 'ALLOWED' | 'DISALLOWED' | 'NOT_FOUND' | 'ERROR';
  redirectChain: RedirectHop[];
  issues: AuditIssue[];
  passedAudit: boolean;
  hasStructuredJob: boolean;
  analyzedAt: string;
}

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Executes a deep, SSRF-hardened technical SEO audit on a URL
 */
export async function analyzeUrl(targetUrl: string): Promise<AnalysisResult> {
  const issues: AuditIssue[] = [];
  const redirectChain: RedirectHop[] = [];
  const startTime = Date.now();

  let currentUrl = targetUrl;
  let finalResponse: Response | null = null;
  let responseBody = '';
  let contentType = '';

  // 1. Initial SSRF check on target
  const initialSsrf = await validateUrlForSSRF(currentUrl);
  if (!initialSsrf.isSafe) {
    return {
      url: targetUrl,
      normalizedUrl: targetUrl,
      httpStatus: 0,
      responseTimeMs: Date.now() - startTime,
      contentType: 'none',
      title: null,
      metaDescription: null,
      robotsMeta: null,
      xRobotsTag: null,
      canonicalUrl: null,
      robotsTxtStatus: 'ERROR',
      redirectChain: [],
      issues: [{
        issue: 'INVALID_URL',
        severity: 'CRITICAL',
        explanation: `SSRF Security Block: ${initialSsrf.reason || 'Target URL rejected by SSRF firewall.'}`,
        recommendedFix: 'Specify a publicly accessible HTTP/HTTPS URL on a public domain.'
      }],
      passedAudit: false,
      hasStructuredJob: false,
      analyzedAt: new Date().toISOString()
    };
  }

  // Check for HTTPS
  if (!currentUrl.startsWith('https://')) {
    issues.push({
      issue: 'HTTPS_PROBLEM',
      severity: 'WARNING',
      explanation: 'The initial URL is served over unencrypted HTTP.',
      recommendedFix: 'Enforce HTTPS with an SSL/TLS certificate and 301 permanent redirect.'
    });
  }

  // 2. Fetch loop with SSRF-safe redirect following
  let hops = 0;
  while (hops < MAX_REDIRECTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'IndexMatrixBot/1.0 (+https://indexmatrix.io/bot-info; technical-auditor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual', // Manually handle redirects to inspect and validate each hop
        signal: controller.signal
      });

      clearTimeout(timeout);
      redirectChain.push({ url: currentUrl, statusCode: res.status });

      // Handle Redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) {
          issues.push({
            issue: 'REDIRECT',
            severity: 'WARNING',
            explanation: `Received HTTP ${res.status} redirect without a Location header.`,
            recommendedFix: 'Ensure server provides a valid Location header on redirect.'
          });
          finalResponse = res;
          break;
        }

        // Resolve relative redirects
        const nextUrl = new URL(location, currentUrl).toString();

        // Re-validate next hop against SSRF firewall!
        const hopSsrf = await validateUrlForSSRF(nextUrl);
        if (!hopSsrf.isSafe) {
          issues.push({
            issue: 'INVALID_URL',
            severity: 'CRITICAL',
            explanation: `Redirect destination (${nextUrl}) blocked by SSRF firewall: ${hopSsrf.reason}`,
            recommendedFix: 'Ensure server does not redirect to internal or private addresses.'
          });
          finalResponse = res;
          break;
        }

        currentUrl = nextUrl;
        hops++;
        continue;
      }

      // Not a redirect, this is our final response
      finalResponse = res;
      contentType = res.headers.get('content-type') || '';
      
      // Read response body up to 2MB limit
      const reader = res.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.length;
            if (totalBytes > MAX_BYTES) {
              issues.push({
                issue: 'UNAVAILABLE',
                severity: 'WARNING',
                explanation: 'Page size exceeded 2MB limit; body was truncated for parsing.',
                recommendedFix: 'Optimize page size and compress heavy HTML/CSS payload.'
              });
              break;
            }
            chunks.push(value);
          }
        }
        const concatenated = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }
        responseBody = new TextDecoder('utf-8').decode(concatenated);
      }
      break;

    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        issues.push({
          issue: 'TIMEOUT',
          severity: 'CRITICAL',
          explanation: `Request timed out after ${TIMEOUT_MS / 1000} seconds.`,
          recommendedFix: 'Check server responsiveness and reduce slow database queries or server render delays.'
        });
      } else {
        issues.push({
          issue: 'UNAVAILABLE',
          severity: 'CRITICAL',
          explanation: `Network connection failed: ${err.message || 'Unknown network error'}`,
          recommendedFix: 'Verify the website is live, DNS is propagating, and firewalls allow inbound requests.'
        });
      }
      break;
    }
  }

  const responseTimeMs = Date.now() - startTime;
  const httpStatus = finalResponse ? finalResponse.status : 0;

  if (redirectChain.length > 1) {
    issues.push({
      issue: 'REDIRECT',
      severity: 'INFO',
      explanation: `URL redirected through ${redirectChain.length - 1} intermediate hop(s).`,
      recommendedFix: 'Update internal links directly to the final destination to preserve crawl budget.'
    });
  }

  if (httpStatus >= 400) {
    issues.push({
      issue: 'HTTP_ERROR',
      severity: 'CRITICAL',
      explanation: `Server returned HTTP client/server error code ${httpStatus}.`,
      recommendedFix: 'Fix broken links, handle server exceptions, or configure proper redirect headers.'
    });
  }

  // 3. Inspect headers
  const xRobotsTag = finalResponse?.headers.get('x-robots-tag') || null;
  if (xRobotsTag && /noindex/i.test(xRobotsTag)) {
    issues.push({
      issue: 'NOINDEX',
      severity: 'CRITICAL',
      explanation: `X-Robots-Tag header specifies "${xRobotsTag}", blocking search engine indexing.`,
      recommendedFix: 'Remove "noindex" from X-Robots-Tag HTTP header if this page should be indexed.'
    });
  }

  // 4. HTML Parsing
  let title: string | null = null;
  let metaDescription: string | null = null;
  let robotsMeta: string | null = null;
  let canonicalUrl: string | null = null;
  let hasStructuredJob = false;

  if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    issues.push({
      issue: 'NON_HTML',
      severity: 'WARNING',
      explanation: `Page content type is "${contentType}" rather than HTML.`,
      recommendedFix: 'Ensure web pages serve standard text/html content-type.'
    });
  } else if (responseBody) {
    try {
      const $ = cheerio.load(responseBody);

      title = $('title').first().text().trim() || null;
      metaDescription = $('meta[name="description" i]').attr('content')?.trim() || null;
      robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || null;
      canonicalUrl = $('link[rel="canonical" i]').attr('href')?.trim() || null;

      // Meta robots validation
      if (robotsMeta && /noindex/i.test(robotsMeta)) {
        issues.push({
          issue: 'NOINDEX',
          severity: 'CRITICAL',
          explanation: `<meta name="robots" content="${robotsMeta}"> is instructing crawlers not to index this page.`,
          recommendedFix: 'Remove the "noindex" directive from the robots meta tag.'
        });
      }

      // Canonical check
      if (canonicalUrl) {
        try {
          const canonicalParsed = new URL(canonicalUrl, currentUrl);
          const currentParsed = new URL(currentUrl);
          if (canonicalParsed.hostname !== currentParsed.hostname || canonicalParsed.pathname !== currentParsed.pathname) {
            issues.push({
              issue: 'CANONICAL_MISMATCH',
              severity: 'WARNING',
              explanation: `Canonical URL points to a different target: "${canonicalUrl}".`,
              recommendedFix: 'Verify whether this page is intended to be canonical, or if search engines should index the canonical target instead.'
            });
          }
        } catch {
          // malformed canonical
        }
      }

      // Title & description checks
      if (!title) {
        issues.push({
          issue: 'UNAVAILABLE',
          severity: 'WARNING',
          explanation: 'The page is missing an HTML <title> tag.',
          recommendedFix: 'Add a concise, descriptive <title> tag (50-60 characters) to improve indexing relevance.'
        });
      }

      // Check JobPosting / BroadcastEvent structured data
      const eligibility = evaluateIndexingApiEligibility(responseBody);
      hasStructuredJob = eligibility.isEligibleForDirectIndexingApi;

    } catch (e: any) {
      issues.push({
        issue: 'NON_HTML',
        severity: 'WARNING',
        explanation: 'Failed to parse page HTML structure: ' + e.message,
        recommendedFix: 'Check for malformed HTML or unclosed tags.'
      });
    }
  }

  // 5. Test robots.txt accessibility
  let robotsTxtStatus: 'ALLOWED' | 'DISALLOWED' | 'NOT_FOUND' | 'ERROR' = 'ALLOWED';
  try {
    const urlObj = new URL(currentUrl);
    const robotsTxtUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const rSsrf = await validateUrlForSSRF(robotsTxtUrl);
    if (rSsrf.isSafe) {
      const robotsRes = await fetch(robotsTxtUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'IndexMatrixBot/1.0' },
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      if (robotsRes && robotsRes.ok) {
        const text = await robotsRes.text();
        // Check simple user-agent: * Disallow: / or Disallow: path
        if (/User-agent:\s*\*\s*[\r\n]+Disallow:\s*\/\s*($|[\r\n])/i.test(text)) {
          robotsTxtStatus = 'DISALLOWED';
          issues.push({
            issue: 'ROBOTS_BLOCKED',
            severity: 'CRITICAL',
            explanation: 'Website robots.txt disallows all crawling under "User-agent: * Disallow: /".',
            recommendedFix: 'Update /robots.txt to allow search crawlers (Googlebot, etc.) to access indexable pages.'
          });
        }
      } else if (robotsRes && robotsRes.status === 404) {
        robotsTxtStatus = 'NOT_FOUND';
      }
    }
  } catch {
    // Non-blocking for analyzer
  }

  const passedAudit = issues.filter(i => i.severity === 'CRITICAL').length === 0 && httpStatus === 200;

  return {
    url: targetUrl,
    normalizedUrl: currentUrl,
    httpStatus,
    responseTimeMs,
    contentType,
    title,
    metaDescription,
    robotsMeta,
    xRobotsTag,
    canonicalUrl,
    robotsTxtStatus,
    redirectChain,
    issues,
    passedAudit,
    hasStructuredJob,
    analyzedAt: new Date().toISOString()
  };
}
