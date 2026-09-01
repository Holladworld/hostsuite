import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type LeadPayload = {
  source?: 'diagnostic' | 'pricing' | 'manual';
  pain_points?: string[];
  company_name?: string | null;
  domain_url?: string | null;
  description?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  estimated_tier?: string | null;
  estimated_cost_min?: number | null;
  estimated_cost_max?: number | null;
  turnaround_hours?: number | null;
  skip_insert?: boolean;
};

// --- Rate limiting: 5 requests per IP per hour ---
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return true;
}

function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}

// --- Input sanitization ---
function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 2000) || null;
}

function sanitizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => sanitizeString(item))
    .filter((v): v is string => v !== null)
    .slice(0, 20);
}

function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function formatUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(lead: LeadPayload): string {
  const fmt = (n?: number | null) =>
    typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : '—';
  const pains = lead.pain_points?.length
    ? lead.pain_points.map((p) => `<li>${escapeHtml(p)}</li>`).join('')
    : '<li>None specified</li>';

  return `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF9FB; padding: 32px; border-radius: 16px;">
    <div style="background: #6001D2; padding: 24px; border-radius: 12px; color: #ffffff; text-align: center;">
      <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 700;">HostSuite — New Lead</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">A new service request was submitted on hostsuite.app</p>
    </div>
    <div style="background: #ffffff; border: 1px solid #EAE6E9; border-radius: 12px; padding: 24px; margin-top: 20px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b6570; width: 40%;">Source</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(lead.source ?? 'diagnostic')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Company</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(lead.company_name ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Domain</td><td style="padding: 8px 0; font-weight: 600; font-family: monospace;">${escapeHtml(lead.domain_url ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Email</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(lead.email ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">WhatsApp</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(lead.whatsapp ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Estimated Tier</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(lead.estimated_tier ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Cost Range</td><td style="padding: 8px 0; font-weight: 600;">${fmt(lead.estimated_cost_min)} – ${fmt(lead.estimated_cost_max)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b6570;">Turnaround</td><td style="padding: 8px 0; font-weight: 600;">${lead.turnaround_hours ? lead.turnaround_hours + ' hrs' : '—'}</td></tr>
      </table>
      <div style="margin-top: 16px;">
        <p style="margin: 0 0 6px; color: #6b6570; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Pain Points</p>
        <ul style="margin: 0; padding-left: 20px; color: #2a2530;">${pains}</ul>
      </div>
      <div style="margin-top: 16px;">
        <p style="margin: 0 0 6px; color: #6b6570; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Description</p>
        <p style="margin: 0; color: #2a2530; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(lead.description ?? '—')}</p>
      </div>
    </div>
    <p style="text-align: center; color: #9b94a3; font-size: 12px; margin-top: 24px;">Vobels Limited · HostSuite Managed Infrastructure</p>
  </div>`;
}

function makeTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(req: Request) {
  try {
    // --- Rate limit check ---
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const raw: LeadPayload = await req.json();

    if (!raw || typeof raw !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload.' },
        { status: 400 }
      );
    }

    // --- Sanitize all string fields ---
    const lead: LeadPayload = {
      source: raw.source === 'pricing' || raw.source === 'manual' ? raw.source : 'diagnostic',
      pain_points: sanitizeArray(raw.pain_points),
      company_name: sanitizeString(raw.company_name),
      domain_url: raw.domain_url ? formatUrl(sanitizeString(raw.domain_url) ?? '') : null,
      description: sanitizeString(raw.description),
      email: raw.email ? sanitizeString(raw.email) : null,
      whatsapp: raw.whatsapp ? sanitizeString(raw.whatsapp) : null,
      estimated_tier: sanitizeString(raw.estimated_tier),
      estimated_cost_min: typeof raw.estimated_cost_min === 'number' ? raw.estimated_cost_min : null,
      estimated_cost_max: typeof raw.estimated_cost_max === 'number' ? raw.estimated_cost_max : null,
      turnaround_hours: typeof raw.turnaround_hours === 'number' ? raw.turnaround_hours : null,
      skip_insert: raw.skip_insert === true,
    };

    // --- Validate: must have email or whatsapp ---
    if (!lead.email && !lead.whatsapp) {
      return NextResponse.json(
        { success: false, error: 'An email or WhatsApp number is required.' },
        { status: 422 }
      );
    }

    // --- Validate email format if provided ---
    if (lead.email && !validateEmail(lead.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format.' },
        { status: 422 }
      );
    }

    // --- Persist to Supabase (unless caller handles it) ---
    let leadId: string | null = null;
    if (!lead.skip_insert) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        const { data, error } = await admin
          .from('leads')
          .insert({
            source: lead.source,
            pain_points: lead.pain_points,
            company_name: lead.company_name,
            domain_url: lead.domain_url,
            description: lead.description,
            email: lead.email,
            whatsapp: lead.whatsapp,
            estimated_tier: lead.estimated_tier,
            estimated_cost_min: lead.estimated_cost_min,
            estimated_cost_max: lead.estimated_cost_max,
            turnaround_hours: lead.turnaround_hours,
          })
          .select('id')
          .single();
        if (error) {
          console.error('[leads] supabase insert failed:', error.message);
        } else {
          leadId = data?.id ?? null;
        }
      }
    }

    // --- Email dispatch (best-effort) ---
    const transport = makeTransport();
    let emailSent = false;
    if (transport) {
      const recipient = process.env.LEAD_RECIPIENT_EMAIL || process.env.SMTP_USER;
      try {
        await transport.sendMail({
          from: `"HostSuite Leads" <${process.env.SMTP_USER}>`,
          to: recipient,
          subject: `New HostSuite Lead — ${lead.company_name || lead.email || 'Unknown'}`,
          html: buildEmailHtml(lead),
          replyTo: lead.email || undefined,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('[leads] email dispatch failed:', (mailErr as Error).message);
      }
    } else {
      console.warn('[leads] SMTP not configured — skipping email dispatch.');
    }

    return NextResponse.json({
      success: true,
      leadId,
      emailSent,
      message: 'Lead received. Check your WhatsApp for the next step.',
    });
  } catch (err) {
    console.error('[leads] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong while submitting your request.' },
      { status: 500 }
    );
  }
}
