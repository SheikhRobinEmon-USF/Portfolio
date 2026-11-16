import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/projects";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, priority: 1 },
    ...caseStudies.map((c) => ({ url: `${siteUrl}/work/${c.slug}/`, priority: 0.8 })),
  ];
}
