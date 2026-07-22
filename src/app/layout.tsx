import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import SocialBar from '@/components/SocialBar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { getServerLang } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'KalaStree — Heritage by Her | GI-Verified Indian Crafts',
  description: "India's first GI-native marketplace for women artisans. Buy verified Geographical Indication products — Banarasi silk, Kashmir Pashmina, Madhubani art — directly from the women who make them.",
  keywords: 'GI products India, women artisans, Geographical Indication, handicrafts, Banarasi, Pashmina, Madhubani',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang()

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider initialLang={lang}>
          <div className="folk-band" />
          <SocialBar />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  )
}
