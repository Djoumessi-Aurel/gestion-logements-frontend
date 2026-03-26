import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <p className="text-8xl font-extrabold text-[#1e3a8a] leading-none">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-[#1e293b]">Page introuvable</h1>
      <p className="mt-2 text-gray-500 max-w-sm">
        Cette page n&apos;existe pas ou n&apos;est pas encore disponible.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e3a8a] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors"
      >
        <i className="pi pi-home text-base" />
        Retour au dashboard
      </Link>
    </div>
  );
}
