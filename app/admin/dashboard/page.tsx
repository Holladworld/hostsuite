'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Ticket,
  Settings2,
  Newspaper,
  BookOpen,
  Server,
  LogOut,
  Loader2,
  Home,
  Users,
} from 'lucide-react';
import { useAdmin, useAdminLeads, useAdminTickets } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminBlogs, useAdminKnowledgeBase, useAdminClients } from '@/hooks/use-admin';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminLeadsPanel } from '@/components/admin/leads-panel';
import { AdminTicketsPanel } from '@/components/admin/tickets-panel';
import { AdminContentPanel } from '@/components/admin/content-panel';
import { AdminBlogPanel } from '@/components/admin/blog-panel';
import { AdminKnowledgePanel } from '@/components/admin/kb-panel';

type Tab = 'leads' | 'tickets' | 'content' | 'blog' | 'knowledge';

const tabs: { id: Tab; label: string; icon: typeof Inbox; description: string }[] = [
  { id: 'leads', label: 'Web Ops & Lead Inbox', icon: Inbox, description: 'Diagnostic submissions & lead pipeline' },
  { id: 'tickets', label: 'Client Requests', icon: Ticket, description: 'Support tickets from the client portal' },
  { id: 'content', label: 'Content Editor', icon: Settings2, description: 'Homepage text, banners & pricing' },
  { id: 'blog', label: 'Blog Studio', icon: Newspaper, description: 'Publish articles & case studies' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, description: 'Documentation guides & FAQs' },
];

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('leads');

  // Stats for sidebar
  const { leads } = useAdminLeads();
  const { tickets } = useAdminTickets();
  const { blogs } = useAdminBlogs();
  const { articles } = useAdminKnowledgeBase();
  const { clients } = useAdminClients();

  const newLeadsCount = leads.filter((l) => l.status === 'new').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const draftBlogsCount = blogs.filter((b) => !b.published).length;
  const draftKbCount = articles.filter((a) => !a.published).length;

  const tabBadge: Record<Tab, number> = {
    leads: newLeadsCount,
    tickets: openTicketsCount,
    content: 0,
    blog: draftBlogsCount,
    knowledge: draftKbCount,
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success('Signed out.');
    router.push('/portal');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Access denied. Admin only.</p>
          <Button asChild className="mt-4">
            <Link href="/portal">Back to Portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Inbox },
    { label: 'Open Tickets', value: openTicketsCount, icon: Ticket },
    { label: 'Blog Posts', value: blogs.length, icon: Newspaper },
    { label: 'KB Guides', value: articles.length, icon: BookOpen },
    { label: 'Clients', value: clients.length, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Server className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-tight">HostSuite</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Suite</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Badge className="bg-primary/10 text-primary">Admin</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="gap-1.5">
                <Home className="h-4 w-4" /> <span className="hidden sm:inline">View Site</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-card lg:block">
          <nav className="space-y-1 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                  {tabBadge[tab.id] > 0 && (
                    <span
                      className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {tabBadge[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Stats */}
          <div className="border-t border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</p>
            <div className="space-y-2">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" /> {stat.label}
                    </span>
                    <span className="font-mono-data font-semibold text-foreground">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card lg:hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{tab.label.split(' ')[0]}</span>
                  {tabBadge[tab.id] > 0 && (
                    <span className="absolute right-2 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {tabBadge[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          {/* Mobile tab label */}
          <div className="mb-6 lg:hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.description}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'leads' && <AdminLeadsPanel />}
              {activeTab === 'tickets' && <AdminTicketsPanel />}
              {activeTab === 'content' && <AdminContentPanel />}
              {activeTab === 'blog' && <AdminBlogPanel />}
              {activeTab === 'knowledge' && <AdminKnowledgePanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
