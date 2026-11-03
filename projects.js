// Single source of truth for the portfolio. Edit this file to update the site.
// Loaded as a classic script (not fetch/ES module) so index.html also works when opened via file://.

window.PROFILE = {
  name: "[Your Name]",
  tagline: "I design and ship applied AI systems — retrieval, agents, and model serving — end to end.",
  github: "https://github.com/tcbryan17",
  linkedin: "https://www.linkedin.com/in/[your-handle]",
  email: "[you@example.com]",
  repo: "https://github.com/tcbryan17/tcbryan17.github.io",
};

// status: "live" | "in-progress" | "planned"
window.PROJECTS = [
  {
    id: "rag",
    number: "01",
    title: "Financial Document Q&A",
    subtitle: "Retrieval-augmented generation over tax & financial filings",
    status: "in-progress",
    problem:
      "Finance and tax teams spend hours searching dense PDFs (IRS publications, 10-Ks) for one answer. This assistant answers in plain English and cites the exact page it used.",
    demonstrates: [
      "PDF ingestion, chunking & metadata extraction",
      "Hybrid search (vector + keyword) with reranking",
      "Grounded answers with page-level citations",
      "Retrieval evaluation (recall@k, faithfulness)",
    ],
    stack: ["Python", "FastAPI", "pgvector", "Embeddings", "Claude API"],
    pipeline: ["PDFs", "Chunk + embed", "Vector DB", "Retrieve + rerank", "LLM answer + citations"],
    links: { demo: "", code: "https://github.com/tcbryan17/fin-doc-rag", writeup: "" },
    replay: {
      label: "Sample Q&A",
      events: [
        { t: 0, who: "user", text: "What is the 2025 standard deduction for a married couple filing jointly?" },
        { t: 600, who: "retriever", text: "Searched 1,284 chunks → top 3: IRS Pub 501 p.14, p.15; Form 1040 Instructions p.32" },
        { t: 1200, who: "reranker", text: "Kept 2 passages (score 0.91, 0.84)" },
        { t: 1900, who: "assistant", text: "Placeholder answer — replace with a real recorded run once the pipeline is built. [Pub 501, p.14]" },
      ],
    },
    disclaimer: "Public documents only. Not tax or financial advice.",
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
    links: { demo: "", code: "https://github.com/tcbryan17/agent-orchestration", writeup: "" },
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
    links: { demo: "", code: "https://github.com/tcbryan17/llm-serving-bench", writeup: "" },
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
