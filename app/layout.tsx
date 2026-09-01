import type { Metadata } from 'next';
import StoreProvider from '@/store/StoreProvider';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import './globals.css';

// URL publique du site — base de toutes les URLs absolues des métadonnées
// (og:image, og:url…). Indispensable : sans metadataBase, Next.js ne peut pas
// résoudre une image OG en URL absolue, et les crawlers de prévisualisation
// (WhatsApp, Facebook, LinkedIn…) l'ignorent silencieusement.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
        <link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260514" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260514" />
        <link rel="shortcut icon" href="/favicon.ico?v=20260514" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260514" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className='m-0'>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
