# Submission Form Draft

Use this as a polished source for the PyCon SG hackathon submission form. Keep claims aligned with the current code: local demo works end-to-end; cloud sponsor integrations are represented by clear architecture and pluggable interfaces, with live OpenAI validation available when a valid key is configured.

## Project Title

Her Otta Lah / nearu: Singapore Otter Auntie Menopause Companion

## Track

Open Track / Creative Track

## Public Repository

https://github.com/AIPensieve/pycon-sg-2026

Team integration repo:

https://github.com/clover475/ai-otter-coach.git

## Short Description

Her Otta Lah is a voice-first, Singapore-localised AI companion for menopausal and postmenopausal women. It combines an App and a small ESP32 otter desktop companion. Users can speak naturally in Chinese, English, Singlish, Malay terms, or mixed expressions like “Today so lazy, knee bit Sakit.” The AI classifies the user’s state, checks safety boundaries, recommends one low-pressure action, and returns structured JSON for the App and hardware to run fixed flows such as `breathing_60s`, `knee_friendly_5min`, and `heel_drop_game_60s`.

## Project Value Proposition

Most health apps feel like cold trackers: forms, dashboards, and pressure. Our target users are 45+ women who may be tired, sleep-deprived, dealing with hot flashes, or simply not in the mood to type. Her Otta Lah lowers the barrier by letting them speak first, then gently offers one tiny next step.

The product is useful, playful, and harmless:

- Useful: mood/body understanding, safety triage, record cards, weekly summaries.
- Playful: accessible Python/Pygame micro-games such as “小水獭接红豆冰.”
- Inclusive: supports Chinese, English, Singlish, Malay terms, and local dialect-flavoured expressions.
- Harmless: does not diagnose, prescribe, or replace clinicians; high-risk symptoms trigger safety escalation.

## How It Fits Open Track

The Open Track asks for useful, playful, “boliao but harmless” community helpers. Her Otta Lah is exactly that: a warm community helper for Singapore aunties, retirees, families, and mixed-language users. It is practical enough to support real daily wellbeing and playful enough to turn gentle heel drops into a tiny otter game.

## Technical Execution

The system is a Python-first AI backend with stable JSON contracts:

- FastAPI service for AI endpoints.
- Local-first memory with transparent CSV schemas.
- RAG-ready seed knowledge base for exercise, menopause body state, emotion soothing, and safety.
- Rule-based safety boundary to avoid unsafe recommendations.
- Hardware directives for ESP32 otter device flows.
- Accessible Pygame game spec generation.
- Test suite: `18 passed`.

Key demo commands:

```bash
.venv/bin/python scripts/demo_hackathon_ai.py
.venv/bin/python scripts/demo_hybrid_architecture.py
.venv/bin/python -m pytest -q
```

## Sponsor Architecture

### AI Singapore / SEA-LION

We implemented a SEA-LION-inspired Southeast Asian language normalization layer. It recognises local expressions such as `sakit`, `makan`, `lah`, `leh`, `jiak ba buay`, and `knee hian`, then expands them before intent classification and RAG retrieval. This prevents mixed-language user input from becoming invisible to the AI layer.

Current demo mode: local fallback lexicon and query expansion.

Future plug-in: SEA-LION LLM or SEA-LION embedding model for production-grade Southeast Asian language understanding.

### Google Cloud SG / Vertex AI

The AI API includes `/ai/vision-game`, designed for Vertex AI Gemini multimodal scene analysis. In the demo, a local fallback accepts a `scene_description`, such as “stable living-room chair detected,” then generates a safe low-impact game specification.

Deployment target: Cloud Run for the FastAPI service, Firestore or Cloud SQL for production memory storage.

### OpenAI

The project includes an OpenAI Structured Outputs path in `scripts/demo_hybrid_architecture.py`. With a valid `OPENAI_API_KEY`, the demo attempts live structured validation using a strict Pydantic schema. Without a key, it falls back to the local schema while preserving the same output contract.

This guarantees that App and ESP32 hardware consume stable JSON rather than free-form text.

## Data Quality / Data Integrity

We deliberately avoid depending on a questionable public women’s health dataset for the demo. Instead:

- The RAG seed knowledge is transparent and reviewable: `data/seed/knowledge_seed.jsonl`.
- User data is consented and local-first.
- Memory schemas are explicit:
  - `records.csv`
  - `actions.csv`
  - `wearable_daily.csv`
- Public repository excludes private memory data and API keys.
- Weekly summaries are structured sections, not opaque prose.

This approach makes the demo explainable and ethically safer, while leaving a path for MCAnalysis-style longitudinal analysis later.

## Data & Logic: Datasets Used and Rationale

We did not train a medical model on scraped or private women’s health data. For transparency and safety, the demo uses a small, reviewable seed knowledge base plus consent-based local records generated by the app.

Datasets / sources used:

- Project-authored RAG seed knowledge: `data/seed/knowledge_seed.jsonl`. Rationale: small, auditable menopause/body/mood/exercise/safety snippets for explainable local demos.
- Project-authored sample RAG docs: `services/backend/app/rag/sample_docs/`. Rationale: deterministic backend retrieval demo without external API keys.
- Local-first user memory schema: `records.csv`, `actions.csv`, `wearable_daily.csv` as documented in `README.md` and `docs/open_source_datasets.md`. Rationale: future data comes from consented user records, not hidden third-party scraping.
- WHO Menopause fact sheet: https://www.who.int/news-room/fact-sheets/detail/menopause. Rationale: source for menopause framing, symptoms, quality-of-life impact, and the need for social/physical/mental support.
- NHS menopause self-care guidance: https://www.nhs.uk/conditions/menopause-and-perimenopause/things-you-can-do/. Rationale: source for gentle lifestyle framing such as rest, regular exercise, relaxation, sleep routines, and talking to others.
- CDC NHANES overview: https://www.cdc.gov/nchs/nhanes/index.html. Rationale: future reference for public-health style variables and survey-quality thinking; not directly used for model training in this hackathon demo.
- MCAnalysis open-source package: https://github.com/kyradelray/mcanalysis. Rationale: future reference for wearable + self-reported longitudinal health analysis patterns; not used as raw user data in the demo.

