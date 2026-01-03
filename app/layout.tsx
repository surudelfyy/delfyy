import type { Metadata } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import './globals.css'

const sourceSans = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
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
    <html lang="en" className="bg-zinc-950">
      <body
        className={`${sourceSans.variable} ${sourceSerif.variable} font-sans bg-zinc-950 text-zinc-50 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
