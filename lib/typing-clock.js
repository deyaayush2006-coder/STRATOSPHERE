export function typeWhenSeen(root) {
  if (!root || root.__typing || typeof root.getAnimations !== "function") return;
  root.__typing = true;

  function tick() {
    if (!root.isConnected) return;

    var anims = [];
    root.querySelectorAll("[data-typed]").forEach(function (el) {
      anims.push.apply(anims, el.getAnimations());
    });
    if (!anims.length) return;

    if (getComputedStyle(root).visibility !== "visible") {
      anims.forEach(function (a) {
        a.pause();
        a.currentTime = 0;
      });
      requestAnimationFrame(tick);
      return;
    }

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
