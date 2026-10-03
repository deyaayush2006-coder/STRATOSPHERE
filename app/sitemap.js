import { getContent } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap() {
  const { projects = [], events = [] } = await getContent();

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...projects.flatMap((p) => [
      { url: `${SITE_URL}/projects/${p.slug}`, changeFrequency: "monthly", priority: 0.7 },
      ...(p.parts ?? []).map((part) => ({
        url: `${SITE_URL}/projects/${p.slug}/${part.slug}`,
        changeFrequency: "monthly",
        priority: 0.5,
      })),
    ]),
    ...events.map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    })),
  ];
}
