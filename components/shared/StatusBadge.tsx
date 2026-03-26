'use client';

// ─── Variantes disponibles ────────────────────────────────────────────────────

export type StatusVariant =
  // Logement
  | 'occupe'
  | 'libre'
  // Arriérés / paiement
  | 'ajour'
  | 'arrier'
  // Occupation
  | 'actif'
  | 'termine'
  // Utilisateur
  | 'actif-user'
  | 'inactif';

// ─── Config de chaque variante ────────────────────────────────────────────────

interface BadgeConfig {
  label: string;
  classes: string;
  icon: string;
}

const BADGE_CONFIG: Record<StatusVariant, BadgeConfig> = {
  occupe:       { label: 'Occupé',   icon: 'pi-lock',             classes: 'bg-[#fee2e2] text-[#991b1b]'  },
  libre:        { label: 'Libre',    icon: 'pi-lock-open',        classes: 'bg-[#dcfce7] text-[#166534]'  },
  ajour:        { label: 'À jour',   icon: 'pi-check-circle',     classes: 'bg-[#dcfce7] text-[#166534]'  },
  arrier:       { label: 'Arriéré', icon: 'pi-exclamation-circle',classes: 'bg-[#fee2e2] text-[#991b1b]'  },
  actif:        { label: 'Actif',    icon: 'pi-circle-fill',      classes: 'bg-[#dbeafe] text-[#1e3a8a]'  },
  termine:      { label: 'Terminé', icon: 'pi-circle',           classes: 'bg-gray-100 text-gray-500'     },
  'actif-user': { label: 'Actif',    icon: 'pi-check',            classes: 'bg-[#dcfce7] text-[#166534]'  },
  inactif:      { label: 'Inactif', icon: 'pi-ban',              classes: 'bg-gray-100 text-gray-400'     },
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  variant: StatusVariant;
  /** Remplace l'étiquette par défaut */
  label?: string;
}

export default function StatusBadge({ variant, label }: Props) {
  const { label: defaultLabel, icon, classes } = BADGE_CONFIG[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      <i className={`pi ${icon} text-xs`} />
      {label ?? defaultLabel}
    </span>
  );
}
