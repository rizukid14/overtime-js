import * as React from "react";
import { cn } from "../../lib/utils";

const Switch = React.forwardRef(({ className, checked, onChange, disabled, ...props }, ref) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-800",
        className
      )}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
});
Switch.displayName = "Switch";

export { Switch };
