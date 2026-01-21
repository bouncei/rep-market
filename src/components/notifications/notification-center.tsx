"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCircle, XCircle, TrendingUp, Info, Check } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "market_resolved" | "prediction_won" | "prediction_lost" | "rep_change" | "market_locked";
  title: string;
  message: string;
  marketId?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const { profile, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    const supabase = createClient();

    // Fetch recent settled predictions to generate notifications
    const { data: recentPredictions } = await supabase
      .from("predictions")
      .select(`
        id,
        is_settled,
        payout_amount,
        stake_amount,
        rep_score_delta,
        settled_at,
        position,
        market:markets(id, title, resolution_outcome, status)
      `)
      .eq("user_id", profile.id)
      .eq("is_settled", true)
      .order("settled_at", { ascending: false })
      .limit(10);

    if (recentPredictions) {
      const notifs: Notification[] = recentPredictions
        .filter((p) => p.market && p.settled_at)
        .map((pred) => {
          const market = pred.market as { id: string; title: string; resolution_outcome: string | null; status: string };
          const isWin = pred.payout_amount !== null && pred.payout_amount > pred.stake_amount;
          const isLoss = pred.payout_amount !== null && pred.payout_amount < pred.stake_amount;

          return {
            id: pred.id,
            type: isWin ? "prediction_won" : isLoss ? "prediction_lost" : "market_resolved",
            title: isWin ? "Prediction Won!" : isLoss ? "Prediction Lost" : "Market Resolved",
            message: isWin
              ? `You won ${((pred.payout_amount ?? 0) - pred.stake_amount).toFixed(1)} on "${market.title}"`
              : isLoss
              ? `You lost ${(pred.stake_amount - (pred.payout_amount ?? 0)).toFixed(1)} on "${market.title}"`
              : `Market "${market.title}" resolved as ${market.resolution_outcome}`,
            marketId: market.id,
            read: false, // For now, all are unread - can persist read state later
            createdAt: pred.settled_at!,
          } as Notification;
        });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time updates for this user's predictions
  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();
    const channel = supabase.channel(`user-${profile.id}-notifications`);

    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: (payload: { new: { is_settled: boolean; payout_amount: number | null; stake_amount: number } }) => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "predictions",
        filter: `user_id=eq.${profile.id}`,
      },
      (payload) => {
        const newData = payload.new;
        if (newData.is_settled) {
          // Prediction was just settled
          const isWin = newData.payout_amount !== null && newData.payout_amount > newData.stake_amount;
          toast(isWin ? "Prediction Won!" : "Prediction Settled", {
            description: isWin
              ? `You won ${((newData.payout_amount ?? 0) - newData.stake_amount).toFixed(1)}!`
              : "Check your portfolio for details.",
            icon: isWin ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4" />,
          });
          fetchNotifications();
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchNotifications]);

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "prediction_won":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "prediction_lost":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "rep_change":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.marketId ? `/markets/${notification.marketId}` : "#"}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            asChild
            onClick={() => setIsOpen(false)}
          >
            <Link href="/portfolio">View all in Portfolio</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
