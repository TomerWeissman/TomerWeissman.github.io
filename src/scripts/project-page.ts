// Enhancements for project pages: code copy buttons, figure zoom, Mermaid diagrams.

function setupCopyButtons() {
  document.querySelectorAll<HTMLPreElement>(".prose pre.astro-code").forEach((pre) => {
    const button = document.createElement("button");
    button.className = "copy-btn";
    button.type = "button";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? "");
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = "Copy"), 1500);
    });
    pre.appendChild(button);
  });
}

function setupZoom() {
  const dialog = document.querySelector<HTMLDialogElement>("dialog.zoom");
  if (!dialog) return;
  document.querySelectorAll<HTMLElement>("[data-zoom]").forEach((frame) =>
    frame.addEventListener("click", () => {
      const img = frame.querySelector("img");
      if (!img) return;
      dialog.replaceChildren(img.cloneNode());
      dialog.showModal();
    })
  );
  dialog.addEventListener("click", () => dialog.close());
}

function isDark() {
  const chosen = document.documentElement.dataset.theme;
  if (chosen) return chosen === "dark";
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

// Mermaid is large, so it only loads on pages that actually contain a diagram
async function setupMermaid() {
  // Shiki skips mermaid, so these arrive as plain <pre><code class="language-mermaid">
  const blocks = [...document.querySelectorAll("pre > code.language-mermaid")].map((code) => code.parentElement!);
  if (!blocks.length) return;
  const { default: mermaid } = await import("mermaid");

  const diagrams = blocks.map((pre) => {
    const wrap = document.createElement("div");
    wrap.className = "mermaid-wrap";
    pre.replaceWith(wrap);
    return { wrap, source: pre.textContent ?? "" };
  });

  async function render() {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark() ? "dark" : "neutral",
      fontFamily: "Inter Variable, system-ui, sans-serif",
    });
    for (const [i, d] of diagrams.entries()) {
      const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, d.source);
      d.wrap.innerHTML = svg;
    }
  }

  await render();
  document.addEventListener("themechange", render);
}

setupCopyButtons();
setupZoom();
setupMermaid();
