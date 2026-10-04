import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  const routes = ["", "/portfolio", "/products"];
  return routes.map((path, i) => ({ url: `${url}${path}`, lastModified: new Date(), changeFrequency: i === 0 ? "weekly" : "monthly", priority: i === 0 ? 1 : 0.8 }));
}
