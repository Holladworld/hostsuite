'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, useAuth } from '@/lib/supabase-client';
import { ADMIN_EMAIL } from '@/lib/constants';
import type {
  LeadRow,
  TicketRow,
  BlogRow,
  KnowledgeBaseRow,
  ClientRow,
  SiteSettings,
} from '@/lib/types';

export function useAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const admin = user.email === ADMIN_EMAIL;
      setIsAdmin(admin);
      setAuthChecked(true);
      if (!admin) {
        router.replace('/portal');
      }
    } else if (!loading && !user) {
      setAuthChecked(true);
      router.replace('/portal');
    }
  }, [user, loading, router]);

  return { user, isAdmin, loading: loading || !authChecked };
}

export function useAdminLeads() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLeads(data as LeadRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLeadStatus = useCallback(
    async (id: string, status: LeadRow['status']) => {
      const { error } = await supabase.from('leads').update({ status }).eq('id', id);
      if (!error) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      }
      return !error;
    },
    [],
  );

  const createLead = useCallback(
    async (lead: {
      company_name?: string;
      domain_url?: string;
      email?: string;
      whatsapp?: string;
      description?: string;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          source: lead.source ?? 'manual',
          status: 'new',
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      load();
      return { error: null, id: data?.id };
    },
    [load],
  );

  return { leads, loading, load, updateLeadStatus, createLead };
}

export function useAdminTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTickets(data as TicketRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateTicket = useCallback(
    async (id: string, updates: Partial<Pick<TicketRow, 'status' | 'admin_notes' | 'priority' | 'resolved_at'>>) => {
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
      if (!error) {
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        );
      }
      return !error;
    },
    [],
  );

  return { tickets, loading, load, updateTicket };
}

export function useAdminBlogs() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setBlogs(data as BlogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveBlog = useCallback(
    async (blog: Partial<BlogRow> & { title: string; slug: string }) => {
      const payload = {
        ...blog,
        published_at: blog.published ? new Date().toISOString() : null,
      };
      if (blog.id) {
        const { error } = await supabase.from('blogs').update(payload).eq('id', blog.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase.from('blogs').insert(payload);
        if (error) return { error: error.message };
      }
      load();
      return { error: null };
    },
    [load],
  );

  const deleteBlog = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (!error) setBlogs((prev) => prev.filter((b) => b.id !== id));
      return !error;
    },
    [],
  );

  return { blogs, loading, load, saveBlog, deleteBlog };
}

export function useAdminKnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setArticles(data as KnowledgeBaseRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveArticle = useCallback(
    async (article: Partial<KnowledgeBaseRow> & { title: string; slug: string; category: string }) => {
      if (article.id) {
        const { error } = await supabase.from('knowledge_base').update(article).eq('id', article.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase.from('knowledge_base').insert(article);
        if (error) return { error: error.message };
      }
      load();
      return { error: null };
    },
    [load],
  );

  const deleteArticle = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
      if (!error) setArticles((prev) => prev.filter((a) => a.id !== id));
      return !error;
    },
    [],
  );

  return { articles, loading, load, saveArticle, deleteArticle };
}

export function useAdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setClients(data as ClientRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addClientDomain = useCallback(
    async (params: {
      user_id: string;
      domain: string;
      plan_tier: 'starter_ops' | 'managed_growth' | 'enterprise';
      status?: 'active' | 'maintenance' | 'backup_complete' | 'security_clean' | 'expiring';
      ssl_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('domains')
        .insert({
          user_id: params.user_id,
          domain: params.domain,
          plan_tier: params.plan_tier,
          status: params.status ?? 'active',
          ssl_active: params.ssl_active ?? true,
          uptime_pct: 100,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { error: null, id: data?.id };
    },
    [],
  );

  const createTicketOnBehalf = useCallback(
    async (params: {
      user_id: string;
      domain?: string;
      subject: string;
      details?: string;
      request_type?: string;
      priority?: 'low' | 'normal' | 'high' | 'emergency';
    }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: params.user_id,
          domain: params.domain,
          subject: params.subject,
          details: params.details,
          request_type: params.request_type ?? 'other',
          priority: params.priority ?? 'normal',
          status: 'open',
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { error: null, id: data?.id };
    },
    [],
  );

  return { clients, loading, load, addClientDomain, createTicketOnBehalf };
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (!error && data) {
      const merged: SiteSettings = {};
      for (const row of data) {
        const k = row.key as keyof SiteSettings;
        (merged as Record<string, unknown>)[k] = row.value;
      }
      setSettings(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSetting = useCallback(
    async (key: string, value: Record<string, unknown>) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (!error) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
      return !error;
    },
    [],
  );

  return { settings, loading, saveSetting };
}
