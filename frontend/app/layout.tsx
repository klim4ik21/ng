import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Новогодний челлендж',
  description: '7 дней до Нового года',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#f97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}

