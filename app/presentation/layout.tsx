import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion de Logements — Plateforme de gestion locative',
  description:
    "Application web complète pour gérer vos bâtiments, logements, locataires et paiements. Suivi des arriérés, exports Excel et PDF, contrôle d'accès par rôle.",
  keywords: [
    'gestion locative',
    'logements à louer',
    'gestion bâtiments',
    'suivi loyers',
    'arriérés locataires',
    'application immobilière',
  ],
  authors: [{ name: 'Aurel Djoumessi', url: 'https://aureldjoumessi.com' }],
  openGraph: {
    type:        'website',
    title:       'Gestion de Logements — Plateforme de gestion locative',
    description:
      "Application web complète pour gérer vos bâtiments, logements, locataires et paiements. Suivi des arriérés, exports Excel et PDF, contrôle d'accès par rôle.",
    siteName: 'Gestion de Logements',
    locale:   'fr_FR',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Gestion de Logements — Plateforme de gestion locative',
    description:
      "Application web complète pour gérer bâtiments, logements, locataires et paiements.",
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function PresentationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
