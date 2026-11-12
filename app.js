(function () {
  const P = window.PROFILE;
  const PROJECTS = window.PROJECTS;
  const STATUS = { live: "Live", "in-progress": "In progress", planned: "Planned" };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c) n.append(c);
    return n;
  };
  const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

  // ---------- Profile ----------
  const first = P.name.split(" ")[0];
  document.getElementById("brand").textContent = P.name;
  document.getElementById("footer-brand").textContent = P.name;
  document.getElementById("hero-h").textContent = `${P.name}, applied AI engineer`;
  document.getElementById("hero-tagline").textContent = P.tagline;
  document.getElementById("footer-name").textContent = P.name;
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footer-github").href = P.github;
  document.getElementById("footer-linkedin").href = P.linkedin;
  document.getElementById("footer-repo").href = P.repo;
  for (const a of document.querySelectorAll("[data-email]")) {
    a.href = `mailto:${P.email}`;
    a.textContent = `Email ${first}`;
  }

  // The pill names the first project that has a recorded run, with its hard fact.
  const lead = PROJECTS.find((p) => p.replay && p.replay.events.some((e) => e.image)) || PROJECTS[0];
  const pill = document.getElementById("hero-pill");
  pill.href = `#${lead.id}`;
  pill.append(el("b", { text: `${lead.number} · ${STATUS[lead.status]}` }), el("span", { text: lead.title }));

  // ---------- Hero window: the lead project's recorded run, at rest on its finished state ----------
  document.getElementById("hero-window").append(renderRunWindow(lead));

  function renderRunWindow(p) {
    const ev = p.replay.events;
    const q = ev.find((e) => e.who === "user");
    const a = ev.find((e) => e.who === "assistant");
    const steps = ev.filter((e) => !["user", "assistant", "source"].includes(e.who));
    const sources = ev.filter((e) => e.who === "source" && e.image);

    const list = el("ol", { class: "trace" }, [
      ...steps.map((e) => el("li", {}, [
        el("span", { class: "who", text: e.who }),
        el("span", {}, [e.text, el("span", { class: "when", text: `+${seconds(e.t)}` })]),
      ])),
      a && el("li", { class: "is-on" }, [
        el("span", { class: "who", text: "answer" }),
        el("span", {}, ["Grounded answer with page citations", el("span", { class: "when", text: `+${seconds(a.t)}` })]),
      ]),
    ]);

    const answer = a ? a.text.replace(/\s*(\[\d+\])+\s*\.?$/, "") : "";
    const cites = a ? (a.text.match(/\[\d+\]/g) || []) : [];
    const open = el("div", { class: "win__pane win__pane--open" }, [
      q && el("p", { class: "msg msg--user", text: q.text }),
      a && el("p", { class: "msg msg--bot" }, [answer + " ", el("span", { class: "cites" }, cites.map((c) => el("sup", { text: c })))]),
      sources.length && el("div", { class: "run-sources" }, sources.slice(0, 2).map((s) =>
        el("a", { class: "run-source", href: s.image, target: "_blank", rel: "noopener" }, [
          el("img", { src: s.image, alt: s.alt || s.text }),
          el("span", { text: s.text }),
        ])
      )),
    ]);

    return el("div", {
      class: "win win--run",
      role: "group",
      "aria-label": `${p.title}, recorded run`,
    }, [
      el("div", { class: "win__bar", "aria-hidden": "true" }, [
        el("span", { class: "win__dots" }, [el("i"), el("i"), el("i")]),
        el("b", { text: p.title }),
        el("span", { class: "sp" }),
        el("span", { class: "mono", text: a ? `Recorded run · answered in ${seconds(a.t)}` : "Recorded run" }),
      ]),
      el("div", { class: "win__body" }, [
        el("div", { class: "win__pane win__pane--list", "aria-hidden": "true" }, list),
        open,
      ]),
    ]);
  }

  // ---------- Project sections: neighbours never share a layout ----------
  const list = document.getElementById("project-list");
  let prev = "";
  PROJECTS.forEach((p, i) => {
    let layout = p.benchmarks ? "table" : i % 2 === 0 ? "wide" : "split";
    if (layout === prev) layout = layout === "split" ? "wide" : "split";
    prev = layout;
    list.append(renderProject(p, layout));
  });
  // The main projects list is three <section>s; lift them out of the wrapper so they stay main > section.
  list.replaceWith(...list.children);

  function actions(p) {
    const row = el("div", { class: "btn-row" });
    if (p.links.demo) row.append(el("a", { class: "btn btn--secondary", href: p.links.demo, target: "_blank", rel: "noopener", text: "Open the live demo" }));
    if (p.replay) {
      const b = el("button", { class: "btn btn--secondary", type: "button", "data-replay": "", text: p.status === "planned" ? "Watch the sample run" : "Watch the recorded run" });
      b.addEventListener("click", () => openReplay(p));
      row.append(b);
    }
    if (p.links.code) row.append(el("a", { class: "btn btn--secondary", href: p.links.code, target: "_blank", rel: "noopener", text: "Read the code" }));
    if (p.links.writeup) row.append(el("a", { class: "btn btn--secondary", href: p.links.writeup, target: "_blank", rel: "noopener", text: "Read the write-up" }));
    return row.children.length ? row : null;
  }

  function label(p) {
    return el("p", { class: "label" }, [
      el("span", { text: p.number }),
      el("span", { class: `status status--${p.status}`, text: STATUS[p.status] }),
    ]);
  }

  function pipeline(p) {
    const items = [];
    p.pipeline.forEach((s, i) => {
      items.push(el("li", {}, [
        i > 0 ? el("span", { class: "wire", style: `--i:${i - 1}` }, el("i")) : null,
        el("div", { class: "node" }, [el("small", { text: String(i + 1).padStart(2, "0") }), el("span", { text: s })]),
      ]));
    });
    return el("figure", { class: "diagram", "data-loop": "", role: "img", "aria-label": `How ${p.title} works: ${p.pipeline.join(", then ")}` }, [
      el("ol", { class: "pipeline", "aria-hidden": "true" }, items),
      loopToggle(),
    ]);
  }

  function foot(p) {
    return el("div", { class: "project__foot" }, [
      el("ul", { class: "tags", "aria-label": "Stack" }, p.stack.map((s) => el("li", { text: s }))),
      p.disclaimer ? el("p", { class: "note", text: p.disclaimer }) : null,
    ]);
  }

  function renderProject(p, layout) {
    const id = `${p.id}-h`;
    const head = el("div", { class: "section-head" }, [
      el("div", { class: "section-head__title" }, [label(p), el("h2", { id, text: p.title }), el("p", { class: "sub", text: p.subtitle })]),
      el("div", { class: "section-head__body" }, [el("p", { text: p.problem }), actions(p)]),
    ]);

    if (layout === "wide") {
      return el("section", { class: "section project", id: p.id, style: "--h: 1", "aria-labelledby": id }, el("div", { class: "wrap" }, [
        head,
        pipeline(p),
        el("ul", { class: "points project__row", "aria-label": "What it demonstrates" }, p.demonstrates.map((d) => el("li", { text: d }))),
        foot(p),
      ]));
    }

    if (layout === "table") {
      const b = p.benchmarks;
      return el("section", { class: "section project", id: p.id, style: "--h: 1", "aria-labelledby": id }, el("div", { class: "wrap" }, [
        head,
        pipeline(p),
        el("div", { class: "grid project__row", style: "row-gap: 48px" }, [
          el("ul", { class: "points points--2", style: "grid-column: span 5", "aria-label": "What it demonstrates" }, p.demonstrates.map((d) => el("li", { text: d }))),
          el("div", { class: "bench-wrap", style: "grid-column: 7 / span 6" }, [
            el("div", { class: "bench" }, el("table", {}, [
              el("thead", {}, el("tr", {}, b.columns.map((c) => el("th", { scope: "col", text: c })))),
              el("tbody", {}, b.rows.map((r) => el("tr", {}, r.map((c) => el("td", { text: c }))))),
            ])),
            b.note ? el("p", { class: "note", text: b.note }) : null,
          ]),
        ]),
        foot(p),
      ]));
    }

    // split: the words on the left, the project's run as a live window on the right
    const text = el("div", { class: "split__text" }, [
      label(p),
      el("h2", { id, text: p.title }),
      el("p", { class: "intro", text: p.problem }),
      el("ul", { class: "points points--2", "aria-label": "What it demonstrates" }, p.demonstrates.map((d) => el("li", { text: d }))),
      el("ul", { class: "tags", "aria-label": "Stack" }, p.stack.map((s) => el("li", { text: s }))),
      actions(p),
    ]);
    const visual = el("div", { class: "split__visual" }, p.replay ? traceWindow(p) : pipeline(p));
    return el("section", { class: "section project", id: p.id, style: "--h: 1", "aria-labelledby": id },
      el("div", { class: "wrap grid split" }, [text, visual]));
  }

  // A trace window: the run's events as rows. It plays once when it comes into view and again on hover.
  function traceWindow(p) {
    const ev = p.replay.events;
    const rows = ev.map((e) => el("li", {}, [
      el("span", { class: "who", text: e.who }),
      el("span", {}, [e.text, el("span", { class: "when", text: `+${seconds(e.t)}` })]),
    ]));
    const win = el("div", { class: "win win--trace", role: "img", "aria-label": `${p.title}, ${p.replay.label.toLowerCase()}: ${ev.map((e) => `${e.who}: ${e.text}`).join(". ")}` }, [
      el("div", { class: "win__bar", "aria-hidden": "true" }, [
        el("span", { class: "win__dots" }, [el("i"), el("i"), el("i")]),
        el("b", { text: p.title }),
        el("span", { class: "sp" }),
        el("span", { class: "mono", text: p.replay.label }),
      ]),
      el("div", { class: "win__pane", "aria-hidden": "true" }, el("ol", { class: "trace" }, rows)),
    ]);
    if (!reduced) {
      let timers = [];
      let lastStart = 0;
      const play = () => {
        if (performance.now() - lastStart < 800) return;
        lastStart = performance.now();
        timers.forEach(clearTimeout);
        timers = [];
        rows.forEach((r) => r.classList.remove("is-shown"));
        win.classList.add("is-playing");
        // One cycle of about 3.2 s, then it holds the finished run.
        const step = 2800 / Math.max(rows.length - 1, 1);
        rows.forEach((r, i) => timers.push(setTimeout(() => r.classList.add("is-shown"), 200 + i * step)));
        timers.push(setTimeout(() => win.classList.remove("is-playing"), 200 + rows.length * step));
      };
      new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) { play(); obs.disconnect(); }
      }, { threshold: 0.4 }).observe(win);
      win.addEventListener("pointerenter", play);
    }
    return win;
  }

  function loopToggle() {
    return el("button", { class: "loop-toggle", type: "button", "aria-pressed": "false", "aria-label": "Pause the animation" });
  }

  // ---------- Approach: the hub diagram (the site linking out to each project) ----------
  const hub = document.getElementById("hub");
  hub.setAttribute("data-loop", "");
  hub.prepend(
    el("div", { class: "hub__core", "aria-hidden": "true" }, [
      el("b", { text: P.repo.replace(/^https:\/\/github\.com\/[^/]+\//, "") }),
      el("span", { text: "Static site with recorded replays" }),
    ]),
    ...PROJECTS.map((p, i) => el("div", { class: `hub__leaf${i === 0 ? " is-first" : ""}${i === PROJECTS.length - 1 ? " is-last" : ""}` }, [
      el("span", { class: "wire", style: `--i:${i}`, "aria-hidden": "true" }, el("i")),
      el("a", { href: `#${p.id}` }, [
        el("small", {}, [el("span", { text: p.number }), el("span", { class: `status status--${p.status}`, text: STATUS[p.status] })]),
        el("span", { text: p.title }),
      ]),
    ]))
  );
  // Footer project links
  document.getElementById("footer-projects").append(...PROJECTS.map((p) => el("li", {}, el("a", { href: `#${p.id}`, text: p.title }))));

  // ---------- Diagram loops: run while in view, with a pause button ----------
  for (const d of document.querySelectorAll("[data-loop]")) {
    const btn = d.querySelector(".loop-toggle");
    if (reduced) { btn && btn.remove(); continue; }
    new IntersectionObserver((entries) => {
      for (const e of entries) d.classList.toggle("is-live", e.isIntersecting);
    }).observe(d);
    btn && btn.addEventListener("click", () => {
      const paused = d.classList.toggle("is-paused");
      btn.setAttribute("aria-pressed", String(paused));
      btn.setAttribute("aria-label", paused ? "Play the animation" : "Pause the animation");
    });
  }

  // ---------- Nav: the menu sheet under 1024px ----------
  const toggle = document.getElementById("nav-toggle");
  const sheet = document.getElementById("nav-sheet");
  const setMenu = (open) => {
    sheet.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
  };
  toggle.addEventListener("click", () => setMenu(sheet.hidden));
  sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); toggle.focus(); } });
  matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // ---------- The hero's entrance: once on load ----------
  const hero = document.querySelector("[data-enter]");
  const root = document.documentElement;
  if (!reduced && root.classList.contains("m-enter") && !root.classList.contains("m-enter-done")) {
    const h1 = hero.querySelector("h1");
    const original = h1.textContent;
    h1.setAttribute("aria-label", original);
    h1.replaceChildren(...original.split(" ").flatMap((w, i, all) => {
      const word = el("span", { class: "w", "aria-hidden": "true" }, el("span", { text: w, style: `--d:${Math.min(i * 40, 240)}` }));
      return i < all.length - 1 ? [word, " "] : [word];
    }));
    let d = 380;
    for (const n of hero.querySelectorAll(".hero__lead, .btn-row")) { n.style.setProperty("--d", d); d += 60; }
    hero.classList.add("is-entering");
    root.classList.add("m-ready");
    setTimeout(() => {
      hero.classList.remove("is-entering");
      h1.textContent = original;
      h1.removeAttribute("aria-label");
    }, 1400);
  } else {
    root.classList.add("m-ready");
  }

  // ---------- The iris-opens moment in #approach ----------
  const io = document.getElementById("approach");
  if (io && !reduced && matchMedia("(min-width: 640px)").matches) {
    const stage = io.querySelector(".mo-io__stage");
    const blocks = [...io.querySelectorAll(".split__text > *, .split__text .rows > div, #hub")].filter((n) => !n.classList.contains("rows"));
    blocks.forEach((b) => b.classList.add("mo-block"));
    io.classList.add("is-armed");
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = innerHeight;
      const r = io.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh;
      const t = Math.min(1, Math.max(0, (visible - 0.15) / (0.5 - 0.15)));
      const s = stage.getBoundingClientRect();
      // the disc opens in the middle of what is visible of the stage
      const top = Math.max(s.top, 0), bottom = Math.min(s.bottom, vh);
      const cx = s.width / 2, cy = (top + bottom) / 2 - s.top;
      const far = Math.hypot(Math.max(cx, s.width - cx), Math.max(cy, s.height - cy));
      const rad = t * far;
      io.style.setProperty("--mo-cx", `${cx}px`);
      io.style.setProperty("--mo-cy", `${cy}px`);
      io.style.setProperty("--mo-r", `${rad}px`);
      for (const b of blocks) {
        if (b.classList.contains("is-in")) continue;
        const q = b.getBoundingClientRect();
        const corners = [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]];
        if (corners.every(([x, y]) => Math.hypot(x - s.left - cx, y - s.top - cy) <= rad)) b.classList.add("is-in");
      }
      if (t >= 1 || r.bottom < 0) {
        blocks.forEach((b) => b.classList.add("is-in"));
        io.classList.add("is-open");
        removeEventListener("scroll", onScroll);
        removeEventListener("resize", onScroll);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  // ---------- Replay dialog: animates a recorded event log ----------
  const dlg = document.getElementById("replay");
  const log = document.getElementById("replay-log");
  let timers = [];
  let current = null;

  function openReplay(p) {
    current = p;
    document.getElementById("replay-title").textContent = `${p.title} · ${p.replay.label}`;
    play();
    dlg.showModal();
  }

  function play() {
    timers.forEach(clearTimeout);
    timers = [];
    log.replaceChildren();
    for (const e of current.replay.events) {
      timers.push(setTimeout(() => {
        // An event may carry an image (e.g. the chart or table an answer was read from).
        const img = e.image ? el("img", { class: "ev-img", src: e.image, alt: e.alt || e.text, loading: "lazy" }) : null;
        log.append(el("li", { class: `ev ${e.who}` }, [
          el("span", { class: "who", text: e.who }),
          el("div", { class: "ev-body" }, [el("span", { text: e.text }), img]),
        ]));
        log.scrollTop = log.scrollHeight;
      }, reduced ? 0 : e.t));
    }
  }

  document.getElementById("replay-again").addEventListener("click", play);
  document.getElementById("replay-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => timers.forEach(clearTimeout));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
})();
