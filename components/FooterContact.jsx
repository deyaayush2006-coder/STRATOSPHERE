"use client";

import { usePathname } from "next/navigation";
import ContactForm from "./ContactForm";

function useOnDetail() {
  const pathname = usePathname();
  return pathname.startsWith("/projects/") || pathname.startsWith("/events/");
}

export function FooterAddressColumn({ address = [], email = "", always = false }) {
  const onDetail = useOnDetail();
  if (!always && !onDetail) return null;

  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">Contact us</h4>
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed">
        <p className="text-ink/60">
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <a
          href={`mailto:${email}`}
          className="text-ink/80 break-words underline underline-offset-2 hover:text-aurora2 transition-colors"
        >
          {email}
        </a>
      </div>
    </div>
  );
}

export default function FooterContact({ address = [], email = "" }) {
  if (useOnDetail()) return null;

  return (
    <div className="mb-14 grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-14 items-start">
      <h2 className="sr-only">Contact us</h2>

      <div className="min-w-0">
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
          className="inline-block break-all font-mono text-sm text-ink/65 hover:text-aurora2 transition-colors mt-4"
        >
          {email}
        </a>
      </div>

      <div className="min-w-0 border-t border-ink/10 pt-10 md:border-t-0 md:pt-0 md:border-l md:pl-14">
        <ContactForm email={email} />
      </div>
    </div>
  );
}
