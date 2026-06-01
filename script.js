/**
 * Agrinho — script.js
 * Acessibilidade: modo escuro / claro + ajuste de tamanho de fonte
 */

(function () {
  "use strict";

  /* ── Constantes ──────────────────────────────────────── */
  const FONT_SIZES = {
    xsmall: 0.82,
    small:  0.9,
    medium: 1.0,    // padrão
    large:  1.12,
    xlarge: 1.25,
    xxlarge:1.4,
  };
  const FONT_KEYS   = Object.keys(FONT_SIZES);
  const DEFAULT_IDX = FONT_KEYS.indexOf("medium");
  const LS_THEME    = "agrinho_theme";
  const LS_FONT     = "agrinho_font";

  /* ── Estado ───────────────────────────────────────────── */
  let isDark    = false;
  let fontIndex = DEFAULT_IDX;

  /* ── Elementos ────────────────────────────────────────── */
  const body       = document.body;
  const btnDark    = document.getElementById("btn-dark");
  const btnInc     = document.getElementById("btn-font-inc");
  const btnDec     = document.getElementById("btn-font-dec");
  const btnReset   = document.getElementById("btn-font-reset");

  /* ── Tema ─────────────────────────────────────────────── */
  function applyTheme(dark) {
    isDark = dark;
    if (dark) {
      body.classList.add("dark");
      body.classList.remove("light");
    } else {
      body.classList.add("light");
      body.classList.remove("dark");
    }
    if (btnDark) {
      btnDark.setAttribute("aria-pressed", String(dark));
      const label = btnDark.querySelector("span");
      if (label) label.textContent = dark ? "Modo Claro" : "Modo Escuro";
    }
    try { localStorage.setItem(LS_THEME, dark ? "dark" : "light"); } catch (_) {}
  }

  function toggleTheme() {
    applyTheme(!isDark);
  }

  /* ── Fonte ────────────────────────────────────────────── */
  function applyFontSize(idx) {
    fontIndex = Math.max(0, Math.min(FONT_KEYS.length - 1, idx));
    const key   = FONT_KEYS[fontIndex];
    const scale = FONT_SIZES[key];
    document.documentElement.style.setProperty("--font-scale", scale);
    body.dataset.fontSize = key;

    // Atualizar labels ARIA dos botões
    if (btnInc)   btnInc.setAttribute("aria-disabled",   fontIndex >= FONT_KEYS.length - 1 ? "true" : "false");
    if (btnDec)   btnDec.setAttribute("aria-disabled",   fontIndex <= 0 ? "true" : "false");
    if (btnReset) btnReset.setAttribute("aria-label",    `Redefinir fonte (atual: ${key})`);

    try { localStorage.setItem(LS_FONT, String(fontIndex)); } catch (_) {}

    // Announce to screen readers
    announceToSR(`Tamanho da fonte alterado para ${labelPT(key)}`);
  }

  function labelPT(key) {
    const map = { xsmall: "muito pequeno", small: "pequeno", medium: "médio",
                  large: "grande", xlarge: "muito grande", xxlarge: "enorme" };
    return map[key] || key;
  }

  function increaseFontSize()  { applyFontSize(fontIndex + 1); }
  function decreaseFontSize()  { applyFontSize(fontIndex - 1); }
  function resetFontSize()     { applyFontSize(DEFAULT_IDX); }

  /* ── Live region p/ leitores de tela ─────────────────── */
  function announceToSR(msg) {
    let el = document.getElementById("sr-live");
    if (!el) {
      el = document.createElement("div");
      el.id = "sr-live";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      Object.assign(el.style, {
        position: "absolute", width: "1px", height: "1px",
        padding: "0", margin: "-1px", overflow: "hidden",
        clip: "rect(0,0,0,0)", border: "0"
      });
      document.body.appendChild(el);
    }
    el.textContent = "";
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  /* ── Restaurar preferências salvas ───────────────────── */
  function restorePreferences() {
    try {
      const savedTheme = localStorage.getItem(LS_THEME);
      const savedFont  = localStorage.getItem(LS_FONT);

      if (savedTheme) {
        applyTheme(savedTheme === "dark");
      } else {
        // Respeitar preferência do sistema operacional
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark);
      }

      if (savedFont !== null) {
        const idx = parseInt(savedFont, 10);
        if (!isNaN(idx)) applyFontSize(idx);
      }
    } catch (_) {
      applyTheme(false);
      applyFontSize(DEFAULT_IDX);
    }
  }

  /* ── Event listeners ──────────────────────────────────── */
  if (btnDark)  btnDark.addEventListener("click",  toggleTheme);
  if (btnInc)   btnInc.addEventListener("click",   increaseFontSize);
  if (btnDec)   btnDec.addEventListener("click",   decreaseFontSize);
  if (btnReset) btnReset.addEventListener("click", resetFontSize);

  // Atalhos de teclado globais
  document.addEventListener("keydown", function (e) {
    // Ctrl + = ou Ctrl + + → aumentar fonte
    if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      increaseFontSize();
    }
    // Ctrl + - → diminuir fonte
    if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      decreaseFontSize();
    }
    // Ctrl + 0 → resetar fonte
    if (e.ctrlKey && e.key === "0") {
      e.preventDefault();
      resetFontSize();
    }
    // Ctrl + D → alternar tema
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Responder a mudanças na preferência do SO (quando não há preferência salva)
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    try {
      const saved = localStorage.getItem(LS_THEME);
      if (!saved) applyTheme(e.matches);
    } catch (_) {
      applyTheme(e.matches);
    }
  });

  /* ── Inicializar ──────────────────────────────────────── */
  restorePreferences();

  /* ── Scroll suave nas âncoras de footer ──────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

})();