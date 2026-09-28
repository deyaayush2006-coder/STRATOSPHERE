import Rocket from "./Rocket";

/* The curtain itself, and nothing else: no timers, no listeners, no idea why
   it is on screen. RouteLoader owns all of that and renders this.
 *
 * It renders with no client JavaScript of its own, which matters: this is in
 * the server-rendered HTML of every public page, so a visitor sees the club
 * wordmark in the first frame rather than after hydration. Everything moving
 * below is CSS, for the same reason.
 *
 * The scene is a real one rather than a picture of one. The ring is a circle
 * lying in a plane tilted away from the viewer, the rocket is pinned to that
 * plane and carried round by it, and the wordmark stands upright in the middle
 * at zero depth. Nothing here is drawn in front of or behind anything else by
 * hand — the browser sorts them, which is why the rocket passes behind the
 * letters along the back of the ring and in front of them along the near edge,
 * and why it is visibly larger when it does.
 */

/* How far the orbit plane is laid down from facing the viewer. It decides the
   shape of the ellipse (the ring's height on screen is its width times the
   cosine of this) and how much depth there is for perspective to work with, so
   it is the one number the whole scene is built around.
 *
 * Not a free knob, though. --animate-orbit-face reads it off the stage to
 * stand the rocket up, which follows any value — but the heading angles in
 * that keyframe are a table computed for this one, because the tangent of an
 * ellipse is not something CSS can be asked for. Change this and those have to
 * be regenerated; the formula is written down beside them. */
const TILT = "68deg";

/* How far the viewer is from the page. Lower is a wider lens: more difference
   between the near and far side of the ring, and past a point the ring stops
   reading as a circle and starts reading as a funnel. */
const PERSPECTIVE = "1200px";

const WORDMARK = "STRATOSPHERE";

/* Between one keystroke and the next, and — now that the letters themselves
   cut in rather than fading — the only thing that sets the speed of the
   typing. Twelve letters, so the name writes itself out in about half a
   second. Below roughly 30ms it stops reading as typing and starts reading as
   the whole word appearing at once, which is the one thing it must not do.
 *
 * Counted from the first frame the curtain is seen in, not from when it was
 * built: every element marked data-typed below is held by lib/typing-clock
 * until then. */
const LETTER_STAGGER = 42;

// After the last keystroke, not with it.
const SUBTITLE_DELAY = WORDMARK.length * LETTER_STAGGER + 80;

/* `reveal` is the difference between the two ways this gets put on screen.
 *
 * "delayed" is the first paint of a real request, where the curtain is in the
 * HTML before anything has had a chance to judge whether it is needed. It
 * hides itself for a grace period and fades in only if the page is still not
 * ready — see --animate-curtain-in in app/globals.css.
 *
 * "now" is a decision already made: RouteLoader has watched a navigation run
 * past the grace period and is showing this deliberately, so it appears in the
 * frame it is rendered in rather than waiting the grace period out twice.
 *
 * `offset` is the same difference, said to everything inside. A CSS animation
 * starts when its element is created, and on a real request that is when the
 * HTML is parsed — which is up to a grace period before the curtain is
 * actually on screen, and on a slow load a great deal longer, because the
 * curtain then sits there hidden while the page keeps arriving. Left alone,
 * the name finished typing itself behind a curtain nobody had seen yet and
 * what turned up was a lockup already assembled. So every delay in here is
 * measured from the moment the curtain becomes visible rather than from the
 * moment it was built, and `offset` is that moment.
 *
 * Leaving overrides both with animate-none. The keyframes hold opacity at 1
 * for as long as they are applied, and an animation outranks a transition — so
 * without dropping it the fade-out would simply not happen. */
