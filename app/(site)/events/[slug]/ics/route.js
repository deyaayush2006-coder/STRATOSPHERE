import { getContent } from "@/lib/content";
import { eventIcs } from "@/lib/event-dates";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 300;

export async function GET(_request, { params }) {
  const { slug } = await params;
  const { events } = await getContent();
  const event = events.find((e) => e.slug === slug);
  const ics = event && eventIcs(event, SITE_URL);
  if (!ics) return new Response("Not found", { status: 404 });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
