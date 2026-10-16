import { ReactNode, useRef } from "react";
import {
  Animated, Pressable, StyleProp, Text, TextInput, TextInputProps, TextProps, TextStyle,
  View, ViewProps, ViewStyle,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icon";
import { font, radius, themes, type Theme } from "@/constants/theme";
import { useStore } from "@/lib/store";

export function useTheme(): Theme {
  const { theme } = useStore();
  return themes[theme];
}

/**
 * Every piece of text in the app goes through here, which is how the lowercase
 * treatment and the mono face stay universal without each screen remembering.
 */
export function T({
  size = 13,
  weight = "regular",
  color,
  style,
  tabular,
  ...rest
}: TextProps & {
  size?: number;
  weight?: keyof typeof font;
  color?: string;
  tabular?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          color: color ?? t.text,
          textTransform: "lowercase",
        },
        tabular && { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] },
        style,
      ]}
    />
  );
}

/** The 11px tracked-out section label used above every group. */
export function Kicker({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <T size={11} color={t.neutral[500]} style={[{ letterSpacing: 1.1 }, style]}>
      {children}
    </T>
  );
}

// This is a phone layout. On iPad it doesn't get letterboxed any more, it
// runs in a resizable window, and without a cap everything stretches — the
// nav bar was wrapping "capture" mid-word. Wider than any iPhone so nothing
// changes on phone.
const MAX_CONTENT = 460;

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: t.bg }, style]} edges={["top", "bottom"]}>
      <View style={{ flex: 1, width: "100%", maxWidth: MAX_CONTENT, alignSelf: "center" }}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function Card({ style, children, ...rest }: ViewProps & { children?: ReactNode }) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radius.md,
          borderWidth: t.shadowSm.borderWidth,
          borderColor: t.shadowSm.borderColor,
          padding: 13,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type BtnVariant = "primary" | "secondary" | "quiet";

/**
 * Buttons are outlines, never fills. A screen full of solid buttons reads as a
 * screen full of demands; outlines let the Next 3 be the only loud thing.
 */
export function Btn({
  label,
  onPress,
  variant = "secondary",
  icon,
  style,
  size = 13,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  size?: number;
  disabled?: boolean;
}) {
  const t = useTheme();
  const border =
    variant === "primary" ? t.accent : variant === "secondary" ? t.neutral[700] : t.neutral[800];
  const color =
    variant === "primary" ? t.accentRamp[300] : variant === "quiet" ? t.neutral[500] : t.neutral[300];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          paddingVertical: 11,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: border,
          borderRadius: radius.md,
          opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
          backgroundColor: pressed && variant === "primary" ? t.accentRamp[900] : "transparent",
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size + 3} color={color} /> : null}
      <T size={size} weight="medium" color={color} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

/** Square icon-only button — the ± and caret controls. */
export function IconBtn({
  icon,
  onPress,
  accent,
  size = 34,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  accent?: boolean;
  size?: number;
  label: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: accent ? t.accent : t.neutral[800],
        borderRadius: radius.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={icon} size={size * 0.45} color={accent ? t.accentRamp[300] : t.neutral[400]} />
    </Pressable>
  );
}

export function Field({ style, ...rest }: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      {...rest}
      placeholderTextColor={t.neutral[600]}
      style={[
        {
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.neutral[800],
          borderRadius: radius.md,
          paddingHorizontal: 11,
          paddingVertical: 10,
          color: t.text,
          fontFamily: font.regular,
          fontSize: 13,
        },
        style,
      ]}
    />
  );
}

/** The accent-barred passive line used for "noticing" and schedule notes. */
export function NoteBar({ icon, children }: { icon: IconName; children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 7,
        alignItems: "flex-start",
        borderLeftWidth: 2,
        borderLeftColor: t.accent,
        backgroundColor: t.accentRamp[900],
        borderTopRightRadius: radius.md,
        borderBottomRightRadius: radius.md,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon name={icon} size={13} color={t.accent} />
      </View>
      <T size={12.5} color={t.neutral[300]} style={{ flex: 1, lineHeight: 18 }}>
        {children}
      </T>
    </View>
  );
}

/** The round check used by tasks, anchors and schedule blocks. */
export function CheckCircleBtn({
  done,
  ghost,
  onPress,
  size = 26,
  label,
}: {
  done: boolean;
  ghost?: boolean;
  onPress: () => void;
  size?: number;
  label: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderStyle: ghost ? "dashed" : "solid",
        borderColor: done ? t.accent : t.neutral[600],
        backgroundColor: done ? t.accentRamp[800] : "transparent",
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {done ? <Icon name="check" size={size * 0.54} color={t.accentRamp[200]} weight="bold" /> : null}
      {ghost && !done ? <Icon name="plus" size={size * 0.5} color={t.neutral[500]} /> : null}
    </Pressable>
  );
}

/**
 * Swipe left to reveal edit / delete for a row — used on individual workout
 * exercises. Deleting has no undo dialog, matching the rest of the app's
 * "effort counts, don't make them confirm everything" stance, but the row
 * animates out so the change is never invisible.
 */
export function SwipeRow({
  children,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  children: ReactNode;
  onEdit?: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const t = useTheme();
  const ref = useRef<Swipeable>(null);

  const renderActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-140, -70, 0],
      outputRange: [1, 0.85, 0.6],
      extrapolate: "clamp",
    });
    return (
      <View style={{ flexDirection: "row", alignItems: "stretch", marginLeft: 8 }}>
        {onEdit ? (
          <Pressable
            onPress={() => {
              ref.current?.close();
              onEdit();
            }}
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            style={{
              width: 60,
              marginRight: 6,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: t.neutral[700],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={{ transform: [{ scale }], alignItems: "center", gap: 3 }}>
              <Icon name="pencil-simple" size={16} color={t.neutral[300]} />
              <T size={9.5} color={t.neutral[400]}>
                edit
              </T>
            </Animated.View>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          style={{
            width: 60,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: "rgba(200,120,110,0.5)",
            backgroundColor: "rgba(200,120,110,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: "center", gap: 3 }}>
            <Icon name="x" size={16} color="#c98c84" />
            <T size={9.5} color="#c98c84">
              delete
            </T>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}
