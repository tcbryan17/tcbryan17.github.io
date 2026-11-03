(function () {
  const P = window.PROFILE;
  const STATUS = {
    live: "Live",
    "in-progress": "In progress",
    planned: "Planned",
  };

  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c) n.append(c);
    return n;
  };

  // Profile
  document.getElementById("brand").textContent = P.name;
  document.getElementById("hero-name").textContent = P.name;
  document.getElementById("hero-tagline").textContent = P.tagline;
  document.getElementById("hero-github").href = P.github;
  document.getElementById("footer-name").textContent = P.name;
  document.getElementById("footer-repo").href = P.repo;
  document.getElementById("contact-links").append(
    el("a", { class: "btn primary", href: `mailto:${P.email}`, text: "Email me" }),
    el("a", { class: "btn", href: P.linkedin, target: "_blank", rel: "noopener", text: "LinkedIn" }),
    el("a", { class: "btn", href: P.github, target: "_blank", rel: "noopener", text: "GitHub" })
  );

  // Hero strip: one chip per project
  const strip = document.getElementById("hero-strip");
  for (const p of window.PROJECTS) {
    strip.append(
      el("li", {}, [
        el("a", { href: `#${p.id}` }, [
          el("span", { class: "mono muted", text: p.number }),
          el("span", { text: p.title }),
        ]),
      ])
    );
  }

  // Projects
  const list = document.getElementById("project-list");
  for (const p of window.PROJECTS) list.append(renderProject(p));

  function renderProject(p) {
    const links = el("div", { class: "links" });
    const addLink = (href, label, primary) => {
      if (!href) return;
      links.append(el("a", { class: `btn small${primary ? " primary" : ""}`, href, target: "_blank", rel: "noopener", text: label }));
    };
    addLink(p.links.demo, "Live demo ↗", true);
    if (p.replay) {
      const b = el("button", { class: `btn small${p.links.demo ? "" : " primary"}`, text: `▶ ${p.replay.label}` });
      b.addEventListener("click", () => openReplay(p));
      links.append(b);
    }
    addLink(p.links.code, "Code");
    addLink(p.links.writeup, "Write-up");

    const pipeline = el("ol", { class: "pipeline", "aria-label": "Architecture" },
      p.pipeline.map((s) => el("li", { text: s })));

    const body = [
      el("p", { class: "problem", text: p.problem }),
      el("h4", { text: "What it demonstrates" }),
      el("ul", { class: "checks" }, p.demonstrates.map((d) => el("li", { text: d }))),
      el("h4", { text: "Architecture" }),
      pipeline,
    ];

    if (p.benchmarks) {
      const b = p.benchmarks;
      body.push(
        el("h4", { text: "Benchmarks" }),
        el("div", { class: "table-wrap" }, [
          el("table", {}, [
            el("thead", {}, el("tr", {}, b.columns.map((c) => el("th", { text: c })))),
            el("tbody", {}, b.rows.map((r) => el("tr", {}, r.map((c) => el("td", { text: c }))))),
          ]),
        ]),
        el("p", { class: "muted small", text: b.note })
      );
    }

    body.push(el("div", { class: "tags" }, p.stack.map((s) => el("span", { class: "tag", text: s }))));
    if (p.disclaimer) body.push(el("p", { class: "muted small", text: p.disclaimer }));
    body.push(links);

    return el("article", { class: "project", id: p.id }, [
      el("div", { class: "project-head" }, [
        el("span", { class: "num mono", text: p.number }),
        el("div", {}, [
          el("h3", { text: p.title }),
          el("p", { class: "muted", text: p.subtitle }),
        ]),
        el("span", { class: `badge ${p.status}`, text: STATUS[p.status] }),
      ]),
      el("div", { class: "project-body" }, body),
    ]);
  }

  // Replay dialog: animates a recorded event log
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
        log.append(el("li", { class: `ev ${e.who}` }, [
          el("span", { class: "who mono", text: e.who }),
          el("span", { text: e.text }),
        ]));
        log.scrollTop = log.scrollHeight;
      }, e.t));
    }
  }

  document.getElementById("replay-again").addEventListener("click", play);
  document.getElementById("replay-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => timers.forEach(clearTimeout));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
})();
