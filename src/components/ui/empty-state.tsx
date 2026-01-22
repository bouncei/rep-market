"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icons?: LucideIcon[];
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className,
}: EmptyStateProps) {
  const ActionContent = () => {
    const ActionIcon = action?.icon;
    const content = (
      <>
        {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
        {action?.label}
      </>
    );

    if (action?.href) {
      return (
        <Button asChild variant="outline" className="mt-6 shadow-sm">
          <a href={action.href}>{content}</a>
        </Button>
      );
    }

    return (
      <Button onClick={action?.onClick} variant="outline" className="mt-6 shadow-sm">
        {content}
      </Button>
    );
  };

  const Icon0 = icons[0];
  const Icon1 = icons[1];
  const Icon2 = icons[2];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background border-border hover:border-border/80 text-center",
        "border-2 border-dashed rounded-xl p-10 sm:p-14 w-full",
        "group hover:bg-muted/30 transition duration-300",
        className
      )}
    >
      {/* Animated icons */}
      {icons.length > 0 && (
        <div className="flex justify-center isolate mb-6">
          {icons.length >= 3 ? (
            <>
              <motion.div
                whileHover={{ x: -20, rotate: -12, y: -2 }}
                className="bg-background size-10 sm:size-12 grid place-items-center rounded-xl relative left-2.5 top-1.5 -rotate-6 shadow-lg ring-1 ring-border group-hover:-translate-x-5 group-hover:-rotate-12 transition duration-300"
              >
                {Icon0 && (
                  <Icon0 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-background size-10 sm:size-12 grid place-items-center rounded-xl relative z-10 shadow-lg ring-1 ring-border transition duration-300"
              >
                {Icon1 && (
                  <Icon1 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </motion.div>
              <motion.div
                whileHover={{ x: 20, rotate: 12, y: -2 }}
                className="bg-background size-10 sm:size-12 grid place-items-center rounded-xl relative right-2.5 top-1.5 rotate-6 shadow-lg ring-1 ring-border group-hover:translate-x-5 group-hover:rotate-12 transition duration-300"
              >
                {Icon2 && (
                  <Icon2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </motion.div>
            </>
          ) : (
            <div className="bg-background size-12 grid place-items-center rounded-xl shadow-lg ring-1 ring-border">
              {Icon0 && (
                <Icon0 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      )}

      <h2 className="text-foreground font-semibold text-lg mt-6">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        {description}
      </p>

      {action && <ActionContent />}
    </motion.div>
  );
}
