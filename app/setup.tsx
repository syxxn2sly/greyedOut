import { View } from "react-native";
import { router } from "expo-router";

import { Icon, type IconName } from "@/components/icon";
import { Btn, Card, IconBtn, Kicker, Screen, T, useTheme } from "@/components/ui";
import { copy } from "@/lib/copy";
import { fmtTime, useStore } from "@/lib/store";
import type { AnchorTimes } from "@/lib/types";

const clampDay = (min: number) => Math.max(0, Math.min(23 * 60 + 30, min));

const rows: { id: keyof AnchorTimes; icon: IconName; label: string; sub: string }[] = [
  { id: "wake", icon: "sun-horizon", label: copy.setup.rows.wake.label, sub: copy.setup.rows.wake.sub },
  { id: "meds", icon: "pill", label: copy.setup.rows.meds.label, sub: copy.setup.rows.meds.sub },
  { id: "lunch", icon: "bowl-food", label: copy.setup.rows.lunch.label, sub: copy.setup.rows.lunch.sub },
  { id: "gym", icon: "barbell", label: copy.setup.rows.gym.label, sub: copy.setup.rows.gym.sub },
  { id: "wind", icon: "moon-stars", label: copy.setup.rows.wind.label, sub: copy.setup.rows.wind.sub },
];

/**
 * First run, and the only setup the app ever asks for. Four times is enough to
 * build a whole day around, and asking for anything more up front is how you
 * lose someone before they have used the thing once.
 */
export default function Setup() {
  const t = useTheme();
  const s = useStore();

  const nudge = (id: keyof AnchorTimes, delta: number) =>
    s.update({ times: { ...s.times, [id]: clampDay(s.times[id] + delta) } });

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, gap: 12 }}>
        <Kicker>{copy.setup.kicker}</Kicker>
        <T size={26} weight="medium" style={{ letterSpacing: -0.4 }}>
          {copy.setup.title}
        </T>
        <T size={13} color={t.neutral[400]} style={{ lineHeight: 19, marginBottom: 4 }}>
          {copy.setup.intro}
        </T>

        <View style={{ flex: 1, gap: 8, justifyContent: "center" }}>
          {rows.map((r) => (
            <Card
              key={r.id}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 13 }}
            >
              <Icon name={r.icon} size={18} color={t.accent} />
              <View style={{ flex: 1 }}>
                <T size={13.5} weight="medium">
                  {r.label}
                </T>
                <T size={11} color={t.neutral[500]}>
                  {r.sub}
                </T>
              </View>
              <IconBtn icon="caret-left" label={copy.a11y.earlier(r.label)} onPress={() => nudge(r.id, -30)} />
              <T size={14} weight="medium" tabular style={{ width: 56, textAlign: "center" }}>
                {fmtTime(s.times[r.id])}
              </T>
              <IconBtn icon="caret-right" label={copy.a11y.later(r.label)} onPress={() => nudge(r.id, 30)} />
            </Card>
          ))}

          <T size={11.5} color={t.neutral[600]} style={{ marginTop: 4, lineHeight: 17 }}>
            {copy.setup.wakeNote}
          </T>
        </View>

        <Btn
          label={copy.setup.confirm}
          variant="primary"
          size={15}
          style={{ paddingVertical: 14 }}
          onPress={() => {
            s.update({ onboarded: true });
            router.replace("/");
          }}
        />
      </View>
    </Screen>
  );
}
