# Projet : Gestion de Logements à Louer – Frontend

## Stack technique
- **Framework** : Next.js 16 TypeScript – App Router (jamais Pages Router)
- **État global** : Redux Toolkit + redux-persist chiffré (CryptoJS)
- **Styles** : TailwindCSS (utilitaires) + SCSS (cas complexes)
- **Composants UI** : PrimeReact (composant par défaut pour tout) + PrimeIcons
- **Client HTTP** : Axios avec intercepteurs JWT (refresh auto sur 401)
- **Graphiques** : PrimeReact Charts ou recharts
- **Validation formulaires** : react-hook-form + zod (ou yup)

## URL Backend
```
NEXT_PUBLIC_API_URL=http://localhost:3000   ← à adapter selon l'environnement
```

Documentation Swagger : `GET /api/docs` (utile pour debug)

## Couleurs principales (charte graphique)
- Bleu principal : `#1e3a8a`
- Bleu moyen : `#3b82f6`
- Bleu clair (fond) : `#dbeafe`
- Blanc : `#ffffff`
- Texte sombre : `#1e293b`
- Succès : `#166534` / fond `#dcfce7`
- Erreur : `#991b1b` / fond `#fee2e2`
- Avertissement : `#92400e` / fond `#fef3c7`

## Structure des dossiers (App Router)
```
app/
  layout.tsx                  ← Layout racine (Redux Provider, thème PrimeReact)
  (auth)/
    login/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx    ← reçoit ?token= en query param
    layout.tsx                ← Layout public (sans sidebar)
  (dashboard)/
    layout.tsx                ← Layout protégé (sidebar, header, session expirée)
    page.tsx                  ← Dashboard principal
    batiments/
      page.tsx                ← Liste + CRUD
      [id]/page.tsx           ← Dashboard bâtiment
    logements/
      page.tsx
      [id]/page.tsx           ← Dashboard logement
    occupations/
      page.tsx
      [id]/page.tsx
    paiements/
      page.tsx
    locataires/
      page.tsx
      [id]/page.tsx           ← Dashboard locataire
    utilisateurs/
      page.tsx
      [id]/page.tsx
    profil/
      page.tsx                ← Profil utilisateur + changement de mot de passe
    export/
      page.tsx
middleware.ts                 ← Protection des routes (vérif JWT + rôle)
store/                        ← Slices Redux (auth, ui, ...)
services/                     ← Wrappers Axios par entité
components/                   ← Composants réutilisables
hooks/                        ← Hooks custom
types/                        ← Interfaces TypeScript partagées
```

## Conventions de code
- **Composants / Pages** : PascalCase (ex : `OccupationCard.tsx`)
- **Hooks** : camelCase préfixé `use` (ex : `useArrieres.ts`)
- **Services API** : kebab-case (ex : `occupations.api.ts`)
- **Types / Interfaces** : PascalCase (ex : `CreatePaiementDto`)
- **Variables / fonctions** : camelCase

---

## Format des réponses API (à toujours exploiter)

```typescript
// Succès
{ statusCode: 200, message: "Opération réussie", data: { ... } }

// Création
{ statusCode: 201, message: "Ressource créée", data: { ... } }

// Liste paginée (ex: GET /paiements) — utiliser ApiResponsePaginated<T>
{ statusCode: 200, message: "Opération réussie", data: [...], meta: { total, page, limit, totalPages } }

// Sans données (suppression, logout)
{ statusCode: 200, message: "Opération réussie" }

// Erreur de validation (400)
{ statusCode: 400, message: "Validation échouée", errors: [{ field: "montant", message: "doit être > 0" }] }

// Erreur métier (422)
{ statusCode: 422, message: "Ce logement est actuellement occupé" }

// Non authentifié (401)
{ statusCode: 401, message: "Non authentifié" }

// Accès refusé (403)
{ statusCode: 403, message: "Accès refusé" }

// Introuvable (404)
{ statusCode: 404, message: "Ressource introuvable" }

// Rate limit (429)
{ statusCode: 429, message: "..." }
```

**Toujours exploiter le champ `message` (et `errors[]` pour les 400) pour afficher des messages clairs à l'utilisateur.**

## Gestion des codes HTTP côté frontend

| Code | Action frontend                                                              |
|------|------------------------------------------------------------------------------|
| 400  | Afficher `errors[]` sous les champs concernés, ou `message` si pas de champs |
| 401  | Si refresh échoue → toast "Session expirée" + redirect `/login`              |
| 403  | Toast erreur "Accès refusé"                                                  |
| 404  | Toast ou message inline "Ressource introuvable"                              |
| 405  | Afficher `message` (ex : suppression utilisateur interdite)                  |
| 409  | Afficher `message` (ex : username déjà utilisé)                              |
| 422  | Afficher `message` (règle métier violée — ex : logement déjà occupé)        |
| 429  | Toast "Trop de tentatives, veuillez patienter"                               |
| 500  | Toast "Erreur serveur inattendue"                                            |

---

## Types TypeScript principaux (à créer dans `types/`)

