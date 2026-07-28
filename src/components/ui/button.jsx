import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm",
        destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm",
        outline: "border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
        secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
        link: "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline",
        emerald: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-sm",
        blue: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 px-2 text-xs rounded-md",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-11 px-6 text-base rounded-xl",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
