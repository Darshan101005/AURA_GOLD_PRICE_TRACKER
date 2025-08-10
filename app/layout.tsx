import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

const siteUrl = 'https://auragold.netlify.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aura Gold Price Tracker | Live 24K Gold & Silver Rates',
    template: '%s | Aura Gold Price Tracker',
  },
  description:
    'Real-time 24K gold and silver price tracker with historical charts, daily high/low, buy/sell rates, and CSV export. Updated every 5 minutes.',
  keywords: [
    'gold price',
    'gold rate today',
    '24k gold price',
    'silver price',
    'gold price chart',
    'aura digital gold',
    'gold buy price',
    'gold sell price',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Aura Gold Price Tracker | Live 24K Gold & Silver Rates',
    description:
      'Track live gold and silver prices with daily high/low, historical charts, and CSV export. Updated every 5 minutes.',
    siteName: 'Aura Gold Price Tracker',
    images: [
      {
        url: 'https://auragold.in/Shine.svg',
        alt: 'Aura Gold Price Tracker Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aura Gold Price Tracker | Live 24K Gold & Silver Rates',
    description:
      'Live gold and silver rate tracker with charts, daily high/low, and CSV export. Auto-refreshed.',
    images: ['https://auragold.in/Shine.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: 'https://auragold.in/Shine.svg',
    shortcut: 'https://auragold.in/Shine.svg',
    apple: 'https://auragold.in/Shine.svg',
  },
  verification: {
    google: 'Ua57rIKifJyZ1KFTeJdG0L7wCaDMJg42oM_gugB0dWo',
  },
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="Ua57rIKifJyZ1KFTeJdG0L7wCaDMJg42oM_gugB0dWo" />
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Aura Gold Price Tracker',
              url: siteUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${siteUrl}/?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Aura Digital',
              url: siteUrl,
              logo: 'https://auragold.in/Shine.svg',
            }),
          }}
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
