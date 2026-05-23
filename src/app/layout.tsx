import type { Metadata } from 'next';
import { GoogleAnalytics } from '@/components/common/GoogleAnalytics';
import { QueryProvider } from '@/lib/client/providers';
import { Toaster } from '@/components/ui';
import { ROOT_METADATA, STRUCTURED_DATA } from '@/lib/seo';
import ChatWidget from '@/components/common/ChatWidget';
import 'react-phone-input-2/lib/style.css';
import './globals.css';

export const metadata: Metadata = ROOT_METADATA;
const measurementId =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  '';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body>
        <QueryProvider>
          {children}
          <ChatWidget />
        </QueryProvider>
        <Toaster />
        <GoogleAnalytics gaId={measurementId} />
      </body>
    </html>
  );
}
