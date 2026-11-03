# AI Projects Portfolio

**Live site:** https://tcbryan17.github.io

This repo is the website that brings together three independent applied-AI projects. Each project lives in its own repo:

| # | Project | What it shows | Repo | Status |
|---|---------|---------------|------|--------|
| 01 | Financial Document Q&A | RAG over tax & financial PDFs, with cited answers | `fin-doc-rag` (private for now) | In progress |
| 02 | Agent Orchestration Console | Supervisor + specialist agents, with full tracing | `agent-orchestration` (private for now) | Planned |
| 03 | Open-Source Model Deployment | Self-hosted open-weight LLM, benchmarked | `llm-serving-bench` (private for now) | Planned |

## Architecture

```
            ┌──────────────────────────────────────────────┐
 visitor ─▶ │  tcbryan17.github.io   (this repo)           │
            │  static site · cards from projects.js        │
            │  recorded replays — work with no backend     │
            └──────┬───────────────┬───────────────┬───────┘
                   │ code + demo   │               │
                   ▼               ▼               ▼
              fin-doc-rag   agent-orchestration  llm-serving-bench
              FastAPI API   FastAPI + SSE        vLLM endpoint
              (Render/Fly)  (Render/Fly)         (Modal, scale-to-zero)
```

**Design rules**

1. **The site is static.** Plain HTML, CSS and JS with no build step. GitHub Pages serves it from the repo root.
2. **Projects are independent.** Each repo has its own code, dependencies, CI and deployment. The site only links to them and calls their public APIs.
3. **Replays always work.** Each project repo saves a recorded run at `replay/sample-run.json`. Copy its events into that project's `replay.events` in `projects.js`. The live demo is a bonus on top of that.
4. **No secrets in the browser.** Live demos call a rate-limited backend proxy that holds the API key.
5. **Measure everything.** Each project reports numbers: retrieval accuracy, agent cost, serving latency and $/token.

## Files

```
index.html     page layout
styles.css     light/dark theme, mobile layout
app.js         renders the project cards and the replay player
projects.js    ← edit this to change site content
```

## Updating the site

- **Your info:** edit `PROFILE` at the top of `projects.js`.
- **When a project goes live:** set `status: "live"` and put the deployed URL in `links.demo`.
- **When you have a new recorded run:** paste the events from the project repo's `replay/sample-run.json` into `replay.events`.

Preview it locally:

```bash
python3 -m http.server 8000
```

## Publishing on GitHub Pages

1. Create a GitHub repo named exactly `tcbryan17.github.io` and push this folder to it.
2. Go to **Settings → Pages**, choose *Deploy from a branch*, then `main` and `/ (root)`.
3. The site is served at `https://tcbryan17.github.io`.
4. Pin this repo and the three project repos on your GitHub profile.

## Roadmap

- [ ] **01 RAG:** ingest public IRS publications and 10-Ks, build hybrid retrieval, write a 50-question eval set, deploy, record a replay
- [ ] **02 Agents:** supervisor and 4 workers, SSE event stream, timeline UI, cost and token tracing
- [ ] **03 Serving:** vLLM on Modal, FP16 vs. 4-bit, Locust load test, fill in the benchmark table
- [ ] Write a short post for each project
