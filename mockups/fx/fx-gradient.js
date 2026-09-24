// Gradient descent: SGD, Momentum and Adam race down a loss bowl whose minimum is the cursor.
(function () {
  const UNIT = 100; // px per loss-space unit
  const A = 1.0, B = 0.08; // curvature along the bowl's two axes — ill-conditioned on purpose
  const THETA = -0.5; // bowl rotation (radians)
  const COS = Math.cos(THETA), SIN = Math.sin(THETA);
  const TRAIL = 110;
  const RACE_MS = 7000;
  const CONTOUR_LEVELS = [0.03, 0.12, 0.35, 0.8, 1.6, 3];
  const rand = FX.seededRandom(7);

  // Gradient of L(d) = A·u² + B·v², where (u, v) is d rotated into the bowl's axes
  function grad(dx, dy) {
    const u = COS * dx + SIN * dy;
    const v = -SIN * dx + COS * dy;
    const gu = 2 * A * u, gv = 2 * B * v;
    return [COS * gu - SIN * gv, SIN * gu + COS * gv];
  }

  const OPTIMIZERS = [
    {
      name: "sgd",
      color: "muted",
      step(o, g) {
        const lr = 0.12, noise = 0.35; // minibatch noise on the gradient
        o.x -= lr * (g[0] + noise * FX.gaussian(rand));
        o.y -= lr * (g[1] + noise * FX.gaussian(rand));
      },
    },
    {
      name: "momentum",
      color: "fg",
      step(o, g) {
        const lr = 0.03, beta = 0.92;
        o.vx = beta * o.vx - lr * g[0];
        o.vy = beta * o.vy - lr * g[1];
        o.x += o.vx;
        o.y += o.vy;
      },
    },
    {
      name: "adam",
      color: "accent",
      step(o, g) {
        const lr = 0.035, b1 = 0.9, b2 = 0.999, eps = 1e-8;
        o.k += 1;
        o.m[0] = b1 * o.m[0] + (1 - b1) * g[0];
        o.m[1] = b1 * o.m[1] + (1 - b1) * g[1];
        o.v[0] = b2 * o.v[0] + (1 - b2) * g[0] ** 2;
        o.v[1] = b2 * o.v[1] + (1 - b2) * g[1] ** 2;
        for (let i = 0; i < 2; i++) {
          const mHat = o.m[i] / (1 - b1 ** o.k);
          const vHat = o.v[i] / (1 - b2 ** o.k);
          const delta = (lr * mHat) / (Math.sqrt(vHat) + eps);
          if (i === 0) o.x -= delta;
          else o.y -= delta;
        }
      },
    },
  ];

  let runners = [];
  let raceStart = 0;
  let startPoint = null;

  // All optimizers start from the same point so the race is fair
  function newRace(state) {
    const angle = rand() * Math.PI * 2;
    const radius = 2.6 + rand() * 0.8;
    const cx = state.pos.x / UNIT, cy = state.pos.y / UNIT;
    const x = Math.min(Math.max(cx + Math.cos(angle) * radius, 0.3), state.w / UNIT - 0.3);
    const y = Math.min(Math.max(cy + Math.sin(angle) * radius, 0.3), state.h / UNIT - 0.3);
    startPoint = { x, y };
    runners = OPTIMIZERS.map((opt) => ({
      opt, x, y, vx: 0, vy: 0, k: 0, m: [0, 0], v: [0, 0], trail: [],
    }));
    raceStart = state.t;
  }

  function drawContours(state) {
    const { ctx } = state;
    ctx.lineWidth = 1;
    CONTOUR_LEVELS.forEach((c, i) => {
      ctx.strokeStyle = state.rgba("muted", 0.22 - i * 0.025);
      ctx.beginPath();
      ctx.ellipse(state.pos.x, state.pos.y, Math.sqrt(c / A) * UNIT, Math.sqrt(c / B) * UNIT, THETA, 0, Math.PI * 2);
      ctx.stroke();
    });
    // Minimum marker
    ctx.strokeStyle = state.rgba("fg", 0.6);
    ctx.beginPath();
    ctx.moveTo(state.pos.x - 5, state.pos.y);
    ctx.lineTo(state.pos.x + 5, state.pos.y);
    ctx.moveTo(state.pos.x, state.pos.y - 5);
    ctx.lineTo(state.pos.x, state.pos.y + 5);
    ctx.stroke();
  }

  function drawRunner(state, r) {
    const { ctx } = state;
    const color = r.opt.color;
    ctx.lineWidth = 1.4;
    for (let i = 1; i < r.trail.length; i++) {
      ctx.strokeStyle = state.rgba(color, (i / r.trail.length) * 0.85);
      ctx.beginPath();
      ctx.moveTo(r.trail[i - 1][0], r.trail[i - 1][1]);
      ctx.lineTo(r.trail[i][0], r.trail[i][1]);
      ctx.stroke();
    }
    const hx = r.x * UNIT, hy = r.y * UNIT;
    ctx.fillStyle = state.rgba(color, 1);
    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Label fades as the optimizer converges so the minimum doesn't get cluttered
    const dist = Math.hypot(hx - state.pos.x, hy - state.pos.y);
    ctx.font = FX.mono;
    ctx.fillStyle = state.rgba(color, Math.min(1, dist / 60) * 0.9);
    ctx.fillText(r.opt.name, hx + 8, hy - 8);
  }

  FX.start({
    init: newRace,
    resize: newRace,
    frame(state) {
      if (state.t - raceStart > RACE_MS || !runners.length) newRace(state);
      const minX = state.pos.x / UNIT, minY = state.pos.y / UNIT;

      drawContours(state);
      for (const r of runners) {
        r.opt.step(r, grad(r.x - minX, r.y - minY));
        r.trail.push([r.x * UNIT, r.y * UNIT]);
        if (r.trail.length > TRAIL) r.trail.shift();
        drawRunner(state, r);
      }

      // Start marker
      const { ctx } = state;
      ctx.strokeStyle = state.rgba("muted", 0.7);
      ctx.beginPath();
      ctx.arc(startPoint.x * UNIT, startPoint.y * UNIT, 4, 0, Math.PI * 2);
      ctx.stroke();
    },
  });
})();
