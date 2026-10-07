import FooterContact, { FooterAddressColumn } from "./FooterContact";
import SocialIcon, { socialLabel } from "./SocialIcon";
import Magnet from "./Magnet";

export default function Footer({ contact = {}, footerCols = [], compact = false }) {
  const { address = [], email = "", socials = [] } = contact;

  const accounts = socials.filter((s) => s?.url);

  const columns = footerCols.length ? footerCols : [{ title: "Useful Links", links: [] }];

  return (
    <footer
      id="contact"
      className="mt-16 mx-auto mb-4 rounded-3xl glass scroll-mt-28 px-6 md:px-10 py-14"
    >
      <div className="max-w-6xl mx-auto">
        {!compact && <FooterContact address={address} email={email} />}

        <div className="grid sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr gap-x-10 gap-y-10 py-10 border-t border-ink/[0.08] first:border-t-0 first:pt-0">
          <nav className="flex flex-wrap gap-x-10 gap-y-8">
          {columns.map((c, i) => (
            <div key={c.title} className={i === 2 ? "lg:ml-8" : undefined}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
                {c.title}
              </h4>
              <div className="flex flex-col gap-2.5 items-start">
                {(c.links ?? []).map((l) => (
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

          <FooterAddressColumn address={address} email={email} always={compact} />

          {accounts.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
                Follow us
              </h4>
              <ul className="flex flex-wrap items-center gap-3">
                {accounts.map((s) => {
                  const name = s.label || socialLabel(s.platform);
                  return (
                    <li key={s.url}>
                      <Magnet padding={18}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={name}
                          title={name}
                          className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink/70 transition
                            hover:border-aurora2/50 hover:text-aurora2 focus-visible:outline focus-visible:outline-2
                            focus-visible:outline-offset-2 focus-visible:outline-aurora2"
                        >
                          <SocialIcon platform={s.platform} className="h-[18px] w-[18px]" />
                        </a>
                      </Magnet>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between pt-6 border-t border-ink/10 text-xs text-ink/40">
          <span>
            Made by Aerospace Club · Website by{" "}
            <a
              href="https://github.com/deyaayush2006-coder"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              Aayush Dey
            </a>
          </span>
          <span>© {new Date().getFullYear()} Stratosphere</span>
        </div>
      </div>
    </footer>
  );
}
