import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const baseClass =
  "px-4 py-2 rounded font-semibold transition-colors duration-150";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-300",
  secondary:
    "bg-white text-blue-600 border border-blue-400 hover:bg-blue-50 focus-visible:ring-blue-200",
};

export function Button({
  variant = "primary",
  className,
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        baseClass,
        variantClass[variant],
        "focus-visible:outline-none focus-visible:ring",
        className
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}
