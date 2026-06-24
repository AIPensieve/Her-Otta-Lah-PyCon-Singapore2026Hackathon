# Interaction Logs and Collaboration Evidence

This document is a public, privacy-safe summary of the AI-human and human-human collaboration evidence for the PyCon SG 2026 hackathon submission.

## AI-Human Collaboration Log

### 2026-06-24: Project consolidation and public submission packaging

Human prompt, translated summary:

> Please organize all local files for this project, upload the relevant files to the public GitHub repository, clone `AIPensieve/pycon-sg-2026`, and prepare the hackathon submission.

AI-assisted work:

- Inspected the local project structure and identified source code, docs, demo data, generated caches, virtual environments, and dependency folders.
- Merged the AI/RAG prototype, React PWA, FastAPI backend, hardware firmware, seed knowledge base, tests, and submission documents into the public submission repository.
- Added `.gitignore` protections for `node_modules`, `.venv`, build artifacts, local memory files, caches, secrets, and device credentials.
- Updated README and submission documents so judges can see the project value proposition, demo commands, architecture, safety boundaries, and repository link.
- Ran verification checks:
  - Python tests: `18 passed`
  - Frontend smoke test: TypeScript typecheck and production build passed
  - Dependency check: npm audit reported 0 vulnerabilities

Human judgement:

- Chose the project direction: a Singapore-localised menopause companion for women aged 45+.
- Chose the public submission repository and confirmed that the hackathon form should point to `https://github.com/AIPensieve/pycon-sg-2026`.
- Decided that private local memory records and credentials should not be published.
- Reviewed the final submission framing for usefulness, playfulness, cultural localisation, and safety.

### 2026-06-24: Form completion for Data & Logic section

Human prompt, translated summary:

> Help complete the hackathon form questions for Data & Logic: datasets used and rationale, interaction logs, how AI tools were used creatively/effectively/responsibly, and tech stack.

AI-assisted work:

- Drafted form-ready answers.
- Added this public interaction-log document.
- Linked data rationale to transparent sources and repository artifacts.

Human judgement:

- The human submitter remains responsible for final wording in the official form and for confirming that all links are accessible after pushing to GitHub.

## Human-Human Collaboration Evidence

This project was assembled from the team integration repository and product/technical notes in this public submission repo.

Evidence files:

- Product and architecture context: `docs/PRODUCT_CONTEXT.md`, `docs/ARCHITECTURE.md`
- Decisions and task tracking: `docs/DECISIONS.md`, `docs/TASKS.md`
- Public release checklist: `docs/PUBLIC_RELEASE_CHECKLIST.md`
- Submission draft: `docs/submission_form_final.md`
- Ethics and safety judgement: `docs/ethics-and-safety.md`
- Demo script: `docs/demo-script.md`

Contribution summary:

- Human product owner / submitter: problem selection, target audience, Singapore-localised tone, final feature judgement, safety judgement, repository/submission choices.
- Human engineering contributors: frontend App, backend integration, hardware companion flow, device protocol, public demo assets, and review of what should be public.
- AI tools: structuring code and docs, drafting safe explanations, generating implementation scaffolding, preparing form copy, checking repository hygiene, and running repeatable verification.

## Responsibility Notes

- No private health records, API keys, `.env` files, or local generated memory files are intentionally published.
- The project uses AI as a development and drafting assistant, not as an unreviewed medical authority.
- Health-related content is limited to education, gentle wellbeing support, and prompts for professional care when risk signals appear.
