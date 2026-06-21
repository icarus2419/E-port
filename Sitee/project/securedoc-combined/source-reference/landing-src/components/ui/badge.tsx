import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "muted" | "danger";
}

function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-label text-[11px] font-semibold uppercase leading-none",
        tone === "default" && "border-primary/25 bg-primary/10 text-primary",
        tone === "accent" && "border-accent bg-accent text-accent-foreground",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
        tone === "danger" && "border-destructive/25 bg-destructive/10 text-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
