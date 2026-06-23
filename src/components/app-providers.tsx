"use client";

import { AppDialogProvider } from "@/components/app-dialog-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppDialogProvider>{children}</AppDialogProvider>;
}
