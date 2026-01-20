"use client";

import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function LoginButton({
  className,
  variant = "default",
  size = "default",
}: LoginButtonProps) {
  const { login, isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={login}
      className={className}
    >
      Connect Wallet
    </Button>
  );
}
