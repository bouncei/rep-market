"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
    icon?: LucideIcon;
    pulse?: boolean;
  };
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "ghost";
    icon?: LucideIcon;
  };
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  const ActionIcon = action?.icon;
  const BadgeIcon = badge?.icon;

  const ActionButton = () => {
    const buttonContent = (
      <>
        {action?.label}
        {ActionIcon ? (
          <ActionIcon className="w-4 h-4 ml-2" />
        ) : (
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        )}
      </>
    );

    if (action?.href) {
      return (
        <Button
          asChild
          variant={action.variant || "outline"}
          className="shrink-0 group"
        >
          <a href={action.href}>{buttonContent}</a>
        </Button>
      );
    }

    return (
      <Button
        onClick={action?.onClick}
        variant={action?.variant || "outline"}
        className="shrink-0 group"
      >
        {buttonContent}
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="space-y-1">
        {badge && (
          <Badge variant={badge.variant || "secondary"} className="mb-2">
            {badge.pulse && (
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
            )}
            {BadgeIcon && <BadgeIcon className="w-3 h-3 mr-1" />}
            {badge.text}
          </Badge>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <ActionButton />}
    </motion.div>
  );
}
