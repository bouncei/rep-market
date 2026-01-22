import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, Eye, ArrowRight } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, ScrollReveal } from "@/components/animations";
import { AnimatedGradientHero } from "@/components/ui/animated-gradient-hero";
import { OddsComparisonSlider } from "@/components/ui/odds-comparison-slider";
import { SocialProof } from "@/components/sections/social-proof";

const features = [
  {
    icon: Shield,
    title: "Credibility-Weighted",
    description:
      "Predictions are weighted by Ethos credibility scores, surfacing signal from noise.",
    className: "md:col-span-2 md:row-span-2",
    gradient: "from-blue-500/10 to-purple-500/10",
  },
  {
    icon: Zap,
    title: "Autonomous Resolution",
    description:
      "Markets resolve automatically from objective data sources with no human intervention.",
    className: "md:col-span-1",
    gradient: "from-yellow-500/10 to-orange-500/10",
  },
  {
    icon: Eye,
    title: "Transparent Evidence",
    description:
      "Every resolution comes with cryptographic evidence from multiple oracle sources.",
    className: "md:col-span-1",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "RepScore System",
    description:
      "Build your reputation through accurate predictions. Your RepScore evolves with your track record.",
    className: "md:col-span-2",
    gradient: "from-pink-500/10 to-rose-500/10",
  },
];

const stats = [
  { value: "10K+", label: "Predictions Made" },
  { value: "99.9%", label: "Resolution Accuracy" },
  { value: "50+", label: "Active Markets" },
  { value: "4.9", label: "Avg Credibility" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 py-16 sm:py-24 md:py-32 px-4">
        <AnimatedGradientHero />

        <FadeIn className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          {/* Announcement Badge */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                Powered by Ethos Network
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Prediction Markets{" "}
              <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                Weighted by Credibility
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="max-w-[700px] text-base text-muted-foreground sm:text-lg md:text-xl">
              RepMarket uses Ethos credibility scores to weight predictions.
              Markets resolve autonomously from objective data. Build reputation
              through accurate forecasts.
            </p>
          </FadeIn>
        </FadeIn>

        <FadeIn delay={0.6} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto max-w-md sm:max-w-none">
          <Button asChild size="lg" className="w-full sm:w-auto group relative overflow-hidden">
            <Link href="/markets" className="flex items-center gap-2">
              Explore Markets
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
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
        </FadeIn>

        {/* Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-border/40 w-full max-w-3xl">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={0.8 + index * 0.1}>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Probability Toggle Demo */}
      <section className="max-w-7xl mx-auto py-12 md:py-16 border-y px-4">
        <ScrollReveal className="flex flex-col items-center gap-6 sm:gap-8 text-center">
          <ScrollReveal delay={0.1}>
            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2 border border-chart-2/20">
              Interactive Demo
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h2 className="text-2xl sm:text-3xl font-bold">See the Difference</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-sm sm:text-base text-muted-foreground max-w-[600px]">
              Toggle between raw odds and credibility-weighted odds to see how
              expert opinions shift market probabilities.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.4} className="w-full">
            <OddsComparisonSlider />
          </ScrollReveal>
        </ScrollReveal>
      </section>

      {/* Features - Bento Grid */}
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-24 px-4">
        <ScrollReveal className="flex flex-col items-center gap-8 sm:gap-12">
          <div className="text-center space-y-3">
            <ScrollReveal delay={0.1}>
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-chart-1/10 text-chart-1 border border-chart-1/20">
                Features
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="text-sm sm:text-base text-muted-foreground max-w-[600px]">
                RepMarket combines credibility scoring with autonomous resolution
                to create trustworthy prediction markets.
              </p>
            </ScrollReveal>
          </div>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            {features.map((feature, index) => (
              <StaggerItem key={feature.title}>
                <ScrollReveal delay={index * 0.1} direction="up">
                  <Card
                    className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full ${feature.className}`}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    <CardHeader className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* CTA with Glow Effect */}
      <section className="relative max-w-7xl mx-auto py-16 sm:py-24 md:py-32 overflow-hidden px-4">
        {/* Glow Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 text-center">
          <ScrollReveal delay={0.1}>
            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Start Predicting Today
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold max-w-2xl">
              Ready to Build Your{" "}
              <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                Prediction Reputation?
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
              Connect your wallet, sync your Ethos credibility, and start making
              predictions on markets that matter.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button asChild size="lg" className="group relative overflow-hidden">
                <Link href="/markets" className="flex items-center gap-2">
                  View Active Markets
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
