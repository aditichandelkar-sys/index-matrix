import * as cheerio from 'cheerio';
import { validateUrlForSSRF } from './ssrf';

export interface ParsedSitemapResult {
  isIndex: boolean;
  urls: string[];
  subSitemaps: string[];
  totalExtracted: number;
  error?: string;
}

const MAX_SITEMAP_URLS = 10000;

/**
 * Fetches and parses an XML sitemap or sitemap index
 */
export async function parseSitemap(sitemapUrl: string): Promise<ParsedSitemapResult> {
  const ssrf = await validateUrlForSSRF(sitemapUrl);
  if (!ssrf.isSafe) {
    return {
      isIndex: false,
      urls: [],
      subSitemaps: [],
      totalExtracted: 0,
      error: `SSRF Block: ${ssrf.reason}`,
    };
  }

  try {
    const res = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'IndexMatrixBot/1.0 (+https://indexmatrix.io/sitemap-bot)',
        Accept: 'application/xml,text/xml,*/*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return {
        isIndex: false,
        urls: [],
        subSitemaps: [],
        totalExtracted: 0,
        error: `HTTP ${res.status}: Failed to retrieve sitemap`,
      };
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // 1. Check if Sitemap Index
    const sitemapTags = $('sitemapindex > sitemap > loc');
    if (sitemapTags.length > 0) {
      const subSitemaps: string[] = [];
      sitemapTags.each((_, el) => {
        const loc = $(el).text().trim();
        if (loc) subSitemaps.push(loc);
      });

      return {
        isIndex: true,
        urls: [],
        subSitemaps,
        totalExtracted: subSitemaps.length,
      };
    }

    // 2. Standard URL Set
    const urlLocs = $('urlset > url > loc');
    const urlSet = new Set<string>();

    urlLocs.each((_, el) => {
      if (urlSet.size >= MAX_SITEMAP_URLS) return false;
      const loc = $(el).text().trim();
      if (loc && /^https?:\/\//i.test(loc)) {
        urlSet.add(loc);
      }
    });

    const urls = Array.from(urlSet);
    return {
      isIndex: false,
      urls,
      subSitemaps: [],
      totalExtracted: urls.length,
    };
  } catch (err: any) {
    return {
      isIndex: false,
      urls: [],
      subSitemaps: [],
      totalExtracted: 0,
      error: err.message || 'Error parsing sitemap XML',
    };
  }
}
