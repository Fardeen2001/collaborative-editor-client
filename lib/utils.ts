import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { staticLocale } from "@/lib/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(staticLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
