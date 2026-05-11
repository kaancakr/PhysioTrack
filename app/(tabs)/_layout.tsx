import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";

import { useAppTheme } from "@/providers/theme-provider";
import { dp, wp } from "@/theme/responsive";

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const horizontalInset =
    width >= 900 ? wp(width, 22) : width >= 640 ? dp(width, 44) : dp(width, 14);
  const tabHeight = dp(width, 74);
  const tabBarWidth = width - horizontalInset * 2;
  const defaultTabBarStyle = {
    alignSelf: "center" as const,
    backgroundColor: colors.card,
    borderTopColor: "transparent",
    borderRadius: dp(width, 36),
    bottom: dp(width, 16),
    elevation: 0,
    height: tabHeight,
    left: undefined,
    marginHorizontal: horizontalInset,
    paddingBottom: dp(width, 5),
    paddingTop: dp(width, 5),
    position: "absolute" as const,
    right: undefined,
    shadowColor: isDark ? "#000000" : "#21414F",
    shadowOffset: {
      height: 12,
      width: 0,
    },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 24,
    width: tabBarWidth,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: defaultTabBarStyle,
        tabBarLabelStyle: {
          fontSize: dp(width, 12),
          fontWeight: "700",
        },
        tabBarItemStyle: {
          borderRadius: dp(width, 999),
          marginVertical: dp(width, 6),
          marginHorizontal: dp(width, 6),
          overflow: "hidden",
        },
        tabBarIconStyle: {
          marginBottom: dp(width, -2),
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveBackgroundColor: isDark
          ? "rgba(143, 208, 234, 0.16)"
          : "rgba(45, 106, 138, 0.1)",
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="home" size={dp(width, size)} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs/index"
        options={{
          title: "Programs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="body" size={dp(width, size)} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs/[programId]/index"
        options={{
          href: null,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
      <Tabs.Screen
        name="programs/[programId]/exercises/[exerciseId]/index"
        options={{
          href: null,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
      <Tabs.Screen
        name="programs/[programId]/exercises/[exerciseId]/session"
        options={{
          href: null,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
      <Tabs.Screen
        name="programs/[programId]/exercises/[exerciseId]/completed"
        options={{
          href: null,
          tabBarStyle: {
            display: "none",
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={({ route }) => {
          const focusedRouteName = getFocusedRouteNameFromRoute(route);
          const isEditRoute = focusedRouteName === "edit";

          return {
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                color={color}
                name="person-circle"
                size={dp(width, size)}
              />
            ),
            tabBarStyle: isEditRoute
              ? {
                  display: "none",
                }
              : defaultTabBarStyle,
          };
        }}
      />
      <Tabs.Screen
        name="dashboard/notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
