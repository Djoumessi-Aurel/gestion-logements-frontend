import type { Metadata } from 'next';
import StoreProvider from '@/store/StoreProvider';
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
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
