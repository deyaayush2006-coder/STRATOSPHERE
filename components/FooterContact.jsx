"use client";

import { usePathname } from "next/navigation";
import ContactForm from "./ContactForm";

/* The top half of the footer: where the club is, how to email it, and the form
 * that writes to it.
 *
 * It is split out here, and it is a client component, for one reason: it is on
 * every page except the detail pages, and the footer is rendered by the shared
 * layout, which has no idea which route is open. Layouts are not given the
 * pathname in the App Router, so the block has to decide for itself. The
 * backdrop makes the same call the same way, against the same prefixes.
 *
 * A write-up is somebody reading about one build, or one event. Asking them
 * for their name, email and a message at the end of it interrupts that, and
 * the address and email are still in the columns below — nothing here is the
 * only copy. What is left under a write-up is the navigation and the
 * copyright.
 *
 * Splitting it costs nothing in bundle terms: ContactForm is a client
 * component already, and it is the whole weight of this block.
 */
export default function FooterContact({ address = [], email = "" }) {
  const pathname = usePathname();

  const onDetail = pathname.startsWith("/projects/") || pathname.startsWith("/events/");
  if (onDetail) return null;

  return (
    <div className="mb-14 grid md:grid-cols-2 gap-10 md:gap-14 items-start">
      <div>
        <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em]">
          Our Address
        </h3>
        <address className="not-italic font-mono text-sm text-ink/65 leading-relaxed mt-4">
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>

        <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em] mt-10">
          Email us
        </h3>
        <a
          href={`mailto:${email}`}
          className="inline-block font-mono text-sm text-ink/65 hover:text-aurora2 transition-colors mt-4"
        >
          {email}
        </a>
      </div>

      <ContactForm />
    </div>
  );
}
