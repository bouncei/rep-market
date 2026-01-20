import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 mt-auto">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base">RepMarket</span>
        </div>
        <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left order-3 md:order-2">
          Credibility-weighted prediction markets powered by{" "}
          <Link
            href="https://ethos.network"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Ethos
          </Link>
        </p>
        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground order-2 md:order-3">
          <Link href="/markets" className="hover:text-foreground hover:underline transition-colors">
            Markets
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground hover:underline transition-colors">
            Leaderboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
