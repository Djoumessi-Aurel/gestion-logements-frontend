'use client';

import { useState, useMemo, useEffect } from 'react';
import type { RefObject } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import type { Occupation } from '@/types/occupation';
import type { Logement, Loyer } from '@/types/logement';
import { PeriodeType } from '@/types/enums';
import { paiementsApi } from '@/services/paiements.api';

// ─── Schémas (champs obligatoires uniquement) ──────────────────────────────────

const opt1Schema = z.object({
  occupationId:   z.number({ message: 'Sélectionnez une occupation' }),
  nombreDeLoyers: z.number({ message: 'Nombre de loyers requis' }).int().min(1, 'Minimum 1 loyer'),
});

const opt2Schema = z.object({
  occupationId: z.number({ message: 'Sélectionnez une occupation' }),
  montantPaye:  z.number({ message: 'Montant requis' }).positive('Le montant doit être > 0'),
  finPeriode:   z.string().min(1, 'La fin de période est obligatoire'),
});

type Opt1Values = z.infer<typeof opt1Schema>;
type Opt2Values = z.infer<typeof opt2Schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addPeriode(date: Date, nombre: number, type: PeriodeType): Date {
  const d = new Date(date);
  if (type === PeriodeType.JOUR)    d.setDate(d.getDate() + nombre);
  if (type === PeriodeType.SEMAINE) d.setDate(d.getDate() + nombre * 7);
  if (type === PeriodeType.MOIS)    d.setMonth(d.getMonth() + nombre);
  if (type === PeriodeType.ANNEE)   d.setFullYear(d.getFullYear() + nombre);
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
  }).format(val);
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

