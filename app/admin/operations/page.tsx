'use client';

import { AdminOperationsPanel } from '@/components/admin/operations-panel';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminOperationsPage() {
  const { loading, isAdmin } = useAdmin();

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying admin access…</p>
      </main>
    );
  }

  if (!isAdmin) return null;
  return <AdminOperationsPanel />;
}
