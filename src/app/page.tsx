import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Impact } from "@/components/sections/impact";
import { Shipped } from "@/components/sections/shipped";
import { Skills } from "@/components/sections/skills";
import { Work } from "@/components/sections/work";

export default function Home() {
  return (
    <>
      <Hero />
      <Impact />
      <Work />
      <Shipped />
      <Experience />
      <Skills />
      <About />
      <Contact />
    </>
  );
}