```typescript
// types/enums.ts
export enum Role { LOCATAIRE = 'LOCATAIRE', ADMIN_LOGEMENT = 'ADMIN_LOGEMENT', ADMIN_BATIMENT = 'ADMIN_BATIMENT', ADMIN_GLOBAL = 'ADMIN_GLOBAL' }
export enum PeriodeType { JOUR = 'JOUR', SEMAINE = 'SEMAINE', MOIS = 'MOIS', ANNEE = 'ANNEE' }

// types/auth.ts
export interface AuthUser { id: number; username: string; role: Role }
export interface AuthState { accessToken: string | null; user: AuthUser | null }

// types/utilisateur.ts
export interface Utilisateur { id: number; nom: string; prenom: string; telephone: string; email?: string; username: string; role: Role; isActive: boolean; createdAt: string; updatedAt: string; batiments?: Batiment[]; logements?: Logement[] }

// types/batiment.ts
export interface Batiment { id: number; nom: string; adresse: string; description?: string; createdAt: string; updatedAt: string }
export interface BatimentDashboard { batimentId: number; totalLogements: number; logementsOccupes: number; logementsVacants: number; occupationsActives: number; montantTotalArrieresOccActives: number; montantTotalArrieres: number; montantTotalPercu: number }

// types/logement.ts
export interface Loyer { id: number; montant: number; dateDebut: string; periodeNombre: number; periodeType: PeriodeType }
export interface Logement { id: number; batimentId: number; batiment?: Batiment; nom: string; description?: string; createdAt: string; updatedAt: string; loyers?: Loyer[] }
export interface LogementDashboard { logementId: number; estOccupe: boolean; loyerActuel: { montant: number; periodeNombre: number; periodeType: PeriodeType }; locataireActuel?: { id: number; nom: string; prenom: string }; nbreTotalPaiementsLocataireActuel: number; montantTotalPayeLocataireActuel: number; arrieresLocataireActuel: Arriere | null; nbreTotalOccupations: number; montantTotalPercu: number; montantTotalArrieres: number }

// types/locataire.ts
export interface Locataire { id: number; nom: string; prenom: string; telephone: string; email?: string; utilisateurId?: number; libre: boolean; createdAt: string; updatedAt: string }

// types/occupation.ts
export interface Occupation { id: number; logementId: number; locataireId: number; logement?: Logement; locataire?: Locataire; dateDebut: string; dateFin?: string; dateDernierJourCouvert: string; contratFichierId?: number; createdAt: string; updatedAt: string; paiements?: Paiement[] }

// types/paiement.ts
export interface Paiement { id: number; occupationId: number; debutPeriode: string; finPeriode: string; montantPaye: number; nombreDeLoyers?: number; datePaiement: string; dateAttenduePaiement: string; commentaire?: string; preuves?: Fichier[]; createdAt: string; updatedAt: string }
export interface Fichier { id: number; nomOriginal: string; mimeType: string; taille: number; createdAt: string }

// types/arriere.ts
export interface Arriere { debutPeriodeDue: string; finPeriodeDue: string; montantDu: number; nombreLoyersDu: number }

// types/dashboard.ts
export interface DashboardGlobal { totalBatiments: number; totalLogements: number; logementsOccupes: number; logementsVacants: number; occupationsActives: number; montantTotalArrieresOccActives: number; montantTotalArrieres: number; montantTotalPercu: number }
export interface LocataireDashboard { locataireId: number; totalOccupations: number; nbOccupationsActives: number; solvabilite: { montantTotalPaye: number; montantArrieres: number }; listeArrieres: Arriere[]; assiduité: { nombrePaiements: number; nombrePaiementsATemps: number; nombrePaiementsEnRetard: number; tauxPonctualite: number; retardMoyenJours: number } }
```

---

## Règles UX impératives (TOUJOURS respecter)

### Feedback visuel
- Toute action déclenchant une requête API → afficher un spinner ou skeleton pendant le chargement
- Succès → toast/notification visible 3-5 secondes
- Erreur → message clair indiquant ce qui a échoué (exploiter le champ `message` de la réponse API)
- Erreur de validation (400) → afficher chaque erreur sous le champ concerné via `errors[]`, formulaire non soumis

### Gestion du token JWT
- Stocker l'access_token dans Redux (chiffré via CryptoJS dans redux-persist)
- **Jamais** stocker le token directement dans localStorage en clair
- Refresh token : Cookie HttpOnly (géré par le backend, path `/auth`)
- Intercepteur Axios : relancer automatiquement la requête après refresh sur 401
- Si refresh expiré (401 sur `/auth/refresh`) → toast "Session expirée" + redirect `/login`
- Le cookie `refresh_token` est envoyé automatiquement par le navigateur pour les routes `/auth/*`

### Formulaire Paiement (règle critique)
- Option 1 (nombre de loyers) : afficher en **temps réel** (avant validation) :
  - `fin_periode` calculée : `addPeriode(dateDernierJourCouvert + 1 jour, nombreDeLoyers × loyer.periodeNombre, loyer.periodeType) - 1 jour`
  - `montant_paye` calculé : `nombreDeLoyers × loyer.montant`
- Toggle entre Option 1 et Option 2 dans le même formulaire
- Option 2 : validation `fin_periode >= debut_periode` côté client avant soumission
- `debut_periode` = toujours `dateDernierJourCouvert + 1 jour` (non modifiable, affiché en lecture seule)

### RBAC côté client
- Décoder le JWT pour extraire le rôle (ou utiliser le champ `user.role` stocké en Redux)
- Afficher **uniquement** les boutons/menus autorisés selon le rôle
- Le middleware.ts vérifie la présence et la validité du JWT pour chaque route protégée
- Ne pas faire confiance uniquement au frontend : le backend est la source de vérité

### Tri et filtrage
- Activer tri et filtrage sur **toutes** les listes de données (DataTable PrimeReact)

### Responsive
- Mobile (375px), Tablette (768px), Desktop (1280px+) — toujours vérifier les trois
- Sidebar : repliée sur mobile/tablette, déployée sur desktop

---

## Rôles utilisateur
```
LOCATAIRE | ADMIN_LOGEMENT | ADMIN_BATIMENT | ADMIN_GLOBAL
```

