import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section data-scene="4" className="container-x flex min-h-[100svh] flex-col items-start justify-center">
      <p className="label-mono text-accent">404</p>
      <h1 className="font-display mt-6 text-[clamp(3rem,10vw,9rem)]">
        Off the <span className="serif-accent text-gradient">roadmap.</span>
      </h1>
      <p className="mt-6 max-w-md text-lg text-soft">That page does not exist. The work does, though.</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-10")}>
        Back to the portfolio
      </Link>
    </section>
  );
}
