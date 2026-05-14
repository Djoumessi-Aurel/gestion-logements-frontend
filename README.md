# Gestion de Logements — Frontend

Application web de gestion locative : bâtiments, logements, locataires, paiements, arriérés, exports.
Développée par [Aurel Djoumessi](https://aureldjoumessi.com).

---

## Prérequis

| Outil | Version minimale |
| ----- | ---------------- |
| Node.js | 18 |
| npm | 9 |
| Backend NestJS | lancé sur `http://localhost:3000` |

Le backend doit être démarré **avant** le frontend. Sa documentation Swagger est accessible sur `http://localhost:3000/api/docs`.

---

## Installation

```bash
npm install
cp .env.example .env.local   # puis éditer .env.local
```

### Variables d'environnement (`.env.local`)

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | URL du backend NestJS sans slash final (ex : `http://localhost:3000`) |
| `NEXT_PUBLIC_CRYPTO_SECRET` | Clé de chiffrement pour redux-persist — chaîne aléatoire longue |
| `NEXT_PUBLIC_SITE_URL` | URL publique du frontend, utilisée pour `sitemap.xml` et `robots.txt` (ex : `https://ton-domaine.com`) |

---

## Commandes

```bash
npm run dev      # Serveur de développement (Turbopack) sur http://localhost:3001
npm run build    # Build production (webpack, requis pour la PWA)
npm start        # Serveur de production après build
npm run lint     # Linter ESLint
```

> **Note build** : le script utilise `next build --webpack` (et non Turbopack) pour que le plugin next-pwa génère le service worker. En développement, Turbopack est utilisé normalement.

---

## Stack technique

| Couche | Technologie |
| ------ | ----------- |
| Framework | Next.js 16 TypeScript — App Router uniquement |
| État global | Redux Toolkit + redux-persist chiffré (CryptoJS) |
| Styles | TailwindCSS v4 + SCSS |
| Composants UI | PrimeReact 10 + PrimeIcons |
| Client HTTP | Axios avec intercepteurs JWT (refresh automatique sur 401) |
| Validation | react-hook-form + zod |
| Auth tokens | jose (décodage JWT côté middleware sans vérification de signature) |
| PWA | @ducanh2912/next-pwa (service worker généré au build) |

---

## Structure du projet

```text
app/
  (auth)/             ← Pages publiques (login, forgot-password, reset-password)
  (dashboard)/        ← Pages protégées (sidebar + header)
    batiments/
    logements/
    locataires/
    occupations/
    paiements/
    utilisateurs/
    locataire/        ← Espace personnel LOCATAIRE (lecture seule)
    profil/
    export/
  presentation/       ← Page publique de présentation du produit
  offline/            ← Fallback PWA hors-ligne
  layout.tsx          ← Layout racine (Provider Redux, favicons, manifeste)
  robots.ts           ← Route handler → /robots.txt
  sitemap.ts          ← Route handler → /sitemap.xml

proxy.ts              ← Protection des routes (remplace middleware.ts en Next.js 16)
store/                ← Slices Redux (authSlice, uiSlice, configSlice)
services/             ← Wrappers Axios par entité (*.api.ts)
components/
  layout/             ← Sidebar, Header, SessionGuard
  shared/             ← Composants réutilisables (DataTableWrapper, ExportModal…)
hooks/                ← Hooks custom
types/                ← Interfaces TypeScript partagées
utils/                ← Helpers (role.ts, cookies.ts…)
public/               ← Assets statiques (favicons, manifeste, sw.js généré)
input/                ← Documentation backend (API.md) — non déployé
```

---

## Points d'attention pour un nouveau développeur

### Authentification

- L'`access_token` est stocké dans un cookie plain (`access_token`) posé par le frontend au login.
- Le `refresh_token` est un cookie HttpOnly posé par le backend.
- `proxy.ts` lit ces cookies pour protéger les routes — **ne pas renommer ce fichier**, Next.js 16 le détecte automatiquement à la racine.
- Le refresh automatique sur 401 est géré dans `services/apiClient.ts`.

### Protection des routes

`proxy.ts` gère trois catégories :

- `PUBLIC_ROUTES` : accessibles sans auth, redirigent vers le dashboard si déjà connecté
- `OPEN_ROUTES` : accessibles à tous sans aucune redirection (`/presentation`, `/sitemap.xml`, `/robots.txt`, `/offline`)
- Routes protégées : nécessitent un token valide, contrôle RBAC par rôle

### Rôles utilisateur

| Rôle | Périmètre |
| ---- | --------- |
| `LOCATAIRE` | Lecture seule — ses occupations et paiements uniquement, redirigé vers `/locataire` |
| `ADMIN_LOGEMENT` | Gestion des logements attribués |
| `ADMIN_BATIMENT` | CRUD logements pour ses bâtiments + capacités ADMIN_LOGEMENT |
| `ADMIN_GLOBAL` | Accès total sans restriction |

### Formulaire paiement

Deux options de saisie avec calcul **temps réel côté client** (voir `UC-PAI-02` dans `CLAUDE.md`). La logique de calcul des périodes se trouve dans `utils/` et dépend du type de loyer actif.

### Exports

Tous les exports retournent un Blob. Le pattern fetch → blob URL → `<a download>` est dans `services/occupations.api.ts` (`downloadFromSignedUrl`), réutilisé partout.

### PWA

Le service worker (`public/sw.js`) est généré au build, pas en dev. La page `/offline` est le fallback hors-ligne. Ne pas committer `public/sw.js`, `public/workbox-*.js` etc. (déjà dans `.gitignore`).

---

## Documentation complète

`CLAUDE.md` à la racine contient :

- Toutes les règles métier (RG-01 à RG-12)
- Les cas d'utilisation détaillés par page (UC-AUTH, UC-BAT, UC-LOG…)
- Les conventions de nommage
- Le plan de réalisation et les étapes complétées

`input/API.md` documente tous les endpoints du backend NestJS. S'il ne figure pas dans le repo, il est accessible via Swagger sur `http://localhost:3000/api/docs` une fois le backend lancé; ou alors vous pouvez demander au responsable du backend de vous le fournir.
