# AI Projects Portfolio

**Live site:** https://tcbryan17.github.io

This repo is the website that brings together three independent applied-AI projects. Each project lives in its own repo:

| # | Project | What it shows | Repo | Status |
|---|---------|---------------|------|--------|
| 01 | Multimodal Document Q&A | RAG over SEC 10-Ks and the FAA Pilot's Handbook, including answers found only in figures, with page citations | [`multimodal-doc-rag`](https://github.com/tcbryan17/multimodal-doc-rag) | In progress: recorded run on the site, eval underway, live Q&A after deployment |
| 02 | Agent Orchestration Console | Supervisor + specialist agents, with full tracing | `agent-orchestration` (private for now) | Planned |
| 03 | LLM Gateway | One governed API in front of the other two: limits, PII redaction, injection guards, routing, audit trail | `llm-gateway` (private for now) | In progress: Phase 0 scaffold and concept stubs |

## Architecture

```
            ┌──────────────────────────────────────────────┐
 visitor ─▶ │  tcbryan17.github.io   (this repo)           │
            │  static site · cards from projects.js        │
            │  recorded replays — work with no backend     │
            └──────┬───────────────┬───────────────┬───────┘
                   │ code + demo   │               │
                   ▼               ▼               ▼
         multimodal-doc-rag agent-orchestration llm-gateway
              FastAPI API   FastAPI + SSE        FastAPI gateway
              (Render/Fly)  (Render/Fly)         (hosting TBD)
```

**Design rules**

1. **The site is static.** Plain HTML, CSS and JS with no build step. GitHub Pages serves it (see CI/CD below).
2. **Projects are independent.** Each repo has its own code, dependencies, CI and deployment. The site only links to them and calls their public APIs.
3. **Replays always work.** Each project repo with a recorded run saves it at `replay/sample-run.json`. Copy its events into that project's `replay.events` in `projects.js`. The live demo is a bonus on top of that.
4. **No secrets in the browser.** Live demos call a rate-limited backend proxy that holds the API key.
5. **Measure everything.** Each project reports numbers: retrieval accuracy, agent cost, gateway cost and latency.

## Files

```
index.html     page layout (hero, approach section, footer)
styles.css     the design system: tokens, grid, sections, buttons, motion
app.js         renders the hero window, project sections, diagrams and the replay player
assets/replays/      figure images shown in recorded runs
assets/code-graph/   interactive code graphs (graphify), linked from project cards
projects.js    ← edit this to change site content
favicon.svg    site icon
share.jpg      social preview image (a still of the hero)
.claude/skills/design-taste-frontend/   the taste-skill used for the UI (not published by Pages)
```

## Design

The UI follows [taste-skill](https://github.com/Leonxlnx/taste-skill) (`tasteskill 2.5.1`, MIT), installed as a
project skill in `.claude/skills/design-taste-frontend`, so Claude Code picks it up when working in this repo.
The deal it was built from is noted in a comment at the top of `<body>` in `index.html`: a centred hero holding the
RAG project's recorded run, the "Lunar and bronze" dark palette, Gabarito + Figtree type, arrow buttons, and one
scroll moment (an iris opening over the "Approach" section). Project sections pick their layout from the data:
a project with `benchmarks` gets the table layout, and neighbouring projects never share a layout.

## Updating the site

- **Your info:** edit `PROFILE` at the top of `projects.js`.
- **When the RAG API is deployed:** set `links.api` in `projects.js` to its base URL (`https://…`, no trailing slash). The card then swaps the "opens once the evaluation passes" note for the ask box (the recorded run stays). The API's CORS setting must allow the origin `https://tcbryan17.github.io` (methods `POST, OPTIONS`, header `Content-Type`) and expose the `Retry-After` header so the 429 message can show the wait time. The 500-character question cap in `app.js` (`ASK_MAX_CHARS`) must match the server's.
- **When a project goes live:** set `status: "live"` and put the deployed URL in `links.demo`.
- **Code graph:** copy a project's `docs/code-graph/graph.html` to `assets/code-graph/<repo>.html` and set `links.graph`. The card then shows an "Explore the code graph" button.
- **When you have a new recorded run:** paste the events from the project repo's `replay/sample-run.json` into `replay.events`. For multimodal-doc-rag, `uv run python scripts/export_site_replay.py --site-dir ../portfolio-site` converts the run into events and writes its figures to `assets/replays/`. Events can carry an optional `image` path.

Try the ask box before the API exists (development only, nothing here ships):

```bash
python3 dev/mock-api.py          # fake API on http://localhost:8787
python3 -m http.server 8000      # in a second terminal
# open http://localhost:8000/?api=http://localhost:8787
```

The `?api=` override is honoured only when the page itself is on `localhost`/`127.0.0.1` and points at a localhost origin, so a visitor to the live site cannot aim it at another server. Type `429`, `503`, `500`, `422`, `slow`, `hang`, `badjson` or `xss` in a question to see each state (see the header of `dev/mock-api.py`). `dev/` is kept off the site by the allowlist in `deploy.yml` (and by `_config.yml` while the old branch deploy runs).

Preview it locally:

```bash
python3 -m http.server 8000
```

## Publishing on GitHub Pages

1. Create a GitHub repo named exactly `tcbryan17.github.io` and push this folder to it.
2. Go to **Settings → Pages → Build and deployment** and set **Source** to *GitHub Actions* (see CI/CD below).
3. The site is served at `https://tcbryan17.github.io`.
4. Pin this repo and the three project repos on your GitHub profile.

## CI/CD

`.github/workflows/ci.yml` runs on every pull request, and `deploy.yml` runs it again before each publish. It runs two checks:

- `npm run check` is fast and static. It checks the syntax of `app.js` and `projects.js`, the shape of `PROFILE` and `PROJECTS`, that every `#anchor` in `index.html` has a target, and that every local file it references exists.
- `npm run smoke` loads the page in Chromium at desktop width. It fails on any page error or console error, and on a missing project section. Then it resizes to phone width and fails on horizontal scroll.

Run them locally:

```bash
npm ci
npx playwright install chromium
npm run check
npm run smoke
```

`.github/workflows/deploy.yml` publishes the site on every merge to `main`, after the same checks pass. It copies only an allowlist of files (`index.html`, `styles.css`, `app.js`, `projects.js`, `favicon.svg`, `share.jpg`, `assets/`) into the published artifact, so `dev/`, `tests/`, this README and `.claude` stay off the site.

One-time setup: go to **Settings → Pages → Build and deployment → Source** and choose *GitHub Actions*. Until you do, the old branch deploy keeps running. If you add a new top-level file the site needs, add it to the allowlist in `deploy.yml`.

Suggested: add a ruleset on `main` that requires the `CI / checks` status check and a pull request. Dependabot opens weekly updates for the actions and the npm dev dependency.

## Roadmap

- [x] **01 RAG:** ingest 10-Ks and the FAA handbook, hybrid retrieval and reranking, recorded replay, reviewed dev eval set, code graph
- [ ] **01 RAG:** eval baseline and judge calibration, held-out release check, then deploy a rate-limited live `/ask` so visitors can ask their own questions
- [ ] **02 Agents:** supervisor and 4 workers, SSE event stream, timeline UI, cost and token tracing
- [ ] **03 Gateway:** hand-write K1 to K8 (routing, limits, accounting, redaction, guards, audit, evals), then route projects 01 and 02 through it
- [ ] Write a short post for each project
