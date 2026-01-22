"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginButton, UserMenu } from "@/components/auth";
import { NotificationCenter } from "@/components/notifications";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

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
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/30">
            Beta
          </Badge>
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
          {isReady && isAuthenticated && (
            <div className="hidden md:block">
              <NotificationCenter />
            </div>
          )}
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
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="md:hidden border-t overflow-hidden"
          >
            <motion.nav
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="max-w-7xl mx-auto px-4 py-4 flex flex-col space-y-3"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.1 + index * 0.05,
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "transition-colors hover:text-foreground/80 py-2 block",
                      pathname === link.href
                        ? "text-foreground font-medium"
                        : "text-foreground/60"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {isReady && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="pt-2 border-t flex items-center justify-between"
                >
                  {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                      <NotificationCenter />
                      <UserMenu />
                    </div>
                  ) : (
                    <LoginButton />
                  )}
                </motion.div>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
