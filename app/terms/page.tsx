import { LegalLayout } from '@/components/legal-layout';
import { BRAND } from '@/lib/constants';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="August 2026"
      sections={[
        {
          heading: 'Acceptance of Terms',
          body: [
            `By engaging HostSuite for any managed infrastructure, development, or support service, you agree to these terms. HostSuite is a specialized managed web operations brand under ${BRAND.parent}. These terms govern the relationship between ${BRAND.parent} ("HostSuite", "we", "us") and the client ("you").`,
          ],
        },
        {
          heading: 'Service Scope',
          body: [
            'HostSuite provides managed web hosting, email deliverability engineering, access recovery, site migrations, security remediation, and custom application development as described on our services and pricing pages.',
            'The specific scope of work for each engagement is confirmed via the diagnostic intake form, the client portal ticket system, or a written statement of work. We do not commence billable work until the scope is agreed.',
          ],
        },
        {
          heading: 'SLA Guarantees',
          body: [
            'Uptime: We target 99.99% monthly uptime for all hosted domains under an active managed plan. Uptime is measured excluding scheduled maintenance windows communicated at least 48 hours in advance.',
            'Emergency Response: Managed Growth and Enterprise plans include a priority WhatsApp response desk with a target first-response time of under 2 hours for Managed Growth and under 15 minutes for Enterprise. Starter Ops plans operate on a best-effort response within 24 hours.',
            'Backups: Daily encrypted offsite backups are included on Managed Growth and Enterprise plans. Starter Ops includes automated weekly backups. We retain backups for a minimum of 30 days.',
            'SLA Remediation: Where an uptime target is not met due to a failure on our infrastructure, we apply a service credit equal to 10 times the downtime duration against your next invoice, upon written request.',
          ],
        },
        {
          heading: 'Client Responsibilities',
          body: [
            'You agree to provide accurate information about your infrastructure, including existing hosting providers, domain registrars, and access credentials where recovery or migration work is required.',
            'You are responsible for maintaining the confidentiality of any portal credentials we issue and for all activity that occurs under your client account.',
            'You agree to keep your billing information current and to authorize recurring charges for monthly or annual managed service plans until cancellation.',
          ],
        },
        {
          heading: 'Fees, Billing & Credit Offset',
          body: [
            'Pricing is published on our pricing page and confirmed at the start of each engagement. Monthly plans are billed in advance; annual plans are billed once per year at a 20% discount versus monthly.',
            'Credit Offset Program: If you switch to HostSuite mid-term with another hosting provider, we will match your remaining prepaid months at no charge, subject to verification of your existing contract. This applies to hosting fees only and does not cover domain registration or third-party SaaS subscriptions.',
            'Custom development work is billed per the agreed statement of work. A deposit of 50% is typically required before commencement, with the balance due on delivery.',
          ],
        },
        {
          heading: 'Cancellation & Refunds',
          body: [
            'You may cancel a managed service plan at any time. Cancellation takes effect at the end of the current billing period. We do not issue partial refunds for unused time within a billing period, except where required by law.',
            'Annual plans may be cancelled with a pro-rata refund of unused months within the first 30 days of the annual term. After 30 days, annual plans are non-refundable but remain active for the full term.',
            'Custom development deposits are non-refundable once work has commenced.',
          ],
        },
        {
          heading: 'Acceptable Use',
          body: [
            'You may not use HostSuite infrastructure to host content that is illegal under Nigerian or applicable international law, to send unsolicited bulk email, or to distribute malware or malicious code.',
            'We reserve the right to suspend or terminate any account engaged in activity that compromises the security or stability of our shared infrastructure, pending investigation.',
          ],
        },
        {
          heading: 'Limitation of Liability',
          body: [
            `HostSuite and ${BRAND.parent} provide services on a commercially reasonable basis. To the maximum extent permitted by law, our total liability for any claim arising from our services is limited to the fees paid by you in the three months preceding the claim.`,
            'We are not liable for indirect or consequential damages, including loss of revenue, loss of data, or loss of business opportunity, except where such exclusion is not permitted by applicable law.',
            'We are not responsible for downtime or issues caused by third-party providers outside our control, including upstream network failures, domain registrar outages, or client-side code errors.',
          ],
        },
        {
          heading: 'Governing Law',
          body: [
            'These terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from these terms or our services shall be resolved in the courts of Lagos State, Nigeria, unless otherwise agreed in writing.',
          ],
        },
        {
          heading: 'Contact',
          body: [
            `For any questions about these terms, contact us at ${BRAND.supportEmail} or via WhatsApp at ${BRAND.whatsappDisplay}.`,
          ],
        },
      ]}
    />
  );
}
