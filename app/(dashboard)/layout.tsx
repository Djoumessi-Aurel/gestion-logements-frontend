import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SessionGuard from '@/components/layout/SessionGuard';
import { ConfirmDialogProvider } from '@/components/shared/ConfirmDialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#dbeafe]">
      {/* Sidebar (fixe à gauche sur desktop, drawer sur mobile) */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Zone scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Notification session expirée — doit être dans ce layout */}
      <SessionGuard />

      {/* Requis pour que showConfirm() fonctionne dans toutes les pages */}
      <ConfirmDialogProvider />
    </div>
  );
}
