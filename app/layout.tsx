import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { RegisterServiceWorker } from '@/components/register-service-worker'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Prodexy',
  description: 'Gestão Financeira e Solicitações',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Prodexy',
  },
  icons: {
    icon: [
      {
        url: '/icon-192.png',
        sizes: '192x192',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
      },
    ],
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`font-sans antialiased`}>
        <RegisterServiceWorker />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
