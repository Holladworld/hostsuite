import { Server, ShieldCheck, Zap, HardDrive, Cpu, Radio } from "lucide-react";

export const featuresData = [
  {
    title: "High-Availability Storage Cells",
    description: "Enterprise NVMe array setups with active mirroring layer configurations to keep database operations fast.",
    icon: HardDrive
  },
  {
    title: "Isolated Resource Pools",
    description: "Dedicated execution frameworks per container, protecting your server workloads from external resource theft.",
    icon: Cpu
  },
  {
    title: "Zero-Drop Mail Frameworks",
    description: "Decoupled outbound networks running through verified relays to secure direct primary inbox delivery.",
    icon: Radio
  },
  {
    title: "Global Content Optimization",
    description: "Integrated processing nodes that optimize static visual assets right at your regional network borders.",
    icon: Zap
  },
  {
    title: "Encrypted Network Firewalls",
    description: "Active transport-layer traffic filtering parameters designed to keep application runtimes fully locked down.",
    icon: ShieldCheck
  },
  {
    title: "Automated Failure Routing",
    description: "Uptime telemetry monitoring layers that dynamically route user traffic away from degraded cluster nodes.",
    icon: Server
  }
];
