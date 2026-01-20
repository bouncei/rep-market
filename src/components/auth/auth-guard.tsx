"use client";

import { useAuth } from "@/hooks";
import { LoginButton } from "./login-button";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
          <p className="text-muted-foreground">
            Please connect your wallet to continue
          </p>
          <LoginButton />
        </div>
      )
    );
  }

  return <>{children}</>;
}
