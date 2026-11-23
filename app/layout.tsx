import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Poppins } from 'next/font/google'
import { site } from '@/lib/site'
import Providers from '@/components/chrome/Providers'
import Header from '@/components/chrome/Header'
import ServiceBar from '@/components/chrome/ServiceBar'
import Footer from '@/components/chrome/Footer'
import HideOn from '@/components/chrome/HideOn'
import Preloader from '@/components/chrome/Preloader'
import CartDrawer from '@/components/cart/CartDrawer'
import LeadPopup from '@/components/lead/LeadPopup'
import BagReminder from '@/components/lead/BagReminder'
import './globals.css'

/**
 * House typefaces (from the brand kit): Rossanova for titles, Poppins for names and text.
 * The supplied Rossanova file has placeholder numerals, so they are stripped from the web font
 * and figures fall back to Poppins automatically.
 * LICENCE: the brand-kit file is the "Personal Use" cut — buy the commercial web licence before launch.
 */
const display = localFont({
  src: './fonts/Rossanova-Regular.woff2',
  weight: '400',
  style: 'normal',
  variable: '--f-display',
  display: 'swap',
  adjustFontFallback: false,
})
const sans = Poppins({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--f-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_IN',
    images: [{ url: '/media/social-collection.jpg', width: 1200, height: 630, alt: 'Amber Hour, Open Sky and Iron Crown by After Bells' }],
  },
  twitter: { card: 'summary_large_image', images: ['/media/social-collection.jpg'] },
  appleWebApp: { title: site.name, statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2a211a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Runs before paint: the intro curtain plays only for a first visit that lands on the home page.
// Guests arriving on a fragrance, the collection or checkout (ads, shared links) see the page at once.
const introScript = `try{var d=document.documentElement;d.classList.remove('no-js');var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(r)d.classList.add('ab-reduced');if(r||location.pathname!=='/'||sessionStorage.getItem('ab-intro')){d.classList.add('ab-skip-intro')}}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`no-js ${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Providers>
          {/* the waitlist stands alone: no shop chrome around it */}
          <HideOn prefix="/waitlist">
            <Preloader />
            <ServiceBar />
            <Header />
          </HideOn>
          <main id="main">{children}</main>
          <HideOn prefix="/waitlist">
            <Footer />
            <CartDrawer />
            <LeadPopup />
            <BagReminder />
          </HideOn>
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  )
}
