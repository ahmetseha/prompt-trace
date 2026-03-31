import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export default async function RootPage() {
  // When running via CLI (PROMPTTRACE_CLI=1), root shows the dashboard
  if (process.env.PROMPTTRACE_CLI === "1") {
    redirect("/dashboard");
  }

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
