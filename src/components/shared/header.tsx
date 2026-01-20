"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginButton, UserMenu } from "@/components/auth";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
      <div className=" max-w-7xl mx-auto w-full px-4 sm:px-6 flex h-14 items-center justify-between md:justify-start">
        <Link href="/" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6" />
          <span className="font-bold">RepMarket</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:ml-auto">
          {isReady && (
            <div className="hidden md:block">
              {isAuthenticated ? <UserMenu /> : <LoginButton />}
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="max-w-7xl mx-auto py-4 flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "transition-colors hover:text-foreground/80 py-2",
                  pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isReady && (
              <div className="pt-2 border-t">
                {isAuthenticated ? <UserMenu /> : <LoginButton />}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