### Périmètre d'accès par rôle (pour le routing et l'affichage conditionnel)
- **LOCATAIRE** : lecture seule, uniquement ses propres occupations et paiements → redirigé vers `/locataire` (espace personnel)
- **ADMIN_LOGEMENT** : gestion des logements attribués (pas CRUD logement lui-même, pas CRUD bâtiment)
- **ADMIN_BATIMENT** : CRUD logements pour ses bâtiments + capacités ADMIN_LOGEMENT + dashboard bâtiment
- **ADMIN_GLOBAL** : accès total sans restriction

### Restrictions d'affichage par rôle (menus / boutons)

| Action                    | LOCATAIRE | ADMIN_LOGEMENT | ADMIN_BATIMENT | ADMIN_GLOBAL |
|---------------------------|-----------|----------------|----------------|--------------|
| Voir bâtiments            | ✗         | ✗              | ✓              | ✓            |
| Créer/supprimer bâtiment  | ✗         | ✗              | ✗              | ✓            |
| Créer logement            | ✗         | ✗              | ✓              | ✓            |
| Modifier logement         | ✗         | ✗              | ✓              | ✓            |
| Voir logements            | ✗         | ✓              | ✓              | ✓            |
| CRUD locataires           | ✗         | ✓              | ✓              | ✓            |
| CRUD occupations          | ✗         | ✓              | ✓              | ✓            |
| CRUD paiements            | ✗         | ✓              | ✓              | ✓            |
| Voir/créer utilisateurs   | ✗         | ✓ (limité)     | ✓ (limité)     | ✓            |
| Attribuer bâtiments       | ✗         | ✗              | ✗              | ✓            |
| Attribuer logements       | ✗         | ✗              | ✓              | ✓            |
| Export                    | ✗         | ✓              | ✓              | ✓            |

---

## Cas d'utilisation détaillés par page

### UC-AUTH : Authentification

#### UC-AUTH-01 : Login (`/login`)
- Formulaire : `username` + `password`
- Endpoint : `POST /auth/login`
- Succès : stocker `access_token` + `user` en Redux → redirect selon rôle :
  - LOCATAIRE → `/locataire`
  - Autres → `/` (dashboard)
- Erreurs : 401 → "Identifiants invalides ou compte désactivé"
- Rate limit : 5 req/60s → afficher "Trop de tentatives, réessayez dans 1 minute"

#### UC-AUTH-02 : Mot de passe oublié (`/forgot-password`)
- Formulaire : `username` + `email`
- Endpoint : `POST /auth/forgot-password`
- Réponse toujours 200 → afficher "Si ce compte existe, un email a été envoyé" (ne pas indiquer si le compte existe ou non)
- Rate limit : 5 req/60s

#### UC-AUTH-03 : Réinitialisation mot de passe (`/reset-password?token=<token>`)
- Lire le `token` depuis `searchParams`
- Formulaire : `newPassword` (min 8 caractères) + confirmation
- Endpoint : `POST /auth/reset-password` avec `{ token, newPassword }`
- Succès : toast "Mot de passe réinitialisé" + redirect `/login`
- Erreur 400 : "Lien invalide ou expiré"

#### UC-AUTH-04 : Changement de mot de passe (profil `/profil`)
- Formulaire : `currentPassword` + `newPassword` (min 8 chars) + confirmation
- Endpoint : `PATCH /auth/change-password`
- Erreur 400 : "Mot de passe actuel incorrect"

#### UC-AUTH-05 : Logout
- Endpoint : `POST /auth/logout`
- Effacer Redux store + appeler `clearAccessTokenCookie()` → redirect `/login`

---

### UC-DASH : Dashboard principal (`/`)

Endpoint : `GET /dashboard/global`
Accès : ADMIN_LOGEMENT+

**Afficher :**
- KPIs : total bâtiments, total logements, logements occupés/vacants, taux d'occupation
- Total arriérés (occupations actives) + total arriérés général + total perçu
- Liste des logements triée par `date_dernier_jour_couvert` (ASC = les plus en retard en premier)
  - Code couleur : rouge si arriéré, vert si à jour

---

### UC-BAT : Bâtiments

#### UC-BAT-01 : Liste (`/batiments`)
- Endpoint : `GET /batiments`
- DataTable avec tri/filtre : nom, adresse, description
- Bouton "Nouveau bâtiment" : visible ADMIN_GLOBAL uniquement
- Actions par ligne : Voir dashboard, Modifier (ADMIN_BATIMENT+), Supprimer (ADMIN_GLOBAL seulement)

#### UC-BAT-02 : Créer/Modifier bâtiment (modal)
- Champs : `nom`*, `adresse`*, `description`
- Endpoint : `POST /batiments` (création) / `PATCH /batiments/:id` (modification)
- Erreurs : afficher `message` ou `errors[]`

#### UC-BAT-03 : Supprimer bâtiment
- ConfirmDialog avant suppression
- Endpoint : `DELETE /batiments/:id`
- Erreur 422 : "Impossible de supprimer ce bâtiment : des logements y sont rattachés" (RG-03)

#### UC-BAT-04 : Dashboard bâtiment (`/batiments/[id]`)
- Endpoint : `GET /batiments/:id/dashboard`
- Afficher : totalLogements, logementsOccupes, logementsVacants (donut chart), montantTotalPercu, montantTotalArrieres
- Liste des logements du bâtiment avec statut et arriérés

---

### UC-LOG : Logements

#### UC-LOG-01 : Liste (`/logements`)
- Endpoint : `GET /logements`
- DataTable : nom, bâtiment, loyer actuel, statut (occupé/libre), locataire actuel, date_dernier_jour_couvert
- StatusBadge : Occupé (rouge) / Libre (vert)
- Bouton "Nouveau logement" : ADMIN_BATIMENT+

#### UC-LOG-02 : Créer logement (modal)
- Champs : `batimentId`*, `nom`*, `description`, `loyerMontant`*, `loyerDateDebut`, `loyerPeriodeNombre`*, `loyerPeriodeType`*
- Endpoint : `POST /logements`
- Note : crée le logement ET son loyer initial en une seule opération

