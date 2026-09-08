import React from "react";
import ContactForm from "./ContactForm";
import { CONTACT, FOOTER_COLS } from "../../data";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="mt-16 mx-4 mb-4 rounded-3xl glass scroll-mt-28 px-6 md:px-10 py-14"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 grid md:grid-cols-2 gap-10 md:gap-14 items-start">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em]">
              Our Address
            </h3>
            <address className="not-italic font-mono text-sm text-ink/65 leading-relaxed mt-4">
              {CONTACT.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>

            <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em] mt-10">
              Email us
            </h3>
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-block font-mono text-sm text-ink/65 hover:text-aurora2 transition-colors mt-4"
            >
              {CONTACT.email}
            </a>
          </div>

          <ContactForm />
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-10 py-10 border-t border-ink/[0.08]">
          <nav className="flex flex-wrap gap-x-2 gap-y-8">
          {FOOTER_COLS.map((c, i) => (
            // the flex gap is shared, so nudge only the third column
            <div key={c.title} className={i === 2 ? "lg:ml-8" : undefined}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
                {c.title}
              </h4>
              <div className="flex flex-col gap-2.5 items-start">
                {c.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="text-sm text-ink/60 hover:text-ink transition-colors w-fit"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          </nav>

          <div className="md:-ml-16">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
              Contact us
            </h4>
            <div className="flex flex-col gap-2.5 font-mono text-[13px] leading-relaxed">
              <p className="text-ink/60">
                {CONTACT.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="text-ink/60">
                Phone:{" "}
                <a
                  href={`tel:${CONTACT.phone.replace(/s/g, "")}`}
                  className="text-ink/80 underline underline-offset-2 hover:text-aurora2 transition-colors"
                >
                  {CONTACT.phone}
                </a>
              </p>
              <p className="text-ink/60 whitespace-nowrap">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-ink/80 underline underline-offset-2 hover:text-aurora2 transition-colors"
                >
                  {CONTACT.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[10px] gap-5 uppercase tracking-[0.22em] text-ink/35 mb-4">
              Office hours
            </h4>
            <dl className="flex flex-col gap-5 text-sm">
              {CONTACT.hours.map(([day, time]) => (
                <div key={day}>
                  <dt className="text-ink/60">{day}</dt>
                  <dd className="text-aurora2 font-mono text-[13px] m-0 mt-0.5">{time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between pt-6 border-t border-ink/10 text-xs text-ink/40">
          <span>Made By Aerospace Club</span>
          <span>© Copyright 2026 STRATOSPHERE</span>
        </div>
      </div>
    </footer>
  );
}
