import { CheckCircle, FileText, Hash, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const approvalChecks = [
  "I reviewed the latest version in full",
  "The SHA-256 fingerprint matches the file I read",
  "I approve this document for release"
];

export function ApprovalileUploadPreview() {
  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_0.8fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-secondary/70 p-5">
          <Badge tone="accent">Final sign-off</Badge>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">Approve Vendor Agreement v2?</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Reviewers confirm the exact version and fingerprint before the document is released.
          </p>
        </div>
        <div className="space-y-4 p-5">
          {approvalChecks.map((check, index) => (
            <label
              key={check}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-3 transition hover:border-primary/45 hover:bg-accent/35"
            >
              <input
                type="checkbox"
                defaultChecked={index < 2}
                className="h-4 w-4 accent-[var(--primary)]"
                aria-label={check}
              />
              <span className="text-sm font-medium text-foreground">{check}</span>
            </label>
          ))}
          <Button className="w-full">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Approve and sign off
          </Button>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckCircle aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Approval record created</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Signed by Maya Chen on Jun 20, 2026 at 9:42 AM.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-md border border-border bg-muted p-4">
            <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Timestamped record</p>
            <p className="mt-2 text-sm font-medium text-foreground">Vendor Agreement v2 approved for release</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Signed approval receipt</p>
              <p className="text-sm text-muted-foreground">Reviewer, decision, note, and file fingerprint in one record.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm">
            <Hash aria-hidden="true" className="h-4 w-4 text-primary" />
            <span className="break-all font-label text-muted-foreground">87f38f12a9b0b30e…</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
