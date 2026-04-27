import { type ExerciseProgram, type FocusArea } from "@/types/domain";

type FocusFilter = {
  label: string;
  value: FocusArea | "all";
};

const neckReleaseProgram: ExerciseProgram = {
  coverImage: {
    background: "#D9EEF8",
    icon: "accessibility",
    tint: "#1C6B8C",
  },
  description:
    "A gentle routine to ease desk-related neck tension with posture resets and controlled movement.",
  difficultyLabel: "Gentle",
  focusArea: "neck",
  focusAreaLabel: "Neck relief",
  id: "neck-release-flow",
  steps: [
    {
      bodyArea: "neck",
      cautionNote: "Stop if the stretch causes tingling or sharp pain.",
      durationSec: 30,
      id: "neck-roll-down",
      image: {
        background: "#E9F6FB",
        icon: "arrow-down-circle",
        tint: "#2D7897",
      },
      instruction: "Lower your chin softly toward your chest and breathe through the stretch.",
      title: "Chin tuck release",
    },
    {
      bodyArea: "neck",
      cautionNote: "Keep both shoulders relaxed and level.",
      durationSec: 30,
      id: "neck-side-stretch",
      image: {
        background: "#E4F1FF",
        icon: "refresh-circle",
        tint: "#2456C7",
      },
      instruction: "Tilt your ear toward one shoulder and hold without forcing the range.",
      title: "Side neck stretch",
    },
    {
      bodyArea: "neck",
      cautionNote: "Move slowly and avoid shrugging your shoulders.",
      durationSec: 40,
      id: "scapular-set",
      image: {
        background: "#E8F5EF",
        icon: "git-compare",
        tint: "#2B8A57",
      },
      instruction: "Draw your shoulder blades slightly back and down, then release with control.",
      title: "Scapular setting",
    },
  ],
  title: "Neck Release Flow",
  totalDurationSec: 100,
};

const shoulderMobilityProgram: ExerciseProgram = {
  coverImage: {
    background: "#E9F0FE",
    icon: "walk",
    tint: "#3459B6",
  },
  description:
    "Simple shoulder mobility movements to open the chest, improve control, and reduce stiffness.",
  difficultyLabel: "Steady",
  focusArea: "shoulder",
  focusAreaLabel: "Shoulder mobility",
  id: "shoulder-mobility-reset",
  steps: [
    {
      bodyArea: "shoulder",
      cautionNote: "Keep the movement pain-free and avoid compensating with your lower back.",
      durationSec: 35,
      id: "shoulder-circles",
      image: {
        background: "#EEF2FF",
        icon: "sync-circle",
        tint: "#4A5BD7",
      },
      instruction: "Make slow shoulder circles forward, then reverse the direction with control.",
      title: "Shoulder circles",
    },
    {
      bodyArea: "shoulder",
      cautionNote: "Only lift as high as your symptoms allow.",
      durationSec: 40,
      id: "wall-slide-air",
      image: {
        background: "#E3F5F3",
        icon: "trending-up",
        tint: "#0F766E",
      },
      instruction: "Reach your arms upward as if sliding along a wall, then lower back down slowly.",
      title: "Air wall slide",
    },
    {
      bodyArea: "shoulder",
      cautionNote: "Keep your ribs down and avoid arching your back.",
      durationSec: 30,
      id: "open-book-press",
      image: {
        background: "#FFF4E6",
        icon: "albums",
        tint: "#B15C00",
      },
      instruction: "Open your elbows outward to stretch the chest, then return to the starting position.",
      title: "Chest opener press",
    },
  ],
  title: "Shoulder Mobility Reset",
  totalDurationSec: 105,
};

const backCareProgram: ExerciseProgram = {
  coverImage: {
    background: "#F5ECFE",
    icon: "leaf",
    tint: "#7650C8",
  },
  description:
    "A calm lower-back routine focused on breathing, core support, and controlled mobility.",
  difficultyLabel: "Restore",
  focusArea: "back",
  focusAreaLabel: "Lower back care",
  id: "lower-back-calm",
  steps: [
    {
      bodyArea: "back",
      cautionNote: "Keep the movement small and comfortable.",
      durationSec: 45,
      id: "pelvic-tilt",
      image: {
        background: "#F4EEFF",
        icon: "radio-button-on",
        tint: "#7D5AC7",
      },
      instruction: "Gently tilt your pelvis to flatten your lower back, then release.",
      title: "Pelvic tilt",
    },
    {
      bodyArea: "back",
      cautionNote: "Breathe out during the reach and do not rush the movement.",
      durationSec: 40,
      id: "single-knee-hug",
      image: {
        background: "#FFF2F2",
        icon: "body",
        tint: "#CC5A71",
      },
      instruction: "Bring one knee toward your chest, hold softly, then switch sides.",
      title: "Alternating knee hug",
    },
    {
      bodyArea: "mobility",
      cautionNote: "Move within a pain-free range only.",
      durationSec: 40,
      id: "cat-cow-standing",
      image: {
        background: "#EEF8EE",
        icon: "repeat",
        tint: "#3A7D44",
      },
      instruction: "Round and extend your upper back slowly while keeping the movement comfortable.",
      title: "Standing cat-cow",
    },
  ],
  title: "Lower Back Calm",
  totalDurationSec: 125,
};

const kneeActivationProgram: ExerciseProgram = {
  coverImage: {
    background: "#E6F7F2",
    icon: "fitness",
    tint: "#13795B",
  },
  description:
    "A short knee-support routine for gentle activation, range of motion, and confidence in daily movement.",
  difficultyLabel: "Gentle",
  focusArea: "knee",
  focusAreaLabel: "Knee support",
  id: "knee-support-sequence",
  steps: [
    {
      bodyArea: "knee",
      cautionNote: "Do not force the knee into pain.",
      durationSec: 35,
      id: "quad-set",
      image: {
        background: "#E9FBF5",
        icon: "checkmark-circle",
        tint: "#198754",
      },
      instruction: "Tighten the front of your thigh and gently press the knee downward.",
      title: "Quad set",
    },
    {
      bodyArea: "knee",
      cautionNote: "Keep the movement smooth and stop if the knee catches.",
      durationSec: 40,
      id: "heel-slide",
      image: {
        background: "#F0F8FF",
        icon: "arrow-forward-circle",
        tint: "#2563EB",
      },
      instruction: "Slide your heel toward you, then extend the leg back out slowly.",
      title: "Heel slide",
    },
    {
      bodyArea: "knee",
      cautionNote: "Hold onto support if you feel unsteady.",
      durationSec: 30,
      id: "sit-to-stand",
      image: {
        background: "#FFF8E7",
        icon: "caret-up-circle",
        tint: "#B7791F",
      },
      instruction: "Stand up from a chair with control, then sit down slowly.",
      title: "Sit to stand",
    },
  ],
  title: "Knee Support Sequence",
  totalDurationSec: 105,
};

export const EXERCISE_PROGRAMS: ExerciseProgram[] = [
  neckReleaseProgram,
  shoulderMobilityProgram,
  backCareProgram,
  kneeActivationProgram,
];

export const FOCUS_FILTERS: FocusFilter[] = [
  { label: "All", value: "all" },
  { label: "Neck", value: "neck" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Back", value: "back" },
  { label: "Knee", value: "knee" },
];
