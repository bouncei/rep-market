import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, Eye, ArrowRight, Check } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, ScrollReveal } from "@/components/animations";
import { AnimatedGradientHero } from "@/components/ui/animated-gradient-hero";
import { OddsComparisonSlider } from "@/components/ui/odds-comparison-slider";
import { SocialProof } from "@/components/sections/social-proof";

const steps = [
  {
    step: "01",
    icon: Shield,
    title: "Connect & Verify",
    description: "Sign in with your wallet and sync your Ethos credibility score. Your reputation becomes your trading power.",
    features: ["Instant wallet connection", "Ethos credibility sync", "Tier-based stake limits"],
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    icon: TrendingUp,
    title: "Predict & Stake",
    description: "Browse markets and stake your RepScore on outcomes you believe in. Higher credibility = higher weight.",
    features: ["Multi-position trading", "Credibility-weighted odds", "Real-time probability updates"],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    step: "03",
    icon: Zap,
    title: "Auto-Resolution",
    description: "Markets resolve automatically from objective data sources. No human intervention, no disputes.",
    features: ["Oracle-backed resolution", "Multi-source verification", "Cryptographic evidence"],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    step: "04",
    icon: Eye,
    title: "Earn & Grow",
    description: "Win predictions to earn from the losing pool. Your RepScore evolves with your track record.",
    features: ["Proportional payouts", "RepScore evolution", "Leaderboard rankings"],
    gradient: "from-rose-500 to-pink-500",
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

      {/* How It Works - Modern Steps */}
      <section id="how-it-works" className="max-w-7xl mx-auto py-16 sm:py-24 md:py-32 px-4">
        <ScrollReveal className="flex flex-col items-center gap-12 sm:gap-16">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl">
            <ScrollReveal delay={0.1}>
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-chart-1/10 text-chart-1 border border-chart-1/20">
                How It Works
              </span>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Four Steps to{" "}
                <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                  Smarter Predictions
                </span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="text-base sm:text-lg text-muted-foreground">
                RepMarket combines credibility scoring with autonomous resolution
                to create prediction markets you can trust.
              </p>
            </ScrollReveal>
          </div>

          {/* Steps Timeline */}
          <div className="w-full">
            {/* Desktop: Horizontal step indicators */}
            <div className="hidden md:block relative mb-12">
              {/* Connecting line */}
              <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-rose-500 opacity-30" />

              {/* Step numbers */}
              <div className="relative grid grid-cols-4 gap-4">
                {steps.map((step, index) => (
                  <ScrollReveal key={step.step} delay={0.1 + index * 0.1}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-background`}>
                        {step.step}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <ScrollReveal key={step.title} delay={0.2 + index * 0.1} direction="up">
                  <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2">
                    {/* Gradient top border */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Mobile step number */}
                    <div className={`md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-xs`}>
                      {step.step}
                    </div>

                    <CardHeader className="pb-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} p-0.5 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                        <div className="w-full h-full rounded-2xl bg-background/95 flex items-center justify-center">
                          <step.icon className="h-6 w-6 text-foreground" />
                        </div>
                      </div>
                      <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">
                        {step.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {/* Features list */}
                      <ul className="space-y-2.5 pt-2 border-t border-border/50">
                        {step.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Social Proof */}
      {/* <SocialProof /> */}

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
