/* The band at the top of the front page.
 *
 * Deliberately empty. The club reel used to play here; it is now the site-wide
 * backdrop in SiteBackground, so there is nothing left to stage. What this
 * still does is give the backdrop a clear run before the first section starts,
 * and carry the #overview anchor the nav and footer both point at.
 *
 * It is rendered by the home page rather than by the layout, because the reel
 * it is clearing space for only plays there. A project page opens on its
 * breadcrumb instead, with no empty screen in front of it.
 *
 * The mobile height is tied to the reel rather than to the viewport. The reel
 * hangs from top-24 (6rem) at the footage's 53/30 ratio, so it ends 56.6vw
 * below that per unit of width — and it is --reel-scale wide, the same
 * variable read here so that retuning the crop cannot leave a gap or an
 * overlap between the footage and the first section. This band is exactly as
 * tall as the reel, and the first section starts where the footage stops.
 *
 * The 42vh floor keeps the band from collapsing on a phone held sideways,
 * where that height is barely anything. */
export default function Hero() {
  return (
    <header
      id="overview"
      className="relative isolate flex flex-col justify-center scroll-mt-28 px-6 md:px-10 pt-28 md:pt-32 pb-10 md:pb-7
        min-h-[max(42vh,calc(6rem+56.6vw*var(--reel-scale)))] md:min-h-[89vh]"
    >
      <div
        className="absolute -z-10 left-0 bottom-0 h-[60%] w-full bg-[radial-gradient(70%_100%_at_30%_100%,rgba(29,96,175,0.28),transparent_70%)]"
        aria-hidden="true"
      />
    </header>
  );
}
