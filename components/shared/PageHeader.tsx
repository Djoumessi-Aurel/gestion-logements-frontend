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
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PageHeader({ title, breadcrumb, action }: Props) {
  const showAction = action && action.visible !== false;

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
                    className="hover:text-[#1e3a8a] transition-colors"
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
        <h1 className="text-2xl font-bold text-[#1e293b] truncate">{title}</h1>
      </div>

      {/* Bouton d'action */}
      {showAction && (
        <Button
          label={action.label}
          icon={action.icon ? `pi ${action.icon}` : undefined}
          onClick={action.onClick}
          loading={action.loading}
          className="shrink-0"
          style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
        />
      )}
    </div>
  );
}
