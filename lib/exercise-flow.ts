import { type ExerciseIllustration, type FocusArea } from "@/types/domain";

type RawRecord = Record<string, unknown>;

export type ProgramProgress = {
  completedExercisesCount: number;
  exercisesCount: number;
  isFinished: boolean;
  progressLabel: string;
};

export type ProgramSummary = {
  code: string | null;
  description: string | null;
  difficultyLabel: string | null;
  focusArea: FocusArea | null;
  focusAreaLabel: string | null;
  id: string;
  illustration: ExerciseIllustration;
  progress: ProgramProgress;
  title: string;
  totalDurationSec: number;
};

export type ExerciseProgress = {
  completedStepIndexes: number[];
  completedStepsCount: number;
  isFinished: boolean;
  nextStepIndex: number | null;
  stepsCount: number;
};

export type ExerciseSummary = {
  bodyArea: FocusArea | null;
  code: string | null;
  description: string | null;
  exerciseOrder: number | null;
  id: string;
  isFavorite: boolean;
  progress: ExerciseProgress;
  title: string;
  totalDurationSec: number;
  is_finished?: boolean;
};

export type ExerciseStepDetail = {
  cautionNote: string;
  durationSec: number;
  image: {
    alt: string | null;
    height: number | null;
    thumbnailUrl: string | null;
    url: string | null;
    width: number | null;
  };
  id: string;
  instruction: string;
  stepIndex: number;
  title: string;
};

export type ExerciseTiming = {
  prescription: string | null;
  repetitions: string | null;
  seconds: number | null;
  sets: string | null;
  type: string | null;
};

export type ExerciseInstructionStepImage = {
  alt: string | null;
  thumbnailUrl: string | null;
  url: string | null;
};

export type ExerciseMetadata = {
  contentSource: string | null;
  equipment: string[];
  instructionStepImages: ExerciseInstructionStepImage[];
  instructionSteps: string[];
  movementType: string | null;
  primaryTargets: string[];
  safetyFlags: string[];
  therapeuticGoals: string[];
  timing: ExerciseTiming;
};

export type ExerciseDetail = {
  bodyArea: FocusArea | null;
  code: string | null;
  description: string | null;
  id: string;
  illustration: ExerciseIllustration;
  isFavorite: boolean;
  metadata: ExerciseMetadata;
  programId: string;
  programTitle: string;
  progress: ExerciseProgress;
  steps: ExerciseStepDetail[];
  title: string;
  totalDurationSec: number;
};

export type ExerciseStepCompletionResponse = {
  completedStepIndexes: number[];
  completedStepsCount: number;
  exerciseId: string;
  isFinished: boolean;
  nextStepIndex: number | null;
  programId: string;
  programProgress: ProgramProgress;
  stepsCount: number;
};

const ILLUSTRATION_BY_FOCUS: Record<FocusArea, ExerciseIllustration> = {
  back: {
    background: "#F5ECFE",
    icon: "leaf",
    tint: "#7650C8",
  },
  knee: {
    background: "#E6F7F2",
    icon: "fitness",
    tint: "#13795B",
  },
  mobility: {
    background: "#EEF2FF",
    icon: "body",
    tint: "#3459B6",
  },
  neck: {
    background: "#D9EEF8",
    icon: "accessibility",
    tint: "#1C6B8C",
  },
  shoulder: {
    background: "#E9F0FE",
    icon: "walk",
    tint: "#3459B6",
  },
};

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
}

function asObject(value: unknown): RawRecord | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as RawRecord;
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function readNumberArray(value: unknown): number[] {
  return asArray(value)
    .map((item) => readNumber(item))
    .filter((item): item is number => item !== null)
    .sort((leftValue, rightValue) => leftValue - rightValue);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return trimmedValue;
}

function readStringArray(value: unknown): string[] {
  return asArray(value)
    .map((item) => readString(item))
    .filter((item): item is string => item !== null);
}

function readFocusArea(value: unknown): FocusArea | null {
  if (
    value === "back" ||
    value === "knee" ||
    value === "mobility" ||
    value === "neck" ||
    value === "shoulder"
  ) {
    return value;
  }

  return null;
}

function getResultsArray(payload: unknown): unknown[] {
  const payloadObject = asObject(payload);

  if (payloadObject === null) {
    return asArray(payload);
  }

  return asArray(payloadObject.results ?? payloadObject.items ?? payload);
}

function getExerciseIllustration(
  focusArea: FocusArea | null,
): ExerciseIllustration {
  if (focusArea === null) {
    return ILLUSTRATION_BY_FOCUS.mobility;
  }

  return ILLUSTRATION_BY_FOCUS[focusArea];
}

