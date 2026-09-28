/* When the loading screen's typing starts: the moment the curtain is seen,
   rather than the moment it was built.
 *
 * The name on the curtain is typed by CSS: one animation per letter, each
 * delayed a stagger further than the last. CSS counts those delays in wall
 * time from the moment the element is styled, and does not care whether any of
 * that time was ever painted — and it mostly is not. The curtain is up exactly
 * when the browser is busiest: evaluating the page's scripts on a first load,
 * rendering the next page on a click. The main thread can go the better part
 * of a second without producing a frame, the typing is only half a second
 * long, and so it ran out behind a frozen screen. The first frame anyone saw
 * had the whole word in it already.
 *
 * So this holds those animations paused until the first frame in which the
 * curtain is actually visible, and then lets them go from the first keystroke.
 *
 * And lets them go is the important half. Moving them on from here, a frame at
 * a time, was tried and is worse: this runs on the main thread, and a project
 * page's model viewer can keep that thread busy for seconds after the curtain
 * is up. The rocket and the fades went on moving through it — they run on the
 * compositor — and the name sat there blank. Played rather than stepped, the
 * letters are compositor animations like the rest, so once started they keep
 * typing through a stall along with everything else. And play() leaves the
 * start time pending until the compositor really starts them, so the first
 * keystroke is dated from a frame that was drawn.
 *
 * Only what carries data-typed is held. The rocket and the fades are motion
 * rather than something being spelled out, and have no reason to wait.
 *
 * It has to be self-contained. The curtain the server renders needs this
 * before React has loaded, so app/(site)/layout inlines it into the page as
 * source text — and source text cannot reach anything outside its own body.
 */
export function typeWhenSeen(root) {
  // Once per curtain, whichever of the two callers gets there first.
  if (!root || root.__typing || typeof root.getAnimations !== "function") return;
  root.__typing = true;

  function tick() {
    if (!root.isConnected) return;

    var anims = [];
    root.querySelectorAll("[data-typed]").forEach(function (el) {
      anims.push.apply(anims, el.getAnimations());
    });
    // Reduced motion, or no stylesheet yet: nothing is animating to hold.
    if (!anims.length) return;

    /* Not on screen yet — the served curtain spends its grace period hidden.
       Hold every letter before its first keystroke and look again next frame. */
    if (getComputedStyle(root).visibility !== "visible") {
      anims.forEach(function (a) {
        a.pause();
        a.currentTime = 0;
      });
      requestAnimationFrame(tick);
      return;
    }

    /* Seen. Every letter is put at the first one's delay, which is the first
       keystroke; the stagger between them is still each one's own delay. */
    var first = Math.min.apply(
      null,
      anims.map(function (a) {
        return a.effect.getTiming().delay;
      })
    );
    anims.forEach(function (a) {
      a.currentTime = first;
      a.play();
    });
  }

  tick();
}