We deliberately exclude private local memory files and credentials from the public repo via `.gitignore`.

## Data & Logic: Interaction Logs

Public log / evidence folder:

https://github.com/AIPensieve/pycon-sg-2026/blob/main/docs/interaction_logs.md

Supporting collaboration evidence:

- Decisions: https://github.com/AIPensieve/pycon-sg-2026/blob/main/docs/DECISIONS.md
- Tasks: https://github.com/AIPensieve/pycon-sg-2026/blob/main/docs/TASKS.md
- Product context: https://github.com/AIPensieve/pycon-sg-2026/blob/main/docs/PRODUCT_CONTEXT.md
- Ethics and safety: https://github.com/AIPensieve/pycon-sg-2026/blob/main/docs/ethics-and-safety.md

The interaction log includes AI-human prompt summaries, what the AI assisted with, what the human judged, and human-human collaboration evidence such as product decisions, architecture notes, task ownership, and release-safety checks.

## Data & Logic: How AI Tools Were Used Creatively, Effectively and Responsibly

AI was used as a build partner, drafting partner, and safety checker. We delegated repetitive and structure-heavy tasks to AI: code scaffolding, JSON contract design, RAG pipeline structure, demo scripts, repository hygiene, README/submission drafting, multilingual test phrasing, and verification steps.

Humans retained judgement over the product concept, target users, cultural tone, safety boundaries, what should be public, and whether an AI-generated answer was acceptable. In particular, we did not let AI invent medical claims or personalised clinical advice. The app avoids diagnosis, medication recommendations, and high-risk symptom minimisation. Risky inputs route to safety escalation instead of calming or exercise flows.

Creative AI use:

- Mixed-language understanding for English, Chinese, Singlish, and Malay terms such as “sakit,” “lah,” and “makan.”
- Structured Outputs-style JSON contracts so the App and ESP32 device consume predictable actions instead of free-form text.
- Tiny fixed-flow wellbeing games, such as `heel_drop_game_60s`, that turn low-impact movement into a playful hardware/app experience.
- Local fallback modes so the demo remains reproducible without API keys.

Responsible AI use:

- Transparent seed data and public source links.
- No private health data or API keys in the public repository.
- Safety guardrails for chest pain, shortness of breath, fainting, severe dizziness, self-harm risk, heavy bleeding, and other high-risk inputs.
- Clear disclaimer that the product is for wellbeing support and medical-conversation preparation, not diagnosis or treatment.

## Data & Logic: Tech Stack

Python:

- Python 3.11+ / 3.14-tested locally
- FastAPI backend
- Pydantic schemas for strict structured contracts
- Pytest test suite
- Local RAG demo modules for chunking, retrieval, bilingual query expansion, and safety filtering
- Optional OpenAI Structured Outputs validation path when `OPENAI_API_KEY` is configured

Frontend and app:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Browser speech APIs for voice-first demo flows
- PWA manifest and static assets for app-like presentation

Hardware / device companion:

- ESP32-S3 round AMOLED companion device concept
- MicroPython firmware path
- Arduino / LovyanGFX firmware path
- WebSocket bridge between backend, frontend, and device state

Deployment / operations:

- npm workspaces
- Vercel and Netlify config files
- Cloud Run / Vertex AI-compatible architecture notes for future deployment
- Local-first storage with explicit CSV/JSONL schemas

## User Focus / Experience

The user does not need to know which feature to open. She can say:

- “我今天很烦。”
- “昨晚三点醒了，hot flash 很明显。”
- “Today so lazy, knee bit Sakit. Don’t want to move.”

The AI returns:

- state classification
- one small action
- a short reason
- hardware directive
- optional record suggestion

All action choices are low-pressure:

```text
start / skip / change / later
```

## Safety and Ethical AI

Her Otta Lah is not a medical diagnosis tool. It does not recommend medication or personalised supplements. It uses safety boundaries for high-risk symptoms such as chest pain, shortness of breath, fainting, self-harm, heavy bleeding, or severe dizziness. In those cases, the system does not recommend exercise or meditation as a substitute for professional help.

Data persistence is consent-based. The public repo excludes private records and secrets.

## What We Would Build Next

- Real SEA-LION endpoint or embedding integration.
- Vertex AI Gemini live image/voice stream analysis.
- Cloud Run deployment with Firestore/Cloud SQL.
- ESP32 IMU calibration for `motion_detected` events.
- More validated low-impact game flows for 45+ users.

## One-minute Demo Script

1. Say: “Today so lazy, knee bit Sakit. Don’t want to move.”
2. Show AI output:
   - `language: singlish_malay_mixed`
   - `intent: exercise_request`
   - `skill_id: knee_friendly_5min`
3. Show game spec:
   - `game_id: heel_drop_game_60s`
   - `motion_detection.sensor_signal: imu_vertical_pulse`
4. Show ESP32 directive:
   - `round_screen_state: playful_timer`
   - `watchface: heel_drop_game_60s`
5. Finish with record suggestion and weekly summary.
