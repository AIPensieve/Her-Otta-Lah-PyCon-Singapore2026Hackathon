export const zh = {
  common: {
    start: "Start",
    skip: "Skip",
    change: "Change",
    later: "Later",
    back: "上一步",
    next: "下一步",
    completeAndRecord: "完成并记录"
  },
  nav: {
    talk: "说说",
    breathe: "缓一缓",
    move: "动一动",
    timeline: "记录",
    me: "我的"
  },
  talk: {
    title: "说说",
    greeting: "今天想先说点什么？",
    subtitle: "身体和心情，都可以告诉我。",
    placeholder: "例如：我今天 very tired，不想运动。",
    simulateVoice: "模拟语音输入",
    skipTitle: "没关系，先不做也可以。",
    skipDesc: "你可以随时回来，只说一句话就好。",
    changedMsg: "已为你换成另一个更轻松的选择。",
    laterMsg: "我先帮你留着。想开始的时候再点 Start。",
    minutes: "约 {{minutes}} 分钟"
  },
  breathe: {
    title: "缓一缓",
    circleText: "呼吸"
  },
  move: {
    title: "动一动",
    intensityInfo: "强度：轻柔。任何明显不舒服都可以立刻停下。",
    stepPrefix: "Step {{step}}"
  },
  timeline: {
    title: "记录",
    emptyTitle: "还没有记录",
    emptyDesc: "从首页开始，完成一个小行动后，<br />可以把你的状态保存到这里。"
  }
};

export type I18nDictionary = typeof zh;
