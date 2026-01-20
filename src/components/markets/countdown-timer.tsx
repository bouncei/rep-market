"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  onExpire?: () => void;
  showLabels?: boolean;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

export function CountdownTimer({
  targetDate,
  className,
  onExpire,
  showLabels = true,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.isExpired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        <span className="font-medium text-yellow-500">Locked</span>
      </div>
    );
  }

  // For very short timeframes, show urgency
  const isUrgent =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 10;

  if (compact) {
    // Compact format: "2d 5h" or "5h 30m" or "30m 15s"
    let display = "";
    if (timeLeft.days > 0) {
      display = `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      display = `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else {
      display = `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    return (
      <span
        className={cn(
          "font-mono tabular-nums",
          isUrgent && "text-red-500 animate-pulse",
          className
        )}
      >
        {display}
      </span>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  // Filter out days if zero
  const displayUnits =
    timeLeft.days === 0 ? timeUnits.slice(1) : timeUnits;

  return (
    <div className={cn("flex gap-2", className)}>
      {displayUnits.map((unit) => (
        <div
          key={unit.label}
          className={cn(
            "flex flex-col items-center",
            isUrgent && "text-red-500"
          )}
        >
          <span
            className={cn(
              "font-mono text-2xl font-bold tabular-nums",
              isUrgent && "animate-pulse"
            )}
          >
            {String(unit.value).padStart(2, "0")}
          </span>
          {showLabels && (
            <span className="text-xs text-muted-foreground uppercase">
              {unit.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
