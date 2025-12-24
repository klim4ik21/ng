import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import TelegramInit from './components/TelegramInit'

export const metadata: Metadata = {
  title: 'Новогодний челлендж',
  description: '7 дней до Нового года',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
  userScalable: false, // Отключаем зум для лучшего UX в Telegram
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        {/* Telegram WebApp скрипт */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="afterInteractive"
        />
        <TelegramInit />
        {children}
      </body>
    </html>
  )
}

