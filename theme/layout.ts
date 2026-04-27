import { dp, wp } from "@/theme/responsive";

export type ScreenMetrics = {
  contentGap: number;
  contentMaxWidth: number;
  horizontalPadding: number;
  panelGap: number;
  sectionGap: number;
};

export function getScreenMetrics(width: number): ScreenMetrics {
  if (width >= 920) {
    return {
      contentGap: dp(width, 24),
      contentMaxWidth: 860,
      horizontalPadding: wp(width, 4),
      panelGap: dp(width, 18),
      sectionGap: dp(width, 28),
    };
  }

  if (width >= 640) {
    return {
      contentGap: dp(width, 22),
      contentMaxWidth: 760,
      horizontalPadding: dp(width, 24),
      panelGap: dp(width, 16),
      sectionGap: dp(width, 24),
    };
  }

  return {
    contentGap: dp(width, 18),
    contentMaxWidth: 560,
    horizontalPadding: dp(width, 18),
    panelGap: dp(width, 14),
    sectionGap: dp(width, 20),
  };
}
