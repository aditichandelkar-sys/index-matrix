import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch last 500 submitted or imported URLs
    const urls = await prisma.url.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: {
        normalizedUrl: true,
        updatedAt: true,
      },
    });

    const xmlItems = urls
      .map(
        (u) => `  <url>
    <loc>${escapeXml(u.normalizedUrl)}</loc>
    <lastmod>${u.updatedAt.toISOString()}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>`
      )
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;

    return new NextResponse(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
