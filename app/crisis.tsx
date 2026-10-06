import { View, ScrollView } from "react-native";
import { router } from "expo-router";

import { Icon } from "@/components/icon";
import { Btn, Card, Kicker, Screen, T, useTheme } from "@/components/ui";
import { copy } from "@/lib/copy";
import { anchorLabel, useStore } from "@/lib/store";

/**
 * Low-capacity mode. Three things, any one of which is a win, and no route to
 * the rest of the app except a deliberate one. The point is not to do less —
 * it is that a list you cannot face gets you zero, and three things gets you
 * more than zero.
 */
export default function Crisis() {
  const t = useTheme();
  const s = useStore();

  const anchor = s.anchors[s.anchors.length - 1];

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 26,
          paddingVertical: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Kicker>{copy.crisis.kicker}</Kicker>
        <T size={24} weight="medium" style={{ letterSpacing: -0.35 }}>
          {copy.crisis.title}
        </T>
        <T size={13} color={t.neutral[400]} style={{ marginBottom: 6 }}>
          {copy.crisis.sub}
        </T>

        <View style={{ gap: 10 }}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}>
            <Icon name="bowl-food" size={20} color={t.accent} />
            <T size={14.5} weight="medium" style={{ flex: 1 }}>
              {copy.crisis.eat}
            </T>
            <Btn
              label={s.crisisAte ? copy.crisis.doneCheck : copy.crisis.ateButton}
              variant="primary"
              size={12.5}
              style={{ paddingVertical: 8, paddingHorizontal: 14 }}
              onPress={() => {
                s.update({ crisisAte: true, food: s.food ?? "ate" });
                s.cheer(copy.toast.crisisAte);
              }}
            />
          </Card>

          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}>
            <Icon name="drop" size={20} color={t.accent} />
            <T size={14.5} weight="medium" style={{ flex: 1 }}>
              {copy.crisis.water(s.water)}
            </T>
            <Btn
              label={copy.crisis.plusOne}
              variant="primary"
              size={12.5}
              style={{ paddingVertical: 8, paddingHorizontal: 14 }}
              onPress={s.addWater}
            />
          </Card>

          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}>
            <Icon name="anchor-simple" size={20} color={t.accent} />
            <T size={14.5} weight="medium" style={{ flex: 1 }}>
              {anchor ? anchorLabel(anchor.id, s.times) : copy.crisis.fallbackAnchor}
            </T>
            <Btn
              label={s.crisisAnchorDone ? copy.crisis.doneCheck : copy.crisis.doneButton}
              variant="primary"
              size={12.5}
              style={{ paddingVertical: 8, paddingHorizontal: 14 }}
              onPress={() => {
                s.update({ crisisAnchorDone: true });
                if (anchor && !anchor.done) s.toggleAnchor(anchor.id);
                else s.cheer(copy.toast.crisisAnchor);
              }}
            />
          </Card>
        </View>

        <Btn
          label={copy.crisis.bringBack}
          variant="quiet"
          style={{ marginTop: 10, paddingVertical: 12 }}
          onPress={() => {
            s.update({ mode: "regular", energy: "mid" });
            router.replace("/home");
          }}
        />
      </ScrollView>
    </Screen>
  );
}
