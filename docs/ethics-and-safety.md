# Ethics & Safety — AI Otter Coach

## Core Principles

This product is designed for vulnerable users in a sensitive health context. Every technical decision is evaluated against these principles:

### 1. No Medical Diagnosis
Every AI-generated response is accompanied by the disclaimer:
> 这只是根据记录整理，不是医学诊断。
> *This is based on your records only, not medical advice.*

This is not optional copy. It is enforced in code in `safety_guard.py` and appended at every API boundary in `main.py`.

### 2. No Drug or Supplement Recommendations
The safety guard (`app/ai/safety_guard.py`) flags any input mentioning medication, supplements, dosage, or prescription. These queries receive an elevated disclaimer and are not processed as action requests.

### 3. Emergency Redirection
Inputs containing crisis keywords (suicidal ideation, chest pain, loss of consciousness) are immediately halted and the user is redirected:
> 我听到了，这听起来很重要。请马上联系你信任的家人、朋友或医疗专业人员。

No AI-generated response is returned in emergency cases — only the human-help redirect.

### 4. Low Pressure, Always Stoppable
Every exercise plan and calm script explicitly:
- Includes "avoid if" warnings (pain, dizziness, chest tightness)
- Uses language like "随时可以停下来" (you can stop at any time)
- Is framed as a suggestion, never a requirement
- Has "skip", "change", "later" as always-visible options

### 5. Privacy by Design
- No real user data is committed to the repository (gitignored)
- WiFi credentials and API keys are gitignored
- Records are stored locally (SQLite), not transmitted to third-party servers
- The demo uses a single anonymous `demo_user` ID — no real identity data

### 6. Knowledge Base Integrity
- The RAG sample_docs/ contain only illustrative snippets, clearly marked as demo content
- No copyrighted medical textbook content is included
- Production would require properly licensed, expert-reviewed medical knowledge

### 7. Transparency to Users
The app should make clear:
- That the AI is an emotional support companion, not a clinician
- That symptom records are for personal awareness, not clinical tracking
- That the weekly summary is a pattern aid, not a health assessment

---

## What This Product Is NOT

| ❌ NOT | ✅ IS |
|--------|-------|
| A medical device | An emotional support companion |
| A symptom checker | A low-pressure action suggester |
| A diagnosis tool | A personal record keeper |
| A replacement for doctors | A complement to existing care |
| A drug or treatment guide | A calm / movement guide |

---

## Future Considerations

Before any production launch:
- [ ] Clinical review of all AI responses and skill scripts
- [ ] RAG knowledge base reviewed by licensed medical professionals
- [ ] Data protection compliance (PDPA Singapore, GDPR if EU users)
- [ ] User consent flows for data collection
- [ ] Clear escalation pathway to human support
- [ ] Regular audit of safety guard keyword coverage
