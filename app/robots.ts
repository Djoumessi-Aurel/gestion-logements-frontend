import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/presentation', '/'],
        // Bloquer les pages applicatives (authentifiées) — inutiles pour les moteurs
        disallow: [
          '/login',
          '/forgot-password',
          '/reset-password',
          '/dashboard',
          '/batiments',
          '/logements',
          '/locataires',
          '/occupations',
          '/paiements',
          '/utilisateurs',
          '/profil',
          '/export',
          '/locataire',
          '/offline',
          '/api/',
          // Fiche tarifaire : accessible par lien partagé, volontairement absente
          // des moteurs de recherche. Retirer cette ligne ET la balise robots de
          // public/tarifs.html pour la rendre indexable.
          '/tarifs.html',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
