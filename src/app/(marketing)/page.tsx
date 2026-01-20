import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, Eye } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Credibility-Weighted",
    description:
      "Predictions are weighted by Ethos credibility scores, surfacing signal from noise.",
  },
  {
    icon: Zap,
    title: "Autonomous Resolution",
    description:
      "Markets resolve automatically from objective data sources with no human intervention.",
  },
  {
    icon: Eye,
    title: "Transparent Evidence",
    description:
      "Every resolution comes with cryptographic evidence from multiple oracle sources.",
  },
  {
    icon: TrendingUp,
    title: "RepScore System",
    description:
      "Build your reputation through accurate predictions. Your RepScore evolves with your track record.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 py-16 sm:py-24 md:py-32">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Prediction Markets{" "}
            <span className="text-primary">Weighted by Credibility</span>
          </h1>
          <p className="max-w-[700px] text-base text-muted-foreground sm:text-lg md:text-xl">
            RepMarket uses Ethos credibility scores to weight predictions.
            Markets resolve autonomously from objective data. Build reputation
            through accurate forecasts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto max-w-md sm:max-w-none">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/markets">Explore Markets</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link
              href="https://ethos.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn About Ethos
            </Link>
          </Button>
        </div>
      </section>

      {/* Probability Toggle Demo */}
      <section className="max-w-7xl mx-auto py-12 md:py-16 border-y">
        <div className="flex flex-col items-center gap-6 sm:gap-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">See the Difference</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[600px]">
              Toggle between raw odds and credibility-weighted odds to see how
              expert opinions shift market probabilities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-base sm:text-lg">Raw Odds</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4 sm:py-6">
                <span className="text-4xl sm:text-5xl font-bold text-yellow-500">62%</span>
                <span className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Every prediction counts equally
                </span>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-base sm:text-lg">Weighted Odds</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4 sm:py-6">
                <span className="text-4xl sm:text-5xl font-bold text-green-500">78%</span>
                <span className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Weighted by Ethos credibility
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-24">
        <div className="flex flex-col items-center gap-8 sm:gap-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[600px]">
              RepMarket combines credibility scoring with autonomous resolution
              to create trustworthy prediction markets.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-primary" />
                  <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-24">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to Start Predicting?</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[500px]">
            Connect your wallet, sync your Ethos credibility, and start making
            predictions on markets that matter.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto max-w-xs">
            <Link href="/markets">View Active Markets</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
