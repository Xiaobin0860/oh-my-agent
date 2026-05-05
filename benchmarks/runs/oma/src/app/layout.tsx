import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Worldie — Build Your World',
  description: 'Create, explore, and share amazing 3D worlds with your imagination!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream antialiased">
        {children}
      </body>
    </html>
  );
}
