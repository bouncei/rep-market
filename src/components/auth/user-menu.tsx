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
  const { isAuthenticated, walletAddress, profile, logout, syncCredibility, isSyncingCredibility } =
    useAuth();
  const { tier } = useCredibility(profile?.ethosCredibility ?? 0, profile?.tier);

  if (!isAuthenticated || !walletAddress) {
    return null;
  }

  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {walletAddress.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block font-mono text-sm">
            {shortAddress}
          </span>
          <Badge className={`${tier.bgColor} ${tier.color} ${tier.borderColor} hidden sm:inline-flex`}>
            {tier.displayName}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Connected</p>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {shortAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profile && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">RepScore</span>
                <span className="font-semibold">{profile.repScore.toFixed(0)}</span>
              </div>
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
          <span>Sync Credibility</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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
