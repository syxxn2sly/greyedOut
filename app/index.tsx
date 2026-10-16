import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router, type Href } from "expo-router";

import { Icon, type IconName } from "@/components/icon";
import { IconBtn, Kicker, Screen, T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";
import { copy } from "@/lib/copy";
import { fmtTime, useStore } from "@/lib/store";
import type { AnchorTimes, Energy, Mode } from "@/lib/types";

/** Same clamp Edit day uses, so a nudge cannot push a time off the end of the day. */
const clampDay = (min: number) => Math.max(0, Math.min(23 * 60 + 30, min));

const options: {
  mode: Mode;
  energy: Energy;
  icon: IconName;
  title: string;
  sub: string;
  route: Href;
  accentIcon?: boolean;
}[] = [
  {
    mode: "regular",
    energy: "mid",
    icon: "squares-four",
    title: copy.checkIn.regular.title,
    sub: copy.checkIn.regular.sub,
    route: "/home",
  },
  {
    mode: "blunt",
    energy: "mid",
    icon: "terminal",
    title: copy.checkIn.blunt.title,
    sub: copy.checkIn.blunt.sub,
    route: "/blunt",
    accentIcon: true,
  },
  {
    mode: "cant",
    energy: "low",
    icon: "cloud",
    title: copy.checkIn.cant.title,
    sub: copy.checkIn.cant.sub,
    route: "/crisis",
  },
];

/**
 * The check-in is one question with three answers and no wrong one. It is the
 * only gate in the app, and it exists so the rest of the interface can be
 * shaped by how much the user actually has today rather than by a default.
 */
export default function CheckIn() {
  const t = useTheme();
  const { update, times } = useStore();
  const [openTimes, setOpenTimes] = useState(false);

  const pick = (o: (typeof options)[number]) => {
    update({ mode: o.mode, energy: o.energy });
    router.replace(o.route);
  };

  const nudge = (id: keyof AnchorTimes, delta: number) =>
    update({ times: { ...times, [id]: clampDay(times[id] + delta) } });

  const timeRows: { id: keyof AnchorTimes; label: string }[] = [
    { id: "wake", label: copy.checkIn.times.wake },
    { id: "wind", label: copy.checkIn.times.wind },
  ];

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingVertical: 16,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Kicker>{copy.checkIn.kicker}</Kicker>
        <T size={28} weight="medium" style={{ letterSpacing: -0.4, marginBottom: 4 }}>
          {copy.checkIn.title}
        </T>
        <T size={13} color={t.neutral[400]} style={{ marginBottom: 18 }}>
          {copy.checkIn.sub}
        </T>

        <View style={{ gap: 10 }}>
          {options.map((o) => (
            <Pressable
              key={o.mode}
              onPress={() => pick(o)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: pressed ? t.accent : t.neutral[800],
                backgroundColor: pressed ? t.accentRamp[900] : "transparent",
                borderRadius: radius.md,
              })}
            >
              <Icon
                name={o.icon}
                size={22}
                color={o.accentIcon ? t.accent : t.neutral[400]}
              />
              <View style={{ flex: 1 }}>
                <T size={15} weight="medium">
                  {o.title}
                </T>
                <T size={12} color={t.neutral[500]} style={{ lineHeight: 17 }}>
                  {o.sub}
                </T>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Hours carry over on their own. Showing them here makes that visible
            without making it another question to answer. */}
        <View style={{ marginTop: 18, gap: 8 }}>
          <Pressable
            onPress={() => setOpenTimes((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: openTimes }}
            accessibilityLabel={copy.checkIn.times.summary(
              fmtTime(times.wake),
              fmtTime(times.wind),
            )}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Icon name="sun-horizon" size={14} color={t.neutral[600]} />
            {/* Stacked, not side by side — all three on one row overflowed at
                375pt and broke onto two lines mid-phrase. */}
            <View style={{ flex: 1 }}>
              <T size={12} color={t.neutral[500]} tabular numberOfLines={1}>
                {copy.checkIn.times.summary(fmtTime(times.wake), fmtTime(times.wind))}
              </T>
              {openTimes ? null : (
                <T size={11} color={t.neutral[600]} numberOfLines={1}>
                  {copy.checkIn.times.carried}
                </T>
              )}
            </View>
            <T size={11} weight="medium" color={t.accent} numberOfLines={1}>
              {openTimes ? copy.checkIn.times.close : copy.checkIn.times.adjust}
            </T>
          </Pressable>

          {openTimes &&
            timeRows.map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: t.neutral[800],
                  borderRadius: radius.md,
                }}
              >
                <T size={12.5} color={t.neutral[300]} style={{ flex: 1 }}>
                  {r.label}
                </T>
                <IconBtn
                  icon="caret-left"
                  label={copy.a11y.earlier(r.label)}
                  onPress={() => nudge(r.id, -30)}
                />
                <T
                  size={13.5}
                  weight="medium"
                  tabular
                  numberOfLines={1}
                  style={{ minWidth: 58, flexShrink: 0, textAlign: "center" }}
                >
                  {fmtTime(times[r.id])}
                </T>
                <IconBtn
                  icon="caret-right"
                  label={copy.a11y.later(r.label)}
                  onPress={() => nudge(r.id, 30)}
                />
              </View>
            ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
