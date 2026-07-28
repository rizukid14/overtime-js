import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200",
        secondary:
          "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
        destructive:
          "border-transparent bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300",
        outline: "text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800",
        emerald:
          "border-transparent bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold",
        blue:
          "border-transparent bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold",
        purple:
          "border-transparent bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold",
        amber:
          "border-transparent bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