#### UC-LOG-03 : Modifier logement (modal)
- Champs : `nom`, `description`
- Endpoint : `PATCH /logements/:id`
- Accès : ADMIN_BATIMENT+

#### UC-LOG-04 : Supprimer logement
- ConfirmDialog
- Endpoint : `DELETE /logements/:id`
- Erreur 422 : "Impossible de supprimer ce logement : une occupation y est rattachée" (RG-02)

#### UC-LOG-05-a : Historique loyers (`/logements/[id]` onglet Loyers)
- Endpoint : `GET /logements/:id/loyers`
- Liste chronologique : montant, date début, période

#### UC-LOG-05-b : Historique occupations (`/logements/[id]` onglet Occupations)
- Endpoint : `GET /logements/:id/occupations`
- Liste chronologique : locataire, date début, date fin, statut

#### UC-LOG-06 : Ajouter loyer (modal)
- Champs : `montant`*, `dateDebut`, `periodeNombre`*, `periodeType`*
- Endpoint : `POST /logements/:id/loyers`
- Erreur 409 : "Un loyer avec cette date de début existe déjà pour ce logement" (RG-09)

#### UC-LOG-07 : Dashboard logement (`/logements/[id]`)
- Endpoint : `GET /logements/:id/dashboard`
- Afficher : statut occupation, loyer actuel, locataire actuel, arriérés du locataire actuel, stats globales
- `arrieresLocataireActuel = null` → afficher badge "À jour"

---

### UC-LOC : Locataires

#### UC-LOC-01 : Liste (`/locataires`)
- Endpoint : `GET /locataires`
- DataTable : nom, prénom, téléphone, email, statut libre, occupation active, arriéré
- Badge arriéré rouge + montant si arriéré

#### UC-LOC-02 : Créer locataire (modal)
- Champs : `nom`*, `prenom`*, `telephone`*, `email`, `utilisateurId` (sélecteur parmi utilisateurs avec rôle LOCATAIRE)
- Endpoint : `POST /locataires`
- Erreurs : 404 si utilisateurId invalide, 400 si rôle ≠ LOCATAIRE

#### UC-LOC-03 : Modifier locataire (modal)
- Endpoint : `PATCH /locataires/:id`

#### UC-LOC-04 : Supprimer locataire
- ConfirmDialog
- Endpoint : `DELETE /locataires/:id`
- Erreur 422 : "Impossible de supprimer ce locataire : une occupation est liée" (RG-01)

#### UC-LOC-05 : Dashboard locataire (`/locataires/[id]`)
- Endpoint : `GET /locataires/:id/dashboard`
- Afficher : total occupations, solvabilité (montant payé, arriérés), liste arriérés, assiduité (taux ponctualité, retard moyen)

---

### UC-OCC : Occupations

#### UC-OCC-01 : Liste (`/occupations`)
- Endpoint : `GET /occupations`
- Query param optionnel : `?statut=0` (en cours, `dateFin IS NULL`) | `?statut=1` (terminées, `dateFin IS NOT NULL`) | absent → toutes
- DataTable : logement, locataire, date début, date fin, statut (actif/terminé), date dernier jour couvert
- StatusBadge : Actif (bleu) / Terminé (gris)

**Stratégie de chargement (performance) :**

- Arrivée sur la page → charger uniquement `?statut=0` (en cours) — léger et rapide
- Clic "Terminées" → charger `?statut=1` **une seule fois**, mettre en cache dans le state local (`terminatedOccs`)
- Clic "Toutes" → fusionner les deux datasets (pas de nouvel appel si les deux sont déjà chargés)
- State : `activeOccs: Occupation[] | null`, `terminatedOccs: Occupation[] | null` (null = pas encore chargé)
- SelectButton : "En cours" (défaut) | "Terminées" | "Toutes"

#### UC-OCC-02 : Créer occupation (modal)
- Champs : `logementId`* (sélecteur parmi logements libres), `locataireId`* (sélecteur parmi locataires libres de préférence), `dateDebut`*
- Endpoint : `POST /occupations`
- Erreur 422 : "Ce logement est actuellement occupé" (RG-05)
- **Dupliqué dans `/logements`** : bouton "Occuper" sur chaque ligne de logement libre (logementId pré-rempli, non modifiable)

#### UC-OCC-03 : Modifier occupation (modal)
- Champs : `dateDebut`, `locataireId`
- Endpoint : `PATCH /occupations/:id`
- Erreur 422 : "Impossible de modifier : des paiements existent ou l'occupation est terminée" (RG-06)

#### UC-OCC-04 : Terminer occupation (bouton "Mettre fin")
- Champ : `dateFin`*
- Endpoint : `PATCH /occupations/:id/fin`

#### UC-OCC-05 : Supprimer occupation
- ConfirmDialog
- Endpoint : `DELETE /occupations/:id`
- Erreur 422 : RG-06

#### UC-OCC-06 : Upload contrat de bail
- FileUploader : 1 fichier, max 10 Mo, MIME : PDF, images (jpg/png), Word
- Endpoint : `POST /occupations/:id/contrat` (multipart, champ `file`)
- Remplace l'ancien contrat si existant

#### UC-OCC-07 : Télécharger contrat
- Endpoint : `GET /occupations/:id/contrat`
- Déclencher le téléchargement via streaming (utiliser `responseType: 'blob'`)

#### UC-OCC-08 : Voir arriérés d'une occupation
- Endpoint : `GET /occupations/:id/arrieres`
- Afficher si `data !== null` : période due, montant dû, nombre de loyers

---

### UC-PAI : Paiements

