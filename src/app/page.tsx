import type { Metadata } from "next";
import About from "@/components/home/About";
import Circular from "@/components/home/Circular";
import Contact from "@/components/home/Contact";
import Facility from "@/components/home/Facility";
import Hero from "@/components/home/Hero";
import Impact from "@/components/home/Impact";
import News from "@/components/home/News";
import Services from "@/components/home/Services";
import Transform from "@/components/home/Transform";

export const metadata: Metadata = {
  title: { absolute: "Envir | Gjenvinning av jord og gravemasser i Bergen" },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Transform />
      <Facility />
      <Services />
      <Impact />
      <Circular />
      <About />
      <News />
      <Contact />
    </>
  );
}
