import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "default" | string;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, asChild, ...props }, ref) => {
    
    const variants: Record<string, string> = {
      primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-lg shadow-purple-500/30",
      secondary: "bg-[var(--color-secondary)] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30",
      outline: "border border-[var(--color-surface-border)] bg-transparent hover:bg-[var(--color-surface)] text-[var(--foreground)]",
      ghost: "bg-transparent hover:bg-[var(--color-surface)] text-[var(--foreground)]",
      danger: "bg-[var(--color-accent)] hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30",
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg font-semibold",
    };

    return (
      <motion.button
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props as any}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
