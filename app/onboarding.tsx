import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  type LayoutRectangle,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { useSession } from "@/providers/session-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { getScreenMetrics } from "@/theme/layout";
import {
  type FocusArea,
  type UserIntakeProfile,
  type WeeklyGoal,
} from "@/types/domain";

type AgeRange = UserIntakeProfile["ageRange"];
type Gender = UserIntakeProfile["gender"];
type SelectableFocusArea = FocusArea;
type BodyView = "front" | "back";
type OnboardingStep = 0 | 1 | 2 | 3;
type OnboardingStepIndex = -1 | OnboardingStep;

type FocusOption = {
  icon: keyof typeof Feather.glyphMap;
  value: SelectableFocusArea;
};

// ─── Body figure image analysis ───────────────────────────────────────────────
// The PNG images are 1512×800 (landscape) with the figure centered.
// The actual body silhouette occupies roughly:
//   horizontal: 40%–60% of image width (center band ~20% wide)
//   vertical:   5%–97% of image height
// When rendered with resizeMode="contain" in a portrait figure box,
// the image will be letterboxed. We compute where the figure actually sits
// inside the rendered box and offset hotspots accordingly.
//
// Since images are wide/short PNGs shown in a tall/narrow box:
//   - rendered image height = box height
//   - rendered image width  = box height * (imageW / imageH)
//   - horizontal offset     = (boxWidth - renderedWidth) / 2  (will be negative = clipped by overflow:hidden, fine)
//
// The figure body within the full PNG:
//   bodyLeft   = 40% of PNG width
//   bodyRight  = 60% of PNG width  → bodyWidth = 20% of PNG width
//   bodyTop    = 5%  of PNG height
//   bodyBottom = 97% of PNG height → bodyHeight = 92% of PNG height
//
// For a hotspot at (bx, by) in body-fraction coords (0–1):
//   pngX = 0.40 + bx * 0.20   (fraction of full PNG width)
//   pngY = 0.05 + by * 0.92   (fraction of full PNG height)
//
// Then convert to rendered pixel coords inside the figure box.

// PNG natural dimensions
const PNG_ASPECT = 1512 / 800; // ≈ 1.89  (wide image)

// Where the body silhouette sits inside the PNG (fractions of PNG dimensions)
const BODY_PNG_LEFT = 0.395;
const BODY_PNG_WIDTH = 0.21;
const BODY_PNG_TOP = 0.04;
const BODY_PNG_HEIGHT = 0.93;

// The figure stage occupies the left portion of the canvas
// (the label column lives on the right)
const FIGURE_STAGE_WIDTH_FRAC = 0.62; // fraction of canvas width
const FIGURE_STAGE_LEFT_FRAC = 0.0;
const CANVAS_HEIGHT = 420;
const LABEL_CARD_HEIGHT = 40;
const LABEL_COL_RIGHT_MARGIN = 10;

// ─── Hotspot definitions in body-local coordinates ────────────────────────────
// (bx, by) = fraction within the body silhouette bounding box defined above.
// bx=0 → left shoulder tip, bx=1 → right shoulder tip
// by=0 → top of head, by=1 → bottom of feet

type BodyHotspotDef = { bx: number; by: number };

type AreaDef = {
  dots: BodyHotspotDef[];
  id: SelectableFocusArea;
  labelKey: string;
  labelTopFrac: number; // fraction of CANVAS_HEIGHT for label card top
  side: BodyView;
};

const AREA_DEFS: AreaDef[] = [
  // ── FRONT ──
  {
    id: "neck",
    labelKey: "neck",
    side: "front",
    labelTopFrac: 0.05,
    dots: [{ bx: 0.5, by: 0.12 }],
  },
  {
    id: "shoulder",
    labelKey: "shoulder",
    side: "front",
    labelTopFrac: 0.22,
    dots: [
      { bx: 0.18, by: 0.22 },
      { bx: 0.82, by: 0.22 },
    ],
  },
  {
    id: "knee",
    labelKey: "knee",
    side: "front",
    labelTopFrac: 0.6,
    dots: [
      { bx: 0.36, by: 0.72 },
      { bx: 0.64, by: 0.72 },
    ],
  },
  // ── BACK ──
  {
    id: "neck",
    labelKey: "neck",
    side: "back",
    labelTopFrac: 0.05,
    dots: [{ bx: 0.5, by: 0.12 }],
  },
  {
    id: "shoulder",
    labelKey: "shoulder",
    side: "back",
    labelTopFrac: 0.22,
    dots: [
      { bx: 0.18, by: 0.22 },
      { bx: 0.82, by: 0.22 },
    ],
  },
  {
    id: "back",
    labelKey: "back",
    side: "back",
    labelTopFrac: 0.42,
    dots: [{ bx: 0.5, by: 0.44 }],
  },
];

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/**
 * Convert a body-local (bx, by) fraction into pixel coords
 * inside the figure stage box.
 *
 * The PNG is rendered with resizeMode="contain" inside the figure stage.
 * Because the PNG is wider than tall and the stage is taller than wide,
 * the image will be scaled so its WIDTH fills the stage width, and the
 * top/bottom will be cropped (or there will be vertical letterbox).
 *
 * Actually for a wide PNG in a portrait box with contain:
 *   - scale by width  → renderedH = stageW / PNG_ASPECT  (shorter than stageH)
 *   - vertical gap    = (stageH - renderedH) / 2  (letterbox top & bottom)
 */
