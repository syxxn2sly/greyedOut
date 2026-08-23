import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Icon } from "@/components/icon";
import { Btn, Card, Field, IconBtn, Screen, T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";
import { defaultBlockTime } from "@/lib/schedule";
import { copy } from "@/lib/copy";
import { requestNotifyPermission } from "@/lib/notify";
import { fmtTime, useStore } from "@/lib/store";
import type { AnchorTimes } from "@/lib/types";

/** Keep every time inside the day so nudging can't push a block off the end. */
const clampDay = (min: number) => Math.max(0, Math.min(23 * 60 + 30, min));

type Row = {
  id: keyof AnchorTimes;
  icon: string;
  label: string;
  sub: string;
};

export default function EditDay() {
  const t = useTheme();
  const s = useStore();
  const [newBlock, setNewBlock] = useState("");

  const rows: Row[] = [
    { id: "wake", icon: "sun-horizon", label: copy.editDay.rows.wake.label, sub: copy.editDay.rows.wake.sub },
    { id: "meds", icon: "pill", label: copy.editDay.rows.meds.label, sub: copy.editDay.rows.meds.sub },
    { id: "lunch", icon: "bowl-food", label: copy.editDay.rows.lunch.label, sub: copy.editDay.rows.lunch.sub },
    {
      id: "gym",
      icon: "barbell",
      label: copy.editDay.rows.gym.label,
      sub: s.autoGym ? copy.editDay.rows.gym.subAuto : copy.editDay.rows.gym.subManual,
    },
    { id: "wind", icon: "moon-stars", label: copy.editDay.rows.wind.label, sub: copy.editDay.rows.wind.sub },
  ];

  const nudge = (r: Row, delta: number) =>
    s.update({ times: { ...s.times, [r.id]: clampDay(s.times[r.id] + delta) } });

  const moveBlock = (id: string, delta: number) =>
    s.update({
      customBlocks: s.customBlocks.map((c) =>
        c.id === id ? { ...c, min: clampDay(c.min + delta) } : c,
      ),
    });

  const addBlock = () => {
    const clean = newBlock.trim();
    if (!clean) return;
    const min = defaultBlockTime(s.times);
    s.update({
      customBlocks: [
        ...s.customBlocks,
        { id: `c${Date.now()}`, min, title: clean, sub: copy.editDay.addedBlockSub, icon: "bookmark-simple", kind: "school" },
      ],
    });
    setNewBlock("");
    s.cheer(copy.toast.blockAdded(fmtTime(min)));
  };

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconBtn icon="arrow-left" size={32} label={copy.a11y.back} onPress={() => router.back()} />
          <T size={16} weight="medium">
            {copy.editDay.title}
          </T>
        </View>

        <T size={12.5} color={t.neutral[400]} style={{ lineHeight: 18 }}>
          {copy.editDay.intro}
        </T>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive">
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
              <IconBtn icon="caret-left" label={copy.a11y.earlier(r.label)} onPress={() => nudge(r, -30)} />
              <T size={14} weight="medium" tabular style={{ width: 56, textAlign: "center" }}>
                {fmtTime(s.times[r.id])}
              </T>
              <IconBtn icon="caret-right" label={copy.a11y.later(r.label)} onPress={() => nudge(r, 30)} />
            </Card>
          ))}

          {/* Your own blocks get the same nudge controls as the anchors —
              a block you cannot move is a block you stop trusting. */}
          {s.customBlocks.map((c) => (
            <Card
              key={c.id}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 13 }}
            >
              <Icon name={c.icon} size={18} color={t.neutral[400]} />
              <View style={{ flex: 1 }}>
                <T size={13.5} weight="medium" numberOfLines={1}>
                  {c.title}
                </T>
                <T size={11} color={t.neutral[500]} numberOfLines={1}>
                  {copy.editDay.yourBlockSub(c.sub)}
                </T>
              </View>
              <IconBtn
                icon="caret-left"
                label={copy.a11y.earlier(c.title)}
                onPress={() => moveBlock(c.id, -30)}
              />
              <T size={14} weight="medium" tabular style={{ width: 56, textAlign: "center" }}>
                {fmtTime(c.min)}
              </T>
              <IconBtn
                icon="caret-right"
                label={copy.a11y.later(c.title)}
                onPress={() => moveBlock(c.id, 30)}
              />
              <Pressable
                onPress={() => s.update({ customBlocks: s.customBlocks.filter((x) => x.id !== c.id) })}
                accessibilityRole="button"
                accessibilityLabel={copy.a11y.removeNamed(c.title)}
                hitSlop={6}
                style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="x" size={13} color={t.neutral[600]} />
              </Pressable>
            </Card>
          ))}

          <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
            <Field
              value={newBlock}
              onChangeText={setNewBlock}
              placeholder={copy.editDay.addBlockPlaceholder}
              onSubmitEditing={addBlock}
              style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 13 }}
            />
            <IconBtn icon="plus" size={44} accent label={copy.a11y.addBlock} onPress={addBlock} />
          </View>

          <Pressable
            onPress={() => router.push("/import-calendar")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 13,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: t.neutral[700],
              borderRadius: radius.md,
            }}
          >
            <Icon name="calendar-plus" size={18} color={t.accent} />
            <T size={13} weight="medium" color={t.neutral[300]} style={{ flex: 1, lineHeight: 18 }}>
              {copy.editDay.importCalendar}
            </T>
          </Pressable>

          {/* The only system permission the app asks for, and it asks at the
              moment the user reaches for the feature rather than on first run. */}
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 13 }}>
            <Icon name="bell" size={18} color={s.notify ? t.accent : t.neutral[500]} />
            <View style={{ flex: 1 }}>
              <T size={13.5} weight="medium">
                {copy.editDay.notify}
              </T>
              <T size={11} color={t.neutral[500]} style={{ lineHeight: 16 }}>
                {copy.editDay.notifySub}
              </T>
            </View>
            <Pressable
              onPress={async () => {
                if (s.notify) {
                  s.update({ notify: false });
                  return;
                }
                // Ask only when switching on. A denial leaves the switch off,
                // which is the honest state: iOS will not deliver anything.
                const ok = await requestNotifyPermission();
                if (!ok) {
                  s.cheer(copy.editDay.notifyDenied);
                  return;
                }
                s.update({ notify: true });
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: s.notify }}
              accessibilityLabel={copy.editDay.notify}
              style={{
                width: 46,
                height: 27,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: s.notify ? t.accentRamp[600] : t.neutral[700],
                backgroundColor: s.notify ? t.accentRamp[800] : "transparent",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: s.notify ? 23 : 3,
                  width: 19,
                  height: 19,
                  borderRadius: radius.pill,
                  backgroundColor: s.notify ? t.accentRamp[300] : t.neutral[600],
                }}
              />
            </Pressable>
          </Card>

          <Card style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 13 }}>
            <Icon name="barbell" size={18} color={s.autoGym ? t.accent : t.neutral[500]} />
            <View style={{ flex: 1 }}>
              <T size={13.5} weight="medium">
                {copy.editDay.autoGym}
              </T>
              <T size={11} color={t.neutral[500]} style={{ lineHeight: 16 }}>
                {copy.editDay.autoGymSub}
              </T>
            </View>
            <Pressable
              onPress={() => s.update({ autoGym: !s.autoGym })}
              accessibilityRole="switch"
              accessibilityState={{ checked: s.autoGym }}
              accessibilityLabel={copy.editDay.autoGym}
              style={{
                width: 46,
                height: 27,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: s.autoGym ? t.accentRamp[600] : t.neutral[700],
                backgroundColor: s.autoGym ? t.accentRamp[800] : "transparent",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: s.autoGym ? 23 : 3,
                  width: 19,
                  height: 19,
                  borderRadius: radius.pill,
                  backgroundColor: s.autoGym ? t.accentRamp[300] : t.neutral[600],
                }}
              />
            </Pressable>
          </Card>
        </ScrollView>

        <Btn
          label={copy.editDay.done}
          variant="primary"
          size={14}
          style={{ paddingVertical: 13 }}
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
