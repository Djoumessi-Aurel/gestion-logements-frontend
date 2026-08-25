import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion de Logements — Connexion',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#dbeafe] px-4 py-8">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        {/* En-tête branding */}
        <div className="text-center mb-8">
          <img
            src="/web-app-manifest-192x192.png"
            alt="Gestion de Logements"
            className="inline-block w-14 h-14 rounded-2xl mb-4"
          />
          <h1 className="text-2xl font-bold text-[#1e293b]">Gestion de Logements</h1>
          <p className="text-sm text-gray-500 mt-1">Plateforme de gestion locative</p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-lg p-8">{children}</div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400 space-y-1">
        <p>
          © {year} Gestion de Logements — Développé par{' '}
          <a
            href="https://aureldjoumessi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1e3a8a] hover:underline font-medium"
          >
            Aurel Djoumessi
          </a>
        </p>
        <p>Tous droits réservés.</p>
      </footer>
    </div>
  );
}
