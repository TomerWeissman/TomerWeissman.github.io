// Forecasting: a constant-velocity Kalman filter tracks the cursor and predicts 0.5s ahead.
// Process noise adapts to recent surprise, so the uncertainty cone widens when you change direction.
(function () {
  const HORIZON = 30; // frames ahead (~0.5s at 60fps)
  const R = 9; // measurement noise (px²)
  const Q_BASE = 0.05;
  const Q_GAIN = 0.006; // how strongly recent innovation inflates process noise
  const MAX_SIGMA = 110;
  const HISTORY = 70;

  // One independent filter per axis; state is [position, velocity] with covariance P
  function makeAxis(p) {
    return { p, v: 0, P: [[100, 0], [0, 100]] };
  }

  function predictAxis(a, q) {
    const [[p00, p01], [p10, p11]] = a.P;
    a.p += a.v;
    // P ← F P Fᵀ + Q, with F = [[1,1],[0,1]] and white-noise-acceleration Q (dt = 1)
    a.P = [
      [p00 + p01 + p10 + p11 + q / 4, p01 + p11 + q / 2],
      [p10 + p11 + q / 2, p11 + q],
    ];
  }

  function updateAxis(a, z) {
    const [[p00, p01], [p10, p11]] = a.P;
    const innovation = z - a.p;
    const s = p00 + R;
    const k0 = p00 / s, k1 = p10 / s;
    a.p += k0 * innovation;
    a.v += k1 * innovation;
    a.P = [
      [(1 - k0) * p00, (1 - k0) * p01],
      [p10 - k1 * p00, p11 - k1 * p01],
    ];
    return innovation;
  }

  let ax, ay, surprise = 0;
  let history = [];
  let pastForecasts = []; // forecasts made HORIZON frames ago, to show error

  function reset(state) {
    ax = makeAxis(state.target ? state.target.x : state.pos.x);
    ay = makeAxis(state.target ? state.target.y : state.pos.y);
    history = [];
    pastForecasts = [];
  }

  // Roll copies of the filters forward without touching the real ones
  function forecast(q) {
    const fx = { ...ax, P: ax.P.map((r) => [...r]) };
    const fy = { ...ay, P: ay.P.map((r) => [...r]) };
    const points = [];
    for (let k = 1; k <= HORIZON; k++) {
      predictAxis(fx, q);
      predictAxis(fy, q);
      const sigma = Math.min(Math.sqrt(fx.P[0][0] + fy.P[0][0]), MAX_SIGMA);
      points.push({ x: fx.p, y: fy.p, sigma });
    }
    return points;
  }

  function drawCone(state, points, origin) {
    const { ctx } = state;
    const end = points[points.length - 1];
    const dx = end.x - origin.x, dy = end.y - origin.y;
    const len = Math.hypot(dx, dy);

    ctx.fillStyle = state.rgba("accent", 0.09);
    ctx.strokeStyle = state.rgba("accent", 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (len < 6) {
      // Standing still: the forecast is just a blob of uncertainty
      ctx.arc(end.x, end.y, end.sigma, 0, Math.PI * 2);
    } else {
      const nx = -dy / len, ny = dx / len;
      ctx.moveTo(origin.x, origin.y);
      points.forEach((p) => ctx.lineTo(p.x + nx * p.sigma, p.y + ny * p.sigma));
      // Rounded cap bulging forward, from the +normal side around to the −normal side
      ctx.arc(end.x, end.y, end.sigma, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
      for (let i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(points[i].x - nx * points[i].sigma, points[i].y - ny * points[i].sigma);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  }

  function drawForecastPath(state, points, origin) {
    const { ctx } = state;
    ctx.strokeStyle = state.rgba("accent", 0.9);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);

    const end = points[points.length - 1];
    ctx.fillStyle = state.rgba("accent", 1);
    ctx.beginPath();
    ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = FX.mono;
    ctx.fillText(`t+0.5s  σ=${Math.round(end.sigma)}px`, end.x + 10, end.y - 10);
  }

  function drawHistory(state) {
    const { ctx } = state;
    ctx.lineWidth = 1.4;
    for (let i = 1; i < history.length; i++) {
      ctx.strokeStyle = state.rgba("fg", (i / history.length) * 0.7);
      ctx.beginPath();
      ctx.moveTo(history[i - 1].x, history[i - 1].y);
      ctx.lineTo(history[i].x, history[i].y);
      ctx.stroke();
    }
  }

  // Where the model said we'd be now, vs. where we are: the forecast error
  function drawError(state, now) {
    const past = pastForecasts[0];
    if (pastForecasts.length < HORIZON || !past) return;
    const { ctx } = state;
    ctx.strokeStyle = state.rgba("muted", 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(past.x, past.y, 4, 0, Math.PI * 2);
    ctx.moveTo(past.x, past.y);
    ctx.lineTo(now.x, now.y);
    ctx.stroke();
  }

  FX.start({
    init: reset,
    resize: reset,
    frame(state) {
      const z = state.target;
      const q = Q_BASE + Q_GAIN * surprise;
      predictAxis(ax, q);
      predictAxis(ay, q);
      const ix = updateAxis(ax, z.x);
      const iy = updateAxis(ay, z.y);
      surprise = 0.9 * surprise + 0.1 * (ix * ix + iy * iy);

      history.push({ x: z.x, y: z.y });
      if (history.length > HISTORY) history.shift();

      const points = forecast(q);
      pastForecasts.push(points[points.length - 1]);
      if (pastForecasts.length > HORIZON) pastForecasts.shift();

      const origin = { x: ax.p, y: ay.p };
      drawCone(state, points, origin);
      drawHistory(state);
      drawError(state, z);
      drawForecastPath(state, points, origin);

      const { ctx } = state;
      ctx.fillStyle = state.rgba("fg", 1);
      ctx.beginPath();
      ctx.arc(z.x, z.y, 3, 0, Math.PI * 2);
      ctx.fill();
    },
  });
})();
