import AssistantWidget from "../components/AssistantWidget";
import CallToAction from "../components/CallToAction";
import FeatureHighlights from "../components/FeatureHighlights";
import HeroSection from "../components/HeroSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeatureHighlights />
      <CallToAction />
      <AssistantWidget />
    </div>
  );
}
