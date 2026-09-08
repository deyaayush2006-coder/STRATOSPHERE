import React from "react";
export default function Hero({
  lineA = "Stratosphere",
  lineB = "Aerospace Club",
  lineC = "Jadavpur University",
}) {
  const chars = (text, offset = 0) => {
    const words = text.split(" ");
    let i = offset;

    return words.map((word, w) => {
      const glyphs = word.split("").map((ch, c) => (
        <span
          key={c}
          className="inline-block animate-rise"
          style={{ animationDelay: `${i++ * 22}ms` }}
        >
          {ch}
        </span>
      ));
      i++; 

      return (
        <React.Fragment key={w}>
          <span className="inline-block whitespace-nowrap">{glyphs}</span>
          {w < words.length - 1 ? " " : null}
        </React.Fragment>
      );
    });
  };

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
          src="/vid.mp4"
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
