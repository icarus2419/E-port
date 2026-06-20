import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export function PricingCard({ name, price, description, features, highlighted }: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-1",
        highlighted && "border-primary bg-secondary"
      )}
    >
      {highlighted ? <Badge className="absolute right-5 top-5">Most popular</Badge> : null}
      <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">{name}</p>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-semibold text-foreground">{price}</span>
        <span className="pb-1 text-sm text-muted-foreground">/mo</span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
      <ul className="mt-5 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-foreground">
            <CheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" variant={highlighted ? "default" : "outline"} onClick={() => { window.location.href = "/app"; }}>
        Start {name}
      </Button>
    </Card>
  );
}
