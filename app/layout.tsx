import type { Metadata } from 'next'
// Suppress TypeScript error for side-effect CSS import when no global d.ts is present
// @ts-ignore
import './globals.css'

export const metadata: Metadata = {
  title: 'Bolão da Copa',
  description: 'App para gerenciar seu bolão da Copa do Mundo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
