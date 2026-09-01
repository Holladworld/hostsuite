'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { BlogRow, KnowledgeBaseRow, KBCategory, SiteSettings } from '@/lib/types';

export function usePublishedBlogs() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false, nullsFirst: false });
      if (!error && data) setBlogs(data as BlogRow[]);
      setLoading(false);
    })();
  }, []);

  return { blogs, loading };
}

export function usePublishedKnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (!error && data) setArticles(data as KnowledgeBaseRow[]);
      setLoading(false);
    })();
  }, []);

  return { articles, loading };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      if (!error && data) {
        const merged: SiteSettings = {};
        for (const row of data) {
          const k = row.key as keyof SiteSettings;
          (merged as Record<string, unknown>)[k] = row.value;
        }
        setSettings(merged);
      }
      setLoading(false);
    })();
  }, []);

  return { settings, loading };
}

export function useBlogBySlug(slug: string | undefined) {
  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      if (!error && data) setBlog(data as BlogRow);
      setLoading(false);
    })();
  }, [slug]);

  return { blog, loading };
}

export function useKnowledgeBaseBySlug(slug: string | undefined) {
  const [article, setArticle] = useState<KnowledgeBaseRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      if (!error && data) setArticle(data as KnowledgeBaseRow);

      // Increment views via RPC (SECURITY DEFINER, no RLS needed)
      await supabase.rpc('increment_kb_views', { slug_text: slug });

      setLoading(false);
    })();
  }, [slug]);

  return { article, loading };
}

export type { KBCategory };
