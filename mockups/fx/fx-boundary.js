// Decision boundary: an RBF kernel classifier over two classes of points.
// The cursor is an extra, heavily weighted training point; click to flip its label.
(function () {
  const SIGMA = 70; // kernel bandwidth (px)
  const CURSOR_WEIGHT = 4;
  const CELL = 10; // grid resolution for the boundary (px)
  const rand = FX.seededRandom(11);

  // Cluster centers in normalized [0,1] coords; label +1 = filled, −1 = hollow
  const BLOBS = [
    { x: 0.55, y: 0.3, label: 1 }, { x: 0.82, y: 0.7, label: 1 }, { x: 0.2, y: 0.78, label: 1 },
    { x: 0.7, y: 0.5, label: -1 }, { x: 0.92, y: 0.25, label: -1 }, { x: 0.38, y: 0.62, label: -1 },
  ];
  const seeds = BLOBS.flatMap((b) =>
    Array.from({ length: 7 }, () => ({
      nx: b.x + FX.gaussian(rand) * 0.05,
      ny: b.y + FX.gaussian(rand) * 0.09,
      label: b.label,
    }))
  );

  let points = [];
  let cursorLabel = 1;
  let grid = null, cols = 0, rows = 0;
  let lastPos = null;

  function layout(state) {
    points = seeds.map((s) => ({ x: s.nx * state.w, y: s.ny * state.h, label: s.label }));
    cols = Math.ceil(state.w / CELL) + 1;
    rows = Math.ceil(state.h / CELL) + 1;
    grid = new Float32Array(cols * rows);
    lastPos = null;
  }

  // Normalized score in [−1, 1]: (Σ₊K − Σ₋K) / ΣK
  function score(x, y, cursor) {
    let pos = 0, neg = 0;
    const k = (px, py) => Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * SIGMA * SIGMA));
    for (const p of points) {
      if (p.label > 0) pos += k(p.x, p.y);
      else neg += k(p.x, p.y);
    }
    const kc = CURSOR_WEIGHT * k(cursor.x, cursor.y);
    if (cursorLabel > 0) pos += kc;
    else neg += kc;
    return (pos - neg) / (pos + neg + 1e-12);
  }

  function refit(cursor) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) grid[j * cols + i] = score(i * CELL, j * CELL, cursor);
    }
  }

  // Marching squares segment table. Corner bits: tl=8, tr=4, br=2, bl=1.
  // Edges: 0 top, 1 right, 2 bottom, 3 left.
  const SEGMENTS = {
    1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[0, 1], [3, 2]], 6: [[0, 2]], 7: [[3, 0]],
    8: [[3, 0]], 9: [[0, 2]], 10: [[3, 0], [2, 1]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]],
  };

  function edgePoint(edge, x, y, tl, tr, br, bl) {
    const lerp = (a, b) => a / (a - b); // where the zero crossing falls between two corner values
    switch (edge) {
      case 0: return [x + lerp(tl, tr) * CELL, y];
      case 1: return [x + CELL, y + lerp(tr, br) * CELL];
      case 2: return [x + lerp(bl, br) * CELL, y + CELL];
      default: return [x, y + lerp(tl, bl) * CELL];
    }
  }

  // Dot-matrix field: dot size shows confidence, color shows which class wins
  function drawField(state) {
    const { ctx } = state;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = grid[j * cols + i];
        const size = 0.6 + Math.abs(v) * 1.4;
        ctx.fillStyle = v > 0 ? state.rgba("fg", 0.28) : state.rgba("accent", 0.4);
        ctx.fillRect(i * CELL - size / 2, j * CELL - size / 2, size, size);
      }
    }
  }

  function drawBoundary(state) {
    const { ctx } = state;
    ctx.strokeStyle = state.rgba("fg", 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const tl = grid[j * cols + i], tr = grid[j * cols + i + 1];
        const bl = grid[(j + 1) * cols + i], br = grid[(j + 1) * cols + i + 1];
        const index = (tl > 0 ? 8 : 0) | (tr > 0 ? 4 : 0) | (br > 0 ? 2 : 0) | (bl > 0 ? 1 : 0);
        const segs = SEGMENTS[index];
        if (!segs) continue;
        const x = i * CELL, y = j * CELL;
        for (const [e1, e2] of segs) {
          const a = edgePoint(e1, x, y, tl, tr, br, bl);
          const b = edgePoint(e2, x, y, tl, tr, br, bl);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
      }
    }
    ctx.stroke();
  }

  function drawPoint(state, x, y, label, r) {
    const { ctx } = state;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (label > 0) {
      ctx.fillStyle = state.rgba("fg", 0.75);
      ctx.fill();
    } else {
      ctx.strokeStyle = state.rgba("accent", 0.95);
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }

  FX.start({
    init(state) {
      layout(state);
      state.hero.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        cursorLabel = -cursorLabel;
        lastPos = null; // force refit
      });
    },
    resize: layout,
    frame(state) {
      const c = state.pos;
      // Refitting is the expensive part — only redo it when the cursor actually moved
      if (!lastPos || Math.hypot(c.x - lastPos.x, c.y - lastPos.y) > 0.5) {
        refit(c);
        lastPos = { x: c.x, y: c.y };
      }
      drawField(state);
      drawBoundary(state);
      for (const p of points) drawPoint(state, p.x, p.y, p.label, 3);

      drawPoint(state, c.x, c.y, cursorLabel, 6);
      const { ctx } = state;
      ctx.font = FX.mono;
      ctx.fillStyle = state.rgba("fg", 0.85);
      ctx.fillText(state.idle ? "training point" : "you · click to flip label", c.x + 12, c.y + 4);
    },
  });
})();
