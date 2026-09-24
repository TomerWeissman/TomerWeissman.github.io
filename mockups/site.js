// Theme toggle: explicit choice is stored; otherwise follow the OS setting
const THEME_KEY = "theme";

function currentTheme() {
  const stored = document.documentElement.dataset.theme;
  if (stored) return stored;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setupThemeToggle() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  const render = () => (btn.textContent = currentTheme() === "dark" ? "☀" : "☾");
  render();
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    render();
    document.dispatchEvent(new CustomEvent("themechange"));
  });
}

function setupTagFilter() {
  const buttons = document.querySelectorAll(".filter");
  const rows = document.querySelectorAll(".project-row");
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      const tag = btn.dataset.tag;
      rows.forEach((row) => {
        row.hidden = tag !== "all" && !row.dataset.tags.split(",").includes(tag);
      });
    })
  );
}

function setupCopyButtons() {
  document.querySelectorAll("pre.code").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(pre.querySelector("code").innerText);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
    pre.appendChild(btn);
  });
}

function setupZoom() {
  const dialog = document.querySelector("dialog.zoom");
  if (!dialog) return;
  document.querySelectorAll("figure .frame").forEach((frame) =>
    frame.addEventListener("click", () => {
      dialog.innerHTML = frame.innerHTML;
      dialog.showModal();
    })
  );
  dialog.addEventListener("click", () => dialog.close());
}

setupThemeToggle();
setupTagFilter();
setupCopyButtons();
setupZoom();
