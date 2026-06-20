import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  icon: LucideIcon;
  client: string;
  project: string;
  status: string;
  progress: number;
  metric: string;
  className?: string;
}

export function ProjectCard({
  icon: Icon,
  client,
  project,
  status,
  progress,
  metric,
  className
}: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35",
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={`${client} ${project} project`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">{client}</p>
            <h3 className="mt-1 font-semibold text-foreground">{project}</h3>
          </div>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Badge tone={status.includes("Overdue") ? "danger" : status.includes("approval") ? "accent" : "default"}>
          {status}
        </Badge>
        <span className="font-label text-xs font-semibold text-muted-foreground">{metric}</span>
      </div>
      <div className="mt-4">
        <Progress value={progress} label={`${project} progress`} />
        <div className="mt-2 flex justify-between font-label text-[11px] text-muted-foreground">
          <span>PROGRESS</span>
          <span>{progress}%</span>
        </div>
      </div>
    </Card>
  );
}
