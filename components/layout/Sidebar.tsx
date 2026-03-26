'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarCollapsed } from '@/store/uiSlice';
import { Role } from '@/types/enums';

type NavItem = {
  label: string;
  path: string;
  icon: string;
  minRole: Role;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/',              icon: 'pi-home',        minRole: Role.ADMIN_LOGEMENT },
  { label: 'Bâtiments',    path: '/batiments',     icon: 'pi-building',    minRole: Role.ADMIN_BATIMENT },
  { label: 'Logements',    path: '/logements',     icon: 'pi-warehouse',   minRole: Role.ADMIN_LOGEMENT },
  { label: 'Locataires',   path: '/locataires',    icon: 'pi-users',       minRole: Role.ADMIN_LOGEMENT },
  { label: 'Occupations',  path: '/occupations',   icon: 'pi-calendar',    minRole: Role.ADMIN_LOGEMENT },
  { label: 'Paiements',    path: '/paiements',     icon: 'pi-money-bill',  minRole: Role.ADMIN_LOGEMENT },
  { label: 'Utilisateurs', path: '/utilisateurs',  icon: 'pi-user-edit',   minRole: Role.ADMIN_LOGEMENT },
  { label: 'Export',       path: '/export',        icon: 'pi-download',    minRole: Role.ADMIN_LOGEMENT },
];

const ROLE_ORDER: Record<Role, number> = {
  [Role.LOCATAIRE]:       0,
  [Role.ADMIN_LOGEMENT]:  1,
  [Role.ADMIN_BATIMENT]:  2,
  [Role.ADMIN_GLOBAL]:    3,
};

function hasAccess(userRole: Role, minRole: Role): boolean {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[minRole];
}

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const role = useAppSelector((s) => s.auth.user?.role);

  const visibleItems = role
    ? NAV_ITEMS.filter((item) => hasAccess(role, item.minRole))
    : [];

  function isActive(path: string) {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  }

  function closeMobile() {
    dispatch(setSidebarCollapsed(true));
  }

  return (
    <>
      {/* Overlay mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#1e3a8a] text-white',
          'transition-transform duration-300 ease-in-out',
          // Mobile : caché par défaut (collapsed = true), affiché quand collapsed = false
          collapsed ? '-translate-x-full' : 'translate-x-0',
          // Desktop : toujours visible
          'lg:relative lg:translate-x-0 lg:z-auto',
        ].join(' ')}
      >
        {/* Logo / titre */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <i className="pi pi-building text-white text-lg" />
          </div>
          <span className="font-semibold text-base leading-tight">
            Gestion<br />Logements
          </span>
          {/* Bouton fermer (mobile) */}
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={closeMobile}
            aria-label="Fermer le menu"
          >
            <i className="pi pi-times text-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={closeMobile}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <i className={`pi ${item.icon} text-base w-5 text-center`} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profil (bas de sidebar) */}
        <div className="border-t border-white/10 px-2 py-3">
          <Link
            href="/profil"
            onClick={closeMobile}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/profil'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <i className="pi pi-user text-base w-5 text-center" />
            Mon profil
          </Link>
        </div>
      </aside>
    </>
  );
}
