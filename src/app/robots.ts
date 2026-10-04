import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }], sitemap: `${url}/sitemap.xml`, host: url };
}
