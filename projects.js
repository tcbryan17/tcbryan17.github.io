// Single source of truth for the portfolio. Edit this file to update the site.
// Loaded as a classic script (not fetch/ES module) so index.html also works when opened via file://.

window.PROFILE = {
  name: "Toby Bryan",
  tagline: "I design and ship applied AI systems — retrieval, agents, and model serving — end to end.",
  github: "https://github.com/tcbryan17",
  linkedin: "https://www.linkedin.com/in/toby-bryan/",
  email: "tobycbryan@gmail.com",
  repo: "https://github.com/tcbryan17/tcbryan17.github.io",
};

// status: "live" | "in-progress" | "planned"
window.PROJECTS = [
  {
    id: "rag",
    number: "01",
    title: "Multimodal Document Q&A",
    subtitle: "RAG over SEC 10-Ks and the FAA Pilot's Handbook, including answers that live in charts and tables",
    status: "in-progress",
    problem:
      "Long documents hide answers in tables, charts and diagrams that text-only search never sees. This assistant answers plain-English questions over SEC 10-K filings and the 500-page FAA Pilot's Handbook, reads the figure when that's where the answer is, and cites the exact printed page.",
    demonstrates: [
      "Parsing HTML filings and a figure-heavy PDF while keeping printed page labels",
      "A vision model describes ~500 figures so charts and tables become searchable",
      "Hybrid search (pgvector + Postgres full-text, fused with RRF) and a reranker",
      "Grounded answers with validated page citations; figure images go to the model",
      "Zero-data-retention model routing and hard spending caps",
      "Eval harness: human-verified questions, held-out split, calibrated LLM judge (results coming)",
    ],
    stack: ["Python", "FastAPI", "Postgres + pgvector", "PyMuPDF", "OpenRouter (zero retention)", "Claude Haiku 5.5", "Qwen3 embeddings + reranker"],
    pipeline: ["10-K HTML + FAA PDF", "Parse + describe figures", "Chunk + embed", "Hybrid search + rerank", "Answer + page citations"],
    links: { demo: "", code: "", writeup: "" }, // repo private for now: https://github.com/tcbryan17/multimodal-doc-rag
    replay: {
      label: "Sample Q&A (recorded run)",
      // From multimodal-doc-rag: scripts/save_replay.py, then scripts/export_site_replay.py.
      // Timings are the real pipeline's; the answer was read from the table images shown.
      events: [
        { t: 0, who: "user", text: "What is the standard temperature at 5,000 feet?" },
        { t: 1300, who: "retriever", text: "Hybrid search (vector + keyword, fused with RRF): 30 candidates" },
        { t: 2381, who: "reranker", text: "Cross-encoder rerank: kept 5 of 30" },
        { t: 2386, who: "figures", text: "Figure images sent to the model: 2 images" },
        { t: 5506, who: "assistant", text: "The standard temperature at 5,000 feet is 5.1 °C (41.2 °F) [1][2]." },
        { t: 5856, who: "source", text: "[1] FAA-H-8083-25C, Ch. 4: Principles of Flight, p. 4-3", image: "assets/replays/rag-1.png" },
        { t: 6206, who: "source", text: "[2] FAA-H-8083-25C, Ch. 11: Aircraft Performance, p. 11-3", image: "assets/replays/rag-2.png" },
      ],
    },
    disclaimer: "Public documents only. Not financial, legal, or flight-training advice.",
  },
  {
    id: "agents",
    number: "02",
    title: "Agent Orchestration Console",
    subtitle: "A supervisor coordinating specialist agents, fully observable",
    status: "planned",
    problem:
      "Multi-step business tasks (research → analyze → draft → review) don't fit one prompt. A supervisor agent breaks the job down, delegates to specialists, and every step is visible: tool calls, tokens, cost, and timing.",
    demonstrates: [
      "Supervisor / worker agent pattern",
      "Tool use and structured handoffs",
      "Live event streaming (SSE) to a timeline UI",
      "Per-agent tracing: tokens, latency, cost",
    ],
    stack: ["Python", "Claude Agent SDK", "FastAPI + SSE", "Postgres", "OpenTelemetry"],
    pipeline: ["Task", "Supervisor", "Researcher · Analyst · Writer", "Reviewer", "Result + trace"],
    links: { demo: "", code: "", writeup: "" }, // repo private for now: https://github.com/tcbryan17/agent-orchestration
    replay: {
      label: "Sample run",
      events: [
        { t: 0, who: "user", text: "Write a one-page competitive brief on three payroll SaaS vendors." },
        { t: 500, who: "supervisor", text: "Plan: research(3 vendors) → analyze(pricing, features) → write → review" },
        { t: 1100, who: "researcher", text: "tool: web_search ×6 · 4.2k tokens · 3.1s" },
        { t: 1700, who: "analyst", text: "tool: build_table · comparison matrix ready" },
        { t: 2300, who: "writer", text: "Draft complete · 612 words" },
        { t: 2900, who: "reviewer", text: "2 issues flagged → sent back to writer" },
        { t: 3500, who: "supervisor", text: "Done · 6 agent turns · 18.4k tokens · $0.09 · 41s (placeholder numbers)" },
      ],
    },
  },
  {
    id: "serving",
    number: "03",
    title: "Open-Source Model Deployment",
    subtitle: "Self-hosting an open-weight LLM behind a production-style API",
    status: "planned",
    problem:
      "Some customers can't send data to a third-party API. This project deploys an open-weight model on rented GPUs with an OpenAI-compatible endpoint, then measures what it actually costs and how fast it is.",
    demonstrates: [
      "GPU serving with vLLM",
      "Quantization trade-offs (quality vs. speed vs. cost)",
      "Load testing: latency p50/p95, tokens/sec",
      "Scale-to-zero deployment & cost analysis",
    ],
    stack: ["vLLM", "Docker", "Modal / RunPod", "Locust", "Prometheus"],
    pipeline: ["Open-weight model", "Quantize", "vLLM server", "OpenAI-compatible API", "Benchmarks"],
    links: { demo: "", code: "", writeup: "" }, // repo private for now: https://github.com/tcbryan17/llm-serving-bench
    benchmarks: {
      note: "Placeholder rows — fill in with your measured results.",
      columns: ["Config", "p50 latency", "Tokens/sec", "$ / 1M tokens"],
      rows: [
        ["8B · FP16 · 1×A10G", "—", "—", "—"],
        ["8B · AWQ 4-bit · 1×A10G", "—", "—", "—"],
        ["Hosted API baseline", "—", "—", "—"],
      ],
    },
  },
];