#### UC-PAI-01 : Liste (`/paiements`)
- Endpoint : `GET /paiements`
- **Pagination côté serveur** : query params `page` (défaut 1) et `limit` (défaut 20, max 100)
- Réponse inclut un champ `meta` : `{ total, page, limit, totalPages }` — utiliser pour la pagination du DataTable
- DataTable : occupation, locataire, logement, période, montant payé, date paiement, nombre loyers
- Filtre par occupation, logement, locataire, période

#### UC-PAI-02 : Formulaire paiement (modal avec toggle Option 1 / Option 2)

- **Dupliqué dans `/occupations`** : bouton "Enregistrer un paiement" sur chaque ligne d'occupation active (occupationId pré-rempli)

**Option 1 – par nombre de loyers :**
- Champs : `occupationId`*, `nombreDeLoyers`*, `datePaiement`, `commentaire`
- Affichage temps réel (sans appel API) :
  - `debut_periode` = `dateDernierJourCouvert + 1 jour` (lecture seule)
  - `fin_periode` = calcul client selon le loyer actif
  - `montant_paye` = `nombreDeLoyers × loyer.montant`
- Endpoint : `POST /paiements/option1`

**Option 2 – montant libre :**
- Champs : `occupationId`*, `montantPaye`*, `finPeriode`*, `datePaiement`, `commentaire`
- `debut_periode` affiché en lecture seule
- Validation client : `finPeriode >= debutPeriode` (RG-12)
- Endpoint : `POST /paiements/option2`

#### UC-PAI-03 : Modifier paiement (modal)
- Uniquement le dernier paiement d'une occupation
- Champs : `datePaiement`, `commentaire`, `montantPaye`, `finPeriode`
- Endpoint : `PATCH /paiements/:id`
- Erreur 422 : "Seul le dernier paiement est modifiable" (RG-07)

#### UC-PAI-04 : Supprimer paiement
- ConfirmDialog
- Endpoint : `DELETE /paiements/:id`
- Erreur 422 : RG-07

#### UC-PAI-05 : Upload preuves de paiement
- FileUploader multiple : max 10 fichiers, max 5 Mo/fichier, MIME : PDF, images, Word
- Endpoint : `POST /paiements/:id/preuves` (champ `files`, array)
- Remplacer toutes les preuves : `PATCH /paiements/:id/preuves`

---

### UC-USR : Utilisateurs

#### UC-USR-01 : Liste (`/utilisateurs`)
- Endpoint : `GET /users`
- DataTable : nom, prénom, username, rôle, téléphone, email, actif/inactif
- Chaque admin ne voit que les utilisateurs de son périmètre

#### UC-USR-02 : Créer utilisateur (modal)

