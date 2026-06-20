import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Folder,
  LayoutDashboard,
  Search,
  Settings,
  Upload,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ProjectCard } from "@/components/ui/project-card";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Documents", icon: Folder },
  { label: "Needs Review", icon: FileText },
  { label: "Reviewers", icon: Users },
  { label: "Upload", icon: Upload },
  { label: "Settings", icon: Settings }
];

const filters = ["Pending", "Changes requested", "Approved", "Rejected"];

const projects = [
  {
    icon: FileText,
    client: "Legal",
    project: "Vendor Agreement",
    status: "Awaiting approval",
    progress: 80,
    metric: "v2"
  },
  {
    icon: Folder,
    client: "Compliance",
    project: "Policy Update",
    status: "Changes requested",
    progress: 45,
    metric: "v1"
  },
  {
    icon: CheckCircle,
    client: "Security",
    project: "Q3 Report",
    status: "Approved",
    progress: 100,
    metric: "v3"
  }
];

const rows = [
  ["Vendor Agreement", "Legal", "SHA-256 verified", "Pending review"],
  ["Data Processing Addendum", "Privacy", "2 reviewer notes", "Changes requested"],
  ["Incident Runbook", "Security", "Awaiting sign-off", "Overdue"]
];

export function DashboardPreview() {
  const [activeFilter, setActiveFilter] = useState("Pending");

  return (
    <Card className="overflow-hidden">
      <div className="grid min-h-[620px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 lg:block">
          <div className="flex items-center gap-3 rounded-md bg-card p-3 shadow-warm">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Folder aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-label text-[10px] font-semibold uppercase text-muted-foreground">SecureDoc</p>
              <p className="text-sm font-semibold text-sidebar-foreground">Workspace</p>
            </div>
          </div>

          <nav aria-label="Dashboard navigation" className="mt-6 space-y-1">
            {navItems.map((item, index) => (
              <button
                key={item.label}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  index === 0 && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                )}
              >
                <item.icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 bg-background">
          <header className="border-b border-border bg-card/85 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Workspace</p>
                <h3 className="mt-1 text-2xl font-semibold text-foreground">Approval command center</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:w-72">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input aria-label="Search documents" className="h-10 pl-9 pr-14" placeholder="Search documents" />
                  <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-label text-[10px] text-muted-foreground">
                    &#8984;K
                  </kbd>
                </div>
                <Button size="icon" aria-label="Open settings" variant="outline" className="shrink-0 lg:hidden">
                  <Settings aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 pb-1" aria-label="Project filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 font-label text-[11px] font-semibold uppercase transition focus-visible:ring-2 focus-visible:ring-ring",
                    activeFilter === filter
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </header>

          <div className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.client} {...project} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <Card className="overflow-hidden shadow-none">
                <div className="border-b border-border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-semibold text-foreground">Document queue</h4>
                    <Badge tone="muted">{activeFilter}</Badge>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {rows.map(([client, project, content, status]) => (
                    <div key={client} className="grid gap-3 p-4 text-sm sm:grid-cols-[1.1fr_1fr_1fr_1fr] sm:items-center">
                      <div>
                        <p className="font-semibold text-foreground">{client}</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:hidden">{project}</p>
                      </div>
                      <p className="hidden text-muted-foreground sm:block">{project}</p>
                      <p className="text-muted-foreground">{content}</p>
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          aria-hidden="true"
                          className={cn("h-4 w-4", status === "Overdue" ? "text-destructive" : "text-primary")}
                        />
                        <span className="font-medium text-foreground">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 shadow-none">
                <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">This week</p>
                <h4 className="mt-2 text-xl font-semibold text-foreground">18 decisions recorded</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Every decision was logged to the tamper-evident audit trail with actor, role, and timestamp.
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between font-label text-[11px] uppercase text-muted-foreground">
                      <span>Approved</span>
                      <span>82%</span>
                    </div>
                    <Progress value={82} label="Weekly approvals" className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between font-label text-[11px] uppercase text-muted-foreground">
                      <span>Verified</span>
                      <span>64%</span>
                    </div>
                    <Progress value={64} label="Weekly integrity checks" className="mt-2" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
