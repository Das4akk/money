import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FORM STUDIO • Лиды Брянска',
  description: 'Профессиональная система поиска клиентов, аудита потерь и генерации продающих сообщений для бизнеса г. Брянска от Даниила (FORM STUDIO).',
  openGraph: {
    title: 'FORM STUDIO • Лиды Брянска',
    description: 'Профессиональная система поиска клиентов, аудита потерь и генерации продающих сообщений для бизнеса г. Брянска от Даниила (FORM STUDIO).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FORM STUDIO • Лиды Брянска',
    description: 'Профессиональная система поиска клиентов, аудита потерь и генерации продающих сообщений для бизнеса г. Брянска от Даниила (FORM STUDIO).',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning className="bg-[#080808] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
