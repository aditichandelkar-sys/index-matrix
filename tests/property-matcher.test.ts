import { describe, it, expect } from 'vitest';
import { matchesSearchConsoleProperty, findBestMatchingProperty } from '@/lib/property-matcher';

describe('Search Console Property Matcher', () => {
  describe('Domain Properties (sc-domain:example.com)', () => {
    const prop = 'sc-domain:example.com';

    it('matches exact root domain on https', () => {
      expect(matchesSearchConsoleProperty('https://example.com/', prop)).toBe(true);
      expect(matchesSearchConsoleProperty('https://example.com/blog/article', prop)).toBe(true);
    });

    it('matches exact root domain on http', () => {
      expect(matchesSearchConsoleProperty('http://example.com/', prop)).toBe(true);
    });

    it('matches subdomains (www, blog, api)', () => {
      expect(matchesSearchConsoleProperty('https://www.example.com/about', prop)).toBe(true);
      expect(matchesSearchConsoleProperty('https://blog.example.com/posts', prop)).toBe(true);
      expect(matchesSearchConsoleProperty('http://api.sub.example.com/v1', prop)).toBe(true);
    });

    it('DOES NOT match partial string prefix attacks or other domains', () => {
      // Must not match example.com.evil.com
      expect(matchesSearchConsoleProperty('https://example.com.evil.org/attack', prop)).toBe(false);
      // Must not match notexample.com
      expect(matchesSearchConsoleProperty('https://notexample.com/', prop)).toBe(false);
      // Must not match completely different domain
      expect(matchesSearchConsoleProperty('https://google.com/', prop)).toBe(false);
    });
  });

  describe('URL-Prefix Properties (https://example.com/blog/)', () => {
    const prop = 'https://example.com/blog/';

    it('matches exact path and subpaths under prefix', () => {
      expect(matchesSearchConsoleProperty('https://example.com/blog/', prop)).toBe(true);
      expect(matchesSearchConsoleProperty('https://example.com/blog/my-post', prop)).toBe(true);
      expect(matchesSearchConsoleProperty('https://example.com/blog/2026/10/guide', prop)).toBe(true);
    });

    it('does NOT match different protocol (http)', () => {
      expect(matchesSearchConsoleProperty('http://example.com/blog/my-post', prop)).toBe(false);
    });

    it('does NOT match outside the path prefix', () => {
      expect(matchesSearchConsoleProperty('https://example.com/', prop)).toBe(false);
      expect(matchesSearchConsoleProperty('https://example.com/products/item', prop)).toBe(false);
    });

    it('does NOT match subdomains on URL-prefix property', () => {
      expect(matchesSearchConsoleProperty('https://www.example.com/blog/my-post', prop)).toBe(false);
    });
  });

  describe('Best Matching Property Selector', () => {
    const properties = [
      { id: '1', propertyUrl: 'sc-domain:example.com' },
      { id: '2', propertyUrl: 'https://example.com/blog/' },
    ];

    it('selects more specific URL-prefix property for matching paths', () => {
      const match = findBestMatchingProperty('https://example.com/blog/post-1', properties);
      expect(match.property?.id).toBe('2');
      expect(match.matchType).toBe('EXACT_PREFIX');
    });

    it('falls back to domain property when path is outside URL-prefix', () => {
      const match = findBestMatchingProperty('https://example.com/about', properties);
      expect(match.property?.id).toBe('1');
      expect(match.matchType).toBe('DOMAIN');
    });

    it('returns null when no property matches', () => {
      const match = findBestMatchingProperty('https://unauthorized-domain.com/', properties);
      expect(match.property).toBeNull();
      expect(match.matchType).toBeNull();
    });
  });
});
