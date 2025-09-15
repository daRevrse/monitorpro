// src/components/common/Button.js
import React from "react";
import { cn } from "../../utils/cn";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-800 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    outline:
      "border-2 border-primary-800 text-primary-800 hover:bg-primary-800 hover:text-white focus:ring-primary-500",
    ghost: "text-primary-800 hover:bg-primary-50 focus:ring-primary-500",
    white:
      "bg-white text-primary-800 hover:bg-gray-100 focus:ring-primary-500 shadow-lg hover:shadow-xl",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl",
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    loading && "cursor-wait",
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;
