/* The band at the top of the page.
 *
 * Deliberately empty. The club reel used to play here; it is now the site-wide
 * backdrop in SiteBackground, so there is nothing left to stage. What this
 * still does is give the backdrop a clear run before the first section starts,
 * and carry the #overview anchor the nav and footer both point at. */
export default function Hero() {
  return (
    <header
      id="overview"
      className="relative isolate flex flex-col justify-center min-h-[62vh] md:min-h-[89vh] scroll-mt-28 px-6 md:px-10 pt-28 md:pt-32 pb-10 md:pb-7"
    >
      <div
        className="absolute -z-10 left-0 bottom-0 h-[60%] w-full bg-[radial-gradient(70%_100%_at_30%_100%,rgba(29,96,175,0.28),transparent_70%)]"
        aria-hidden="true"
      />
    </header>
  );
}
