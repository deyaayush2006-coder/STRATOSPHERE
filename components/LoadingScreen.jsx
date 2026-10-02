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

/* The same curtain whether it is the first paint of the site or raised by a
   click: visible from the frame it is rendered in, and opaque, so nothing
   behind it shows until RouteLoader lifts it. `leaving` fades it out. */
export default function LoadingScreen({ leaving = false, fade = 500 }) {
  return (
    <div
      data-route-loader=""
      role="status"
      aria-live="polite"
      aria-label="Loading Stratosphere"
      className={`fixed inset-0 z-[100] grid place-items-center bg-base transition-opacity ease-out
        ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${fade}ms` }}
    >
      {/* Without JavaScript nothing is ever going to take this down, and a
          visitor with it switched off would get a permanent blue screen over a
          site that renders perfectly well underneath. The curtain is a nicety;
          the page is not. */}
      <noscript>
        <style>{`[data-route-loader]{display:none!important}`}</style>
      </noscript>

      {/* The sky behind the lockup, so the curtain reads as the same place the
          site is set in rather than as a blank sheet pulled over it. Built from
          the backdrop's own tokens, so it follows the theme toggle. Out of the
          flow and first in the tree, so it can neither move the stage nor be
          drawn over it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* A bloom centred on the ring, breathing slowly. */}
        <div
          className="absolute left-1/2 top-1/2 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2
            animate-loader-bloom motion-reduce:animate-none
            bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky-core)_42%,transparent)_0%,color-mix(in_oklab,var(--sky-core)_14%,transparent)_45%,transparent_100%)]"
        />
        {/* A low horizon wash, the way the site backdrop sits over the fold. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(120%_100%_at_50%_100%,var(--sky-horizon),transparent_70%)]" />

        {/* Two layers of stars on tiles of different sizes, so the repeat never
            lines up into a grid. Dark theme only: on the pale sky they read as
            dust on the screen rather than as anything far away. */}
        <div
          className="absolute inset-0 animate-loader-twinkle motion-reduce:animate-none [[data-theme=light]_&]:hidden
            [background-size:260px_260px]
            [background-image:radial-gradient(1px_1px_at_24px_38px,#fff_100%,transparent),radial-gradient(1px_1px_at_142px_96px,#fff_100%,transparent),radial-gradient(1.5px_1.5px_at_208px_22px,#fff_100%,transparent),radial-gradient(1px_1px_at_74px_188px,#fff_100%,transparent),radial-gradient(1px_1px_at_230px_210px,#fff_100%,transparent)]
            [mask-image:radial-gradient(ellipse_at_center,transparent_18%,#000_70%)]"
        />
        <div
          className="absolute inset-0 animate-loader-twinkle [animation-delay:-1.8s] motion-reduce:animate-none
            [[data-theme=light]_&]:hidden [background-size:410px_410px]
            [background-image:radial-gradient(1px_1px_at_60px_300px,#fff_100%,transparent),radial-gradient(1.5px_1.5px_at_320px_140px,#9ad9ff_100%,transparent),radial-gradient(1px_1px_at_190px_40px,#fff_100%,transparent),radial-gradient(1px_1px_at_380px_380px,#fff_100%,transparent)]
            [mask-image:radial-gradient(ellipse_at_center,transparent_18%,#000_70%)]"
        />
      </div>

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
            push the wait off a phone screen.

            On the way out the lockup lifts towards the viewer and softens as
            the curtain fades, so the page underneath reads as arriving through
            it rather than as a sheet being switched off. Done with the `scale`
            property, which Tailwind's scale utility sets, rather than
            `transform`, which the entry animation holds for as long as it is
            applied and would otherwise outrank. */}
        <div
          aria-hidden="true"
          className={`animate-loader-in [--s:1] max-[980px]:[--s:0.76] max-[720px]:[--s:0.56]
            max-[480px]:[--s:0.4] h-[calc(300px*var(--s))] w-[calc(760px*var(--s))]
            transition-[scale,filter] ease-in motion-reduce:transition-none
            ${leaving ? "scale-[1.08] blur-[3px]" : ""}`}
          style={{ transitionDuration: `${fade}ms` }}
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
              >
                {/* The wake. A third of the ring lit behind the rocket and
                    fading back along it, so the path the craft has just flown
                    stays visible for a moment and the motion reads as flight
                    rather than as a marker being moved.

                    It rides this disc, so it turns with the rocket and costs no
                    animation of its own, and it lies in the tilted plane, so
                    the browser draws it behind the name along the far side of
                    the ring and in front of it along the near side, the same as
                    the rocket.

                    A conic gradient cut to a thin band by a radial mask. The
                    conic angle is measured clockwise from twelve, and the
                    rocket is parked at three flying clockwise, so the wake has
                    to end at 90deg and fade in from before it. Starting the
                    sweep at -40deg puts the rocket at 130deg of it; the bright
                    end stops a few degrees short of that, at the tail rather
                    than the nose. Two copies: a crisp line on the ring, and a
                    wider blurred one under it for the glow. */}
                <div
                  className="absolute inset-0 rounded-full blur-[6px]
                    bg-[conic-gradient(from_-40deg,transparent_0deg,rgba(34,211,238,0.35)_123deg,transparent_124deg)]
                    [mask-image:radial-gradient(closest-side,transparent_calc(100%-14px),#000_calc(100%-2px),transparent_calc(100%+8px))]"
                />
                <div
                  className="absolute inset-0 rounded-full
                    bg-[conic-gradient(from_-40deg,transparent_0deg,rgba(34,211,238,0.12)_60deg,rgba(154,217,255,0.9)_123deg,transparent_124deg)]
                    [mask-image:radial-gradient(closest-side,transparent_calc(100%-4.5px),#000_calc(100%-2px),transparent_calc(100%+0.5px))]"
                />

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
                <span className="relative flex items-center font-display text-[54px] font-bold uppercase leading-none tracking-[0.02em] text-ink
                  [text-shadow:0_0_32px_rgba(34,211,238,0.22)]">
                  {WORDMARK.split("").map((letter, i) => (
                    /* One keystroke each. The delay is the only thing that
                       differs between them, so the name types itself left to
                       right without twelve separate animations to keep in
                       step — and the whole speed of it is one number. */
                    <span
                      key={i}
                      data-typed=""
                      className="inline-block animate-letter-in motion-reduce:animate-none"
                      style={{ animationDelay: `${i * LETTER_STAGGER}ms` }}
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
                  style={{ animationDelay: `${SUBTITLE_DELAY}ms` }}
                >
                  Aerospace Club · Jadavpur University
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The wait itself: a status line and three signal lights that blink a
            beat apart, like a link being brought up. It says the same thing a
            sweeping bar would and says it more plainly — a bar looks like
            progress being reported, and nothing in here can honestly report
            any.

            Taken out of the flow and pinned low, so that it reads as a caption
            to the screen rather than as the other half of a pair the stage has
            to share the middle with. */}
        <div
          className="absolute inset-x-0 bottom-[12%] flex animate-loader-in justify-center px-6"
        >
          <div
            className="flex items-center gap-3 rounded-full border border-edge bg-panel/40 px-4 py-2
              font-mono text-[11px] uppercase tracking-[0.3em] text-ink/55 backdrop-blur-sm"
          >
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-loader-signal rounded-full bg-aurora2
                    shadow-[0_0_6px_rgba(34,211,238,0.7)] motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
            Preparing for launch
          </div>
        </div>
      </>
    </div>
  );
}
