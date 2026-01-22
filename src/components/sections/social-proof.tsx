"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations";

const testimonials = [
  {
    quote: "RepMarket finally solves the signal vs noise problem in prediction markets. Credibility weighting is a game-changer.",
    name: "Alex Chen",
    role: "DeFi Analyst",
    avatar: "/avatars/alex.jpg",
    rating: 5,
  },
  {
    quote: "Autonomous resolution with cryptographic evidence gives me confidence that markets are resolved fairly.",
    name: "Sarah Kim",
    role: "Crypto Researcher",
    avatar: "/avatars/sarah.jpg",
    rating: 5,
  },
  {
    quote: "My Ethos credibility score finally means something beyond social proof. Real skin in the game.",
    name: "Marcus Johnson",
    role: "Market Maker",
    avatar: "/avatars/marcus.jpg",
    rating: 5,
  },
];

export function SocialProof() {
  return (
    <section className="py-16 md:py-24 border-y bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <ScrollReveal className="text-center mb-12">
          <ScrollReveal delay={0.1}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Trusted by Top Predictors</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Join thousands of users building their reputation through accurate forecasts
            </p>
          </ScrollReveal>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <ScrollReveal delay={0.1 * index} direction="up">
                <Card className="bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-sm mb-6 flex-grow">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3 mt-auto">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
