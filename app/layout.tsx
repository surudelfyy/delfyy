import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport = {
  themeColor: '#09090b', // zinc-950
}

export const metadata: Metadata = {
  title: 'Delfyy',
  description: 'Defensible decisions, delivered clearly.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-zinc-950 overflow-x-hidden`}
    >
      <body className="font-body bg-zinc-950 text-zinc-100 min-h-screen antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
