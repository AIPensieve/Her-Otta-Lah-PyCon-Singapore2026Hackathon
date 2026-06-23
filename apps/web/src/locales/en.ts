import type { I18nDictionary } from "./zh";

export const en: I18nDictionary = {
  common: {
    start: "Start",
    skip: "Skip",
    change: "Change",
    later: "Later",
    back: "Previous",
    next: "Next",
    completeAndRecord: "Complete & Save"
  },
  nav: {
    talk: "Talk",
    breathe: "Breathe",
    move: "Move",
    timeline: "Timeline",
    me: "Me"
  },
  talk: {
    title: "Talk",
    greeting: "What's on your mind today?",
    subtitle: "You can tell me about your body and feelings.",
    placeholder: "e.g., I'm very tired today, don't want to exercise.",
    simulateVoice: "Simulate Voice Input",
    skipTitle: "That's okay, maybe later.",
    skipDesc: "You can come back anytime.",
    changedMsg: "I've changed it to an easier option.",
    laterMsg: "I'll save this for later. Just press Start when you're ready.",
    minutes: "about {{minutes}} min"
  },
  breathe: {
    title: "Breathe",
    circleText: "Breathe"
  },
  move: {
    title: "Move",
    intensityInfo: "Intensity: Gentle. Stop immediately if you feel uncomfortable.",
    stepPrefix: "Step {{step}}"
  },
  timeline: {
    title: "Timeline",
    emptyTitle: "No records yet",
    emptyDesc: "Start from the Talk page. After completing an action, you can save your state here."
  }
};
