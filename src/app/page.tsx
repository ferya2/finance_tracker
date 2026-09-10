import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/landing/ambient-background";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <AmbientBackground />
      <main className="relative z-10 flex-1">
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}