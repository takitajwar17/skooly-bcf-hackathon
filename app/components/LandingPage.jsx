import FAQ from "@/app/components/landing/faq";
import Features from "@/app/components/landing/features";
import Footer from "@/app/components/landing/footer";
import Hero from "@/app/components/landing/hero";
import Navbar from "@/app/components/landing/navbar";
import Pricing from "@/app/components/landing/pricing";
import Testimonial from "@/app/components/landing/testimonial";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <Testimonial />
      <Pricing />
      <Footer />
    </>
  );
}
