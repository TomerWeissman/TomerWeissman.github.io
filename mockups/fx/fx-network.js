// Neural net: the cursor's (x, y) is the input to a small fixed-weight MLP.
// Edges light up by contribution (weight × activation); the background is the net's own decision map.
(function () {
  const LAYERS = [2, 6, 8, 6, 3];
  const NODE_GAP = 34;
  const MAP_CELL = 16;
  const rand = FX.seededRandom(5);

  // Fixed random weights, scaled so tanh activations stay in an interesting range
  const weights = [];
  const biases = [];
  for (let l = 0; l < LAYERS.length - 1; l++) {
    const scale = 1.8 / Math.sqrt(LAYERS[l]);
    weights.push(Array.from({ length: LAYERS[l + 1] }, () =>
      Array.from({ length: LAYERS[l] }, () => FX.gaussian(rand) * scale)));
    biases.push(Array.from({ length: LAYERS[l + 1] }, () => FX.gaussian(rand) * 0.3));
  }
  // Per-edge phase offsets so signal pulses don't move in lockstep
  const phases = weights.map((layer) => layer.map((row) => row.map(() => rand())));

  function softmax(v) {
    const max = Math.max(...v);
    const e = v.map((x) => Math.exp(x - max));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  }

  // Returns activations for every layer; the last layer is softmax probabilities
  function forward(input) {
    const acts = [input];
    for (let l = 0; l < weights.length; l++) {
      const prev = acts[l];
      const z = weights[l].map((row, j) => row.reduce((sum, w, i) => sum + w * prev[i], biases[l][j]));
      acts.push(l === weights.length - 1 ? softmax(z.map((x) => x * 2)) : z.map(Math.tanh));
    }
    return acts;
  }

  function toInput(state, p) {
    return [((p.x / state.w) * 2 - 1) * 2, ((p.y / state.h) * 2 - 1) * 2];
  }

  let nodes = []; // nodes[layer][i] = {x, y}
  let decisionMap = null;

  function layout(state) {
    const left = state.w * 0.55, right = state.w * 0.9;
    nodes = LAYERS.map((n, l) => {
      const x = left + ((right - left) * l) / (LAYERS.length - 1);
      const top = state.h / 2 - ((n - 1) * NODE_GAP) / 2;
      return Array.from({ length: n }, (_, i) => ({ x, y: top + i * NODE_GAP }));
    });
    // The network's argmax over the whole hero never changes, so compute it once
    decisionMap = [];
    for (let y = 0; y < state.h; y += MAP_CELL) {
      for (let x = 0; x < state.w; x += MAP_CELL) {
        const probs = forward(toInput(state, { x: x + MAP_CELL / 2, y: y + MAP_CELL / 2 })).at(-1);
        decisionMap.push({ x, y, cls: probs.indexOf(Math.max(...probs)) });
      }
    }
  }

  // Dot-matrix texture: each class gets its own dot size
  function drawDecisionMap(state) {
    const { ctx } = state;
    const sizes = [0.8, 1.6, 2.4];
    ctx.fillStyle = state.rgba("muted", 0.35);
    for (const cell of decisionMap) {
      const size = sizes[cell.cls];
      ctx.fillRect(cell.x + MAP_CELL / 2 - size / 2, cell.y + MAP_CELL / 2 - size / 2, size, size);
    }
  }

  function drawEdges(state, acts) {
    const { ctx } = state;
    for (let l = 0; l < weights.length; l++) {
      for (let j = 0; j < LAYERS[l + 1]; j++) {
        for (let i = 0; i < LAYERS[l]; i++) {
          const contribution = Math.min(Math.abs(weights[l][j][i] * acts[l][i]), 1.5);
          const color = weights[l][j][i] * acts[l][i] >= 0 ? "fg" : "accent";
          const a = nodes[l][i], b = nodes[l + 1][j];
          ctx.strokeStyle = state.rgba(color, 0.05 + contribution * 0.4);
          ctx.lineWidth = 0.5 + contribution;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Signal pulse travelling along strong edges
          if (contribution > 0.3) {
            const f = (state.t * 0.0007 + phases[l][j][i]) % 1;
            ctx.fillStyle = state.rgba(color, Math.min(contribution, 1));
            ctx.beginPath();
            ctx.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  function drawNodes(state, acts) {
    const { ctx } = state;
    ctx.font = FX.mono;
    nodes.forEach((layer, l) =>
      layer.forEach((n, i) => {
        const a = acts[l][i];
        const isOutput = l === nodes.length - 1;
        ctx.fillStyle = state.rgba("bg", 1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = state.rgba("fg", isOutput ? a : Math.min(Math.abs(a), 1) * 0.9);
        ctx.fill();
        ctx.strokeStyle = state.rgba("muted", 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();
        if (isOutput) {
          ctx.fillStyle = state.rgba("fg", 0.85);
          ctx.fillText(`p(${i}) ${a.toFixed(2).replace(/^0/, "")}`, n.x + 12, n.y + 4);
        }
      })
    );
  }

  // Dashed wires from the cursor to the two input nodes, labelled with their values
  function drawInputs(state, input) {
    const { ctx } = state;
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = state.rgba("muted", 0.5);
    ctx.lineWidth = 1;
    nodes[0].forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(state.pos.x, state.pos.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.font = FX.mono;
    ctx.fillStyle = state.rgba("fg", 0.85);
    ["x", "y"].forEach((name, i) => {
      const n = nodes[0][i];
      ctx.fillText(`${name} ${input[i] >= 0 ? " " : ""}${input[i].toFixed(2)}`, n.x - 74, n.y - 10);
    });
    ctx.fillStyle = state.rgba("fg", 1);
    ctx.beginPath();
    ctx.arc(state.pos.x, state.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  FX.start({
    init: layout,
    resize: layout,
    frame(state) {
      const input = toInput(state, state.pos);
      const acts = forward(input);
      drawDecisionMap(state);
      drawInputs(state, input);
      drawEdges(state, acts);
      drawNodes(state, acts);
    },
  });
})();
