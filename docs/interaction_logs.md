# Interaction Logs and Collaboration Evidence

This document records how we used AI tools and how our team collaborated during the PyCon Singapore 2026 Hackathon project **Her Otta Lah**.
The purpose is to provide transparent evidence of:
1. AI-human collaboration: prompts, AI-assisted outputs, and human decisions.
2. Human-human collaboration: team roles, responsibilities, discussions, and integration work.

---
## 1. Project Timeline

### 19–20 June: Problem framing and user focus
We explored the problem of menopausal and postmenopausal women in Singapore who may experience hot flashes, poor sleep, joint discomfort, mood changes, and difficulty using complex medical apps.
AI tools were used to brainstorm product directions, but the team made the final decision to avoid:
- medical diagnosis
- medication recommendation
- personalised supplement plans
- family surveillance or parent-monitoring features

**Final human decision:**
The product should be a private AI wellbeing companion for women themselves, not a monitoring tool for children or family members.

---
### 21 June: Product structure and interaction design
AI-assisted prompts were used to explore:
- voice-first interaction
- bilingual / mixed-language input
- Singapore-localised otter companion concept
- low-pressure action recommendations
- body/mood timeline
- App + hardware interaction flow

**Final human decision:**
We chose the five-part product structure:
1. Talk
2. Breathe
3. Move
4. Timeline
5. Me

We also decided that “Breathe” and “Move” should not be isolated pages. They should be actions recommended by the AI after understanding the user’s state.

**Key interaction logic:**
User says something  
→ AI understands body/mood state  
→ AI recommends one low-pressure action  
→ App opens a fixed skill flow  
→ Otter device mirrors the state  
→ User may save a record after the action

---
### 22 June: AI / RAG / hardware contract design
AI tools were used to draft the AI responsibilities and structured API contracts.
Human team members reviewed and simplified the scope for a demo-safe implementation.

**Final AI responsibilities:**
- intent recognition
- mixed-language understanding
- action recommendation
- record card generation
- safety boundary classification
- RAG-ready knowledge base
- structured JSON output for App and hardware

**Final hardware decision:**
The ESP32 otter device does not run AI directly. It consumes structured hardware directives from the backend.

**Example hardware directive:**
```json
{
  "skill_id": "heel_drop_game_60s",
  "open_fixed_flow": "heel_drop_game_60s",
  "round_screen_state": "playful_timer",
  "watchface": "heel_drop_game_60s",
  "display_text": "Little otter catches red-bean ice",
  "voice_text": "Small-small movement can already. Press when you finish one.",
  "countdown_seconds": 60
}
```

---
### 23 June: Implementation and demo stabilization

Team members worked on:
* FastAPI backend
* RAG-ready knowledge base
* strict JSON schema
* local fallback demo mode
* App UI
* ESP32 MicroPython hardware flow
* WebSocket device communication
* Pygame accessible micro-game demo flow

We added a demo-safe path so the project can still run without external API keys.

**Demo flow:**
User input
→ FastAPI AI service
→ language normalization
→ safety boundary
→ RAG/action recommender
→ strict JSON
→ App / ESP32 / Pygame fixed flow

---
### 24 June: README, demo script, and final submission

AI tools were used to refine:
* README wording
* demo video script
* project description
* ethical AI statement
* tech stack summary
* submission form answers

Human team members reviewed final claims to avoid overclaiming. We clarified that:
* the product is not diagnostic
* user records are consent-based
* hardware does not run AI locally
* cloud/multimodal integrations are extension paths unless shown in demo

---
## 2. AI-Human Interaction Evidence

We used AI tools for the following tasks:

### Product ideation
**Example prompt theme:**
Help us define an AI companion product for menopausal women in Singapore, combining a mobile App and an otter desktop companion. It should not be medical diagnosis or family monitoring.

**AI-assisted output:**
* private AI companion positioning
* Talk / Breathe / Move / Timeline / Me structure
* low-pressure action recommendation logic
* body/mood timeline concept

**Human judgement:**
We rejected earlier parent-child monitoring directions and kept the product focused on the woman herself.

---
### UI and product design prompts
**Example prompt theme:**
Generate UI prompts for a Singapore otter AI companion App. The App should be voice-first, bilingual, ageing-friendly, and use a green Singapore garden-inspired visual system.

**AI-assisted output:**
* otter IP prompt
* circular watchface UI prompt
* App UI prompt
* Breathe / Move / Timeline interaction structure

**Human judgement:**
The team selected the final visual direction, adapted the page structure, and removed features that felt too medical or too childlike.

---
### AI architecture and JSON contracts
**Example prompt theme:**
Define the AI/RAG responsibilities and API contracts for an App + ESP32 hardware AI companion. The AI should recommend calm or movement actions and return structured JSON.

**AI-assisted output:**
* /ai/understand
* /ai/recommend-action
* /ai/generate-record-card
* /ai/generate-exercise-plan
* /ai/generate-calm-script
* /ai/action-completion
* /ai/safety-check

**Human judgement:**
The team simplified the implementation for demo stability and prioritised a strict JSON contract over free-form AI responses.

---
### README and submission writing
**Example prompt theme:**
Review our README for overclaiming and help make it accurate for a hackathon submission.

**AI-assisted output:**
* reduced overclaiming around sponsor technologies
* clearer distinction between implemented demo and extension paths
* improved ethical AI and safety language

**Human judgement:**
The team made final decisions on what claims to keep, weaken, or remove.

---
## 3. Human-Human Collaboration Evidence

**Team responsibilities**

| Area | Contributor | Responsibility |
|------|-------------|----------------|
| Product direction | Clover | User problem, product positioning, interaction design, UI direction, demo narrative |
| App / hardware integration | Clover / engineering support | App flow, hardware state design, device demo, WebSocket integration |
| AI / RAG | Ruijie | AI Agent, RAG-ready knowledge base, structured JSON output, safety boundary |
| Backend / integration | Team | FastAPI service, demo scripts, strict schema, local fallback |
| Demo and submission | Team | README, demo flow, technical delivery notes, final submission answers |

---
**Key collaboration decisions**

1. We decided to focus on menopausal and postmenopausal women aged 45–65.
2. We decided not to build a family-monitoring product.
3. We decided the otter device should not run AI locally.
4. We decided to use structured JSON contracts to connect AI, App, hardware, and Pygame flows.
5. We decided to keep demo flows stable with fixed skills and fallback logic.
6. We decided to make all records consent-based.
7. We decided not to include medication recommendation, diagnosis, or personalised supplement plans.

---
## 4. Stakeholder / User Reasoning

The product was shaped by observations of target users in Singapore, aiming to address genuine emotional and physical needs through respectful, accessible, and playful interaction.