function normalizeProgramProgress(
  progressSource: RawRecord | null,
): ProgramProgress {
  const completedExercisesCount =
    readNumber(progressSource?.completed_exercises_count) ??
    readNumber(progressSource?.completed_exercises) ??
    0;
  const exercisesCount =
    readNumber(progressSource?.exercises_count) ??
    readNumber(progressSource?.exercise_count) ??
    readNumber(progressSource?.total_exercises) ??
    0;
  const isFinished = readBoolean(progressSource?.is_finished) ?? false;
  const progressLabel =
    exercisesCount > 0
      ? `${completedExercisesCount}/${exercisesCount} exercises complete`
      : "No exercises yet";

  return {
    completedExercisesCount,
    exercisesCount,
    isFinished,
    progressLabel,
  };
}

function normalizeExerciseProgress(
  progressSource: RawRecord | null,
): ExerciseProgress {
  const completedStepIndexes =
    readNumberArray(progressSource?.completed_step_indexes) ?? [];
  const completedStepsCount =
    readNumber(progressSource?.completed_steps_count) ??
    readNumber(progressSource?.completed_steps) ??
    completedStepIndexes.length;
  const stepsCount =
    readNumber(progressSource?.steps_count) ??
    readNumber(progressSource?.step_count) ??
    0;
  const nextStepIndexValue = readNumber(progressSource?.next_step_index);
  const nextStepIndex =
    nextStepIndexValue !== null && nextStepIndexValue >= 0
      ? nextStepIndexValue
      : null;
  const isFinished =
    readBoolean(progressSource?.is_finished) ??
    (stepsCount > 0 && completedStepsCount >= stepsCount);

  return {
    completedStepIndexes,
    completedStepsCount,
    isFinished,
    nextStepIndex,
    stepsCount,
  };
}

function normalizeExerciseInstructionStepImage(
  payload: unknown,
): ExerciseInstructionStepImage {
  const imageObject = asObject(payload);

  if (imageObject === null) {
    return {
      alt: null,
      thumbnailUrl: null,
      url: null,
    };
  }

  return {
    alt: readString(imageObject.alt),
    thumbnailUrl:
      readString(imageObject.thumbnail_url) ??
      readString(imageObject.thumbnailUrl),
    url: readString(imageObject.url),
  };
}

function normalizeExerciseTiming(payload: RawRecord | null): ExerciseTiming {
  return {
    prescription: readString(payload?.prescription),
    repetitions: readString(payload?.repetitions),
    seconds: readNumber(payload?.seconds),
    sets: readString(payload?.sets),
    type: readString(payload?.type),
  };
}

function normalizeExerciseMetadata(
  payload: RawRecord | null,
): ExerciseMetadata {
  return {
    contentSource:
      readString(payload?.content_source) ?? readString(payload?.contentSource),
    equipment: readStringArray(payload?.equipment),
    instructionStepImages: asArray(payload?.instruction_step_images).map(
      normalizeExerciseInstructionStepImage,
    ),
    instructionSteps: readStringArray(payload?.instruction_steps),
    movementType:
      readString(payload?.movement_type) ?? readString(payload?.movementType),
    primaryTargets: readStringArray(payload?.primary_targets),
    safetyFlags: readStringArray(payload?.safety_flags),
    therapeuticGoals: readStringArray(payload?.therapeutic_goals),
    timing: normalizeExerciseTiming(asObject(payload?.timing)),
  };
}

function normalizeProgramSummary(program: unknown): ProgramSummary {
  const programObject = asObject(program);

  if (programObject === null) {
    throw new Error("Program payload was not an object.");
  }

  const idValue =
    readString(programObject.id) ?? readString(programObject.uuid);

  if (idValue === null) {
    throw new Error("Program payload is missing an id.");
  }

  const progressSource =
    asObject(programObject.current_user_program_progress) ??
    asObject(programObject.program_progress) ??
    asObject(programObject.user_progress) ??
    programObject;
  const focusArea = readFocusArea(programObject.focus_area);

  return {
    code: readString(programObject.code),
    description: readString(programObject.description),
    difficultyLabel: readString(programObject.difficulty_label),
    focusArea,
    focusAreaLabel: readString(programObject.focus_area_label),
    id: idValue,
    illustration: getExerciseIllustration(focusArea),
    progress: normalizeProgramProgress(progressSource),
    title: readString(programObject.title) ?? "Untitled program",
    totalDurationSec: readNumber(programObject.total_duration_sec) ?? 0,
  };
}

function normalizeExerciseSummary(exercise: unknown): ExerciseSummary {
  const exerciseObject = asObject(exercise);

  if (exerciseObject === null) {
    throw new Error("Exercise payload was not an object.");
  }

  const idValue =
    readString(exerciseObject.exercise_id) ??
    readString(exerciseObject.id) ??
    readString(exerciseObject.uuid);

  if (idValue === null) {
    throw new Error("Exercise payload is missing an id.");
  }

  const progressSource =
    asObject(exerciseObject.current_user_exercise_progress) ??
    asObject(exerciseObject.exercise_progress) ??
    asObject(exerciseObject.user_progress) ??
    exerciseObject;

  return {
    bodyArea: readFocusArea(exerciseObject.body_area),
    code: readString(exerciseObject.code),
    description: readString(exerciseObject.description),
    exerciseOrder: readNumber(exerciseObject.exercise_order),
    id: idValue,
    isFavorite: readBoolean(exerciseObject.is_favorite) ?? false,
    progress: normalizeExerciseProgress(progressSource),
    title: readString(exerciseObject.title) ?? "Untitled exercise",
    totalDurationSec: readNumber(exerciseObject.total_duration_sec) ?? 0,
  };
}

