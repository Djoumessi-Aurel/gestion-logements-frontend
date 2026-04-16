'use client';

import Link from 'next/link';
import { useState } from 'react';

// ─── Données ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'pi-building',
    title: 'Gestion des bâtiments',
    description:
      "Centralisez tous vos bâtiments en un seul endroit. Suivez le taux d'occupation, les arriérés et les revenus par immeuble en temps réel.",
  },
  {
    icon: 'pi-home',
    title: 'Gestion des logements',
    description:
      'Gérez chaque unité locative : loyer, historique des occupations, locataire actuel et arriérés. Un tableau de bord dédié par logement.',
  },
  {
    icon: 'pi-users',
    title: 'Dossiers locataires',
    description:
      "Suivez la solvabilité et l'assiduité de chaque locataire. Taux de ponctualité, retard moyen, historique complet des paiements.",
  },
  {
    icon: 'pi-calendar',
    title: 'Gestion des occupations',
    description:
      "Créez et terminez les occupations, uploadez les contrats de bail, consultez les arriérés à l'instant T pour chaque occupation.",
  },
  {
    icon: 'pi-money-bill',
    title: 'Suivi des paiements',
    description:
      'Enregistrez les paiements en quelques clics. Calcul automatique des montants et des périodes. Preuves de paiement attachées.',
  },
  {
    icon: 'pi-download',
    title: 'Exports Excel & PDF',
    description:
      'Exportez paiements, arriérés, logements, locataires et plus encore. Classeur multi-onglets disponible pour une vue globale.',
  },
];

const ROLES = [
  {
    title: 'Admin Global',
    color: 'bg-[#1e3a8a] text-white',
    icon: 'pi-shield',
    perks: [
      'Accès total sans restriction',
      'Gestion des utilisateurs et des rôles',
      'Attribution des bâtiments et logements',
      'Tous les exports disponibles',
    ],
  },
  {
    title: 'Admin Bâtiment',
    color: 'bg-[#3b82f6] text-white',
    icon: 'pi-building',
    perks: [
      'CRUD logements sur ses bâtiments',
      'Gestion des occupations et paiements',
      'Attribution de logements aux admins',
      'Dashboard bâtiment et exports',
    ],
  },
  {
    title: 'Admin Logement',
    color: 'bg-[#dbeafe] text-[#1e3a8a]',
    icon: 'pi-home',
    perks: [
      'Gestion des logements attribués',
      'CRUD locataires, occupations, paiements',
      'Création de comptes locataires',
      'Exports dans son périmètre',
    ],
  },
  {
    title: 'Locataire',
    color: 'bg-gray-100 text-gray-700',
    icon: 'pi-user',
    perks: [
      'Espace personnel en lecture seule',
      'Suivi de ses paiements',
      'Visualisation des arriérés',
      'Téléchargement du contrat de bail',
    ],
  },
];

const STATS = [
  { value: '100 %',     label: 'Web — aucune installation',  icon: 'pi-globe'   },
  { value: 'JWT',       label: 'Authentification sécurisée', icon: 'pi-lock'    },
  { value: 'RBAC',      label: "Contrôle d'accès par rôle",  icon: 'pi-sitemap' },
  { value: 'Excel & PDF', label: "Formats d'export",         icon: 'pi-file'    },
];

const MODULES = [
  { icon: 'pi-th-large',   label: 'Dashboard global',  desc: 'KPIs, taux d\'occupation, retards' },
  { icon: 'pi-building',   label: 'Bâtiments',         desc: 'Liste, stats et dashboard par immeuble' },
  { icon: 'pi-warehouse',  label: 'Logements',         desc: 'Fiches, loyers, historique, statut' },
  { icon: 'pi-users',      label: 'Locataires',        desc: 'Solvabilité, assiduité, arriérés' },
  { icon: 'pi-calendar',   label: 'Occupations',       desc: "Contrats, arriérés, fin d'occupation" },
  { icon: 'pi-money-bill', label: 'Paiements',         desc: 'Deux modes de saisie, preuves jointes' },
  { icon: 'pi-user-edit',  label: 'Utilisateurs',      desc: 'Comptes, rôles, mots de passe' },
  { icon: 'pi-download',   label: 'Exports',           desc: 'Rapports Excel et PDF à la demande' },
];

