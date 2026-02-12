import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  hover = true,
  className = "",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "card",
    glass: "card-glass",
  };

  const paddingStyles = {
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  const hoverStyles = hover ? "" : "hover:transform-none hover:shadow-[var(--shadow-card)]";

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ children, className = "", ...props }: CardTitleProps) {
  return (
    <h3 className={`h4 ${className}`} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ children, className = "", ...props }: CardDescriptionProps) {
  return (
    <p className={`body-sm text-[var(--color-text-secondary)] ${className}`} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
