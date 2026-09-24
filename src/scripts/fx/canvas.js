// Canvas plumbing for the hero effect: sizing, pointer tracking, theme colors.
// An effect calls start({ init, resize, frame }) and draws with the `state` it receives.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const colors = {};
  for (const name of ["bg", "fg", "muted", "border", "accent"]) {
    colors[name] = hexToRgb(style.getPropertyValue("--" + name).trim());
  }
  return colors;
}

// Slow Lissajous drift used when no mouse is over the hero, so the effect stays alive
function idlePoint(t, w, h) {
  return {
    x: w * (0.7 + 0.2 * Math.sin(t * 0.00045)),
    y: h * (0.5 + 0.3 * Math.sin(t * 0.0007 + 1)),
  };
}

export function start(effect) {
  const hero = document.querySelector(".fx-hero");
  const canvas = hero.querySelector(".fx-canvas");
  const ctx = canvas.getContext("2d");
  const state = { ctx, hero, w: 0, h: 0, t: 0, mouse: null, colors: readColors() };
  state.rgba = (name, a) => {
    const [r, g, b] = state.colors[name];
    return `rgba(${r},${g},${b},${a})`;
  };

  let initialized = false;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    state.w = rect.width;
    state.h = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (initialized && effect.resize) effect.resize(state);
  }

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    state.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  hero.addEventListener("pointerleave", () => (state.mouse = null));

  const refreshColors = () => (state.colors = readColors());
  document.addEventListener("themechange", refreshColors);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", refreshColors);

  resize();
  state.pos = idlePoint(0, state.w, state.h);
  if (effect.init) effect.init(state);
  initialized = true;
  new ResizeObserver(resize).observe(canvas);

  function frame(t) {
    state.t = t;
    state.idle = !state.mouse;
    // `target` is the raw point; `pos` eases toward it so mouse enter/leave never jumps
    state.target = state.mouse || idlePoint(t, state.w, state.h);
    state.pos.x += (state.target.x - state.pos.x) * 0.15;
    state.pos.y += (state.target.y - state.pos.y) * 0.15;
    ctx.clearRect(0, 0, state.w, state.h);
    effect.frame(state);
    running = visible && !reduceMotion;
    if (running) requestAnimationFrame(frame);
  }

  // Stop animating while the hero is scrolled out of view
  let visible = true;
  let running = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !running && !reduceMotion) {
      running = true;
      requestAnimationFrame(frame);
    }
  }).observe(canvas);
  requestAnimationFrame(frame);
}

// Deterministic RNG so layouts look the same on every load
export function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand) {
  const u = 1 - rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export const MONO = '11px "JetBrains Mono Variable", ui-monospace, monospace';