const PAYMENT_ITEMS = [
  { icon: 'pi-calculator', text: 'Calcul automatique montant × loyers' },
  { icon: 'pi-calendar',   text: 'Période calculée depuis la dernière date couverte' },
  { icon: 'pi-paperclip',  text: 'Preuves de paiement jointes au dossier' },
  { icon: 'pi-chart-bar',  text: 'Taux de ponctualité calculé par locataire' },
];

// ─── Composants ───────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/presentation" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center shrink-0">
            <i className="pi pi-building text-white text-sm" />
          </div>
          <span className="font-bold text-[#1e293b] text-sm leading-tight">
            Gestion<br />Logements
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <a href="#fonctionnalites" className="hover:text-[#1e3a8a] transition-colors">Fonctionnalités</a>
          <a href="#modules"         className="hover:text-[#1e3a8a] transition-colors">Modules</a>
          <a href="#roles"           className="hover:text-[#1e3a8a] transition-colors">Rôles</a>
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#1e3a8a] border border-[#1e3a8a] hover:bg-[#dbeafe] transition-colors"
          >
            Se connecter
          </Link>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <i className={`pi ${open ? 'pi-times' : 'pi-bars'} text-lg`} />
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <a href="#fonctionnalites" onClick={() => setOpen(false)} className="block text-sm text-gray-600 py-1">Fonctionnalités</a>
          <a href="#modules"         onClick={() => setOpen(false)} className="block text-sm text-gray-600 py-1">Modules</a>
          <a href="#roles"           onClick={() => setOpen(false)} className="block text-sm text-gray-600 py-1">Rôles</a>
          <Link
            href="/login"
            className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium bg-[#1e3a8a] text-white"
          >
            Se connecter
          </Link>
        </div>
      )}
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Gestion de Logements',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    "Application web de gestion locative : bâtiments, logements, locataires, paiements, arriérés, exports Excel et PDF.",
  author: {
    '@type': 'Person',
    name: 'Aurel Djoumessi',
    url: 'https://aureldjoumessi.com',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'XAF',
  },
};

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-white text-[#1e293b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#3b82f6] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-32 -translate-y-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-24 translate-y-24 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-6 border border-white/20">
            <i className="pi pi-star-fill text-yellow-300 text-xs" />
            Plateforme de gestion locative complète
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Gérez vos logements<br />
            <span className="text-[#93c5fd]">en toute sérénité</span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Une application web moderne pour centraliser la gestion de vos bâtiments,
            logements, locataires et paiements — avec un contrôle d&apos;accès précis
            adapté à chaque intervenant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#1e3a8a] font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              <i className="pi pi-sign-in" />
              Accéder à l&apos;application
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <i className="pi pi-arrow-down" />
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>

        {/* Vague de transition */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-xl bg-[#dbeafe] flex items-center justify-center">
                <i className={`pi ${s.icon} text-[#1e3a8a] text-lg`} />
              </div>
              <p className="text-xl font-bold text-[#1e3a8a]">{s.value}</p>
              <p className="text-xs text-gray-500 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ───────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e293b] mt-2 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              De la gestion des bâtiments aux exports comptables, chaque aspect
              de la gestion locative est couvert.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[#dbeafe] flex items-center justify-center mb-4">
                  <i className={`pi ${f.icon} text-[#1e3a8a] text-lg`} />
                </div>
                <h3 className="font-semibold text-[#1e293b] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ───────────────────────────────────────────────────────────── */}
      <section id="modules" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Modules</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e293b] mt-2 mb-4">
              Une application, huit modules
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Chaque module est conçu pour une tâche précise et s&apos;intègre
              naturellement avec les autres.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MODULES.map((m, i) => (
              <div
                key={m.label}
                className="group rounded-2xl border border-gray-100 p-5 hover:border-[#3b82f6] hover:bg-[#dbeafe]/30 transition-all duration-200 cursor-default"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#dbeafe] group-hover:bg-[#3b82f6] flex items-center justify-center transition-colors">
                    <i className={`pi ${m.icon} text-[#1e3a8a] group-hover:text-white text-sm transition-colors`} />
                  </div>
                  <span className="text-xs font-bold text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="font-semibold text-sm text-[#1e293b] mb-1">{m.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Focus paiements ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#dbeafe] to-[#eff6ff]">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Maquette */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm border border-blue-100">
              <div className="flex items-center justify-between mb-5">
                <span className="font-semibold text-sm text-[#1e293b]">Enregistrer un paiement</span>
                <span className="text-xs bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full font-medium">Option 1</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Occupation</span>
                  <span className="font-medium text-[#1e293b]">Appt 3B — Dupont</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Début période</span>
                  <span className="font-medium text-[#1e293b]">01/05/2026</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Nombre de loyers</span>
                  <span className="font-medium text-[#1e293b]">× 2</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between text-gray-500">
                  <span>Fin période calculée</span>
                  <span className="font-medium text-[#1e293b]">30/06/2026</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1e3a8a]">
                  <span>Montant total</span>
                  <span>120 000 FCFA</span>
                </div>
              </div>
              <div className="mt-5 w-full py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold text-center">
                Enregistrer
              </div>
            </div>
          </div>

          {/* Texte */}
          <div className="w-full lg:w-1/2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Paiements</span>
            <h2 className="text-3xl font-bold text-[#1e293b] mt-2 mb-4">
              Saisie intelligente,<br />zéro erreur
            </h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Deux modes de saisie selon vos besoins. Le calcul du montant et des
              périodes est effectué automatiquement en temps réel : vous voyez le
              résultat avant même de valider.
            </p>
            <ul className="space-y-3">
              {PAYMENT_ITEMS.map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] flex items-center justify-center shrink-0">
                    <i className={`pi ${item.icon} text-white text-xs`} />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Rôles ─────────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Contrôle d&apos;accès</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e293b] mt-2 mb-4">
              Un rôle pour chaque intervenant
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Chaque utilisateur accède uniquement à son périmètre.
              La hiérarchie des droits est gérée automatiquement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`${r.color} px-5 py-4 flex items-center gap-3`}>
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <i className={`pi ${r.icon} text-lg`} />
                  </div>
                  <span className="font-bold text-sm">{r.title}</span>
                </div>
                <ul className="p-5 space-y-2.5">
                  {r.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-gray-600">
                      <i className="pi pi-check-circle text-[#166534] text-sm mt-0.5 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#1e3a8a] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-white/5" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <i className="pi pi-building text-white text-2xl" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Prêt à simplifier votre gestion locative ?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Accédez à l&apos;application avec vos identifiants et commencez dès maintenant.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#1e3a8a] font-bold text-sm hover:bg-blue-50 transition-colors shadow-xl"
          >
            <i className="pi pi-sign-in" />
            Se connecter à l&apos;application
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
              <i className="pi pi-building text-white text-xs" />
            </div>
            <span className="font-semibold text-white">Gestion Logements</span>
          </div>
          <p className="text-center">
            © {new Date().getFullYear()} — Développé par{' '}
            <a
              href="https://aureldjoumessi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#93c5fd] hover:text-white transition-colors"
            >
              Aurel Djoumessi
            </a>
          </p>
          <Link href="/login" className="hover:text-white transition-colors">
            Se connecter →
          </Link>
        </div>
      </footer>
    </div>
  );
}
