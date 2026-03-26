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
      <body className='m-0'>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
