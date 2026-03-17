# Gestion de Logements – Frontend

Application web de gestion de logements à louer, développée avec Next.js 15 (App Router).

## Stack technique

- **Framework** : Next.js 16 TypeScript (App Router)
- **État global** : Redux Toolkit + redux-persist chiffré (CryptoJS)
- **Styles** : TailwindCSS + SCSS
- **Composants UI** : PrimeReact + PrimeIcons
- **Client HTTP** : Axios avec intercepteurs JWT
- **Validation formulaires** : react-hook-form + zod

## Prérequis

- Node.js >= 18
- npm >= 9
- Backend NestJS lancé sur `http://localhost:3000`

## Installation

```bash
npm install
```

## Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner les valeurs :

```bash
cp .env.example .env.local
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3001](http://localhost:3001) dans le navigateur.

## Build production

```bash
npm run build
npm start
```

## Rôles utilisateur

| Rôle | Périmètre |
|------|-----------|
| `LOCATAIRE` | Lecture seule — ses occupations et paiements uniquement |
| `ADMIN_LOGEMENT` | Gestion des logements attribués |
| `ADMIN_BATIMENT` | CRUD logements pour ses bâtiments |
| `ADMIN_GLOBAL` | Accès total sans restriction |
