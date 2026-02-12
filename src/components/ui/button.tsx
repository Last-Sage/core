"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "icon";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "btn";
  
  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    tertiary: "btn-tertiary",
    icon: "btn-icon",
  };

  const sizeStyles = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-4 py-2.5",
    lg: "text-lg px-6 py-3",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  "aria-label": string; // Required for a11y
}

export function FAB({ icon: Icon, className = "", "aria-label": ariaLabel, ...props }: FABProps) {
  return (
    <button className={`btn-fab ${className}`} aria-label={ariaLabel} {...props}>
      <Icon className="w-6 h-6" />
    </button>
  );
}
