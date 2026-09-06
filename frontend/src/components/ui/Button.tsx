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
      primary: "bg-[#C25E2E] hover:bg-[#A34A20] text-white shadow-sm font-medium",
      secondary: "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 font-medium",
      outline: "border border-stone-300 bg-white/85 hover:bg-white text-stone-800 shadow-sm font-medium",
      ghost: "bg-transparent hover:bg-stone-100 text-stone-700 font-medium",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm font-medium",
      default: "bg-[#C25E2E] hover:bg-[#A34A20] text-white shadow-sm font-medium",
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-3.5 text-xs rounded-lg",
      md: "h-11 px-5 text-sm rounded-xl",
      lg: "h-13 px-7 text-base rounded-xl font-medium",
    };

    return (
      <motion.button
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        {...props as any}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };

