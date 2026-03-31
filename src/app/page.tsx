"use client";

import {
  Navbar,
  Hero,
  TrustStrip,
  ProblemSection,
  SolutionSection,
  FeatureGrid,
  HowItWorks,
  SupportedSources,
  PrivacySection,
  FAQSection,
  CTASection,
  Footer,
} from "@/features/landing/components";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <TrustStrip />
      <ProblemSection />
      <SolutionSection />
      <FeatureGrid />
      <HowItWorks />
      <SupportedSources />
      <PrivacySection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
