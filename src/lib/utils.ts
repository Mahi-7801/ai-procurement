import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(val: number | string) {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numValue)) return `₹${val}`;
    if (numValue >= 10000000) return `₹${(numValue / 10000000).toFixed(2)} Cr`;
    if (numValue >= 100000) return `₹${(numValue / 100000).toFixed(2)} L`;
    return `₹${numValue.toLocaleString("en-IN")}`;
}

