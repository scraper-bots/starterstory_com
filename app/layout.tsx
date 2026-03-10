import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Skee-Ball Arcade',
  description: 'A neon-themed browser Skee-Ball game. Aim, throw, and rack up points!',
  keywords:    ['skee-ball', 'arcade', 'browser game', 'next.js'],
};

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,
  userScalable:       false,
  themeColor:         '#06060f',
  viewportFit:        'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon – inline SVG data URI */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
