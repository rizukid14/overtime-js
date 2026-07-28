import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-950 dark:text-slate-50 shadow-sm backdrop-blur-sm transition-all duration-200",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 border-b border-slate-100 dark:border-slate-800/80", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100", className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
