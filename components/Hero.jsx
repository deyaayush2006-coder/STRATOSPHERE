import { mediaUrl } from "@/lib/media-url";

/* Full-bleed video with the title burnt into the footage itself — there is no
   text layer here on purpose, which is why the section is empty below the
   video and the gradient. */
export default function Hero({ heroVideo }) {
  const src = mediaUrl(heroVideo) || "/vid.mp4";

  return (
    <header
      id="overview"
      className="relative isolate flex flex-col justify-center min-h-[62vh] md:min-h-[89vh] scroll-mt-28 overflow-hidden px-6 md:px-10 pt-28 md:pt-32 pb-10 md:pb-7"
    >
      <div
        className="absolute inset-x-0 top-24 bottom-0 md:top-6 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/45 to-base/90" />
      </div>
      <div
        className="absolute -z-10 left-0 bottom-0 h-[60%] w-full bg-[radial-gradient(70%_100%_at_30%_100%,rgba(29,96,175,0.28),transparent_70%)]"
        aria-hidden="true"
      />
    </header>
  );
}
