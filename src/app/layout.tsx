import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'KalaStree — Heritage by Her | GI-Verified Indian Crafts',
  description: "India's first GI-native marketplace for women artisans. Buy verified Geographical Indication products — Banarasi silk, Kashmir Pashmina, Madhubani art — directly from the women who make them.",
  keywords: 'GI products India, women artisans, Geographical Indication, handicrafts, Banarasi, Pashmina, Madhubani',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="folk-band" />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  )
}
