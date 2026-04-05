import type { Metadata } from 'next';
import StoreProvider from '@/store/StoreProvider';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestion de Logements',
  description: 'Application de gestion de logements à louer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260405" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260405" />
        <link rel="shortcut icon" href="/favicon.ico?v=20260405" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260405" />
        <link rel="manifest" href="/site.webmanifest?v=20260405" />
      </head>
      <body className='m-0'>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
