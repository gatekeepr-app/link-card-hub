import { createFileRoute } from "@tanstack/react-router";
import { listActiveCards } from "@/lib/cards";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cards = await listActiveCards();
        const configuredSiteUrl = process.env["SITE_URL"];
        const origin = new URL(configuredSiteUrl || request.url).origin;
        const locations = [
          `${origin}/`,
          ...cards.map((card) => `${origin}/${encodeURIComponent(card.slug)}`),
        ];
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...locations.map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`),
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
          },
        });
      },
    },
  },
});
