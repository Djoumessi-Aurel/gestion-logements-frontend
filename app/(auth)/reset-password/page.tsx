import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    // Suspense requis pour useSearchParams() dans un composant client (Next.js App Router)
    <Suspense fallback={<div className="text-center text-gray-400 py-4">Chargement…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