export default function LoadingScreen({ reveal = "now", offset = 0, leaving = false, fade = 500 }) {
  return (
    <div
      data-route-loader=""
      role="status"
      aria-live="polite"
      aria-label="Loading Stratosphere"
      className={`fixed inset-0 z-[100] grid place-items-center bg-base transition-opacity ease-out
        ${
          leaving
            ? "animate-none opacity-0"
            : reveal === "delayed"
              ? "animate-curtain-in"
              : "opacity-100"
        }`}
      style={{ transitionDuration: `${fade}ms` }}
    >
      {/* Without JavaScript nothing is ever going to take this down, and a
          visitor with it switched off would get a permanent blue screen over a
          site that renders perfectly well underneath. The curtain is a nicety;
          the page is not. */}
      <noscript>
        <style>{`[data-route-loader]{display:none!important}`}</style>
      </noscript>

      {/* The stage is the only thing in the overlay's flow, so the middle of
          the ring is the middle of the screen. Stacked in a column with the
          wait underneath it, as this used to be, the two of them together were
          what got centred and the orbit rode about forty pixels high — which
          is a long way to be out when the whole point of the ring is that it
          is drawn around the name. */}
      <>
        {/* The stage is laid out once at a fixed design size and then scaled as
            a whole. That is what keeps the ring and the wordmark in register:
            the orbit is a circle of a stated radius in stage coordinates, and
            if the type inside it reflowed at a breakpoint the rocket would
            start cutting through the letters. Scaling moves every part of it
            by the same factor and nothing drifts.

            The outer box carries the scaled size so the row below it sits
            where it should — a transform does not change layout, and without
            this the stage would reserve its full 760×300 at every width and
            push the wait off a phone screen. */}
        <div
          aria-hidden="true"
          className="animate-loader-in [--s:1] max-[980px]:[--s:0.76] max-[720px]:[--s:0.56]
            max-[480px]:[--s:0.4] h-[calc(300px*var(--s))] w-[calc(760px*var(--s))]"
          style={{ animationDelay: `${offset}ms` }}
        >
          <div
            className="relative h-[300px] w-[760px] origin-top-left [transform:scale(var(--s))]
              [transform-style:preserve-3d]"
            style={{ "--tilt": TILT, perspective: PERSPECTIVE }}
          >
            {/* The disc: a 640px circle laid down by --tilt. Everything pinned
                to it inherits the tilt, which is the whole trick — the ellipse,
                the rocket's path and the rocket's depth all come from this one
                rotation rather than being three separate approximations that
                have to be kept agreeing with each other. */}
            <div
              className="absolute left-1/2 top-1/2 h-[640px] w-[640px] [transform-style:preserve-3d]
                [transform:translate(-50%,-50%)_rotateX(var(--tilt))]"
            >
              {/* The ring drawn, so the orbit reads as an orbit even in the
                  moment before the rocket reaches that part of it. A plain
                  circle: it is the tilt that makes it an ellipse, and
                  perspective that makes the near edge of it wider.
               *
               * Dotted the way the route in components/Members is dotted, and
               * by the same means — the stroke width, the round cap, the 1-and-8
               * dash and the weight of the ink are that path's, so the two read
               * as the same line. A CSS dashed border cannot do this: the
               * browser picks the dash length itself, stretches it to fit and
               * gives it square ends, so it comes out as a ring of tally marks
               * rather than a run of dots.
               *
               * The radius is not a round number because the dashes have to
               * close. A circumference that is not a whole number of 9-unit
               * periods leaves a short gap where the pattern wraps, which on a
               * ring is a seam sitting in one place; 317.99 is the radius that
               * puts 222 of them round it exactly. */}
              <svg
                viewBox="0 0 640 640"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full text-ink/15"
              >
                <circle
                  cx="320"
                  cy="320"
                  r="317.99"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="1 8"
                />
              </svg>

              {/* Turning this turns the rim, and anything standing on it.
               *
               * Held at its first frame until the curtain is on screen, so the
               * rocket leaves three o'clock in the same instant the first
               * letter is struck rather than having quietly flown part of a
               * lap behind a curtain nobody had seen yet. `backwards` on the
               * keyframes is what makes the delay a pose rather than a gap.
               *
               * This delay and the one on the rocket below have to be the same
               * number. One turns the disc and the other turns the rocket back
               * against it, and they only cancel while they agree — start them
               * apart and the rocket spins on the spot the whole way round. */}
              <div
                className="absolute inset-0 animate-orbit-spin [transform-style:preserve-3d] motion-reduce:animate-none"
                style={{ animationDelay: `${offset}ms` }}
              >
                {/* Parked on the rim at three o'clock. The disc's rotation is
                    what moves it from here; it never moves itself. */}
                <div className="absolute left-full top-1/2 [transform:translate(-50%,-50%)] [transform-style:preserve-3d]">
                  {/* The billboard, and nothing else — it owns the
                      counter-rotation, so the bob below it has an element of
                      its own to animate. Both want `transform`, and one
                      element can only run one animation on it.

                      The rest pose only shows when that animation is not
                      running: a reduced-motion visitor gets a parked rocket
                      rather than none, and this is what stands it up. Without
                      it, dropping the animation drops the counter-rotation
                      with it and the rocket lies down flat in the tilted disc.
                      An animation outranks a declaration while it is running,
                      so this costs nothing when it is. */}
                  <span
                    className="block animate-orbit-face [transform:rotateX(calc(var(--tilt)*-1))]
                      motion-reduce:animate-none"
                    style={{ animationDelay: `${offset}ms` }}
                  >
                    {/* Dressed as the aircraft in components/Members: the same
                        cyan, the same halo behind it, the same bob and the
                        same glow. That one is the club's craft as the site
                        draws it — flying the committee route — and there is no
                        reason for the one on the loading screen to be a
                        different aeroplane. */}
                    <span className="relative block h-[68px] w-[68px] text-aurora2">
                      {/* The bloom. A radial gradient rather than a tinted
                          disc behind a blur: a disc has one brightness right
                          out to its edge and the blur only softens the cut, so
                          it reads as a sticker of a glow. Light does not do
                          that — it is brightest at the source and falls away,
                          which is what the three stops are. The blur on top is
                          only there to take the banding off them. */}
                      <span
                        className="absolute -inset-6 rounded-full blur-lg
                          bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(34,211,238,0.09)_42%,transparent_72%)]"
                      />
                      {/* Two shadows rather than one, for the same reason. A
                          single wide one at full strength puts an even cyan
                          rim the whole way round the craft; a tight bright one
                          inside a wide faint one is a core and a halo, which is
                          how a lit object actually sits in the dark. Both are
                          well under the old 0.7 — at that strength the rocket
                          was a lamp rather than a thing being lit. */}
                      <Rocket
                        size={68}
                        className="relative block h-full w-full animate-craft-bob motion-reduce:animate-none
                          [filter:drop-shadow(0_0_4px_rgba(34,211,238,0.45))_drop-shadow(0_0_15px_rgba(34,211,238,0.18))]"
                      />
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* The wordmark, upright in the middle of the ring at zero depth,
                which is what the rocket's own depth is measured against. */}
            <div className="absolute inset-0 grid place-items-center">
              {/* Only the name is centred. Everything else that belongs to the
                  lockup hangs off it without being allowed to move it: laid
                  out in a column, the line underneath would make the pair of
                  them the thing being centred and push the name a good dozen
                  pixels above the middle of the ring, which is not where the
                  rocket is going round. */}
              <div className="relative">
                <span className="relative flex items-center font-display text-[54px] font-bold uppercase leading-none tracking-[0.02em] text-ink">
                  {WORDMARK.split("").map((letter, i) => (
                    /* One keystroke each. The delay is the only thing that
                       differs between them, so the name types itself left to
                       right without twelve separate animations to keep in
                       step — and the whole speed of it is one number. */
                    <span
                      key={i}
                      data-typed=""
                      className="inline-block animate-letter-in motion-reduce:animate-none"
                      style={{ animationDelay: `${offset + i * LETTER_STAGGER}ms` }}
                    >
                      {letter === "O" ? (
                        /* The orbit ring around the O, the same mark the nav
                           card carries. Retuned for this size rather than
                           copied: the nav draws it at 17px, where 1.45em of
                           width is a hair past the letter, and at 54px that
                           ratio reached from the A to the P and read as a
                           swoosh through the word instead of a ring around one
                           letter. Narrower, and a heavier stroke so it does not
                           thin out as the type grows. */
                        <span className="relative inline-block">
                          O
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 h-[0.46em] w-[1.24em]
                              -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border-[3px] border-ink/75"
                          />
                        </span>
                      ) : (
                        letter
                      )}
                    </span>
                  ))}

                  {/* The cursor the name is being typed into. It sits at the
                      end of the word rather than following the keystrokes: the
                      letters hold their own width from the first frame, which
                      is what stops the whole lockup shuffling sideways twelve
                      times, and the cost of that is that there is no gap for a
                      caret to travel through. At this speed it reads as the
                      line being typed either way.

                      Absolute, so it hangs off the end of the name without
                      being part of it. In the flow it was half its own width
                      of everyone else's centring, and the name sat left of the
                      middle of the ring by that much. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-full top-1/2 ml-[0.12em] h-[0.78em] w-[0.06em] -translate-y-1/2
                      animate-caret bg-aurora2 motion-reduce:hidden"
                  />
                </span>

                {/* Who it is. It arrives once the name has finished writing
                    itself, rather than competing with it — and it is hung
                    under the name rather than stacked with it, so that it
                    cannot shift what the ring is drawn around.

                    Paced with the letters, because it is timed off them: on
                    the wall clock it would turn up under a name the frame
                    clock has only half typed. */}
                <span
                  data-typed=""
                  className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap
                    animate-loader-in font-mono text-[13px] uppercase tracking-[0.3em] text-ink/45
                    motion-reduce:animate-none"
                  style={{ animationDelay: `${offset + SUBTITLE_DELAY}ms` }}
                >
                  Aerospace Club · Jadavpur University
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The wait itself: a label that breathes and three dots that bounce a
            beat apart. It says the same thing a sweeping bar would and says it
            more plainly — a bar looks like progress being reported, and nothing
            in here can honestly report any.

            Taken out of the flow and pinned low, so that it reads as a caption
            to the screen rather than as the other half of a pair the stage has
            to share the middle with. */}
        <div
          className="absolute inset-x-0 bottom-[14%] flex animate-loader-in flex-col items-center gap-4 px-6"
          style={{ animationDelay: `${offset}ms` }}
        >
          <p className="animate-pulse font-mono text-sm font-medium text-ink/45 motion-reduce:animate-none">
            Loading...
          </p>

          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aurora2 [animation-delay:0ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aurora2 [animation-delay:150ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-aurora2 [animation-delay:300ms] motion-reduce:animate-none" />
          </div>
        </div>
      </>
    </div>
  );
}
