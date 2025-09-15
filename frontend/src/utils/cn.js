// src/utils/cn.js
// Utility pour combiner les classes CSS conditionnellement (comme clsx)
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