function bodyToStageCoords(
  bx: number,
  by: number,
  stageW: number,
  stageH: number,
): { x: number; y: number } {
  // Image is scaled so its height = stageH (cover mode, portrait box, wide PNG)
  const renderedH = stageH;
  const renderedW = stageH * PNG_ASPECT; // wider than stageW → crops left+right

  // Horizontal crop: image is centered, so left edge is offset negatively
  const offsetX = (stageW - renderedW) / 2; // negative value

  // Convert body-local → PNG-fraction → rendered pixels
  const pngFracX = BODY_PNG_LEFT + bx * BODY_PNG_WIDTH;
  const pngFracY = BODY_PNG_TOP + by * BODY_PNG_HEIGHT;

  const x = offsetX + pngFracX * renderedW;
  const y = pngFracY * renderedH;

  return { x, y };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AgeOption = { label: string; value: AgeRange };
type GoalOption = { label: string; value: WeeklyGoal };
type DailyStepGoalOption = {
  label: string;
  value: UserIntakeProfile["dailyStepGoal"];
};
type GenderOption = { label: string; value: Gender };
type ProgressStep = {
  description: string;
  index: OnboardingStep;
  title: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUS_OPTIONS: FocusOption[] = [
  { icon: "user", value: "neck" },
  { icon: "activity", value: "shoulder" },
  { icon: "align-center", value: "back" },
  { icon: "disc", value: "knee" },
  { icon: "move", value: "mobility" },
];

const AGE_OPTIONS: AgeOption[] = [
  { label: "18-29", value: "18-29" },
  { label: "30-44", value: "30-44" },
  { label: "45-59", value: "45-59" },
  { label: "60+", value: "60+" },
];

const GENDER_OPTIONS: GenderOption[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const WEEKLY_GOALS: GoalOption[] = [
  { label: "2 sessions", value: 2 },
  { label: "3 sessions", value: 3 },
  { label: "4 sessions", value: 4 },
  { label: "5 sessions", value: 5 },
];

const STEP_GOALS: DailyStepGoalOption[] = [
  { label: "3,000", value: 3000 },
  { label: "5,000", value: 5000 },
  { label: "7,000", value: 7000 },
  { label: "9,000", value: 9000 },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function getProgressSteps(t: (key: string) => string): ProgressStep[] {
  return [
    {
      description: t("onboarding.progress.aboutDesc"),
      index: 0,
      title: t("onboarding.progress.aboutTitle"),
    },
    {
      description: t("onboarding.progress.genderDesc"),
      index: 1,
      title: t("onboarding.progress.genderTitle"),
    },
    {
      description: t("onboarding.progress.focusDesc"),
      index: 2,
      title: t("onboarding.progress.focusTitle"),
    },
    {
      description: t("onboarding.progress.goalsDesc"),
      index: 3,
      title: t("onboarding.progress.goalsTitle"),
    },
  ];
}

function getNextStepIndex(stepIndex: OnboardingStepIndex): OnboardingStep {
  if (stepIndex === -1) return 0;
  if (stepIndex === 0) return 1;
  if (stepIndex === 1) return 2;
  return 3;
}

function getBodyViewForFocusArea(focusArea: SelectableFocusArea): BodyView {
  return focusArea === "back" ? "back" : "front";
}

function resolveSelectableFocusArea(
  focusArea: FocusArea | undefined,
): SelectableFocusArea {
  if (
    focusArea === "neck" ||
    focusArea === "shoulder" ||
    focusArea === "back" ||
    focusArea === "knee" ||
    focusArea === "mobility"
  )
    return focusArea;
  return "back";
}

function getBodyImageSource(
  bodyView: BodyView,
  gender: Gender,
): ImageSourcePropType {
  const g = gender === "female" ? "female" : "male";
  if (g === "female" && bodyView === "front")
    return require("@/assets/images/female_front.png");
  if (g === "female" && bodyView === "back")
    return require("@/assets/images/female_back.png");
  if (bodyView === "front") return require("@/assets/images/men_front.png");
  return require("@/assets/images/men_back.png");
}

function titledStepLabel(current: number, total: number): string {
  return `${current}/${total}`;
}

// ─── ConnectorLines ───────────────────────────────────────────────────────────

function ConnectorLines(props: {
  accentColor: string;
  areas: AreaDef[];
  borderColor: string;
  labelColLeft: number; // absolute x inside canvas where label column starts
  stageW: number;
  stageH: number;
  stageLeft: number; // absolute x inside canvas where figure stage starts
  focusArea: SelectableFocusArea;
}) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {props.areas.map((area) => {
        const isSelected = props.focusArea === area.id;
        const stroke = isSelected ? props.accentColor : props.borderColor;
        const cardCenterY =
          area.labelTopFrac * CANVAS_HEIGHT + LABEL_CARD_HEIGHT / 2;

        return area.dots.map((dot, di) => {
          const local = bodyToStageCoords(
            dot.bx,
            dot.by,
            props.stageW,
            props.stageH,
          );
          const dotX = props.stageLeft + local.x;
          const dotY = local.y;
          const midX = (dotX + props.labelColLeft) / 2;

          const d = `M ${dotX} ${dotY} C ${midX} ${dotY}, ${midX} ${cardCenterY}, ${props.labelColLeft} ${cardCenterY}`;

          return (
            <Path
              d={d}
              fill="none"
              key={`${area.side}-${area.id}-${di}`}
              stroke={stroke}
              strokeDasharray="5,3"
              strokeLinecap="round"
              strokeWidth={1.5}
            />
          );
        });
      })}
    </Svg>
  );
}

// ─── ProgressHeader ───────────────────────────────────────────────────────────

function ProgressHeader(props: {
  currentStep: ProgressStep;
  stepIndex: OnboardingStep;
  steps: ProgressStep[];
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressLines}>
        {props.steps.map((step) => {
          const isActive = props.stepIndex === step.index;
          const isComplete = props.stepIndex > step.index;
          return (
            <View
              key={step.index}
              style={[
                styles.progressLine,
                {
                  backgroundColor:
                    isActive || isComplete
                      ? colors.accent
                      : colors.surfaceMuted,
                  opacity: isActive ? 1 : isComplete ? 0.9 : 0.6,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.progressCopy}>
        <Text style={[styles.progressEyebrow, { color: colors.accent }]}>
          {titledStepLabel(props.stepIndex + 1, props.steps.length)}
        </Text>
        <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>
          {props.currentStep.title}
        </Text>
        <Text
          style={[styles.progressDescription, { color: colors.textSecondary }]}
        >
          {props.currentStep.description}
        </Text>
      </View>
    </View>
  );
}

// ─── SelectableCard ───────────────────────────────────────────────────────────

function SelectableCard(props: {
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  isSelected: boolean;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const isCompact = props.icon === undefined && props.description === undefined;
  const isDetailed =
    props.icon !== undefined && props.description !== undefined;

  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.selectableCard,
        isCompact ? styles.selectableCardCompact : null,
        isDetailed ? styles.selectableCardDetailed : null,
        {
          backgroundColor: props.isSelected
            ? colors.accent + "14"
            : colors.card,
          borderColor: props.isSelected ? colors.accent : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.selectableCardHeader,
          isCompact ? styles.selectableCardHeaderCompact : null,
        ]}
      >
        {props.icon !== undefined ? (
          <View
            style={[
              styles.selectableCardIcon,
              { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <Feather
              color={props.isSelected ? colors.accent : colors.textMuted}
              name={props.icon}
              size={18}
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.selectableCardLabel,
            isCompact ? styles.selectableCardLabelCompact : null,
            props.labelStyle ?? null,
            { color: colors.textPrimary },
          ]}
        >
          {props.label}
        </Text>
        <View
          style={[
            styles.selectionIndicator,
            isCompact ? styles.selectionIndicatorCompact : null,
            {
              backgroundColor: props.isSelected ? colors.accent : "transparent",
              borderColor: props.isSelected ? colors.accent : colors.border,
            },
          ]}
        >
          {props.isSelected ? (
            <Feather color={colors.accentContrast} name="check" size={12} />
          ) : null}
        </View>
      </View>
      {props.description !== undefined ? (
        <Text
          style={[
            styles.selectableCardDescription,
            { color: colors.textSecondary },
          ]}
        >
          {props.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── BodyAreaSelector ─────────────────────────────────────────────────────────

function BodyAreaSelector(props: {
  bodyView: BodyView;
  focusArea: SelectableFocusArea;
  gender: Gender;
  onBodyViewChange: (v: BodyView) => void;
  onFocusAreaSelect: (f: SelectableFocusArea) => void;
  t: (key: string) => string;
}) {
  const { colors } = useAppTheme();
  const [canvasLayout, setCanvasLayout] = useState<LayoutRectangle | null>(
    null,
  );
  const [toggleLayout, setToggleLayout] = useState<LayoutRectangle | null>(
    null,
  );

  const slideValue = useRef(
    new Animated.Value(props.bodyView === "front" ? 0 : 1),
  ).current;
  const toggleValue = useRef(
    new Animated.Value(props.bodyView === "front" ? 0 : 1),
  ).current;

  useEffect(() => {
    Animated.timing(slideValue, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
      toValue: props.bodyView === "front" ? 0 : 1,
      useNativeDriver: true,
    }).start();
    Animated.timing(toggleValue, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: props.bodyView === "front" ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [props.bodyView, slideValue, toggleValue]);

  const toggleInset = 4;
  const toggleWidth = toggleLayout?.width ?? 0;
  const toggleIndicatorWidth =
    toggleWidth > 0 ? (toggleWidth - toggleInset * 2) / 2 : 0;

  const toggleIndicatorStyle = {
    width: toggleIndicatorWidth,
    transform: [
      {
        translateX: toggleValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, toggleIndicatorWidth],
        }),
      },
    ],
  };

  const frontFigureStyle = {
    opacity: slideValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.06],
    }),
    transform: [
      {
        translateX: slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30],
        }),
      },
      {
        scale: slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.96],
        }),
      },
    ],
  };

  const backFigureStyle = {
    opacity: slideValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.06, 1],
    }),
    transform: [
      {
        translateX: slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
      {
        scale: slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const canvasWidth = canvasLayout?.width ?? 320;
  const canvasHeight = CANVAS_HEIGHT;

  // Figure stage pixel dimensions
  const stageLeft = canvasWidth * FIGURE_STAGE_LEFT_FRAC;
  const stageW = canvasWidth * FIGURE_STAGE_WIDTH_FRAC;
  const stageH = canvasHeight;

  // Label column position
  const labelColLeft = stageLeft + stageW + 6;
  const labelColWidth = canvasWidth - labelColLeft - LABEL_COL_RIGHT_MARGIN;

  const visibleAreas = AREA_DEFS.filter((a) => a.side === props.bodyView);
  const mobilityIsSelected = props.focusArea === "mobility";

  return (
    <View style={styles.bodySelector}>
      {/* Front / Back toggle */}
      <View
        style={[
          styles.bodyViewToggle,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
        onLayout={(event) => setToggleLayout(event.nativeEvent.layout)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bodyViewToggleIndicator,
            { backgroundColor: colors.card },
            toggleIndicatorStyle,
          ]}
        />
        {(["front", "back"] as BodyView[]).map((view) => {
          const isSel = props.bodyView === view;
          return (
            <Pressable
              key={view}
              onPress={() => props.onBodyViewChange(view)}
              style={styles.bodyViewToggleOption}
            >
              <Text
                style={[
                  styles.bodyViewToggleLabel,
                  { color: isSel ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                {props.t(`onboarding.step3.bodyView.${view}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Canvas */}
      <View
        style={[
          styles.bodyCanvas,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
        onLayout={(e) => setCanvasLayout(e.nativeEvent.layout)}
      >
        {/* Figure stage — images rendered here */}
        <View
          style={[
            styles.figureStage,
            {
              left: stageLeft,
              width: stageW,
            },
          ]}
        >
          {/* We use resizeMode="contain" so the PNG is fully visible.
              The PNG is wide (1512×800) so rendered in a portrait box it will
              be scaled to fill the width and letterboxed top/bottom.
              Background is transparent so the canvas bg shows through. */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, frontFigureStyle]}
          >
            <Image
              resizeMode="cover"
              source={getBodyImageSource("front", props.gender)}
              style={styles.bodyFigure}
            />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFillObject, backFigureStyle]}
          >
            <Image
              resizeMode="cover"
              source={getBodyImageSource("back", props.gender)}
              style={styles.bodyFigure}
            />
          </Animated.View>
        </View>

        {/* SVG connector lines — rendered after layout is known */}
        {canvasLayout !== null ? (
          <ConnectorLines
            accentColor={colors.accent}
            areas={visibleAreas}
            borderColor={colors.border}
            focusArea={props.focusArea}
            labelColLeft={labelColLeft}
            stageH={stageH}
            stageLeft={stageLeft}
            stageW={stageW}
          />
        ) : null}

        {/* Hotspot dots — positioned using the same coordinate transform */}
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {visibleAreas.map((area) => {
            const isSelected = props.focusArea === area.id;
            return area.dots.map((dot, di) => {
              const { x, y } = bodyToStageCoords(
                dot.bx,
                dot.by,
                stageW,
                stageH,
              );
              const dotX = stageLeft + x;
              const dotY = y;
              return (
                <View
                  key={`${area.side}-${area.id}-dot-${di}`}
                  style={[
                    styles.hotspot,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                      left: dotX,
                      top: dotY,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.hotspotInner,
                      {
                        backgroundColor: isSelected
                          ? colors.accentContrast
                          : colors.accent,
                      },
                    ]}
                  />
                </View>
              );
            });
          })}
        </View>

        {/* Label cards column */}
        <View
          pointerEvents="box-none"
          style={[
            styles.labelsColumn,
            { left: labelColLeft, width: labelColWidth },
          ]}
        >
          {visibleAreas.map((area) => {
            const isSelected = props.focusArea === area.id;
            return (
              <Pressable
                key={`${area.side}-${area.id}-label`}
                onPress={() => props.onFocusAreaSelect(area.id)}
                style={[
                  styles.labelCard,
                  {
                    backgroundColor: isSelected
                      ? colors.accent + "14"
                      : colors.card,
                    borderColor: isSelected ? colors.accent : colors.border,
                    height: LABEL_CARD_HEIGHT,
                    top: area.labelTopFrac * CANVAS_HEIGHT,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.labelCardText,
                    { color: isSelected ? colors.accent : colors.textPrimary },
                  ]}
                >
                  {props.t(`onboarding.options.focus.${area.labelKey}.label`)}
                </Text>
                <View
                  style={[
                    styles.checkRing,
                    { borderColor: isSelected ? colors.accent : colors.border },
                  ]}
                >
                  {isSelected ? (
                    <Feather color={colors.accent} name="check" size={12} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {/* Mobility — pinned to bottom, no dot or connector needed */}
          <Pressable
            onPress={() => props.onFocusAreaSelect("mobility")}
            style={[
              styles.labelCard,
              styles.mobilityCard,
              {
                backgroundColor: mobilityIsSelected
                  ? colors.accent + "14"
                  : colors.card,
                borderColor: mobilityIsSelected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.labelCardText,
                {
                  color: mobilityIsSelected
                    ? colors.accent
                    : colors.textPrimary,
                },
              ]}
            >
              {props.t("onboarding.options.focus.mobility.label")}
            </Text>
            <View
              style={[
                styles.checkRing,
                {
                  borderColor: mobilityIsSelected
                    ? colors.accent
                    : colors.border,
                },
              ]}
            >
              {mobilityIsSelected ? (
                <Feather color={colors.accent} name="check" size={12} />
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.bodyHint, { color: colors.textSecondary }]}>
        {props.t("onboarding.step3.bodyHint")}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { currentUserId, intakeProfile, profile, saveIntakeProfile } =
    useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const metrics = getScreenMetrics(width);
  const progressSteps = getProgressSteps(t);
  const transitionValue = useRef(new Animated.Value(1)).current;

  const [stepIndex, setStepIndex] = useState<OnboardingStepIndex>(-1);
  const [fullName, setFullName] = useState<string>(profile?.fullName ?? "");
  const [focusArea, setFocusArea] = useState<SelectableFocusArea>(
    resolveSelectableFocusArea(intakeProfile?.focusArea),
  );
  const [ageRange, setAgeRange] = useState<AgeRange>(
    intakeProfile?.ageRange ?? "30-44",
  );
  const [gender, setGender] = useState<Gender>(
    intakeProfile?.gender ?? "prefer_not_to_say",
  );
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(
    intakeProfile?.weeklyGoal ?? 3,
  );
  const [dailyStepGoal, setDailyStepGoal] = useState<
    UserIntakeProfile["dailyStepGoal"]
  >(intakeProfile?.dailyStepGoal ?? 5000);
  const [bodyView, setBodyView] = useState<BodyView>(
    getBodyViewForFocusArea(
      resolveSelectableFocusArea(intakeProfile?.focusArea),
    ),
  );
  const [isIntroTransitionRunning, setIsIntroTransitionRunning] =
    useState(false);

  const nextStepIndex = getNextStepIndex(stepIndex);
  const currentStep = progressSteps[nextStepIndex];
  const activeStepIndex: OnboardingStep = stepIndex === -1 ? 0 : stepIndex;
  const introMinHeight = Math.max(height * 0.84, 620);
  const selectedFocusOption = FOCUS_OPTIONS.find((o) => o.value === focusArea);

  const animateContentIn = () => {
    transitionValue.setValue(0);
    Animated.timing(transitionValue, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => setIsIntroTransitionRunning(false));
  };

  const handleStartOnboarding = () => {
    if (isIntroTransitionRunning) return;
    setIsIntroTransitionRunning(true);
    Animated.timing(transitionValue, {
      duration: 150,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setStepIndex(0);
      animateContentIn();
    });
  };

  const handleContinue = async () => {
    if (stepIndex < 3) {
      setStepIndex((stepIndex + 1) as OnboardingStep);
      return;
    }
    await saveIntakeProfile({
      ageRange,
      dailyStepGoal,
      focusArea,
      fullName:
        fullName.trim().length > 0
          ? fullName.trim()
          : t("onboarding.defaults.fullName"),
      gender,
      weeklyGoal,
    });
    if (currentUserId === null) {
      router.replace("/(auth)/welcome");
      return;
    }
    router.replace("/(tabs)/dashboard");
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    setStepIndex((stepIndex - 1) as OnboardingStep);
  };

  const handleFocusAreaSelect = (next: SelectableFocusArea) => {
    setFocusArea(next);
    if (next !== "mobility") setBodyView(getBodyViewForFocusArea(next));
  };

  const animatedStageStyle = {
    opacity: transitionValue,
    transform: [
      {
        translateX: transitionValue.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: stepIndex >= 0 ? 152 : 28,
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            animatedStageStyle,
            { gap: metrics.sectionGap, maxWidth: metrics.contentMaxWidth },
          ]}
        >
          {stepIndex === -1 ? (
            <View
              style={[
                styles.introLayout,
                {
                  marginHorizontal: -metrics.horizontalPadding,
                  minHeight: introMinHeight,
                },
              ]}
            >
              <View style={styles.introHero}>
                <View
                  style={[
                    styles.introGlow,
                    styles.introGlowTop,
                    { backgroundColor: colors.accent + "14" },
                  ]}
                />
                <View
                  style={[
                    styles.introGlow,
                    styles.introGlowBottom,
                    { backgroundColor: colors.accentSoft + "18" },
                  ]}
                />
                <View
                  style={[
                    styles.introContentWrap,
                    { paddingHorizontal: metrics.horizontalPadding },
                  ]}
                >
                  <View
                    style={[
                      styles.introBadge,
                      { backgroundColor: colors.accent + "14" },
                    ]}
                  >
                    <Feather name="heart" size={14} color={colors.accent} />
                    <Text
                      style={[styles.introBadgeText, { color: colors.accent }]}
                    >
                      {t("onboarding.introBadge")}
                    </Text>
                  </View>

                  <Text
                    style={[styles.introTitle, { color: colors.textPrimary }]}
                  >
                    {t("onboarding.introTitle")}
                  </Text>
                  <Text
                    style={[
                      styles.introSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("onboarding.introSubtitle")}
                  </Text>

                  <View style={styles.illustrationWrap}>
                    <View
                      style={[
                        styles.floatingCard,
                        styles.floatingCardLeft,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Feather
                        name="activity"
                        size={16}
                        color={colors.accent}
                      />
                      <Text
                        style={[
                          styles.floatingCardText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {t("onboarding.introFloatingLeft")}
                      </Text>
                    </View>
                    <Image
                      resizeMode="contain"
                      source={require("@/assets/images/welcome-illustration.png")}
                      style={styles.introIllustration}
                    />
                    <View
                      style={[
                        styles.floatingCard,
                        styles.floatingCardRight,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Feather
                        name="check-circle"
                        size={16}
                        color={colors.accent}
                      />
                      <Text
                        style={[
                          styles.floatingCardText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {t("onboarding.introFloatingRight")}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    disabled={isIntroTransitionRunning}
                    onPress={handleStartOnboarding}
                    style={[
                      styles.introButton,
                      {
                        backgroundColor: colors.accent,
                        opacity: isIntroTransitionRunning ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.introButtonText,
                        { color: colors.accentContrast },
                      ]}
                    >
                      {t("onboarding.introStart")}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={18}
                      color={colors.accentContrast}
                    />
                  </Pressable>

                  <View style={styles.introBenefits}>
                    <View style={styles.introBenefitItem}>
                      <Feather
                        name="clock"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.introBenefitText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("onboarding.introBenefitSetup")}
                      </Text>
                    </View>
                    <View style={styles.introBenefitItem}>
                      <Feather
                        name="shield"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.introBenefitText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("onboarding.introBenefitGuided")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              <ProgressHeader
                currentStep={currentStep}
                stepIndex={activeStepIndex}
                steps={progressSteps}
              />

              <AppCard style={styles.card}>
                <View style={[styles.cardContent, { gap: metrics.panelGap }]}>
                  {/* Step 0 — Name & Age */}
                  {stepIndex === 0 ? (
                    <>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step1.title")}
                        </Text>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.text")}
                        </Text>
                      </View>
                      <View style={styles.namePanel}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.fullNameLabel")}
                        </Text>
                        <TextInput
                          onChangeText={setFullName}
                          placeholder={t(
                            "onboarding.step1.fullNamePlaceholder",
                          )}
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surfaceMuted,
                              borderColor: colors.border,
                              color: colors.textPrimary,
                            },
                          ]}
                          value={fullName}
                        />
                      </View>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.optionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step1.ageTitle")}
                        </Text>
                        <Text
                          style={[
                            styles.optionSubheading,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step1.ageText")}
                        </Text>
                      </View>
                      <View style={styles.grid}>
                        {AGE_OPTIONS.map((option) => (
                          <SelectableCard
                            isSelected={ageRange === option.value}
                            key={option.value}
                            label={option.label}
                            onPress={() => setAgeRange(option.value)}
                          />
                        ))}
                      </View>
                    </>
                  ) : null}

                  {/* Step 1 — Gender */}
                  {stepIndex === 1 ? (
                    <>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step2.title")}
                        </Text>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step2.text")}
                        </Text>
                      </View>
                      <View style={styles.grid}>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectableCard
                            isSelected={gender === option.value}
                            key={option.value}
                            label={t(
                              `onboarding.options.gender.${option.value}`,
                            )}
                            onPress={() => setGender(option.value)}
                          />
                        ))}
                      </View>
                    </>
                  ) : null}

                  {/* Step 2 — Focus area */}
                  {stepIndex === 2 ? (
                    <>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step3.title")}
                        </Text>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("onboarding.step3.text")}
                        </Text>
                      </View>
                      {selectedFocusOption !== undefined ? (
                        <View
                          style={[
                            styles.helperBanner,
                            { backgroundColor: colors.accent + "12" },
                          ]}
                        >
                          <View
                            style={[
                              styles.helperBannerIcon,
                              { backgroundColor: colors.card },
                            ]}
                          >
                            <Feather
                              color={colors.accent}
                              name={selectedFocusOption.icon}
                              size={18}
                            />
                          </View>
                          <Text
                            style={[
                              styles.helperBannerText,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {t(`onboarding.options.focus.${focusArea}.desc`)}
                          </Text>
                        </View>
                      ) : null}
                      <BodyAreaSelector
                        bodyView={bodyView}
                        focusArea={focusArea}
                        gender={gender}
                        onBodyViewChange={setBodyView}
                        onFocusAreaSelect={handleFocusAreaSelect}
                        t={t}
                      />
                    </>
                  ) : null}

                  {/* Step 3 — Goals */}
                  {stepIndex === 3 ? (
                    <>
                      <View style={styles.sectionHeading}>
                        <Text
                          style={[
                            styles.goalCardTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step4.title")}
                        </Text>
                      </View>
                      <View style={styles.goalSection}>
                        <Text
                          style={[
                            styles.goalOptionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step4.weeklyTitle")}
                        </Text>
                        <View style={styles.grid}>
                          {WEEKLY_GOALS.map((option) => (
                            <SelectableCard
                              isSelected={weeklyGoal === option.value}
                              key={option.value}
                              label={t(
                                `onboarding.options.weekly.${option.value}`,
                              )}
                              labelStyle={styles.goalSelectableCardLabel}
                              onPress={() => setWeeklyGoal(option.value)}
                            />
                          ))}
                        </View>
                      </View>
                      <View style={styles.goalSection}>
                        <Text
                          style={[
                            styles.goalOptionHeading,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("onboarding.step4.dailyStepGoalLabel")}
                        </Text>
                        <View style={styles.grid}>
                          {STEP_GOALS.map((option) => (
                            <SelectableCard
                              isSelected={dailyStepGoal === option.value}
                              key={option.value}
                              label={option.label}
                              labelStyle={styles.goalSelectableCardLabel}
                              onPress={() => setDailyStepGoal(option.value)}
                            />
                          ))}
                        </View>
                      </View>
                    </>
                  ) : null}
                </View>
              </AppCard>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {stepIndex >= 0 ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: "transparent",
              borderTopColor: colors.border,
              paddingHorizontal: metrics.horizontalPadding,
            },
          ]}
        >
          <View style={styles.footerContent}>
            {stepIndex === 0 ? (
              <View style={styles.singleActionRow}>
                <AppButton
                  label={t("onboarding.buttons.continue")}
                  onPress={() => {
                    void handleContinue();
                  }}
                  style={styles.footerButton}
                />
              </View>
            ) : (
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <AppButton
                    label={t("onboarding.buttons.back")}
                    onPress={handleBack}
                    style={styles.footerButton}
                    variant="secondary"
                  />
                </View>
                <View style={styles.actionButton}>
                  <AppButton
                    label={
                      stepIndex === 3
                        ? t("onboarding.buttons.finish")
                        : t("onboarding.buttons.continue")
                    }
                    onPress={() => {
                      void handleContinue();
                    }}
                    style={styles.footerButton}
                  />
                </View>
              </View>
            )}
            <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
              {t("onboarding.footerHint")}
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 28, paddingTop: 18 },
  container: { alignSelf: "center", width: "100%" },

  progressSection: { gap: 14 },
  progressLines: { flexDirection: "row", gap: 8 },
  progressLine: { borderRadius: 999, flex: 1, height: 4 },
  progressCopy: { gap: 8 },
  progressEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  progressTitle: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  progressDescription: { fontSize: 14, lineHeight: 20 },

  card: { borderRadius: 30, padding: 22 },
  cardContent: { width: "100%" },
  sectionHeading: { gap: 6 },
  cardTitle: { fontSize: 24, fontWeight: "800", lineHeight: 30 },
  goalCardTitle: { fontSize: 24, fontWeight: "700", lineHeight: 30 },
  cardText: { fontSize: 14, lineHeight: 21 },
  namePanel: { gap: 10 },
  fieldLabel: { fontSize: 14, fontWeight: "700" },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionHeading: { fontSize: 16, fontWeight: "800" },
  goalOptionHeading: { fontSize: 14, lineHeight: 20 },
  optionSubheading: { fontSize: 13, lineHeight: 19 },
  goalSection: { gap: 14 },

  helperBanner: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  helperBannerIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  selectableCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 10,
    minHeight: 132,
    padding: 16,
    width: "47%",
  },
  selectableCardCompact: { gap: 0, minHeight: 0, paddingVertical: 14 },
  selectableCardDetailed: { minHeight: 148, width: "48%" },
  selectableCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectableCardHeaderCompact: { gap: 12 },
  selectableCardIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  selectionIndicator: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  selectionIndicatorCompact: { flexShrink: 0 },
  selectableCardLabel: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  goalSelectableCardLabel: { fontWeight: "600" },
  selectableCardLabelCompact: { flex: 1 },
  selectableCardDescription: { fontSize: 13, lineHeight: 19 },

  // ── Body selector ──
  bodySelector: { gap: 12 },
  bodyViewToggle: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
    position: "relative",
  },
  bodyViewToggleIndicator: {
    borderRadius: 14,
    bottom: 4,
    left: 4,
    position: "absolute",
    top: 4,
    width: "50%",
  },
  bodyViewToggleOption: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    zIndex: 1,
  },
  bodyViewToggleLabel: { fontSize: 14, fontWeight: "800" },

  bodyCanvas: {
    borderRadius: 28,
    borderWidth: 1,
    height: CANVAS_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  figureStage: {
    bottom: 0,
    position: "absolute",
    top: 0,
    // left and width set dynamically
  },
  bodyFigure: {
    height: "100%",
    width: "100%",
  },

  hotspot: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginLeft: -10,
    marginTop: -10,
    position: "absolute",
    width: 20,
  },
  hotspotInner: { borderRadius: 999, height: 7, width: 7 },

  labelsColumn: { bottom: 0, position: "absolute", top: 0 },
  labelCard: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: "absolute",
    width: "100%",
  },
  labelCardText: { flex: 1, fontSize: 12, fontWeight: "800", lineHeight: 15 },
  checkRing: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  mobilityCard: { bottom: 16, top: undefined },
  bodyHint: { fontSize: 13, lineHeight: 19, textAlign: "center" },

  // ── Footer ──
  footer: {
    borderTopWidth: 0,
    bottom: 0,
    left: 0,
    paddingBottom: 24,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  footerContent: { alignSelf: "center", gap: 12, width: "100%" },
  footerHint: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  actionRow: { alignItems: "stretch", flexDirection: "row", gap: 12 },
  singleActionRow: { width: "100%" },
  actionButton: { flex: 1 },
  footerButton: { borderRadius: 18, flex: 0, minHeight: 56, width: "100%" },

  // ── Intro ──
  introLayout: { flex: 1 },
  introHero: {
    flex: 1,
    gap: 18,
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingVertical: 8,
    position: "relative",
  },
  introContentWrap: { flex: 1, gap: 18 },
  introGlow: { borderRadius: 999, position: "absolute" },
  introGlowTop: { height: 220, right: -36, top: 56, width: 220 },
  introGlowBottom: { bottom: 72, height: 280, left: -84, width: 280 },
  introBadge: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  introBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
    textAlign: "center",
  },
  introSubtitle: {
    alignSelf: "center",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 320,
    textAlign: "center",
  },
  illustrationWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginVertical: 10,
  },
  introIllustration: { alignSelf: "center", height: 380, width: "100%" },
  floatingCard: {
    alignItems: "center",
    borderRadius: 18,
    elevation: 6,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    zIndex: 2,
  },
  floatingCardLeft: { left: 4, top: 42 },
  floatingCardRight: { right: 4, bottom: 46 },
  floatingCardText: { fontSize: 12, fontWeight: "800" },
  introButton: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  introButtonText: { fontSize: 16, fontWeight: "900" },
  introBenefits: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
  },
  introBenefitItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  introBenefitText: { fontSize: 12, fontWeight: "700" },
});
