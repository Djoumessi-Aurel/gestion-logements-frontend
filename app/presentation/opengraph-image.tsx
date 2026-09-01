import { ImageResponse } from 'next/og';

/**
 * Image de prévisualisation (og:image) de la page /presentation.
 *
 * Générée au build par Next.js (convention de fichier `opengraph-image`), servie
 * sur /presentation/opengraph-image et injectée automatiquement en URL absolue
 * grâce au `metadataBase` défini dans app/layout.tsx.
 *
 * ⚠️ Sans og:image, WhatsApp n'affiche aucune carte de prévisualisation : il
 * retombe sur le nom de domaine brut. Le format 1200×630 est celui qui déclenche
 * la grande carte (WhatsApp, LinkedIn, Twitter/X, Facebook, Slack…).
 *
 * ⚠️ Contraintes de rendu : styles inline uniquement, et tout conteneur ayant
 * plusieurs enfants doit déclarer explicitement `display: 'flex'` (Satori).
 */

export const alt         = 'Gestion de Logements — Plateforme de gestion locative';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          padding:        '0 90px',
          background:     'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #3b82f6 100%)',
          fontFamily:     'sans-serif',
          position:       'relative',
        }}
      >
        {/* Cercles décoratifs */}
        <div
          style={{
            position: 'absolute', top: -180, right: -140,
            width: 520, height: 520, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -220, left: -120,
            width: 460, height: 460, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Pastille de marque */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            marginBottom: 34,
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 74, height: 74, borderRadius: 20,
              background: '#ffffff',
              color: '#1e3a8a',
              fontSize: 42, fontWeight: 700,
            }}
          >
            GL
          </div>
          <div
            style={{
              marginLeft: 22,
              fontSize: 26,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: 2,
            }}
          >
            GESTION LOCATIVE
          </div>
        </div>

        {/* Titre */}
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Gestion de Logements
        </div>

        {/* Accroche */}
        <div
          style={{
            marginTop: 26,
            fontSize: 33,
            color: '#dbeafe',
            lineHeight: 1.35,
            maxWidth: 900,
          }}
        >
          Bâtiments, logements, locataires et paiements — suivi des arriérés,
          exports Excel et PDF, accès par rôle.
        </div>

        {/* Puces */}
        <div style={{ display: 'flex', marginTop: 44 }}>
          {['Suivi des arriérés', 'Exports Excel / PDF', 'Multi-rôles'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex', alignItems: 'center',
                marginRight: 16,
                padding: '13px 26px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#ffffff',
                fontSize: 25,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
