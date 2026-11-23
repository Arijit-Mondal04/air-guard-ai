import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'VayuGuard — Urban Air Telemetry & Household Smog Defense',
  description:
    'Real-time PM2.5 telemetry and personalized winter smog protection & emission-reduction protocols.',
  icons: {
    icon: '/icon.svg?v=2',
    shortcut: '/icon.svg?v=2',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#F7F5F0] text-[#0F1E36]">
        {children}
      </body>
    </html>
  );
}