function normalizeExerciseStep(step: unknown): ExerciseStepDetail {
  const stepObject = asObject(step);

  if (stepObject === null) {
    throw new Error("Exercise step payload was not an object.");
  }

  const stepIndex = readNumber(stepObject.step_index) ?? 0;
  const idValue =
    readString(stepObject.id) ??
    readString(stepObject.uuid) ??
    `step-${stepIndex}`;

  const imageObject = asObject(stepObject.image);

  return {
    cautionNote:
      readString(stepObject.caution_note) ??
      readString(stepObject.cautionNote) ??
      "Move in a comfortable range and stop if symptoms worsen.",
    durationSec:
      readNumber(stepObject.duration_sec) ??
      readNumber(stepObject.durationSec) ??
      0,
    image: {
      alt: readString(imageObject?.alt) ?? readString(imageObject?.image_alt),
      height:
        readNumber(imageObject?.height) ??
        readNumber(imageObject?.image_height),
      thumbnailUrl:
        readString(imageObject?.thumbnail_url) ??
        readString(imageObject?.thumbnailUrl),
      url: readString(imageObject?.url) ?? readString(imageObject?.image_url),
      width:
        readNumber(imageObject?.width) ?? readNumber(imageObject?.image_width),
    },
    id: idValue,
    instruction:
      readString(stepObject.instruction) ??
      "Follow the movement comfortably and with control.",
    stepIndex,
    title: readString(stepObject.title) ?? "Untitled step",
  };
}

function normalizeExerciseDetail(
  exercise: unknown,
  programId: string,
  exerciseId: string,
): ExerciseDetail {
  const exerciseObject = asObject(exercise);

  if (exerciseObject === null) {
    throw new Error("Exercise detail payload was not an object.");
  }

  const progressSource =
    asObject(exerciseObject.current_user_exercise_progress) ??
    asObject(exerciseObject.exercise_progress) ??
    asObject(exerciseObject.user_progress) ??
    exerciseObject;
  const focusArea =
    readFocusArea(exerciseObject.focus_area) ??
    readFocusArea(exerciseObject.body_area);

  return {
    bodyArea: readFocusArea(exerciseObject.body_area),
    code: readString(exerciseObject.code),
    description: readString(exerciseObject.description),
    id:
      readString(exerciseObject.exercise_id) ??
      readString(exerciseObject.id) ??
      exerciseId,
    illustration: getExerciseIllustration(focusArea),
    isFavorite: readBoolean(exerciseObject.is_favorite) ?? false,
    metadata: normalizeExerciseMetadata(asObject(exerciseObject.metadata)),
    programId,
    programTitle:
      readString(exerciseObject.program_title) ??
      readString(asObject(exerciseObject.program)?.title) ??
      "Exercise program",
    progress: normalizeExerciseProgress(progressSource),
    steps: asArray(exerciseObject.steps).map(normalizeExerciseStep),
    title: readString(exerciseObject.title) ?? "Untitled exercise",
    totalDurationSec: readNumber(exerciseObject.total_duration_sec) ?? 0,
  };
}

function normalizeExerciseStepCompletionResponse(
  payload: unknown,
): ExerciseStepCompletionResponse {
  const payloadObject = asObject(payload);

  if (payloadObject === null) {
    throw new Error("Exercise step completion payload was not an object.");
  }

  return {
    completedStepIndexes: readNumberArray(payloadObject.completed_step_indexes),
    completedStepsCount: readNumber(payloadObject.completed_steps_count) ?? 0,
    exerciseId: readString(payloadObject.exercise_id) ?? "",
    isFinished: readBoolean(payloadObject.is_finished) ?? false,
    nextStepIndex: readNumber(payloadObject.next_step_index),
    programId: readString(payloadObject.program_id) ?? "",
    programProgress: normalizeProgramProgress(
      asObject(payloadObject.program_progress),
    ),
    stepsCount: readNumber(payloadObject.steps_count) ?? 0,
  };
}

export function parseProgramsPayload(payload: unknown): ProgramSummary[] {
  return getResultsArray(payload).map(normalizeProgramSummary);
}

export function parseProgramExercisesPayload(
  payload: unknown,
): ExerciseSummary[] {
  return getResultsArray(payload).map(normalizeExerciseSummary);
}

export function parseExerciseDetailPayload(
  payload: unknown,
  programId: string,
  exerciseId: string,
): ExerciseDetail {
  return normalizeExerciseDetail(payload, programId, exerciseId);
}

export function parseExerciseStepCompletionPayload(
  payload: unknown,
): ExerciseStepCompletionResponse {
  return normalizeExerciseStepCompletionResponse(payload);
}
