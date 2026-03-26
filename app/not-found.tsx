import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#dbeafe] text-center px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a8a] mb-6">
        <i className="pi pi-exclamation-triangle text-white text-2xl" />
      </div>
      <p className="text-7xl font-extrabold text-[#1e3a8a] leading-none">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-[#1e293b]">Page introuvable</h1>
      <p className="mt-2 text-gray-500 max-w-sm">
        Cette page n&apos;existe pas ou n&apos;est pas encore disponible.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e3a8a] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors"
      >
        <i className="pi pi-sign-in text-base" />
        Aller à la connexion
      </Link>
    </div>
  );
}
