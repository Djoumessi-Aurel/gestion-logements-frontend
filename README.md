# Gestion de Logements — Frontend

Application web de gestion locative : bâtiments, logements, locataires, paiements, arriérés, exports.
Développée par [Aurel Djoumessi](https://aureldjoumessi.com).

> Guide destiné aux **développeurs**. Pour l'utilisation fonctionnelle de l'application,
> voir [`docs/guide-utilisateur.html`](docs/guide-utilisateur.html) — le guide remis aux clients.

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

| Variable | Requise | Description |
| -------- | ------- | ----------- |
| `NEXT_PUBLIC_API_URL` | oui | URL du backend NestJS sans slash final (ex : `http://localhost:3000`) |
| `NEXT_PUBLIC_CRYPTO_SECRET` | oui | Clé de chiffrement pour redux-persist — chaîne aléatoire longue |
| `NEXT_PUBLIC_SITE_URL` | oui en prod | URL publique du frontend. Sert de `metadataBase` (donc aux URLs absolues `og:image`/`og:url`) ainsi qu'à `sitemap.xml` et `robots.txt` |
| `NEXT_PUBLIC_MULTI_TENANT_BACKEND` | non | `"true"` **uniquement** si `NEXT_PUBLIC_API_URL` pointe vers un backend multi-tenant. Voir l'avertissement CORS dans `CLAUDE.md` — l'activer à tort bloque toutes les requêtes |
| `NEXT_PUBLIC_DEV_TENANT_SLUG` | non | Slug d'organisation à forcer en développement local (pas de sous-domaine sur `localhost`) |

---

## Commandes

```bash
npm run dev      # Serveur de développement (Turbopack) sur http://localhost:3001
npm run build    # Build production (webpack, requis pour la PWA)
npm start        # Serveur de production après build
npm run lint     # Linter ESLint — doit rester silencieux
```

**Note build** : le script utilise `next build --webpack` (et non Turbopack) pour que
le plugin next-pwa génère le service worker. En développement, Turbopack est utilisé
normalement.

**Note lint** : `npm run lint` ne doit produire **aucune sortie**. Toute nouvelle ligne
est une régression à traiter, pas du bruit de fond. Les bundles générés dans `public/`
sont exclus via `globalIgnores` dans `eslint.config.mjs`.

Il n'y a pas de script de typecheck dédié : `next build` lance TypeScript. Pour un
contrôle rapide sans build complet, `npx tsc --noEmit`.

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
| Auth tokens | jose (décodage JWT côté proxy sans vérification de signature) |
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
    opengraph-image.tsx  ← Image de partage 1200×630 générée au build
  offline/            ← Fallback PWA hors-ligne
  layout.tsx          ← Layout racine (Provider Redux, metadataBase, favicons, manifeste)
  robots.ts           ← Route handler → /robots.txt
  sitemap.ts          ← Route handler → /sitemap.xml

proxy.ts              ← Protection des routes (remplace middleware.ts en Next.js 16)
store/                ← Slices Redux (authSlice, uiSlice, configSlice)
services/             ← Wrappers Axios par entité (*.api.ts)
components/
  layout/             ← Sidebar, Header, SessionGuard, ConfigLoader
  shared/             ← Composants réutilisables (DataTableWrapper, ExportModal, Logo…)
types/                ← Interfaces TypeScript partagées
utils/                ← Helpers partagés (voir ci-dessous)
public/               ← Assets statiques (favicons, manifeste, sw.js généré)
input/                ← Documentation backend (API.md) — non suivi par git
```

### Helpers partagés (`utils/`)

Aucun de ces helpers ne doit être redéfini localement dans une page.

| Module | Contenu |
| ------ | ------- |
| `utils/date.ts` | `formatDate`, `toDateStr`, `addPeriode`, `addOneDay`, `isDatePassee` |
| `utils/format.ts` | `formatMontant`, `formatSize`, `mimeLabel`, `mimeIcon`, `labelPeriode`, `labelPeriodeCourt` |
| `utils/error.ts` | `extractError` — extrait le message affichable d'une erreur Axios |
| `utils/role.ts` | `roleLabels`, `roleColors`, `hasMinRole`, `rolesForAdmin` |
| `utils/password.ts` | `generatePassword` — mot de passe initial généré côté admin |
| `utils/cookies.ts` | Pose et efface le cookie `access_token` lu par le proxy |
| `utils/tenant.ts` | Résolution du slug d'organisation (multi-tenance) |

⚠️ `toDateStr` sérialise en heure **locale**. Ne jamais utiliser `toISOString()` pour
produire une date `YYYY-MM-DD` : le décalage UTC ferait perdre un jour dans les
fuseaux à l'est de Greenwich, ce qui est le cas du Cameroun (UTC+1).

---

## Points d'attention pour un nouveau développeur

### Authentification

- L'`access_token` est stocké dans un cookie plain (`access_token`) posé par le frontend au login.
- Le `refresh_token` est un cookie HttpOnly posé par le backend.
- `proxy.ts` lit ces cookies pour protéger les routes — **ne pas renommer ce fichier**, Next.js 16 le détecte automatiquement à la racine.
- Le refresh automatique sur 401 est géré dans `services/apiClient.ts`.
- L'expiry du cookie `access_token` est volontairement calée sur celle du *refresh*
  token (7 jours), pas sur celle du JWT. Sinon le proxy redirigerait vers `/login`
  avant que l'intercepteur Axios ait la chance de rafraîchir la session.

### Protection des routes

`proxy.ts` gère trois catégories :

- `PUBLIC_ROUTES` : accessibles sans auth, redirigent vers le dashboard si déjà connecté
- `OPEN_ROUTES` : accessibles à tous sans aucune redirection (`/presentation`, `/sitemap.xml`, `/robots.txt`, `/offline`)
- Routes protégées : nécessitent un token valide, contrôle RBAC par rôle

⚠️ Le `matcher` exclut les chemins portant une extension de fichier. Une route
générée **sans** extension (par exemple `/presentation/opengraph-image`) passe donc
par le proxy : il faut qu'elle tombe sous un préfixe d'`OPEN_ROUTES`, sinon les
crawlers reçoivent une redirection vers `/login`.

### Rôles utilisateur

| Rôle | Périmètre |
| ---- | --------- |
| `LOCATAIRE` | Lecture seule — ses occupations et paiements uniquement, redirigé vers `/locataire` |
| `ADMIN_LOGEMENT` | Gestion des logements attribués |
| `ADMIN_BATIMENT` | CRUD logements pour ses bâtiments + capacités ADMIN_LOGEMENT |
| `ADMIN_GLOBAL` | Accès total sans restriction |

Côté client, l'appartenance hiérarchique se teste **exclusivement** avec
`hasMinRole(role, minRole)` (`utils/role.ts`), seul détenteur de l'ordre des rôles.
Ne pas réécrire de chaîne `role === X || role === Y`. Un rôle absent (store non
réhydraté) n'a accès à rien : on masque par défaut.

Le backend reste la source de vérité — le RBAC client ne fait que piloter l'affichage.

### Formulaire paiement

Deux options de saisie avec calcul **temps réel côté client** (voir `UC-PAI-02` dans
`CLAUDE.md`). Le calcul des périodes repose sur `addPeriode` (`utils/date.ts`) et
dépend du loyer actif du logement.

### Limites d'upload

Elles ne sont **jamais** codées en dur. `components/layout/ConfigLoader.tsx` appelle
`GET /config` au montage du layout dashboard et alimente `configSlice` ; `FileUploader`
les lit depuis le store. Tant qu'elles sont inconnues, le composant affiche un état de
chargement au lieu d'une zone de dépôt — annoncer une limite fausse laisserait
l'utilisateur choisir un fichier que le serveur refusera.

`ConfigLoader` retente trois fois (2 s, 5 s, 15 s) : l'API de production démarre à
froid en une quarantaine de secondes.

### Téléchargements

Deux mécanismes distincts, à ne pas confondre :

- **Exports** (`services/export.api.ts`) : réponse Blob → `downloadBlob()`.
- **Contrats et preuves** : le backend renvoie une **URL signée temporaire**, pas un
  flux. `downloadFromSignedUrl()` (`services/occupations.api.ts`) la récupère via
  `fetch` puis crée un blob URL local — nécessaire car l'attribut `download` d'un
  lien est ignoré en cross-origin.

### PWA

Le service worker (`public/sw.js`) est généré au build, pas en dev. La page `/offline`
est le fallback hors-ligne. Ne pas committer `public/sw.js`, `public/workbox-*.js` etc.
(déjà dans `.gitignore`).

> `public/swe-worker-*.js` est lui aussi généré par next-pwa mais échappe au
> `.gitignore` actuel — le motif `public/worker-*.js` ne couvre pas un nom
> commençant par `swe-`. Il se retrouve donc suivi par git.

### Métadonnées de partage

`metadataBase` est défini dans `app/layout.tsx` à partir de `NEXT_PUBLIC_SITE_URL`.
Sans lui, Next.js ne peut produire aucune URL absolue et les crawlers de
prévisualisation (WhatsApp, Facebook, LinkedIn) ignorent silencieusement l'image.

L'image de partage est générée au build par `app/presentation/opengraph-image.tsx`
via `next/og`. WhatsApp **exige** un `og:image` : sans lui il n'affiche aucune carte,
seulement le nom de domaine.

⚠️ Les prévisualisations sont mises en cache par URL pendant plusieurs semaines. Pour
tester un changement, partager l'URL avec un paramètre factice (`?v=2`), sinon
l'ancienne carte est reservie.

### Images

Passer par le composant `components/shared/Logo.tsx` plutôt que par une balise
`<img>` : `next/image` sert une version redimensionnée du PNG source (192×192, 62 Ko)
au lieu du fichier entier, sur chaque page.

---

## Documentation complète

### Documents commerciaux et utilisateurs (`docs/`)

Trois documents HTML autonomes, ouvrables directement dans un navigateur, sans
dépendance hors les polices Google, et imprimables en PDF via `Ctrl + P`.

| Fichier | Destinataire | Contenu |
| ------- | ------------ | ------- |
| [`guide-utilisateur.html`](docs/guide-utilisateur.html) | **Clients** | Manuel d'utilisation en 16 chapitres |
| [`formules-client.html`](docs/formules-client.html) | **Clients** | Fiche tarifaire — 4 formules et prestations en supplément |
| [`tarification-interne.html`](docs/tarification-interne.html) | **Interne uniquement** | Coûts d'hébergement, seuil de rentabilité, marges, tactique de négociation |

> ⛔ **`tarification-interne.html` ne doit jamais être transmis à un client.** Il expose
> la base de coûts et les marges. Un avertissement figure en tête du fichier.

⚠️ `formules-client.html` porte encore `[à compléter]` à la place du téléphone et de
l'e-mail, dans le bloc « Démarrer ». À renseigner avant tout envoi.

**Ces fichiers sont la source de vérité.** Les versions publiées en ligne en sont des
rendus&nbsp;: pour les mettre à jour, on retire le squelette HTML (`doctype`, `html`,
`head`, `body`) et on republie le reste à la même URL. Ne jamais maintenir deux copies
du contenu.

Règles à respecter en modifiant le **guide utilisateur** :

- **Ne jamais y chiffrer les limites d'upload.** Elles sont configurables côté serveur
  (`UPLOAD_*`) et le guide renvoie volontairement à ce qui est affiché dans la zone de
  dépôt.
- **Toute couleur passe par un jeton CSS**, jamais par une valeur littérale hors du bloc
  `@media print`. Le bandeau de titre a ses propres jetons (`--hero-*`) parce que le bleu
  de marque s'éclaircit en thème sombre pour rester lisible en texte, alors que l'en-tête
  l'utilise comme fond.

### Documentation technique

`CLAUDE.md` à la racine contient :

- Toutes les règles métier (RG-01 à RG-12)
- Les cas d'utilisation détaillés par page (UC-AUTH, UC-BAT, UC-LOG…)
- Les conventions de nommage
- La configuration multi-tenance
- Le plan de réalisation et les étapes complétées

`input/API.md` documente tous les endpoints du backend NestJS. Le dossier `input/`
n'est **volontairement pas suivi par git** (c'est une copie du fichier maintenu dans
le dépôt backend). En son absence, la documentation est accessible via Swagger sur
`http://localhost:3000/api/docs` une fois le backend lancé, ou auprès du responsable
du backend.
