'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import ExportModal from '@/components/shared/ExportModal';

// ─── Configuration des exports disponibles ────────────────────────────────────

type ExportEntry = {
  label: string;
  description: string;
  endpoint: 'paiements' | 'arrieres' | 'logements' | 'locataires' | 'batiments' | 'occupations' | 'complet';
  icon: string;
  minRole: Role;
  complet?: boolean;
};

const EXPORTS: ExportEntry[] = [
  {
    label:       'Paiements',
    description: 'Historique de tous les paiements enregistrés',
    endpoint:    'paiements',
    icon:        'pi-wallet',
    minRole:     Role.ADMIN_LOGEMENT,
  },
  {
    label:       'Arriérés',
    description: 'Liste des arriérés en cours par occupation',
    endpoint:    'arrieres',
    icon:        'pi-exclamation-triangle',
    minRole:     Role.ADMIN_LOGEMENT,
  },
  {
    label:       'Logements',
    description: 'Fiche complète de tous les logements',
    endpoint:    'logements',
    icon:        'pi-home',
    minRole:     Role.ADMIN_LOGEMENT,
  },
  {
    label:       'Locataires',
    description: 'Liste des locataires avec statut et solvabilité',
    endpoint:    'locataires',
    icon:        'pi-users',
    minRole:     Role.ADMIN_LOGEMENT,
  },
  {
    label:       'Occupations',
    description: 'Toutes les occupations passées et en cours',
    endpoint:    'occupations',
    icon:        'pi-calendar',
    minRole:     Role.ADMIN_LOGEMENT,
  },
  {
    label:       'Bâtiments',
    description: 'Liste des bâtiments avec statistiques',
    endpoint:    'batiments',
    icon:        'pi-building',
    minRole:     Role.ADMIN_BATIMENT,
  },
  {
    label:       'Classeur complet',
    description: 'Export Excel multi-onglets (toutes les données)',
    endpoint:    'complet',
    icon:        'pi-file-excel',
    minRole:     Role.ADMIN_LOGEMENT,
    complet:     true,
  },
];

const ROLE_ORDER: Role[] = [
  Role.ADMIN_LOGEMENT,
  Role.ADMIN_BATIMENT,
  Role.ADMIN_GLOBAL,
];

function hasAccess(userRole: Role | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  if (userRole === Role.LOCATAIRE) return false;
  const userIdx = ROLE_ORDER.indexOf(userRole);
  const minIdx  = ROLE_ORDER.indexOf(minRole);
  return userIdx >= minIdx;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const role = useAppSelector((s) => s.auth.user?.role);

  const [active, setActive] = useState<ExportEntry | null>(null);

  const accessible = EXPORTS.filter((e) => hasAccess(role, e.minRole));

  return (
    <>
      <PageHeader
        title="Exports"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Exports' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessible.map((entry) => (
          <div
            key={entry.endpoint}
            className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-3 ${
              entry.complet ? 'border-[#1e3a8a] ring-1 ring-[#1e3a8a]' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${entry.complet ? 'bg-[#1e3a8a]' : 'bg-[#dbeafe]'}`}>
                <i className={`pi ${entry.icon} text-lg ${entry.complet ? 'text-white' : 'text-[#1e3a8a]'}`} />
              </div>
              <div>
                <p className="font-semibold text-[#1e293b]">{entry.label}</p>
                {entry.complet && (
                  <span className="text-xs bg-[#dbeafe] text-[#1e3a8a] px-1.5 py-0.5 rounded-full font-medium">
                    Excel uniquement
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">{entry.description}</p>
            <Button
              label="Télécharger"
              icon="pi pi-download"
              size="small"
              outlined={!entry.complet}
              onClick={() => setActive(entry)}
              style={entry.complet ? { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' } : { borderColor: '#1e3a8a', color: '#1e3a8a' }}
            />
          </div>
        ))}

        {accessible.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <i className="pi pi-lock text-4xl mb-3 block" />
            <p>Aucun export disponible pour votre rôle.</p>
          </div>
        )}
      </div>

      {active && (
        <ExportModal
          visible
          onHide={() => setActive(null)}
          entityLabel={active.label}
          endpoint={active.endpoint}
        />
      )}
    </>
  );
}
