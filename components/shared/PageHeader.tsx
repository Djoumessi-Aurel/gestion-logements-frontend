'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  /** Si fourni, l'item devient un lien cliquable */
  path?: string;
}

interface ActionButton {
  label: string;
  /** Classe d'icône PrimeIcons sans le préfixe "pi " (ex : "pi-plus") */
  icon?: string;
  onClick: () => void;
  /** Masque le bouton si false (pratique pour le RBAC) */
  visible?: boolean;
  loading?: boolean;
}

interface Props {
  title: string;
  /** Fil d'ariane affiché au-dessus du titre */
  breadcrumb?: BreadcrumbItem[];
  /** Bouton d'action principal (ex : "Nouveau bâtiment") */
  action?: ActionButton;
  /** Boutons d'action secondaires (ex : "Exporter") — affichés en outlined à gauche du bouton principal */
  actions?: ActionButton[];
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PageHeader({ title, breadcrumb, action, actions }: Props) {
  const showAction      = action && action.visible !== false;
  const visibleActions  = (actions ?? []).filter((a) => a.visible !== false);

  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      {/* Titre + breadcrumb */}
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center flex-wrap gap-1 text-sm text-gray-400 mb-1">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <i className="pi pi-angle-right text-xs text-gray-300" />}
                {item.path ? (
                  <Link
                    href={item.path}
                    className="text-[#0000ee] hover:text-[#1e3a8a] transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[#1e293b] font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#1e293b] truncate">{title}</h1>
      </div>

      {/* Boutons d'action */}
      {(showAction || visibleActions.length > 0) && (
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2 shrink-0">
          {visibleActions.map((a, i) => (
            <Button
              key={i}
              label={a.label}
              icon={a.icon ? `pi ${a.icon}` : undefined}
              onClick={a.onClick}
              loading={a.loading}
              severity="secondary"
              outlined
              className='text-sm px-1.5 py-1 md:text-base md:px-3 md:py-2'
            />
          ))}
          {showAction && (
            <Button
              label={action.label}
              icon={action.icon ? `pi ${action.icon}` : undefined}
              onClick={action.onClick}
              loading={action.loading}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
              className='text-sm px-1.5 py-1 md:text-base md:px-3 md:py-2'
            />
          )}
        </div>
      )}
    </div>
  );
}
