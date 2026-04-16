'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#dbeafe] px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a8a] mb-6">
        <i className="pi pi-wifi text-white text-2xl" />
      </div>
      <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Vous êtes hors ligne</h1>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Vérifiez votre connexion internet et réessayez. L&apos;application nécessite une connexion pour fonctionner.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-lg bg-[#1e3a8a] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
