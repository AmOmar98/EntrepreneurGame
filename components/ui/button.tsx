import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonProps = {
  variant?: "primary" | "success" | "ghost";
  size?: "default" | "lg";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "eic-button",
    `eic-button--${variant}`,
    size === "lg" ? "eic-button--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
