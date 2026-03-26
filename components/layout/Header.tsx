'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCredentials } from '@/store/authSlice';
import { toggleSidebar } from '@/store/uiSlice';
import { clearAccessTokenCookie } from '@/utils/cookies';
import { authApi } from '@/services/auth.api';
import { Role } from '@/types/enums';

const ROLE_LABELS: Record<Role, string> = {
  [Role.LOCATAIRE]:       'Locataire',
  [Role.ADMIN_LOGEMENT]:  'Admin Logement',
  [Role.ADMIN_BATIMENT]:  'Admin Bâtiment',
  [Role.ADMIN_GLOBAL]:    'Admin Global',
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.LOCATAIRE]:       'bg-gray-100 text-gray-700',
  [Role.ADMIN_LOGEMENT]:  'bg-blue-100 text-blue-700',
  [Role.ADMIN_BATIMENT]:  'bg-indigo-100 text-indigo-700',
  [Role.ADMIN_GLOBAL]:    'bg-[#1e3a8a]/10 text-[#1e3a8a]',
};

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // Ignorer les erreurs réseau — on déconnecte quand même localement
    } finally {
      dispatch(clearCredentials());
      clearAccessTokenCookie();
      router.push('/login');
    }
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
      {/* Gauche : hamburger (mobile) */}
      <button
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Ouvrir le menu"
      >
        <i className="pi pi-bars text-lg" />
      </button>

      {/* Titre (desktop) */}
      <div className="hidden lg:flex items-center gap-2 text-[#1e293b] font-semibold text-base">
        <i className="pi pi-building text-[#1e3a8a]" />
        <span>Gestion de Logements</span>
      </div>

      {/* Droite : utilisateur + actions */}
      <div className="flex items-center gap-3 ml-auto">
        {user && (
          <>
            {/* Badge rôle */}
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
            >
              {ROLE_LABELS[user.role]}
            </span>

            {/* Nom utilisateur */}
            <span className="hidden sm:block text-sm font-medium text-[#1e293b]">
              {user.username}
            </span>

            {/* Bouton profil */}
            <button
              onClick={() => router.push('/profil')}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors"
              title="Mon profil"
              aria-label="Mon profil"
            >
              {user.username.charAt(0).toUpperCase()}
            </button>
          </>
        )}

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
          title="Se déconnecter"
        >
          <i className="pi pi-sign-out text-base" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
