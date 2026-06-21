import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  History,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { ApprovalFileUploadPreview } from "@/components/ui/approval-file-upload-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientPortalPreview } from "@/components/ui/client-portal-preview";
import { DashboardPreview } from "@/components/ui/dashboard-preview";
import { FeatureCard } from "@/components/ui/feature-card";
import { HeroFuturistic } from "@/components/ui/hero-futuristic";
import { PricingCard } from "@/components/ui/pricing-card";
import { Progress } from "@/components/ui/progress";

const APP_URL = "./app/";

const painCards = [
  {
    icon: MessageSquare,
    title: "Approvals over email",
    description: "Sign-off lives in scattered replies with no record of who approved which version."
  },
  {
    icon: History,
    title: "Version confusion",
    description: "Reviewers comment on an old file while a newer draft quietly circulates elsewhere."
  },
  {
    icon: AlertCircle,
    title: "No tamper evidence",
    description: "Nothing proves a document wasn't altered between review and final approval."
  },
  {
    icon: Clock,
    title: "Audit gaps",
    description: "When compliance asks who did what and when, the trail is incomplete or missing."
  }
];

const features = [
  {
    icon: Users,
    title: "Role-based access",
    description: "Submitters, reviewers, and admins each see only what their role permits."
  },
  {
    icon: Hash,
    title: "SHA-256 fingerprints",
    description: "Every upload gets a cryptographic hash stored beside its metadata and approval."
  },
  {
    icon: Clock,
    title: "Tamper-evident audit trail",
    description: "Each action is chained to the previous event hash, so nothing can be quietly removed."
  },
  {
    icon: History,
    title: "Version history",
    description: "Upload revised files without losing the original or its full review chain."
  },
  {
    icon: MessageSquare,
    title: "Change requests",
    description: "Send a document back with notes attached to the exact version under review."
  },
  {
    icon: ShieldCheck,
    title: "Approval receipts",
    description: "Capture a dated receipt with reviewer, decision, note, and file fingerprint."
  },
  {
    icon: CheckCircle,
    title: "Reviewer assignment",
    description: "Route each document to the right reviewer and track its decision in one place."
  },
  {
    icon: FileText,
    title: "Exportable audit report",
    description: "Hand compliance a clean, complete record of every action on every document."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    description: "Up to 3 users",
    features: ["Role-based access", "File uploads", "Approval receipts"]
  },
  {
    name: "Team",
    price: "$49",
    description: "Up to 15 users",
    features: ["Everything in Starter", "SHA-256 evidence", "Audit trail export"],
    highlighted: true
  },
  {
    name: "Business",
    price: "$129",
    description: "Up to 50 users",
    features: ["Everything in Team", "Version history", "Reviewer routing"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Unlimited users + SSO",
    features: ["Everything in Business", "SSO & SAML", "Priority support"]
  }
];

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <Badge tone="accent">{eyebrow}</Badge> : null}
      <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
      {description ? <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">{description}</p> : null}
    </div>
  );
}

function ProductDashboardPreview() {
  const stats = [
    ["Pending review", "2"],
    ["Approved", "4"],
    ["Changes requested", "1"],
    ["Integrity", "All verified"]
  ];

  const requests = [
    ["Vendor Agreement v2", "Approved", CheckCircle],
    ["Policy Update", "Changes requested", AlertCircle],
    ["Q3 Security Report", "Pending review", Clock],
    ["Data Processing Addendum", "Awaiting sign-off", ShieldCheck]
  ];

  return (
    <Card className="mx-auto max-w-6xl overflow-hidden">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-border bg-secondary/70 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Workspace</p>
              <h3 className="mt-1 text-3xl font-semibold text-foreground">Approval dashboard</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Legal &amp; Compliance queue</p>
            </div>
            <Badge tone="accent">Status: Awaiting sign-off</Badge>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Approval rate this week</p>
                <p className="mt-2 text-4xl font-semibold text-primary">86%</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles aria-hidden="true" className="h-6 w-6" />
              </div>
            </div>
            <Progress value={86} label="Weekly approval rate" className="mt-5" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="font-label text-[10px] font-semibold uppercase text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">2</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="font-label text-[10px] font-semibold uppercase text-muted-foreground">Changes</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">1</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="font-label text-[10px] font-semibold uppercase text-muted-foreground">Verified</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">7/7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-background p-4">
                <p className="font-label text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Documents</h4>
              <Badge tone="muted">Live</Badge>
            </div>
            {requests.map(([label, status, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{label as string}</p>
                  <p className="text-xs text-muted-foreground">{status as string}</p>
                </div>
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroFuturistic />

      <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="The old way"
            title="Document approvals should not live in your inbox."
            description="SecureDoc turns scattered email sign-off into a controlled workflow with proof at every step."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {painCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.06 }}
              >
                <Card className="h-full p-5 transition hover:-translate-y-1 hover:border-primary/35">
                  <card.icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="product-preview">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Full visibility"
            title="See every document, decision, and fingerprint."
            description="A clear dashboard shows what is pending, approved, changed, and cryptographically verified."
          />
          <div className="mt-12">
            <ProductDashboardPreview />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="features">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Built for sign-off"
            title="Everything you need for secure approvals."
            description="SecureDoc stays focused on the controlled review and approval work that compliance depends on."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="demo-portal" className="scroll-mt-8 bg-secondary/65 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="client-portal">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="For reviewers"
            title="A focused space to review and decide."
            description="Reviewers see the version under review, the file fingerprint, and a clear decision in one place."
          />
          <div className="mt-12">
            <ClientPortalPreview />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="dashboard">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Admin workspace"
            title="A proper dashboard for every document in flight."
            description="Filter by pending, changes requested, approved, and rejected without digging through threads."
          />
          <div className="mt-12">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="approval">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Final sign-off"
            title="Capture explicit approval with cryptographic proof."
            description="A timestamped receipt records the reviewer, the decision, the note, and the exact file fingerprint."
          />
          <div className="mt-12">
            <ApprovalFileUploadPreview />
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-8 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="pricing">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free, then add your team."
            description="Simple monthly pricing for teams that need a real approval trail."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8" aria-labelledby="final-cta">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-border bg-primary p-8 text-primary-foreground shadow-warm sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
                Ready to approve
              </Badge>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-5xl">
                Approve documents with evidence, not email.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                Upload, route to a reviewer, capture a signed approval receipt, and keep every action in a
                tamper-evident audit trail.
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => { window.location.href = APP_URL; }}
              className="w-full bg-primary-foreground text-primary hover:bg-accent sm:w-auto"
            >
              Open the demo app
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
