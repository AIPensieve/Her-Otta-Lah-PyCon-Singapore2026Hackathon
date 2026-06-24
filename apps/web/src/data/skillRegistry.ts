/**
 * Frontend skill registry — mirrors services/backend/skill_registry.py.
 * Pages use these steps directly when skillId is known, bypassing AI calls.
 */

export type SkillType = "calm" | "move";
export type SkillIntensity = "very_low" | "low" | "medium";

export type SkillStep = {
  step_id: string;
  name_zh: string;
  name_en: string;
  duration_seconds: number;
  instruction_zh: string;
  instruction_en: string;
  device_text_zh: string;
  device_text_en: string;
  screen_state: string;
};

export type Skill = {
  skill_id: string;
  type: SkillType;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  duration_seconds: number;
  intensity: SkillIntensity;
  tags: string[];
  steps: SkillStep[];
  safety_note_zh: string;
  safety_note_en: string;
  completion_record_template: {
    kind: "body" | "mood" | "action" | "mixed";
    title: string;
    summary: string;
    tags: string[];
    mood_tags: string[];
    body_tags: string[];
    related_action: string;
  };
};

export const SKILL_REGISTRY: Record<string, Skill> = {
  breathing_60s: {
    skill_id: "breathing_60s",
    type: "calm",
    title_zh: "60 秒呼吸",
    title_en: "60-Second Breathing",
    description_zh: "一分钟慢慢呼吸，把身体和心情都慢下来一点。",
    description_en: "One minute of gentle breathing to slow down body and mind.",
    duration_seconds: 60,
    intensity: "very_low",
    tags: ["breathing", "calm", "quick", "mood"],
    steps: [
      { step_id: "b1", name_zh: "放松", name_en: "Relax", duration_seconds: 15,
        instruction_zh: "把肩膀放松一点，先不用回答任何问题。",
        instruction_en: "Relax your shoulders. No need to answer anything.",
        device_text_zh: "放松肩膀", device_text_en: "Relax", screen_state: "breathing" },
      { step_id: "b2", name_zh: "吸气", name_en: "Inhale", duration_seconds: 15,
        instruction_zh: "慢慢吸气，像把空气放进身体里。",
        instruction_en: "Slowly breathe in, like filling your body with air.",
        device_text_zh: "慢慢吸气", device_text_en: "Breathe in", screen_state: "breathing" },
      { step_id: "b3", name_zh: "呼气", name_en: "Exhale", duration_seconds: 15,
        instruction_zh: "慢慢呼气，把刚才的紧绷放下来。",
        instruction_en: "Slowly breathe out, release the tension.",
        device_text_zh: "慢慢呼气", device_text_en: "Breathe out", screen_state: "breathing" },
      { step_id: "b4", name_zh: "完成", name_en: "Done", duration_seconds: 15,
        instruction_zh: "很好，就这样，给自己一点点空间。",
        instruction_en: "Well done. Give yourself a little space.",
        device_text_zh: "做得很好", device_text_en: "Well done", screen_state: "breathing" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。",
    safety_note_en: "This is based on your records only, not medical advice.",
    completion_record_template: {
      kind: "action", title: "完成了 60 秒呼吸",
      summary: "完成了 60 秒的慢慢呼吸练习。",
      tags: ["breathing", "calm", "60s"], mood_tags: [], body_tags: [], related_action: "60 秒呼吸",
    },
  },

  night_calm: {
    skill_id: "night_calm",
    type: "calm",
    title_zh: "夜里陪伴",
    title_en: "Night Calm",
    description_zh: "夜里醒了，小水獭低亮度陪着你，先慢慢缓一缓。",
    description_en: "Woke up at night? Otter keeps you company at low brightness.",
    duration_seconds: 180,
    intensity: "very_low",
    tags: ["sleep", "night", "calm", "low_light"],
    steps: [
      { step_id: "n1", name_zh: "安定", name_en: "Settle", duration_seconds: 60,
        instruction_zh: "不用着急，先感受一下现在的呼吸。",
        instruction_en: "No rush. Just notice your breath right now.",
        device_text_zh: "慢慢呼吸", device_text_en: "Breathe slowly", screen_state: "night_calm" },
      { step_id: "n2", name_zh: "放松", name_en: "Release", duration_seconds: 60,
        instruction_zh: "从脚趾开始，慢慢把全身放松。",
        instruction_en: "Start from your toes and slowly relax the whole body.",
        device_text_zh: "放松全身", device_text_en: "Relax", screen_state: "night_calm" },
      { step_id: "n3", name_zh: "陪伴", name_en: "Together", duration_seconds: 60,
        instruction_zh: "我在这里陪着你，不需要睡着，只是休息就好。",
        instruction_en: "I'm here. No need to sleep, just rest.",
        device_text_zh: "我在这里", device_text_en: "I'm here", screen_state: "night_calm" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。",
    safety_note_en: "This is based on your records only, not medical advice.",
    completion_record_template: {
      kind: "action", title: "夜间缓一缓",
      summary: "夜里醒了，用了小水獭陪伴模式缓一缓。",
      tags: ["night_calm", "sleep", "calm"], mood_tags: [], body_tags: ["夜醒"], related_action: "夜里陪伴",
    },
  },

  hot_flash_calm: {
    skill_id: "hot_flash_calm",
    type: "calm",
    title_zh: "潮热后缓一缓",
    title_en: "After Hot Flash",
    description_zh: "潮热过后，先让身体慢慢冷静下来。",
    description_en: "After a hot flash, let your body slowly calm down.",
    duration_seconds: 120,
    intensity: "very_low",
    tags: ["hot_flash", "menopause", "calm", "breathing"],
    steps: [
      { step_id: "h1", name_zh: "冷静", name_en: "Cool Down", duration_seconds: 30,
        instruction_zh: "找一个舒服的姿势，不用动。",
        instruction_en: "Find a comfortable position. No need to move.",
        device_text_zh: "慢慢冷静", device_text_en: "Cool down", screen_state: "hot_flash_calm" },
      { step_id: "h2", name_zh: "呼吸", name_en: "Breathe", duration_seconds: 30,
        instruction_zh: "慢慢吸气 4 秒，呼气 6 秒。",
        instruction_en: "Breathe in for 4 seconds, out for 6 seconds.",
        device_text_zh: "4秒吸 6秒呼", device_text_en: "4 in 6 out", screen_state: "hot_flash_calm" },
      { step_id: "h3", name_zh: "关注", name_en: "Notice", duration_seconds: 30,
        instruction_zh: "感受一下身体慢慢在降温。",
        instruction_en: "Notice your body gradually cooling down.",
        device_text_zh: "感受降温", device_text_en: "Feel cooler", screen_state: "hot_flash_calm" },
      { step_id: "h4", name_zh: "完成", name_en: "Done", duration_seconds: 30,
        instruction_zh: "潮热已经过了，你处理得很好。",
        instruction_en: "The hot flash has passed. You handled it well.",
        device_text_zh: "你很棒", device_text_en: "Well done", screen_state: "hot_flash_calm" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。",
    safety_note_en: "This is based on your records only, not medical advice.",
    completion_record_template: {
      kind: "mixed", title: "潮热后缓一缓",
      summary: "经历了一次潮热，完成了缓一缓练习。",
      tags: ["hot_flash", "menopause", "calm"], mood_tags: [], body_tags: ["潮热"], related_action: "潮热后缓一缓",
    },
  },

  emotion_overload: {
    skill_id: "emotion_overload",
    type: "calm",
    title_zh: "情绪很多时缓一缓",
    title_en: "Emotion Release",
    description_zh: "突然烦躁或心里堵住，先不分析，慢慢把情绪放下。",
    description_en: "Sudden irritation or overwhelm. No analysis, just release.",
    duration_seconds: 90,
    intensity: "very_low",
    tags: ["emotion", "anxiety", "calm", "mood"],
    steps: [
      { step_id: "e1", name_zh: "停下来", name_en: "Stop", duration_seconds: 30,
        instruction_zh: "先停下手里的事，让自己有一点点空间。",
        instruction_en: "Stop what you're doing. Give yourself a little space.",
        device_text_zh: "先停下来", device_text_en: "Just stop", screen_state: "breathing" },
      { step_id: "e2", name_zh: "呼吸", name_en: "Breathe", duration_seconds: 30,
        instruction_zh: "慢慢深呼吸，不用解决任何问题。",
        instruction_en: "Slow deep breaths. No need to solve anything.",
        device_text_zh: "慢慢呼吸", device_text_en: "Breathe", screen_state: "breathing" },
      { step_id: "e3", name_zh: "接受", name_en: "Accept", duration_seconds: 30,
        instruction_zh: "有这种感受很正常，不需要立刻消除它。",
        instruction_en: "It's normal to feel this way. No need to fix it now.",
        device_text_zh: "感受没问题", device_text_en: "Feeling OK", screen_state: "breathing" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。",
    safety_note_en: "This is based on your records only, not medical advice.",
    completion_record_template: {
      kind: "mood", title: "情绪很多，缓了一缓",
      summary: "感到烦躁或情绪堵住，做了一次情绪缓一缓。",
      tags: ["emotion", "anxiety", "calm"], mood_tags: ["烦躁"], body_tags: [], related_action: "情绪很多时缓一缓",
    },
  },

  neck_relax_3min: {
    skill_id: "neck_relax_3min",
    type: "move",
    title_zh: "3 分钟肩颈放松",
    title_en: "3-Min Neck & Shoulder",
    description_zh: "久坐或肩颈紧，三分钟轻柔活动让肌肉松开。",
    description_en: "Sitting long or neck tight? Three minutes of gentle movement.",
    duration_seconds: 180,
    intensity: "low",
    tags: ["neck", "shoulder", "stretch", "desk"],
    steps: [
      { step_id: "nk1", name_zh: "转肩", name_en: "Shoulder Roll", duration_seconds: 30,
        instruction_zh: "坐稳或站稳，慢慢前后转动肩膀。",
        instruction_en: "Sit or stand steady. Slowly roll shoulders forward and back.",
        device_text_zh: "慢慢转肩", device_text_en: "Roll shoulders", screen_state: "exercise_countdown" },
      { step_id: "nk2", name_zh: "抬头", name_en: "Head Lift", duration_seconds: 30,
        instruction_zh: "双手轻放大腿，慢慢抬头看远处。",
        instruction_en: "Hands on thighs, slowly look up into the distance.",
        device_text_zh: "看向远处", device_text_en: "Look far", screen_state: "exercise_countdown" },
      { step_id: "nk3", name_zh: "侧颈", name_en: "Neck Tilt", duration_seconds: 30,
        instruction_zh: "头轻轻向左倒，停 10 秒，再向右。",
        instruction_en: "Gently tilt head left, hold 10 seconds, then right.",
        device_text_zh: "左右侧颈", device_text_en: "Neck tilt", screen_state: "next_move" },
      { step_id: "nk4", name_zh: "摆臂", name_en: "Arm Swing", duration_seconds: 30,
        instruction_zh: "手臂自然下垂，左右轻轻摆动。",
        instruction_en: "Arms hanging loose, gently swing side to side.",
        device_text_zh: "轻摆手臂", device_text_en: "Swing arms", screen_state: "exercise_countdown" },
      { step_id: "nk5", name_zh: "放松", name_en: "Rest", duration_seconds: 30,
        instruction_zh: "停下来，感受呼吸和身体。",
        instruction_en: "Stop and feel your breath and body.",
        device_text_zh: "感受身体", device_text_en: "Feel it", screen_state: "exercise_countdown" },
      { step_id: "nk6", name_zh: "完成", name_en: "Done", duration_seconds: 30,
        instruction_zh: "很好！肩颈放松了一些，感觉怎么样？",
        instruction_en: "Well done! Shoulders a bit looser. How do you feel?",
        device_text_zh: "完成了", device_text_en: "Done!", screen_state: "exercise_countdown" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。如果动作中有明显疼痛，请立刻停下。",
    safety_note_en: "Not medical advice. Stop immediately if you feel sharp pain.",
    completion_record_template: {
      kind: "action", title: "3 分钟肩颈放松",
      summary: "完成了 3 分钟轻柔肩颈活动。",
      tags: ["neck", "shoulder", "move"], mood_tags: [], body_tags: ["肩颈"], related_action: "3 分钟肩颈放松",
    },
  },

  gentle_stretch_5min: {
    skill_id: "gentle_stretch_5min",
    type: "move",
    title_zh: "5 分钟轻量拉伸",
    title_en: "5-Min Gentle Stretch",
    description_zh: "五分钟全身轻量拉伸，让身体动起来但不觉得累。",
    description_en: "Five minutes of full-body light stretching. Energizing but not tiring.",
    duration_seconds: 300,
    intensity: "low",
    tags: ["stretch", "full_body", "gentle", "energy"],
    steps: [
      { step_id: "gs1", name_zh: "手臂拉伸", name_en: "Arm Stretch", duration_seconds: 60,
        instruction_zh: "双手十指交叉，向头顶伸直，深呼吸。",
        instruction_en: "Interlace fingers and stretch arms overhead. Deep breath.",
        device_text_zh: "双手向上伸", device_text_en: "Stretch up", screen_state: "exercise_countdown" },
      { step_id: "gs2", name_zh: "侧弯", name_en: "Side Bend", duration_seconds: 60,
        instruction_zh: "右手过头，身体轻轻向左弯，再换边。",
        instruction_en: "Right arm overhead, lean gently left. Switch sides.",
        device_text_zh: "侧弯拉伸", device_text_en: "Side bend", screen_state: "next_move" },
      { step_id: "gs3", name_zh: "腰部", name_en: "Waist Twist", duration_seconds: 60,
        instruction_zh: "双手扶腰，轻轻左右转动腰部。",
        instruction_en: "Hands on hips, gently twist waist left and right.",
        device_text_zh: "转腰", device_text_en: "Twist waist", screen_state: "exercise_countdown" },
      { step_id: "gs4", name_zh: "小腿", name_en: "Calf Raise", duration_seconds: 60,
        instruction_zh: "扶着椅子，脚跟慢慢抬起再放下。",
        instruction_en: "Hold chair for support. Slowly rise on toes and lower.",
        device_text_zh: "踮脚跟", device_text_en: "Heel raise", screen_state: "next_move" },
      { step_id: "gs5", name_zh: "放松", name_en: "Rest", duration_seconds: 60,
        instruction_zh: "停下来，深呼吸，感受一下身体的变化。",
        instruction_en: "Stop, deep breath, notice how your body feels now.",
        device_text_zh: "完成了", device_text_en: "Done!", screen_state: "exercise_countdown" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。如果动作中有明显疼痛，请立刻停下。",
    safety_note_en: "Not medical advice. Stop immediately if you feel sharp pain.",
    completion_record_template: {
      kind: "action", title: "5 分钟轻量拉伸",
      summary: "完成了 5 分钟全身轻量拉伸。",
      tags: ["stretch", "full_body", "gentle"], mood_tags: [], body_tags: [], related_action: "5 分钟轻量拉伸",
    },
  },

  knee_friendly_move: {
    skill_id: "knee_friendly_move",
    type: "move",
    title_zh: "膝盖友好动作",
    title_en: "Knee-Friendly Move",
    description_zh: "膝盖不适时也能做的轻柔坐姿小动作。",
    description_en: "Gentle seated moves safe for those with knee discomfort.",
    duration_seconds: 180,
    intensity: "very_low",
    tags: ["knee", "joint", "gentle", "seated", "low_impact"],
    steps: [
      { step_id: "kn1", name_zh: "坐姿热身", name_en: "Seated Warmup", duration_seconds: 30,
        instruction_zh: "坐好，把双手放大腿，感受一下身体重心。",
        instruction_en: "Sit comfortably, hands on thighs, feel your center of gravity.",
        device_text_zh: "坐好放松", device_text_en: "Sit & relax", screen_state: "exercise_countdown" },
      { step_id: "kn2", name_zh: "踝转", name_en: "Ankle Circle", duration_seconds: 30,
        instruction_zh: "把一只脚抬离地面，慢慢画圈，再换脚。",
        instruction_en: "Lift one foot slightly, rotate ankle in circles. Switch feet.",
        device_text_zh: "转脚踝", device_text_en: "Ankle circles", screen_state: "exercise_countdown" },
      { step_id: "kn3", name_zh: "抬腿", name_en: "Leg Lift", duration_seconds: 30,
        instruction_zh: "一条腿缓慢抬平，保持 5 秒，放下，再换腿。",
        instruction_en: "Slowly raise one leg parallel, hold 5 sec, lower. Switch.",
        device_text_zh: "慢慢抬腿", device_text_en: "Leg lift", screen_state: "next_move" },
      { step_id: "kn4", name_zh: "手臂", name_en: "Arm Circles", duration_seconds: 30,
        instruction_zh: "双手侧平举，慢慢画小圆。",
        instruction_en: "Arms out to sides, slowly draw small circles.",
        device_text_zh: "手臂画圆", device_text_en: "Arm circles", screen_state: "exercise_countdown" },
      { step_id: "kn5", name_zh: "放松", name_en: "Rest", duration_seconds: 60,
        instruction_zh: "很好，现在深呼吸，让身体慢慢平静。",
        instruction_en: "Well done. Deep breaths now, let your body settle.",
        device_text_zh: "完成了", device_text_en: "Done!", screen_state: "exercise_countdown" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。如果膝盖有明显疼痛，请立刻停下。",
    safety_note_en: "Not medical advice. Stop if you feel knee pain.",
    completion_record_template: {
      kind: "action", title: "膝盖友好动作",
      summary: "完成了一次膝盖友好的轻柔活动。",
      tags: ["knee", "gentle", "seated"], mood_tags: [], body_tags: ["膝盖", "腿"], related_action: "膝盖友好动作",
    },
  },

  sleep_stretch: {
    skill_id: "sleep_stretch",
    type: "move",
    title_zh: "睡前舒缓拉伸",
    title_en: "Pre-Sleep Stretch",
    description_zh: "睡前几分钟，轻柔拉伸放松全身，帮助入睡。",
    description_en: "A few minutes before bed, gentle stretches to relax the whole body.",
    duration_seconds: 240,
    intensity: "very_low",
    tags: ["sleep", "stretch", "bedtime", "relaxation"],
    steps: [
      { step_id: "ss1", name_zh: "躺下", name_en: "Lie Down", duration_seconds: 30,
        instruction_zh: "躺在床上，深呼吸三次，感受床的支撑。",
        instruction_en: "Lie in bed, breathe deeply three times, feel the support.",
        device_text_zh: "舒适躺下", device_text_en: "Lie down", screen_state: "night_calm" },
      { step_id: "ss2", name_zh: "腿部", name_en: "Knee Hug", duration_seconds: 60,
        instruction_zh: "抱膝到胸前，停 15 秒，再换腿。",
        instruction_en: "Hug one knee to chest, hold 15 seconds, switch legs.",
        device_text_zh: "抱膝拉伸", device_text_en: "Knee hug", screen_state: "exercise_countdown" },
      { step_id: "ss3", name_zh: "脊背", name_en: "Spine Twist", duration_seconds: 60,
        instruction_zh: "双膝倒向一边，肩膀贴床，停 20 秒，换边。",
        instruction_en: "Let knees fall to one side, shoulders flat. Hold 20 sec, switch.",
        device_text_zh: "脊背扭转", device_text_en: "Spine twist", screen_state: "next_move" },
      { step_id: "ss4", name_zh: "放松", name_en: "Drift Off", duration_seconds: 90,
        instruction_zh: "平躺，全身放松，感受每一次呼吸把身体带向睡眠。",
        instruction_en: "Lie flat, relax everything, feel each breath carry you toward sleep.",
        device_text_zh: "准备入睡", device_text_en: "Drift off", screen_state: "night_calm" },
    ],
    safety_note_zh: "这只是根据记录整理，不是医学诊断。",
    safety_note_en: "This is based on your records only, not medical advice.",
    completion_record_template: {
      kind: "action", title: "睡前舒缓拉伸",
      summary: "完成了睡前舒缓拉伸练习。",
      tags: ["sleep", "stretch", "bedtime"], mood_tags: [], body_tags: [], related_action: "睡前舒缓拉伸",
    },
  },
};

SKILL_REGISTRY.heel_drop_game_60s = {
  ...SKILL_REGISTRY.gentle_stretch_5min,
  skill_id: "heel_drop_game_60s",
  type: "move",
  title_zh: "60 秒踮脚小游戏",
  title_en: "60-Second Heel Drop Game",
  description_zh: "用很轻的踮脚节奏做一个短小游戏，随时可以停下。",
  description_en: "A very short heel-drop game flow. Stop anytime.",
  duration_seconds: 60,
  intensity: "very_low",
  tags: ["game", "heel_drop", "gentle", "move"],
  steps: [
    { step_id: "hd1", name_zh: "扶稳", name_en: "Hold Support", duration_seconds: 15,
      instruction_zh: "扶好椅背或桌边，脚跟轻轻抬起。",
      instruction_en: "Hold a chair or table, gently lift your heels.",
      device_text_zh: "扶稳再开始", device_text_en: "Hold steady", screen_state: "exercise_countdown" },
    { step_id: "hd2", name_zh: "轻落", name_en: "Drop Gently", duration_seconds: 30,
      instruction_zh: "脚跟轻轻落下，不要用力震动身体。",
      instruction_en: "Let your heels drop gently. Do not jar your body.",
      device_text_zh: "轻轻落下", device_text_en: "Drop softly", screen_state: "exercise_countdown" },
    { step_id: "hd3", name_zh: "停下", name_en: "Rest", duration_seconds: 15,
      instruction_zh: "停下来，感受一下小腿和呼吸。",
      instruction_en: "Stop and notice your calves and breath.",
      device_text_zh: "完成了", device_text_en: "Done", screen_state: "next_move" },
  ],
  completion_record_template: {
    kind: "action",
    title: "60 秒踮脚小游戏",
    summary: "完成了 60 秒轻量踮脚小游戏。",
    tags: ["game", "heel_drop", "move"],
    mood_tags: [],
    body_tags: [],
    related_action: "60 秒踮脚小游戏",
  },
};

SKILL_REGISTRY.neck_relax_game_60s = {
  ...SKILL_REGISTRY.neck_relax_3min,
  skill_id: "neck_relax_game_60s",
  type: "move",
  title_zh: "60 秒肩颈小游戏",
  title_en: "60-Second Neck Relax Game",
  description_zh: "用短小游戏方式做肩颈放松，轻柔、不追求幅度。",
  description_en: "A short game-like neck and shoulder relaxation flow.",
  duration_seconds: 60,
  intensity: "very_low",
  tags: ["game", "neck", "shoulder", "move"],
  steps: [
    { step_id: "ng1", name_zh: "转肩", name_en: "Shoulder Roll", duration_seconds: 20,
      instruction_zh: "肩膀慢慢向后转两圈，动作小一点也可以。",
      instruction_en: "Slowly roll shoulders backward twice. Small movement is fine.",
      device_text_zh: "慢慢转肩", device_text_en: "Roll shoulders", screen_state: "exercise_countdown" },
    { step_id: "ng2", name_zh: "看远", name_en: "Look Far", duration_seconds: 20,
      instruction_zh: "轻轻抬头看远处，让脖子放松。",
      instruction_en: "Gently look into the distance and relax your neck.",
      device_text_zh: "看向远处", device_text_en: "Look far", screen_state: "exercise_countdown" },
    { step_id: "ng3", name_zh: "放松", name_en: "Rest", duration_seconds: 20,
      instruction_zh: "停下来，感受肩颈有没有松一点。",
      instruction_en: "Stop and notice if your neck feels a little looser.",
      device_text_zh: "完成了", device_text_en: "Done", screen_state: "next_move" },
  ],
  completion_record_template: {
    kind: "action",
    title: "60 秒肩颈小游戏",
    summary: "完成了 60 秒肩颈放松小游戏。",
    tags: ["game", "neck", "shoulder", "move"],
    mood_tags: [],
    body_tags: ["肩颈"],
    related_action: "60 秒肩颈小游戏",
  },
};

// Aliases from the API contract (2026-06-24) → our registry keys.
// Backend may return either name; both resolve to the same skill.
const SKILL_ALIASES: Record<string, string> = {
  night_low_light_companion: "night_calm",
  hot_flash_calm_90s:        "hot_flash_calm",
  knee_friendly_5min:        "knee_friendly_move",
  bedtime_stretch_5min:      "sleep_stretch",
  talk_and_sort_3min:        "emotion_overload",
  breathing_60s:             "breathing_60s",   // identity, keep explicit
};

export function getSkill(skillId: string): Skill | undefined {
  return SKILL_REGISTRY[skillId] ?? SKILL_REGISTRY[SKILL_ALIASES[skillId] ?? ""];
}

export function allSkills(): Skill[] {
  return Object.values(SKILL_REGISTRY);
}
