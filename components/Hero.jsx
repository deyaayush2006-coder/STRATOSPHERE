import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";

export default function Hero({ backdrop }) {
  const still = mediaUrl(backdrop);

  return (
    
    <header
      id="overview"
      className="relative isolate grid overflow-hidden scroll-mt-28 mt-[calc(1rem+2px)]
        min-h-[calc(100svh-5.25rem)]"
    >
      {still && (
        <Image
          src={still}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
      )}
      <div
        className="col-start-1 row-start-1 bg-gradient-to-t from-base via-base/55 to-transparent"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 bg-gradient-to-r from-base/85 via-base/25 to-transparent"
        aria-hidden="true"
      />
      <div className="col-start-1 row-start-1 flex flex-col justify-end px-6 pb-14 md:px-10 md:pb-20">
        <div className="hero-title flex flex-col border-l-[4px] border-x-[#0D4C72] dark:border-x-[#309ece] w-[330px] md:w-[500px] text-left pr-2 absolute top-[40vh] left-[5%] font-semibold font-Josefin gap-y-4">
          <div className="pl-[15px] text-4xl md:text-5xl text-black dark:text-white">
            <span className="font-display text-[35px] sm:text-[47px] hover:text-aurora2 font-bold uppercase leading-none tracking-[0.01em] text-ink">
              Strat
              <span className="relative inline-block">
                O
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[0.4em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border border-ink/75">
                </span>
              </span>
              sphere
            </span>
          </div>
          <div className="pl-[15px] text-4xl md:text-5xl text-[#0D4C72] dark:text-[#38BDF8]">
            <span className=" inline-block w-fit max-w-full hidden sm:block min-w-0 leading-[1.15]">
              <span className="hover:text-aurora2 block truncate text-[27px] font-bold uppercase tracking-[0.03em] text-ink">
                Aerospace Club
              </span>
              <span className="block truncate text-[27px] hover:text-aurora2 text-ink/85">
                Jadavpur University
              </span>
            </span>
          </div>
        </div>
      </div>

    </header>
  );
}
