import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
      <Card className={cn("h-full p-5 transition-colors hover:border-primary/35", className)}>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-secondary text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </Card>
    </motion.div>
  );
}
