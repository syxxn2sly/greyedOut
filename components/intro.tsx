// Splash animation. Drawn in code rather than using the icon PNG so the
// checkbox can actually animate. Skipped under reduced motion.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";

import { Icon } from "@/components/icon";
import { T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";

const ROWS = 240;
const TICK = 260;
const WORD = 240;
const HOLD = 180;
const GREY = 320;
const OUT = 220;

const fill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export function Intro({ onDone }: { onDone: () => void }) {
  const t = useTheme();

  const rows = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const greyed = useRef(new Animated.Value(0)).current;
  const leave = useRef(new Animated.Value(1)).current;
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      setGone(true);
      onDone();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          finish();
          return;
        }

        Animated.sequence([
          Animated.timing(rows, {
            toValue: 1,
            duration: ROWS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // slight overshoot so it reads as landing, not just fading in
          Animated.timing(tick, {
            toValue: 1,
            duration: TICK,
            easing: Easing.out(Easing.back(2.2)),
            useNativeDriver: true,
          }),
          Animated.timing(word, {
            toValue: 1,
            duration: WORD,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(HOLD),
          // cross-fade a grey copy — colour interpolation can't run on the
          // native driver and it stutters
          Animated.timing(greyed, {
            toValue: 1,
            duration: GREY,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(leave, {
            toValue: 0,
            duration: OUT,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(finish);
      });

    return () => {
      cancelled = true;
    };
  }, [rows, tick, word, greyed, leave, onDone]);

  if (gone) return null;

  // same falloff as the icon
  const bars = [
    { w: 62, color: t.text },
    { w: 50, color: t.neutral[700] },
    { w: 38, color: t.neutral[800] },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        ...fill,
        backgroundColor: t.bg,
        alignItems: "center",
        justifyContent: "center",
        opacity: leave,
      }}
    >
      <Animated.View
        style={{
          alignItems: "center",
          gap: 22,
          opacity: rows,
          transform: [
            { translateY: rows.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        }}
      >
        <View style={{ gap: 9 }}>
          {bars.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: i === 0 ? t.neutral[500] : t.neutral[700],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i === 0 ? (
                  <Animated.View
                    style={{
                      opacity: tick,
                      transform: [{ scale: tick }],
                    }}
                  >
                    <Icon name="check" size={12} color={t.text} weight="bold" />
                  </Animated.View>
                ) : null}
              </View>
              <View
                style={{ width: b.w, height: 7, borderRadius: radius.pill, backgroundColor: b.color }}
              />
            </View>
          ))}
        </View>

        <Animated.View
          style={{
            flexDirection: "row",
            opacity: word,
            transform: [
              { translateY: word.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) },
            ],
          }}
        >
          <T size={22} weight="medium" style={{ letterSpacing: -0.4 }}>
            greyed{" "}
          </T>
          <View>
            <T size={22} weight="medium" style={{ letterSpacing: -0.4 }}>
              out
            </T>
            <Animated.View style={{ ...fill, opacity: greyed }} pointerEvents="none">
              <T size={22} weight="medium" color={t.neutral[600]} style={{ letterSpacing: -0.4 }}>
                out
              </T>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
