import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'INDEX MATRIX — Enterprise SEO URL Intelligence & Indexing Platform',
  description:
    'Deep technical SEO URL analysis, Google Search Console integration, capability-aware indexing workflows, XML sitemap auditing, and auditable credit-based SaaS.',
  keywords: [
    'SEO url analyzer',
    'Google Search Console API',
    'URL inspection',
    'XML sitemap monitor',
    'indexing workflow',
    'technical SEO audit',
  ],
  authors: [{ name: 'INDEX MATRIX Platform' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
