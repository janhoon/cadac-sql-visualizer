import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends unknown[], R>(
  func: (...args: T) => R,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: T) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}
