import { CheckCircle, FileText, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const checklist = [
  { label: "Opened latest version", done: true },
  { label: "Confirmed SHA-256 match", done: true },
  { label: "Reviewed change request notes", done: false },
  { label: "Checked prior version history", done: true },
  { label: "Record decision", done: false }
];

export function ClientPortalPreview() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary/65 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="accent">Reviewer portal</Badge>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-foreground">
              You have one document to review.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Everything needed for a confident decision sits on one screen: the file, its fingerprint, and the notes.
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-3 text-left sm:min-w-36">
            <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Review</p>
            <p className="mt-1 text-2xl font-semibold text-primary">80%</p>
          </div>
        </div>
        <Progress value={80} label="Review completion" className="mt-5" />
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {checklist.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
            >
              <span
                className={
                  item.done
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
                }
              >
                <CheckCircle aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <Badge tone={item.done ? "default" : "muted"} className="ml-auto">
                {item.done ? "Done" : "To do"}
              </Badge>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-accent/35 p-4 text-left">
              <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
              <span className="mt-3 block text-sm font-semibold text-foreground">Vendor Agreement v2</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">PDF · 248 KB · uploaded today</span>
            </div>
            <div className="rounded-md border border-border bg-accent/35 p-4 text-left">
              <Hash aria-hidden="true" className="h-5 w-5 text-primary" />
              <span className="mt-3 block text-sm font-semibold text-foreground">SHA-256 fingerprint</span>
              <span className="mt-1 block break-all font-label text-xs leading-5 text-muted-foreground">87f38f12a9b0b30e…</span>
            </div>
          </div>

          <div>
            <label className="font-label text-[11px] font-semibold uppercase text-muted-foreground" htmlFor="decision-note">
              Decision note
            </label>
            <Textarea
              id="decision-note"
              className="mt-2"
              placeholder="Explain your decision so the approval receipt has full context..."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto">Approve</Button>
            <Button variant="outline" className="w-full sm:w-auto">Request changes</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
