// Attention: the cursor is a query; a grid of token dots are keys.
// Head 1 attends locally (softmax over distance). Head 2 attends to tokens offset to the left.
(function () {
  const SPACING = 34;
  const TAU = 42; // softmax temperature, in px
  const TOP_K = 26;
  const LABELED = 5;
  const HEAD2_OFFSET = { x: -150, y: 40 };
  const rand = FX.seededRandom(3);
  let tokens = [];

  function buildGrid(state) {
    tokens = [];
    for (let y = SPACING / 2; y < state.h; y += SPACING) {
      for (let x = SPACING / 2; x < state.w; x += SPACING) {
        // Small jitter so it reads as data, not graph paper
        tokens.push({ x: x + (rand() - 0.5) * 8, y: y + (rand() - 0.5) * 8 });
      }
    }
  }

  // Softmax over negative squared distance to `center`; returns top-k [index, weight] pairs
  function attend(center) {
    const scores = tokens.map((t) => -((t.x - center.x) ** 2 + (t.y - center.y) ** 2) / (2 * TAU * TAU));
    const max = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps
      .map((e, i) => [i, e / sum])
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_K);
  }

  function drawHead(state, query, weights, color, dashed) {
    const { ctx } = state;
    const maxW = weights[0][1];
    ctx.setLineDash(dashed ? [2, 4] : []);
    for (const [i, w] of weights) {
      const rel = w / maxW;
      ctx.strokeStyle = state.rgba(color, rel * 0.65);
      ctx.lineWidth = 0.6 + rel;
      ctx.beginPath();
      ctx.moveTo(query.x, query.y);
      ctx.lineTo(tokens[i].x, tokens[i].y);
      ctx.stroke();
      ctx.fillStyle = state.rgba(color, 0.3 + rel * 0.7);
      ctx.beginPath();
      ctx.arc(tokens[i].x, tokens[i].y, 1.5 + rel * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([]);

    ctx.font = FX.mono;
    ctx.fillStyle = state.rgba(color, 0.85);
    for (const [i, w] of weights.slice(0, LABELED)) {
      ctx.fillText(w.toFixed(2).replace(/^0/, ""), tokens[i].x + 6, tokens[i].y - 6);
    }
  }

  FX.start({
    init: buildGrid,
    resize: buildGrid,
    frame(state) {
      const { ctx } = state;
      const q = state.pos;

      ctx.fillStyle = state.rgba("muted", 0.35);
      for (const t of tokens) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      const head2Center = { x: q.x + HEAD2_OFFSET.x, y: q.y + HEAD2_OFFSET.y };
      drawHead(state, q, attend(head2Center), "muted", true);
      drawHead(state, q, attend(q), "accent", false);

      // Query marker
      ctx.strokeStyle = state.rgba("fg", 0.9);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(q.x - 4, q.y - 4, 8, 8);
      ctx.font = FX.mono;
      ctx.fillStyle = state.rgba("fg", 0.9);
      ctx.fillText("q", q.x + 8, q.y + 14);
    },
  });
})();
