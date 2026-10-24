// Replays a recorded run of @ghostpaw/grimoire 0.3.0 (2026-10-24, fixed clock). Without this script every step and result stays visible.
const STATES = [{"rows": [{"k": "Spell", "v": "not inscribed"}, {"k": "Rank", "v": "—"}, {"k": "Commits", "v": "0"}, {"k": "Notes", "v": "0"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "—"}], "foot": "An empty grimoire after init(root, db)."}, {"rows": [{"k": "Spell", "v": "not inscribed · refused", "t": "alarm"}, {"k": "Rank", "v": "—"}, {"k": "Commits", "v": "0"}, {"k": "Notes", "v": "0"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "—"}], "foot": "Nothing was written."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service", "t": "cyan"}, {"k": "Rank", "v": "1 · Apprentice"}, {"k": "Commits", "v": "1"}, {"k": "Notes", "v": "0"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "Run `npm run build`"}], "foot": "The inscribe commit counts as the first seal."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service"}, {"k": "Rank", "v": "1 · Apprentice"}, {"k": "Commits", "v": "1"}, {"k": "Notes", "v": "1 · practice", "t": "violet"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "Run `npm run build`"}], "foot": "read.pendingNotes waits for distillation."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service"}, {"k": "Rank", "v": "1 · Apprentice"}, {"k": "Commits", "v": "1"}, {"k": "Notes", "v": "1 · practice", "t": "violet"}, {"k": "Uncommitted", "v": "1 · SKILL.md modified", "t": "violet"}, {"k": "Step 1", "v": "Export `DOCKER_REGISTRY`", "t": "violet"}], "foot": "The edit is on disk, not in history."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service"}, {"k": "Rank", "v": "2 · Apprentice", "t": "cyan"}, {"k": "Commits", "v": "2 · 26141d8"}, {"k": "Notes", "v": "1 · practice", "t": "violet"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "Export `DOCKER_REGISTRY`", "t": "cyan"}], "foot": "Sealed. Rank follows the commit count."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service"}, {"k": "Rank", "v": "2 · Apprentice", "t": "cyan"}, {"k": "Commits", "v": "2 · 26141d8"}, {"k": "Notes", "v": "0 · distilled", "t": "ward"}, {"k": "Uncommitted", "v": "0"}, {"k": "Step 1", "v": "Export `DOCKER_REGISTRY`", "t": "cyan"}], "foot": "The note is marked as absorbed by this spell."}, {"rows": [{"k": "Spell", "v": "engineering/deploy-service"}, {"k": "Rank", "v": "2 · Apprentice"}, {"k": "Commits", "v": "2"}, {"k": "Notes", "v": "0"}, {"k": "Uncommitted", "v": "1 · restored c40ce35", "t": "violet"}, {"k": "Step 1", "v": "Run `npm run build`", "t": "violet"}], "foot": "Rollback is an edit too. Seal it to keep it."}];
(() => {
  const list = document.getElementById("state-list");
  const foot = document.getElementById("state-foot");
  const steps = Array.from(document.querySelectorAll(".step"));
  const reset = document.getElementById("reset");
  const status = document.getElementById("run-status");
  if (!list || !steps.length) return;
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let at = 0;

  function paint(i) {
    const s = STATES[i];
    list.textContent = "";
    for (const r of s.rows) {
      const li = document.createElement("li");
      if (r.t) li.className = "t-" + r.t;
      const k = document.createElement("span"); k.className = "k"; k.textContent = r.k;
      const v = document.createElement("span"); v.className = "v"; v.textContent = r.v;
      li.append(k, v);
      if (r.w != null) {
        const bar = document.createElement("span"); bar.className = "bar";
        const fill = document.createElement("i");
        bar.append(fill); li.append(bar);
        const w = Math.max(0, Math.min(1, r.w)) * 100 + "%";
        const from = list.dataset.prev && JSON.parse(list.dataset.prev)[r.k];
        fill.style.width = motion && from != null ? from : w;
        if (motion && from != null) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = w; }));
      }
      list.append(li);
    }
    const prev = {};
    for (const r of s.rows) if (r.w != null) prev[r.k] = Math.max(0, Math.min(1, r.w)) * 100 + "%";
    list.dataset.prev = JSON.stringify(prev);
    if (foot) foot.textContent = s.foot || "";
  }

  function mark() {
    steps.forEach((el, i) => {
      el.classList.toggle("done", i < at);
      el.classList.toggle("next", i === at);
    });
    if (status) status.textContent = at < steps.length ? "Step " + (at + 1) + " of " + steps.length + " is next." : "All " + steps.length + " steps replayed.";
  }

  steps.forEach((el, i) => {
    const btn = el.querySelector(".run-btn");
    btn.addEventListener("click", () => {
      if (i !== at) return;
      at = i + 1;
      paint(at);
      mark();
      if (el.classList.contains("refused") && motion) {
        el.classList.add("flash");
        el.addEventListener("animationend", () => el.classList.remove("flash"), { once: true });
      }
      const next = steps[at] && steps[at].querySelector(".run-btn");
      const res = el.querySelector(".result");
      if (res) { res.setAttribute("tabindex", "-1"); res.focus({ preventScroll: true }); }
      if (next) next.setAttribute("aria-describedby", "run-status");
    });
  });
  if (reset) reset.addEventListener("click", () => { at = 0; list.dataset.prev = ""; paint(0); mark(); steps[0].querySelector(".run-btn").focus(); });
  paint(0);
  mark();

  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const input = document.getElementById(b.dataset.copy);
      try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand("copy"); }
      const label = b.textContent;
      b.textContent = "Copied";
      setTimeout(() => { b.textContent = label; }, 1400);
    });
  });
})();
