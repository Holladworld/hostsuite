import { LegalLayout } from '@/components/legal-layout';
import { BRAND } from '@/lib/constants';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="August 2026"
      sections={[
        {
          heading: 'Overview',
          body: [
            `HostSuite, a specialized managed web operations brand under ${BRAND.parent}, respects your privacy. This policy explains what data we collect, why we collect it, how we use it, and the controls you have over your information.`,
          ],
        },
        {
          heading: 'Information We Collect',
          body: [
            'Lead intake data: When you submit the "Tell Us Your Pain" diagnostic form or a pricing enquiry, we collect your company name, domain, description of the issue, corporate email, and WhatsApp number.',
            'Client account data: When you create a client portal account, we store your email address and an encrypted password hash. We do not store plaintext passwords.',
            'Infrastructure data: For hosted clients, we store domain records, backup timestamps, uptime metrics, and support ticket history necessary to deliver and report on our services.',
            'Technical data: We collect standard server logs, including IP addresses, request timestamps, and user agent strings, for security monitoring and abuse prevention.',
          ],
        },
        {
          heading: 'How We Use Your Information',
          body: [
            'To deliver and manage the infrastructure services you have engaged us for.',
            'To respond to service requests and support tickets, including via WhatsApp and email.',
            'To send you operational notifications about your hosted domains, such as backup completions, SSL renewals, and incident alerts.',
            'To improve our services, diagnose technical issues, and prevent abuse of our platform.',
            'We do not sell your data to third parties. We do not use your data for advertising.',
          ],
        },
        {
          heading: 'Data Storage & Security',
          body: [
            'Client data is stored in encrypted databases hosted on Supabase infrastructure with row-level security policies that restrict each client to their own records.',
            'Backups of client infrastructure are AES-encrypted and stored offsite. Access to backup vaults is restricted to authorized engineers.',
            'Access credentials you share with us for migration or recovery work are stored in an encrypted vault and revoked or deleted once the engagement is complete.',
            'We enforce role-based access control internally: only engineers assigned to your account can access your infrastructure data.',
          ],
        },
        {
          heading: 'Data Sharing & Sub-Processors',
          body: [
            'We share data only with the sub-processors necessary to deliver our services, including cloud hosting providers (AWS, DigitalOcean), our database and authentication provider (Supabase), and our CDN and security provider (Cloudflare).',
            'Each sub-processor is bound by contractual obligations to protect your data consistent with this policy.',
            'We may disclose data where required by law, court order, or legitimate law-enforcement request, and only to the extent necessary to comply.',
          ],
        },
        {
          heading: 'Data Retention',
          body: [
            'We retain lead intake data for 24 months from submission, after which it is automatically purged unless you become a client.',
            'Client account and infrastructure data is retained for the duration of your engagement and for 90 days thereafter, to facilitate export or migration.',
            'Server logs are retained for 90 days for security purposes, then automatically deleted.',
          ],
        },
        {
          heading: 'Your Rights',
          body: [
            'You may request access to, correction of, or deletion of your personal data at any time by contacting us.',
            'You may export your infrastructure and ticket data from the client portal at any time.',
            'You may close your account at any time; closure triggers the retention schedule described above.',
          ],
        },
        {
          heading: 'Cookies & Tracking',
          body: [
            'Our website uses essential cookies for authentication and session management in the client portal. We do not use third-party advertising or tracking cookies.',
            'Analytics, where used, are aggregated and anonymized to understand site performance — not to profile individual visitors.',
          ],
        },
        {
          heading: 'International Transfers',
          body: [
            'Your data may be processed by our sub-processors in jurisdictions outside Nigeria, including the European Union and the United States. We rely on the standard contractual clauses and equivalent safeguards to ensure your data is protected to Nigerian standards during such transfers.',
          ],
        },
        {
          heading: 'Changes to This Policy',
          body: [
            'We may update this policy from time to time. We will notify active clients of material changes via email at least 30 days before they take effect. The "last updated" date above reflects the most recent revision.',
          ],
        },
        {
          heading: 'Contact',
          body: [
            `For privacy questions or data requests, contact us at ${BRAND.supportEmail} or via WhatsApp at ${BRAND.whatsappDisplay}.`,
          ],
        },
      ]}
    />
  );
}