const TOGGLE_OPTIONS = [
  { label: 'Par nombre de loyers', value: 'option1' },
  { label: 'Montant libre',        value: 'option2' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onHide: () => void;
  /** Occupations actives — pour le sélecteur */
  occupations: Occupation[];
  /** Logements avec loyerActuel — pour le calcul temps réel */
  logements: Logement[];
  /** Si défini, le champ occupation est verrouillé sur cet id */
  lockedOccupationId?: number;
  toast: RefObject<Toast | null>;
  onSuccess: () => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PaiementFormDialog({
  visible, onHide, occupations, logements, lockedOccupationId, toast, onSuccess,
}: Props) {
  const [payOption,    setPayOption]    = useState<'option1' | 'option2'>('option1');
  const [datePaiement, setDatePaiement] = useState('');
  const [commentaire,  setCommentaire]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const opt1Form = useForm<Opt1Values>({
    resolver: zodResolver(opt1Schema),
    defaultValues: { occupationId: undefined, nombreDeLoyers: 1 },
  });

  const opt2Form = useForm<Opt2Values>({
    resolver: zodResolver(opt2Schema),
    defaultValues: { occupationId: undefined, montantPaye: undefined, finPeriode: '' },
  });

  const watchOccId1  = opt1Form.watch('occupationId');
  const watchNLoyers = opt1Form.watch('nombreDeLoyers');
  const watchOccId2  = opt2Form.watch('occupationId');
  const watchFinPer  = opt2Form.watch('finPeriode');

  // ── Reset à chaque ouverture ────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setPayOption('option1');
    setDatePaiement('');
    setCommentaire('');
    opt1Form.reset({ occupationId: lockedOccupationId, nombreDeLoyers: 1 });
    opt2Form.reset({ occupationId: lockedOccupationId, montantPaye: undefined, finPeriode: '' });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Données dérivées ────────────────────────────────────────────────────────
  const activeOccId = payOption === 'option1' ? watchOccId1 : watchOccId2;

  const selectedOcc = useMemo(
    () => occupations.find((o) => o.id === activeOccId) ?? null,
    [occupations, activeOccId],
  );

  const debutPeriode = useMemo<string | null>(() => {
    if (!selectedOcc) return null;
    const d = new Date(selectedOcc.dateDernierJourCouvert);
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  }, [selectedOcc]);

  const loyerActif = useMemo<Loyer | null>(() => {
    if (!selectedOcc) return null;
    const logement = logements.find((l) => l.id === selectedOcc.logementId);
    if (!logement) return null;
    if (logement.loyerActuel) return logement.loyerActuel;
    if (!logement.loyers?.length) return null;
    const dp = debutPeriode ?? toDateStr(new Date());
    const filtered = logement.loyers.filter((l) => l.dateDebut <= dp);
    if (!filtered.length) return logement.loyers[0];
    return filtered.reduce((a, b) => (a.dateDebut > b.dateDebut ? a : b));
  }, [selectedOcc, logements, debutPeriode]);

  // Preview calcul temps réel (Option 1)
  const opt1Preview = useMemo(() => {
    if (!loyerActif || !debutPeriode || !watchNLoyers || watchNLoyers < 1) return null;
    const debut = new Date(debutPeriode);
    const fin   = addPeriode(debut, watchNLoyers * loyerActif.periodeNombre, loyerActif.periodeType);
    fin.setDate(fin.getDate() - 1);
    return {
      finPeriode:  toDateStr(fin),
      montantPaye: watchNLoyers * loyerActif.montant,
    };
  }, [loyerActif, debutPeriode, watchNLoyers]);

  // Validation RG-12 (Option 2)
  const rgError12 = useMemo(() => {
    if (!debutPeriode || !watchFinPer) return null;
    return watchFinPer < debutPeriode
      ? 'La fin de période doit être ≥ au début de période (RG-12)'
      : null;
  }, [debutPeriode, watchFinPer]);

  // ── Soumission ──────────────────────────────────────────────────────────────
  const onOpt1Submit = opt1Form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await paiementsApi.createOption1({
        occupationId:   values.occupationId,
        nombreDeLoyers: values.nombreDeLoyers,
        ...(datePaiement ? { datePaiement } : {}),
        ...(commentaire  ? { commentaire  } : {}),
      });
      toast.current?.show({ severity: 'success', summary: 'Paiement enregistré', life: 3000 });
      onHide();
      onSuccess();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'enregistrer le paiement."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  const onOpt2Submit = opt2Form.handleSubmit(async (values) => {
    if (rgError12) return;
    setSubmitting(true);
    try {
      await paiementsApi.createOption2({
        occupationId: values.occupationId,
        montantPaye:  values.montantPaye,
        finPeriode:   values.finPeriode,
        ...(datePaiement ? { datePaiement } : {}),
        ...(commentaire  ? { commentaire  } : {}),
      });
      toast.current?.show({ severity: 'success', summary: 'Paiement enregistré', life: 3000 });
      onHide();
      onSuccess();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'enregistrer le paiement."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  const handleSubmit = payOption === 'option1' ? onOpt1Submit : onOpt2Submit;

  const occOptions = occupations.map((o) => ({
    label: `${o.logement?.nom ?? `Log.#${o.logementId}`} — ${o.locataire ? `${o.locataire.prenom} ${o.locataire.nom}` : `Loc.#${o.locataireId}`}`,
    value: o.id,
  }));

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Enregistrer un paiement"
      style={{ width: '540px' }}
      modal draggable={false} resizable={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" outlined onClick={onHide} disabled={submitting} />
          <Button
            label="Enregistrer" icon="pi pi-check" loading={submitting}
            onClick={handleSubmit}
            style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
          />
        </div>
      }
    >
      <div className="space-y-4 pt-2">

        {/* ── Toggle option ── */}
        <div className="flex justify-center">
          <SelectButton
            value={payOption}
            onChange={(e) => e.value && setPayOption(e.value)}
            options={TOGGLE_OPTIONS}
            optionLabel="label"
            optionValue="value"
          />
        </div>

        {/* ── Occupation ── */}
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-1">
            Occupation <span className="text-red-500">*</span>
          </label>
          {lockedOccupationId ? (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-[#1e293b]">
              {occOptions.find((o) => o.value === lockedOccupationId)?.label ?? `Occupation #${lockedOccupationId}`}
            </div>
          ) : payOption === 'option1' ? (
            <>
              <Controller name="occupationId" control={opt1Form.control} render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value)}
                  options={occOptions}
                  placeholder="Sélectionner une occupation"
                  className={`w-full ${opt1Form.formState.errors.occupationId ? 'p-invalid' : ''}`}
                  filter emptyMessage="Aucune occupation active"
                />
              )} />
              {opt1Form.formState.errors.occupationId && (
                <p className="text-xs text-[#991b1b] mt-1">{opt1Form.formState.errors.occupationId.message}</p>
              )}
            </>
          ) : (
            <>
              <Controller name="occupationId" control={opt2Form.control} render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value)}
                  options={occOptions}
                  placeholder="Sélectionner une occupation"
                  className={`w-full ${opt2Form.formState.errors.occupationId ? 'p-invalid' : ''}`}
                  filter emptyMessage="Aucune occupation active"
                />
              )} />
              {opt2Form.formState.errors.occupationId && (
                <p className="text-xs text-[#991b1b] mt-1">{opt2Form.formState.errors.occupationId.message}</p>
              )}
            </>
          )}
        </div>

        {/* ── Début de période (read-only) ── */}
        {debutPeriode && (
          <div className="flex items-center gap-2 bg-[#f0f9ff] border border-blue-100 rounded-lg px-3 py-2 text-sm">
            <i className="pi pi-calendar text-[#3b82f6]" />
            <span className="text-[#1e293b]">
              Début de période : <strong>{formatDate(debutPeriode)}</strong>
            </span>
          </div>
        )}

        {/* ── Option 1 : nombre de loyers ── */}
        {payOption === 'option1' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Nombre de loyers <span className="text-red-500">*</span>
              </label>
              <Controller name="nombreDeLoyers" control={opt1Form.control} render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value ?? undefined)}
                  min={1}
                  showButtons
                  inputClassName={`w-full ${opt1Form.formState.errors.nombreDeLoyers ? 'p-invalid' : ''}`}
                  className="w-full"
                />
              )} />
              {opt1Form.formState.errors.nombreDeLoyers && (
                <p className="text-xs text-[#991b1b] mt-1">{opt1Form.formState.errors.nombreDeLoyers.message}</p>
              )}
            </div>

            {/* Aperçu calcul en temps réel */}
            {opt1Preview && loyerActif && (
              <div className="bg-[#dcfce7] border border-green-200 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-[#166534] font-semibold">
                  <i className="pi pi-calculator" />
                  Calcul automatique
                </div>
                <p className="text-[#166534]">
                  Fin de période : <strong>{formatDate(opt1Preview.finPeriode)}</strong>
                </p>
                <p className="text-[#166534]">
                  Montant : <strong>{formatMontant(opt1Preview.montantPaye)}</strong>
                </p>
                <p className="text-xs text-green-600">
                  {watchNLoyers} × {formatMontant(loyerActif.montant)} — {loyerActif.periodeNombre} {loyerActif.periodeType.toLowerCase()}/loyer
                </p>
              </div>
            )}
            {selectedOcc && !loyerActif && (
              <div className="text-sm text-[#991b1b] bg-[#fee2e2] rounded-lg px-3 py-2">
                Aucun loyer actif trouvé pour ce logement.
              </div>
            )}
          </>
        )}

        {/* ── Option 2 : montant libre ── */}
        {payOption === 'option2' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Montant payé (XAF) <span className="text-red-500">*</span>
              </label>
              <Controller name="montantPaye" control={opt2Form.control} render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value ?? undefined)}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  min={0}
                  inputClassName={`w-full ${opt2Form.formState.errors.montantPaye ? 'p-invalid' : ''}`}
                  className="w-full"
                  placeholder="Ex : 150 000"
                />
              )} />
              {opt2Form.formState.errors.montantPaye && (
                <p className="text-xs text-[#991b1b] mt-1">{opt2Form.formState.errors.montantPaye.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Fin de période <span className="text-red-500">*</span>
              </label>
              <Controller name="finPeriode" control={opt2Form.control} render={({ field }) => (
                <Calendar
                  value={field.value ? new Date(field.value) : null}
                  onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                  dateFormat="dd/mm/yy"
                  className={`w-full ${(opt2Form.formState.errors.finPeriode || rgError12) ? 'p-invalid' : ''}`}
                  placeholder="Sélectionner une date"
                  showIcon
                />
              )} />
              {(opt2Form.formState.errors.finPeriode || rgError12) && (
                <p className="text-xs text-[#991b1b] mt-1">
                  {opt2Form.formState.errors.finPeriode?.message ?? rgError12}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Champs communs (optionnels) ── */}
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-1">Date de paiement</label>
          <Calendar
            value={datePaiement ? new Date(datePaiement) : null}
            onChange={(e) => setDatePaiement(e.value ? toDateStr(e.value as Date) : '')}
            dateFormat="dd/mm/yy"
            className="w-full"
            placeholder="Aujourd'hui par défaut"
            showIcon
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-1">Commentaire</label>
          <InputTextarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            className="w-full"
            placeholder="Optionnel"
            autoResize
          />
        </div>

      </div>
    </Dialog>
  );
}
