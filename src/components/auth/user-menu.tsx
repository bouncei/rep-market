"use client";

import { useAuth } from "@/hooks";
import { useCredibility } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Wallet, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { isAuthenticated, user, walletAddress, profile, logout, syncCredibility, isSyncingCredibility } =
    useAuth();
  const { tier } = useCredibility(profile?.ethosCredibility ?? 0, profile?.tier);

  if (!isAuthenticated) {
    return null;
  }

  // Get display info based on auth method
  let displayName = "";
  let shortIdentifier = "";
  let isWalletUser = false;

  if (walletAddress) {
    displayName = "Wallet";
    shortIdentifier = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    isWalletUser = true;
  } else if (user?.google?.email) {
    displayName = "Google";
    shortIdentifier = user.google.email;
  } else if (user?.twitter?.username) {
    displayName = "Twitter";
    shortIdentifier = `@${user.twitter.username}`;
  } else {
    displayName = "User";
    shortIdentifier = "Unknown";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {isWalletUser ? walletAddress!.slice(2, 4).toUpperCase() :
               user?.google?.email?.slice(0, 2).toUpperCase() ||
               user?.twitter?.username?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block font-mono text-sm max-w-32 truncate">
            {shortIdentifier}
          </span>
          <Badge className={`${tier.bgColor} ${tier.color} ${tier.borderColor} hidden sm:inline-flex`}>
            {tier.displayName}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName} Account</p>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {shortIdentifier}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profile && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Available RepScore</span>
                <span className="font-semibold">{profile.availableRepScore.toFixed(0)}</span>
              </div>
              {profile.lockedRepScore > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Locked</span>
                  <span className="font-semibold text-orange-500">{profile.lockedRepScore.toFixed(0)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Credibility</span>
                <span className="font-semibold">{profile.ethosCredibility.toFixed(0)}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/portfolio" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Portfolio</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/markets" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Markets</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => syncCredibility()}
          disabled={isSyncingCredibility}
          className="cursor-pointer"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncingCredibility ? "animate-spin" : ""}`} />
          <span>
            {isWalletUser ? "Sync Ethos (Wallet)" : 
             user?.twitter ? "Sync Ethos (Twitter)" : 
             "Sync Credibility"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isWalletUser && (
          <DropdownMenuItem asChild>
            <a
              href={`https://etherscan.io/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Wallet className="mr-2 h-4 w-4" />
              <span>View on Etherscan</span>
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
