# AI API Contract

## Implementations

The app uses one app-facing TypeScript contract and multiple replaceable transports.

| Implementation | Location | When Used |
|----------------|----------|-----------|
| TypeScript mock | `services/mock-ai` | Frontend-only demo or backend failure fallback |
| Python backend | `services/backend` | Local full-stack demo, Claude or mock fallback |
| Future AI/RAG service | External service behind `/ai/*` | Commercial Agent + RAG + memory service |

Pages should import from `apps/web/src/services/aiService.ts`, not directly from a backend or mock package.

## App-Facing Contract

```typescript
interface AiAgentService {
  understandUserInput(input: UserInput): Promise<AIUnderstandResponse>
  createCalmScript(action: SuggestedAction): Promise<CalmScript>
  createExercisePlan(action: SuggestedAction): Promise<ExercisePlan>
  completeAction(action: SuggestedAction): Promise<ActionCompletionResponse>
}
```

## Primary REST Contract

The primary integration contract for Cloud / AI / RAG work is `/ai/*`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/ai/understand` | Understand user text, detect language/intent/safety, recommend next action |
| POST | `/ai/recommend-action` | Recommend a low-pressure calm/move action from state |
| POST | `/ai/generate-record-card` | Generate a user-approved body/mood/action record card |
| POST | `/ai/generate-exercise-plan` | Generate a gentle movement plan |
| POST | `/ai/generate-calm-script` | Generate a breathing, meditation, or calm script |
| POST | `/ai/action-completion` | Return completion copy and a record suggestion after an action |
| POST | `/ai/safety-check` | Classify safety boundary risk |
| POST | `/ai/generate-weekly-summary` | Summarize records into structured weekly sections |
| POST | `/ai/memory/record` | Save user-approved body/mood memory |
| POST | `/ai/memory/wearable-daily` | Save wearable daily summary |
| POST | `/ai/memory/action` | Save completed action memory |
| POST | `/ai/memory/timeline` | Read user timeline memory |

The current local Python backend implements these `/ai/*` endpoints with mock/Claude-compatible behavior. Weekly summary and memory endpoints are lightweight demo implementations; the future AI/RAG service should replace them with real retrieval and long-term storage.

## `/ai/understand`

Request:

```json
{
  "user_id": "u1",
  "text": "我今天很烦，昨晚也没睡好。",
  "remember": true
}
```

Response:

```json
{
  "intent": "mood_body_record",
  "language": "zh",
  "raw_language": "zh-SG",
  "user_text": "我今天很烦，昨晚也没睡好。",
  "reply_text": "听起来今天身体和心情都比较累。我们先不急着分析，可以先缓一缓。",
  "pet_voice_text": "听到了，我们先缓一缓。",
  "record_suggestion": true,
  "suggested_action": {
    "action_type": "calm",
    "skill_id": "breathing_60s",
    "title": "60 秒呼吸",
    "reason": "先做一个短时间、低压力的呼吸练习。",
    "duration_seconds": 60,
    "pressure_level": "low",
    "user_options": ["start", "skip", "change", "later"],
    "hardware_directive": {
      "skill_id": "breathing_60s",
      "open_fixed_flow": "breathing_60s",
      "round_screen_state": "calm_guidance",
      "display_text": "60 秒呼吸",
      "voice_text": "先慢慢呼吸。",
      "countdown_seconds": 60,
      "effects": {
        "light": "soft",
        "breathing_light": true,
        "vibration": "none"
      }
    }
  },
  "safety_level": "normal",
  "body_state": ["sleep change"],
  "mood_state": ["anxious"],
  "wants_record": true,
  "suitable_for_action": true,
  "safety": {
    "level": "normal",
    "disclaimer": "这只是根据记录整理，不是医学诊断。"
  },
  "next_step": "recommend_action",
  "display_text": "听起来今天身体和心情都比较累。我们先不急着分析，可以先缓一缓。"
}
```

## Suggested Action Fields

| Field | Required | Notes |
|-------|----------|-------|
| `action_type` | yes | `calm`, `move`, or `none` |
| `skill_id` | yes for actions | Must resolve through Skill Registry or alias |
| `title` | yes | User-visible title |
| `reason` | yes | Short recommendation reason |
| `duration_seconds` | yes | Source of truth for app timers and device countdown |
| `pressure_level` | yes | `very-low`, `low`, or `medium` |
| `user_options` | yes | Usually `start`, `skip`, `change`, `later` |
| `hardware_directive` | recommended | Used by app/device bridge to show otter watchface state |

`hardware_directive.open_fixed_flow` is the app/watchface flow key. `hardware_directive.round_screen_state` is the round-screen state machine key for hardware.

## Skill Registry

Canonical demo skill IDs:

- `breathing_60s`
- `night_calm`
- `hot_flash_calm`
- `emotion_overload`
- `neck_relax_3min`
- `gentle_stretch_5min`
- `knee_friendly_move`
- `sleep_stretch`
- `heel_drop_game_60s`
- `neck_relax_game_60s`

Accepted aliases for newer AI/RAG responses:

- `night_low_light_companion` -> `night_calm`
- `hot_flash_calm_90s` -> `hot_flash_calm`
- `knee_friendly_5min` -> `knee_friendly_move`
- `bedtime_stretch_5min` -> `sleep_stretch`
- `gentle_stretch_3min` -> `gentle_stretch_5min`
- `talk_and_sort_3min` -> `emotion_overload`
`heel_drop_game_60s` and `neck_relax_game_60s` are first-class game flow IDs, not aliases. They may appear in `game_id`, `hardware_directive.skill_id`, and `hardware_directive.open_fixed_flow`.

## Game Flow Contract

Game skills return extra fields so the app can show progress and the ESP32 can report simple IMU/button events without running AI or game logic locally.

```json
{
  "game_id": "heel_drop_game_60s",
  "skill_id": "heel_drop_game_60s",
  "movement": "supported_heel_drops",
  "motion_detection": {
    "primary_motion": "supported_heel_drop",
    "fallback_input": "space_key",
    "sensor_signal": "imu_vertical_pulse",
    "minimum_reps": 4,
    "max_reps_target": 12,
    "safety_stop_signals": [
      "dizziness",
      "chest_tightness",
      "sharp_pain",
      "loss_of_balance"
    ]
  },
  "scoring": {
    "score_unit": "gentle_rep",
    "points_per_motion": 1,
    "target_score": 12,
    "minimum_success_score": 4,
    "pressure_level": "low"
  },
  "completion": {
    "duration_seconds": 60,
    "success_condition": "time_elapsed_or_user_stops_comfortably",
    "record_action_on_finish": true,
    "completion_states": [
      "completed",
      "skipped",
      "changed",
      "later",
      "safety_stopped"
    ]
  },
  "sensor_events": {
    "expected_from_hardware": [
      "game_started",
      "motion_detected",
      "game_completed",
      "safety_stop"
    ],
    "optional_signals": [
      "imu_vertical_pulse",
      "button_press",
      "heart_rate_high",
      "user_stop"
    ],
    "app_to_hardware": [
      "start_countdown",
      "show_score",
      "play_voice",
      "soft_vibration"
    ]
  },
  "hardware_directive": {
    "skill_id": "heel_drop_game_60s",
    "open_fixed_flow": "heel_drop_game_60s",
    "round_screen_state": "playful_timer",
    "watchface": "heel_drop_game_60s",
    "display_text": "小水獭接红豆冰",
    "voice_text": "Small-small movement can already. Press when you finish one.",
    "countdown_seconds": 60,
    "effects": {
      "light": "playful_soft",
      "breathing_light": false,
      "vibration": "score_soft"
    }
  }
}
```

App uses:

- `game_id`
- `scoring`
- `completion`
- `hardware_directive.open_fixed_flow`
- `hardware_directive.watchface`

ESP32 uses:

- `hardware_directive.round_screen_state`
- `hardware_directive.display_text`
- `hardware_directive.voice_text`
- `hardware_directive.countdown_seconds`
- `sensor_events`
- `motion_detection.sensor_signal`

## `/ai/generate-weekly-summary`

Response is structured sections, not pure text. The frontend should render these fields as cards or combine them into display copy.

```json
{
  "summary_type": "weekly",
  "disclaimer": "以下是根据记录做的整理，不是医学诊断。",
  "body_summary": "...",
  "mood_summary": "...",
  "exercise_summary": "...",
  "small_action_summary": "...",
  "wearable_summary": "...",
  "patterns_to_watch": ["..."],
  "doctor_questions": ["..."]
}
```

## `/ai/memory/record`

Request:

```json
{
  "user_id": "u1",
  "time": "2026-06-24T03:00:00",
  "body_sensations": ["poor_sleep", "hot_flash"],
  "mood_sensations": ["irritability"],
  "sleep_quality": "poor",
  "action_id": "hot_flash_calm_90s",
  "original_text": "昨晚三点醒了，热得不行。"
}
```

Response:

```json
{
  "saved": true,
  "record": {
    "user_id": "u1",
    "date": "...",
    "time": "...",
    "body_tags": ["poor_sleep", "hot_flash"],
    "mood_tags": ["irritability"],
    "sleep_quality": "poor",
    "hot_flash": true,
    "knee_pain": false,
    "action_id": "hot_flash_calm_90s",
    "free_text": "..."
  }
}
```

## `/ai/memory/action`

Request:

```json
{
  "user_id": "u1",
  "started_at": "2026-06-24T10:00:00",
  "completed_at": "2026-06-24T10:01:00",
  "action_type": "calm",
  "skill_id": "breathing_60s",
  "duration_seconds": 60,
  "completion_state": "completed"
}
```

Response:

```json
{
  "status": "success",
  "saved": true,
  "message": "Action status logged to local-first memory.",
  "action": {}
}
```

## `/ai/memory/wearable-daily`

Response:

```json
{
  "saved": true,
  "wearable_daily": {}
}
```

## `/ai/memory/timeline`

Response:

```json
{
  "user_id": "u1",
  "timeline": [],
  "tag_counts": {}
}
```

## Legacy Local Backend Contract

The local Python backend still keeps old `/api/ai/*` routes for compatibility.

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/understand` | `UserInput` | `AIUnderstandResponse` |
| POST | `/api/ai/calm-script` | `SuggestedAction` | `CalmScript` |
| POST | `/api/ai/exercise-plan` | `SuggestedAction` | `ExercisePlan` |
| POST | `/api/ai/complete-action` | `SuggestedAction` | `ActionCompletionResponse` |

Do not build new frontend code against these legacy paths. Use `aiService.ts`.

## Fallback Behavior

- If `VITE_API_BASE_URL` is not set, the web app uses `services/mock-ai`.
- If `VITE_API_BASE_URL` is set but a backend call fails, `aiService.ts` falls back to `services/mock-ai`.
- If the Python backend has `AI_MODE=real` and `ANTHROPIC_API_KEY`, it tries Claude and falls back to mock on error.
- If `AI_MODE=mock` or no API key is present, the Python backend uses deterministic mock responses.

## Safety Rules

All health-related responses must include:

> 这只是根据记录整理，不是医学诊断。

The AI must never:

- Suggest a specific diagnosis
- Recommend medication or supplements
- Claim to replace professional medical care
- Trigger covert location sharing or real-time monitoring

## Open Items For AI/RAG Team

- None for the current Hackathon game-flow contract.
