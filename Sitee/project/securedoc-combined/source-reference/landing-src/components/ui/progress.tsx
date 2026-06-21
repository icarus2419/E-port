import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
}

function Progress({ value, label, className, ...props }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
      aria-label={label}
      className={cn("h-2.5 overflow-hidden rounded-full bg-input", className)}
      {...props}
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        whileInView={{ width: `${clampedValue}%` }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export { Progress };
