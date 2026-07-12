import { Check } from "lucide-react";

export const pricingData = [
  {
    name: "Core Business Setup",
    price: "49",
    description: "Perfect for single business platforms and startups looking to launch with zero technical headaches.",
    features: [
      { name: "Fully Managed Server Environment", icon: Check },
      { name: "Secure Custom Business Emails (Up to 5 Inboxes)", icon: Check },
      { name: "Hardcoded SPF, DKIM & DMARC (Inbox Guarantee)", icon: Check },
      { name: "Up to 3 Custom Domain Linkings & SSL", icon: Check },
      { name: "Automated 24/7 Server Failover Telemetry", icon: Check },
      { name: "Direct WhatsApp Line for Quick Fixes", icon: Check }
    ],
    buttonText: "Deploy My Infrastructure",
    isPopular: false
  },
  {
    name: "Growth & Developer Takeover",
    price: "129",
    description: "Engineered for active platforms dealing with slow speeds, broken code, or missing developers.",
    features: [
      { name: "Everything in Core Business Setup", icon: Check },
      { name: "MIA Developer Takeover & Repo Stabilization", icon: Check },
      { name: "Full Database & Legacy Platform Migration", icon: Check },
      { name: "Deep Speed Optimization & Cache Hardening", icon: Check },
      { name: "Unlimited Custom Domain & Email Mappings", icon: Check },
      { name: "Priority System Engineer Response Window", icon: Check }
    ],
    buttonText: "Take Over My Stack",
    isPopular: true
  },
  {
    name: "Enterprise Architecture",
    price: "299",
    description: "For established operations requiring custom backend systems and full-service corporate design assets.",
    features: [
      { name: "Everything in Growth & Handovers", icon: Check },
      { name: "Dedicated Server Resources (Zero Shared Lag)", icon: Check },
      { name: "Custom Corporate Graphic Design & Visual Assets", icon: Check },
      { name: "Tailored Node.js / Next.js / Supabase Engineering", icon: Check },
      { name: "Continuous Performance & Security Audits", icon: Check },
      { name: "Dedicated Technical Partner Account Manager", icon: Check }
    ],
    buttonText: "Deploy Enterprise Stack",
    isPopular: false
  }
];