- Champs : `nom`*, `prenom`*, `telephone`*, `email`, `username`*, `role`*
- Le mot de passe est **généré automatiquement** (non saisi par l'admin) et **affiché en lecture seule** dans le modal après génération (avant soumission). L'admin le communique à l'utilisateur qui pourra le modifier lui-même via son profil.
- Rôles affichables selon le rôle de l'admin connecté :
  - ADMIN_LOGEMENT : peut créer LOCATAIRE uniquement
  - ADMIN_BATIMENT : peut créer LOCATAIRE, ADMIN_LOGEMENT
  - ADMIN_GLOBAL : peut créer tous les rôles
- Endpoint : `POST /users`
- Erreur 409 : "Ce nom d'utilisateur est déjà pris"

#### UC-USR-03 : Voir/Modifier utilisateur (`/utilisateurs/[id]`)
- Endpoint : `GET /users/:id` (retourne `batiments[]` et `logements[]`)
- Modifier : `nom`, `prenom`, `telephone`, `email`, `role`
- Endpoint : `PATCH /users/:id`
- Erreur 422 si changement de rôle bloqué (données liées)

#### UC-USR-04 : Activer/Désactiver utilisateur
- Bouton toggle "Activer"/"Désactiver"
- Endpoint : `PATCH /users/:id/activate` avec `{ isActive: true/false }`
- La suppression est **interdite** (RG-04) — ne jamais afficher un bouton "Supprimer"

#### UC-USR-05 : Réinitialiser mot de passe (admin)

- Le nouveau mot de passe est **généré automatiquement** (non saisi par l'admin) et **affiché en lecture seule** dans un modal de confirmation. L'admin le communique à l'utilisateur.
- Endpoint : `PATCH /users/:id/reset-password` avec `{ newPassword }`

#### UC-USR-06 : Attribuer un bâtiment à ADMIN_BATIMENT
- Sélecteur de bâtiment + bouton "Attribuer"
- Endpoint : `POST /users/:id/batiments/:batimentId`
- Retirer : `DELETE /users/:id/batiments/:batimentId`
- Visible : ADMIN_GLOBAL uniquement

#### UC-USR-07 : Attribuer un logement à ADMIN_LOGEMENT
- Sélecteur de logement + bouton "Attribuer"
- Endpoint : `POST /users/:id/logements/:logementId`
- Retirer : `DELETE /users/:id/logements/:logementId`
- Visible : ADMIN_BATIMENT+ (uniquement logements dans ses propres bâtiments)

---

### UC-EXP : Export

Endpoint base : `GET /export/...`
Accès minimum : ADMIN_LOGEMENT
Tous les exports retournent un fichier binaire (Blob) — utiliser `responseType: 'blob'`

| Endpoint               | Onglet/Rapport         | Accès minimum  |
|------------------------|------------------------|----------------|
| `/export/paiements`    | Paiements              | ADMIN_LOGEMENT |
| `/export/arrieres`     | Arriérés               | ADMIN_LOGEMENT |
| `/export/logements`    | Logements              | ADMIN_LOGEMENT |
| `/export/locataires`   | Locataires             | ADMIN_LOGEMENT |
| `/export/batiments`    | Bâtiments              | ADMIN_BATIMENT |
| `/export/occupations`  | Occupations            | ADMIN_LOGEMENT |
| `/export/complet`      | Classeur multi-onglets | ADMIN_LOGEMENT |

**Query params communs :** `format` (excel/pdf)*, `dateDebut`, `dateFin`, `batimentId`, `logementId`

**Pattern de téléchargement Blob :**
```typescript
const response = await apiClient.get('/export/paiements', {
  params: { format: 'excel', dateDebut, dateFin },
  responseType: 'blob'
});
const url = URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.download = `paiements_${date}.xlsx`;
link.click();
URL.revokeObjectURL(url);
```

---

### UC-LOC-PERSO : Espace personnel Locataire (`/locataire`)

Accessible uniquement au rôle LOCATAIRE, tout en lecture seule.

- Endpoint occupation : `GET /occupations/:id`
- Endpoint arriérés : `GET /occupations/:id/arrieres`
- Endpoint paiements : `GET /paiements` (filtrés sur ses occupations)

**Affichage :**
- Si arriéré → badge rouge + montant dû + période due
- Si à jour → badge vert + "Prochain paiement attendu le [dateDernierJourCouvert + 1 jour]"
- Historique de ses paiements (lecture seule)
- Accès au téléchargement de son contrat de bail

---

## Règles métier à afficher côté frontend (RG-01 à RG-12)

| Règle | Déclencheur | Message à afficher |
| ----- | ----------- | ----------------- |
| RG-01 | DELETE /locataires/:id → 422 | "Impossible de supprimer : une occupation est liée à ce locataire" |
| RG-02 | DELETE /logements/:id → 422 | "Impossible de supprimer : une occupation est liée à ce logement" |
| RG-03 | DELETE /batiments/:id → 422 | "Impossible de supprimer : des logements sont rattachés à ce bâtiment" |
| RG-04 | DELETE /users/:id → 405 | Bouton suppression JAMAIS affiché |
| RG-05 | POST /occupations → 422 | "Ce logement est déjà occupé" |
| RG-06 | PATCH/DELETE /occupations/:id → 422 | "Impossible de modifier : des paiements existent ou l'occupation est terminée" |
| RG-07 | PATCH/DELETE /paiements/:id → 422 | "Seul le dernier paiement d'une occupation peut être modifié ou supprimé" |
| RG-07b | Occupation terminée (dateFin définie) | Aucun paiement lié à une occupation terminée n'est modifiable/supprimable — masquer les boutons Modifier et Supprimer côté client |
| RG-08 | Preuves : tout paiement modifiable | Upload preuves toujours disponible, même pour anciens paiements |
| RG-09 | POST /logements/:id/loyers → 409 | "Un loyer avec cette date de début existe déjà pour ce logement" |
| RG-10 | Création occupation | Afficher `dateDernierJourCouvert = dateDebut - 1 jour` |
| RG-11 | Après chaque paiement | Mettre à jour l'affichage de `dateDernierJourCouvert` |
| RG-12 | Option 2 client-side | "La fin de période doit être ≥ au début de période" |

---

## Affichage Locataire (vue espace personnel)
- Si arriéré → badge rouge + montant dû + période due
- Si à jour → badge vert + date attendue prochain paiement (= date_dernier_jour_couvert + 1 jour)
- Tout en lecture seule, aucun bouton de modification

---

## Module Config — `/config` (PUBLIC)

Endpoint appelé **au démarrage de l'application** (avant même le login) pour récupérer les limites d'upload définies côté backend. Permet d'éviter toute duplication des valeurs entre backend et frontend.

```
GET /config   →   accès public, aucun token requis
```

**Réponse 200 :**
```json
{
  "data": {
    "upload": {
      "contrat": {
        "maxSizeMb": 10,
        "maxFiles": 1,
        "mimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      },
      "preuve": {
        "maxSizeMb": 5,
        "maxFiles": 10,
        "mimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/webp"]
      }
    }
  }
}
```

**Règle d'implémentation :** stocker ces valeurs dans le Redux store (`uiSlice` ou slice dédié `configSlice`) dès le démarrage. Le composant `FileUploader` les lit depuis Redux pour sa validation côté client. Ne jamais hardcoder ces limites dans le frontend.

---

## Upload de fichiers — contraintes

### Contrat de bail
- Endpoint : `POST /occupations/:id/contrat`
- Champ multipart : `file` (unique)
- Max : provient du backend et stocké dans le store
- MIME autorisés : provient du backend et stocké dans le store
- Remplace l'ancien contrat (l'ancien est supprimé côté serveur)

### Preuves de paiement
- Endpoints : `POST /paiements/:id/preuves` (ajout), `PATCH /paiements/:id/preuves` (remplacement)
- Champ multipart : `files` (array, nombre max de fichiers provient du backend et stocké dans le store)
- Max : provient du backend et stocké dans le store
- MIME autorisés : idem

### Téléchargement contrat
- Endpoint : `GET /occupations/:id/contrat`
- Réponse en streaming avec headers `Content-Disposition: attachment`
- Utiliser `responseType: 'blob'` dans Axios

---

## Rate Limiting (à gérer côté frontend)

| Route                    | Limite        | Message utilisateur                              |
|--------------------------|---------------|--------------------------------------------------|
| `POST /auth/login`       | 5 req / 60 s  | "Trop de tentatives de connexion. Réessayez dans 1 minute." |
| `POST /auth/refresh`     | 10 req / 60 s | Géré silencieusement par l'intercepteur          |
| `POST /auth/forgot-password` | 5 req / 60 s | "Trop de demandes. Réessayez dans 1 minute."   |
| Toutes les autres        | 100 req / 60 s| "Trop de requêtes. Veuillez patienter."          |

---

## Composants partagés à créer (Phase F5.7)
- `PageHeader` : titre + breadcrumb + bouton d'action contextuel
- `DataTableWrapper` : PrimeReact DataTable avec tri/filtre/pagination préconfigurés
- `StatusBadge` : badge coloré (Occupé/Libre, À jour/Arriéré, Actif/Inactif)
- `ConfirmDialog` : confirmation avant suppression
- `LoadingSpinner` / `SkeletonLoader`
- `ErrorMessage` : affichage erreurs API
- `FileUploader` : upload avec prévisualisation + validation MIME/taille (côté client avant envoi)
- `ExportModal` : choix format (Excel/PDF) + période + périmètre + bouton télécharger
- `RoleGuard` : composant React qui affiche ses enfants uniquement si le rôle est autorisé

---

## Variables d'environnement requises (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CRYPTO_SECRET=...    ← clé de chiffrement redux-persist
```

---

## Plan de réalisation – Étapes Frontend

### Phase 0 – Initialisation (partie frontend)
- P0.1 : Créer repo Git frontend + README + .gitignore ✓
- P0.3 : Initialiser projet Next.js 16 TypeScript (`create-next-app@latest` – App Router, TailwindCSS) ✓
- P0.4 : Configurer variables d'environnement (.env.local + .env.example documenté) ✓
- P0.7 : Installer toutes les dépendances frontend ✓

### Phase 5 – Fondations Frontend
- F5.1 : Redux Toolkit + redux-persist chiffré (CryptoJS) + Provider dans app/layout.tsx
  - Slices : `authSlice` (accessToken, user), `uiSlice` (sidebar, notifications), `configSlice`
- F5.2 : apiClient Axios + intercepteur request (Bearer token) + intercepteur response (refresh auto sur 401)
  - Gérer la rotation du cookie `refresh_token` (cookie HttpOnly, path `/auth`)
- F5.3 : Services API frontend typés (un fichier par entité dans `services/`)
  - `auth.api.ts`, `users.api.ts`, `batiments.api.ts`, `logements.api.ts`, `locataires.api.ts`, `occupations.api.ts`, `paiements.api.ts`, `dashboard.api.ts`, `export.api.ts`
- F5.4 : `middleware.ts` – protection des routes + vérification rôle JWT
  - Routes publiques : `/login`, `/forgot-password`, `/reset-password`
  - LOCATAIRE → redirect `/locataire`, autres rôles → dashboard
- F5.5 : Layouts (racine, `(auth)`, `(dashboard)` avec sidebar + header + footer + notification session expirée)
  - Sidebar : items filtrés par rôle, repliée sur mobile
  - Header : nom utilisateur + rôle + bouton profil + déconnexion
- F5.6 : Pages Auth
  - Login (`/login`) : UC-AUTH-01
  - Mot de passe oublié (`/forgot-password`) : UC-AUTH-02
  - Réinitialisation (`/reset-password`) : UC-AUTH-03
  - Changement mot de passe (dans `/profil`) : UC-AUTH-04
- F5.7 : Composants partagés (PageHeader, DataTableWrapper, StatusBadge, ConfirmDialog, LoadingSpinner, ErrorMessage, FileUploader, ExportModal, RoleGuard)
- F5.8 : Types TypeScript partagés dans `types/` (toutes les interfaces des entités)

### Phase 6 – Pages métier (CRUD)
- F6.1 : Pages Bâtiments (UC-BAT-01 à UC-BAT-04) : liste, CRUD modal, dashboard bâtiment
- F6.2 : Pages Logements (UC-LOG-01 à UC-LOG-07) : liste, CRUD modal, historique loyers, ajout loyer, dashboard logement
- F6.3 : Pages Locataires (UC-LOC-01 à UC-LOC-05) : liste avec badge arriéré, CRUD modal, dashboard locataire
- F6.4 : Pages Occupations (UC-OCC-01 à UC-OCC-08) : liste, CRUD modal, fin d'occupation, upload contrat, téléchargement contrat, arriérés + bouton "Occuper" dupliqué dans `/logements` (UC-OCC-02 avec logementId pré-rempli)
- F6.5 : Formulaire Paiement (UC-PAI-01 à UC-PAI-05) : Option 1/2 avec calcul temps réel, toggle, upload preuves + bouton "Enregistrer un paiement" dupliqué dans `/occupations` (UC-PAI-02 avec occupationId pré-rempli)
- F6.6 : Pages Utilisateurs (UC-USR-01 à UC-USR-07) : liste, CRUD modal, activation, reset mdp, attribution bâtiments/logements
- F6.7 : Espace Locataire (UC-LOC-PERSO) : lecture seule, arriéré ou prochain paiement, historique paiements
- F6.8 : Page Profil (`/profil`) : infos utilisateur + changement mot de passe (UC-AUTH-04)

### Phase 7 – Dashboards & Export
- F7.1 : Dashboard principal (UC-DASH) : KPIs globaux + liste logements avec code couleur
- F7.2 : Dashboard Bâtiment (UC-BAT-04) : donut occupé/libre + arriérés
- F7.3 : Dashboard Logement (UC-LOG-07) : statut actuel + historique paiements + arriérés
- F7.4 : Dashboard Locataire (UC-LOC-05) : solvabilité + assiduité + arriérés
- F7.5 : ExportModal intégré sur toutes les pages liste + téléchargement Blob (UC-EXP)
- F7.6 : Responsive design & polish UI (375px / 768px / 1280px+, cohérence visuelle)

### Phase 8 – Intégration & Finalisation
- I8.1 : Tests E2E flux critiques (login → logement → occupation → paiement → export)
- I8.2 : Vérification règles métier RG-01 à RG-12 (messages d'erreur côté frontend)
- I8.3 : Tests RBAC – vérifier que chaque rôle ne voit que son périmètre
- I8.5 : Vérification logs et gestion des erreurs non gérées (ErrorBoundary React)
- I8.6 : Configuration déploiement (Dockerfile frontend, variables d'env de prod)

---

## Étape en cours
F6.7

## Étapes complétées

- P0.1 : Repo Git + README + .gitignore ✓
- F5.1 : Redux Toolkit + redux-persist chiffré ✓
- F5.2 : apiClient Axios + intercepteurs JWT ✓
- F5.3 : Services API frontend typés ✓
- F5.4 : proxy.ts – protection des routes + vérification rôle JWT ✓
  - Fichiers créés : `proxy.ts` (renommé depuis middleware.ts — convention Next.js 16), `utils/cookies.ts`
  - Cookie `access_token` (plain) posé au login/refresh, lu par le proxy
  - `decodeJwt` (jose) pour extraire le rôle sans vérification de signature
  - LOCATAIRE → /locataire | autres rôles → / | routes publiques protégées si déjà connecté
- F5.5 : Layouts (auth, dashboard) + Sidebar + Header + SessionGuard ✓
  - `app/(auth)/layout.tsx` : layout public centré + branding
  - `app/(dashboard)/layout.tsx` : sidebar + header + SessionGuard
  - `components/layout/Sidebar.tsx` : nav filtrée par rôle, drawer mobile / fixe desktop
  - `components/layout/Header.tsx` : username, badge rôle, profil, déconnexion
  - `components/layout/SessionGuard.tsx` : toast "Session expirée" + redirect /login (déclenché par uiSlice.sessionExpired)
  - `uiSlice` étendu : `sessionExpired` boolean (dispatché par apiClient, lu par SessionGuard)
  - PrimeReact 10 configuré : `PrimeReactProvider` dans StoreProvider, thème lara-light-blue, `transpilePackages`
- F5.6 : Pages Auth ✓
  - `/login` : react-hook-form + zod, setAccessTokenCookie au succès, redirect par rôle, erreurs 401/429
  - `/forgot-password` : message générique toujours affiché (ne révèle pas l'existence du compte), erreur 429
  - `/reset-password` : lit `?token=` via useSearchParams (Suspense), confirmation mot de passe, erreur 400/429
- F5.7 : Composants partagés ✓ (PageHeader, DataTableWrapper, StatusBadge, ConfirmDialog, LoadingSpinner, ErrorMessage, FileUploader, ExportModal, RoleGuard)
- F5.8 : Types TypeScript partagés dans `types/` ✓
- F6.1 : Pages Bâtiments ✓ (liste CRUD + dashboard `/batiments/[id]`)
- F6.2 : Pages Logements ✓
  - `/logements` : liste avec statut (occupationsApi statut=0), locataire actuel, loyer actuel, CRUD modal
  - `/logements/[id]` : TabView — Dashboard (KPIs, arriérés loc. actuel) | Loyers (lazy load + ajout) | Occupations (lazy load)
  - Stratégie lazy load : loyers et occupations chargés uniquement au premier clic sur l'onglet
- F6.3 : Pages Locataires ✓
- F6.4 : Pages Occupations ✓
  - `/occupations` : liste (tabs lazy loading En cours/Terminées/Toutes), CRUD modal, fin d'occupation, upload/download contrat, modal arriérés
  - `/logements` : bouton "Occuper" (pi-user-plus) sur logements libres → modal création occupation avec logementId pré-rempli (ADMIN_LOGEMENT+)
  - `/locataires` : liste (nom, prénom, téléphone, email, statut libre, logement actuel, dernier jour couvert en rouge si retard), CRUD modal
  - Chargement : locataires + occupations actives (statut=0) + users LOCATAIRE en parallèle
  - `/locataires/[id]` : dashboard — infos, arriérés (liste ou badge à jour), KPIs occupations, solvabilité, assiduité
- F6.6 : Pages Utilisateurs ✓
  - `/utilisateurs` : liste avec filtre global (nom, username, email, téléphone), badges rôle et statut, CRUD modal (mdp auto-généré affiché en readonly), toggle activer/désactiver, reset mdp (mdp auto-généré affiché en readonly)
  - `/utilisateurs/[id]` : fiche éditable (nom, prénom, téléphone, email, rôle), boutons activer/désactiver et reset mdp, attribution bâtiments (ADMIN_GLOBAL → ADMIN_BATIMENT), attribution logements (ADMIN_BATIMENT+ → ADMIN_LOGEMENT), redirect vers /profil si l'admin consulte son propre compte
  - `roleLabels` et `roleColors` exportés depuis la page liste pour réutilisation
- F6.5 : Paiements ✓
  - `/paiements` : liste paginée serveur (lazy DataTable, page/limit), CRUD modal, upload preuves (ajout ou remplacement)
  - `PaiementFormDialog` : composant partagé, toggle Option 1 (nombre de loyers, calcul temps réel) / Option 2 (montant libre, RG-12)
  - Calcul temps réel opt1 : `debutPeriode = dateDernierJourCouvert + 1 j` (lu sur l'occupation), `finPeriode` et `montantPaye` calculés via `addPeriode`
  - Loyer actif résolu via `logement.loyerActuel` (chargé avec `?includeLoyer=true`)
  - `/occupations` : bouton "Enregistrer un paiement" (pi-wallet) sur chaque occupation active → `PaiementFormDialog` avec occupationId verrouillé
  - Après paiement créé dans `/occupations` : rechargement des occupations actives (RG-11 : dateDernierJourCouvert mis à jour)
- P0.3 : Next.js 16 TypeScript (App Router + TailwindCSS) ✓
- P0.4 : Variables d'environnement (.env.local + .env.example) ✓
- P0.7 : Dépendances installées (Redux, Axios, PrimeReact, react-hook-form, zod, jose, sass…) ✓
