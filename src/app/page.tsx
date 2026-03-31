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

export const dynamic = "force-dynamic";

export default async function RootPage() {
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
