import { redirect } from 'next/navigation';
import { AdminOperationsPanel } from '@/components/admin/operations-panel';
import { verifyAdmin } from '@/lib/supabase-server';

export default async function AdminOperationsPage() {
  if (!(await verifyAdmin())) redirect('/portal');
  return <AdminOperationsPanel />;
}
