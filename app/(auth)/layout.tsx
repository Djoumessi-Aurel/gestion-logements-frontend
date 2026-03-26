import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion de Logements — Connexion',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dbeafe] px-4">
      <div className="w-full max-w-md">
        {/* En-tête branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1e3a8a] mb-4">
            <i className="pi pi-building text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Gestion de Logements</h1>
          <p className="text-sm text-gray-500 mt-1">Plateforme de gestion locative</p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-lg p-8">{children}</div>
      </div>
    </div>
  );
}
