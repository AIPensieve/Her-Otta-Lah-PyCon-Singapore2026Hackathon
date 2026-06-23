# AI Otter Coach

Public Web/PWA hackathon demo for an AI health companion for women aged 45-65 experiencing menopause or post-menopause changes.

This project is not a medical diagnosis tool. It helps users talk, slow down, move gently, and record body and mood changes. All health-related summaries must keep this disclaimer: **这只是根据记录整理，不是医学诊断。**

## Run The Hackathon Demo

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Demo Flow

1. The user starts on **Talk** and enters one sentence, simulating voice input.
2. The mock AI service understands the user state and recommends one low-pressure action: **Breathe** or **Move**.
3. The user can **Start**, **Skip**, **Change**, or choose **Later**.
4. If the user starts, the app opens the matching execution flow.
5. After completion, the mock AI asks whether to save a record.
6. Saved records appear in **Timeline**.

## Current Scope

- React + TypeScript + Tailwind CSS Web/PWA demo.
- Mobile-first UI.
- Mock AI service with future-compatible method names.
- Device simulator and shared device protocol types.
- Local storage persistence for demo records.
- No real AI, RAG, accounts, database, voice, TTS, GPS, Bluetooth, Wi-Fi, or hardware integration.

## Future Replacement Points

- Replace `services/mock-ai` with a real AI Agent service behind the same contract.
- Add RAG retrieval before `understandUserInput`.
- Replace local storage with an authenticated database-backed record repository.
- Replace the device simulator with Bluetooth/Wi-Fi hardware adapters using `DeviceState` and `DeviceCommand`.
- Add real voice input and TTS behind browser capability adapters.
- Add privacy and permission controls before GPS sharing, long-term storage, or caregiver features.

## Important Safety Boundary

The product must not provide medical diagnosis, medication recommendations, supplement prescriptions, real-time monitoring, or covert family tracking.
