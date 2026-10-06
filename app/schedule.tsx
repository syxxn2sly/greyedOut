import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Icon } from "@/components/icon";
import { Btn, Card, CheckCircleBtn, IconBtn, NoteBar, Screen, T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";
import { buildSchedule, currentBlockId } from "@/lib/schedule";
import { copy } from "@/lib/copy";
import { fmtTime, useStore } from "@/lib/store";

function Stat({ label, value, pct }: { label: string; value: string; pct: `${number}%` }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 11 }}>
      <T size={10} color={t.neutral[500]} style={{ letterSpacing: 0.8 }}>
        {label}
      </T>
      <T size={15} weight="medium" tabular>
        {value}
      </T>
      <View
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: t.neutral[900],
          marginTop: 5,
          overflow: "hidden",
        }}
      >
        <View style={{ height: "100%", borderRadius: 2, backgroundColor: t.accent, width: pct }} />
      </View>
    </Card>
  );
}

export default function Schedule() {
  const t = useTheme();
  const s = useStore();

  const now = new Date();
  const blocks = buildSchedule({
    times: s.times,
    energy: s.energy,
    workoutDone: s.workoutDone,
    customBlocks: s.customBlocks,
    hiddenBlocks: s.hiddenBlocks,
    tasks: s.tasks,
  });

  const isGhost = (id: string, suggest?: boolean) => !!suggest && !s.accepted[id];
  const isDone = (id: string) => (id === "gym" ? s.workoutDone !== null : !!s.schedDone[id]);

  const nowId = currentBlockId(blocks, now.getHours() * 60 + now.getMinutes(), (b) =>
    isGhost(b.id, b.suggest),
  );

  const real = blocks.filter((b) => !isGhost(b.id, b.suggest));
  const heldCount = real.filter((b) => isDone(b.id)).length;
  const tasksDone = s.tasks.filter((x) => x.done).length;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
        <IconBtn icon="arrow-left" size={32} label={copy.a11y.back} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <T size={16} weight="medium">
            {copy.schedule.title}
          </T>
          <T size={11} color={t.neutral[500]}>
            {copy.schedule.progress(heldCount, real.length)}
          </T>
        </View>
        <Btn
          label={copy.schedule.editDay}
          icon="sliders-horizontal"
          size={12}
          style={{ paddingVertical: 8, paddingHorizontal: 12 }}
          onPress={() => router.push("/edit-day")}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 10 }}>
        <Stat
          label={copy.schedule.statTasks}
          value={`${tasksDone}/${s.tasks.length}`}
          pct={`${s.tasks.length ? Math.round((100 * tasksDone) / s.tasks.length) : 0}%` as const}
        />
        <Stat
          label={copy.schedule.statBlocks}
          value={`${heldCount}/${real.length}`}
          pct={`${real.length ? Math.round((100 * heldCount) / real.length) : 0}%` as const}
        />
        <Stat
          label={copy.schedule.statWorkout}
          value={s.workoutDone ? (s.workoutDone === "mini" ? copy.schedule.workoutMini : copy.schedule.workoutDone) : fmtTime(s.times.gym)}
          pct={s.workoutDone ? "100%" : "0%"}
        />
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <NoteBar icon="pill">
          {copy.schedule.medsNote(fmtTime(s.times.meds + 120), fmtTime(s.times.meds + 300))}
        </NoteBar>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {blocks.map((b) => {
          const ghost = isGhost(b.id, b.suggest);
          const done = !ghost && isDone(b.id);
          const showNow = b.id === nowId && !done && !ghost;

          return (
            <View key={b.id} style={{ flexDirection: "row", gap: 8, opacity: ghost ? 0.65 : done ? 0.6 : 1 }}>
              {/* 46, not 38 — "10:30a" is six characters and was splitting
                  onto a second line on a 375pt screen. */}
              <View style={{ width: 46, alignItems: "flex-end", paddingTop: 11 }}>
                <T
                  size={11}
                  tabular
                  numberOfLines={1}
                  color={showNow ? t.accentRamp[300] : t.neutral[500]}
                >
                  {fmtTime(b.min)}
                </T>
              </View>
              <View
                style={{
                  width: 2,
                  borderRadius: 1,
                  marginVertical: 6,
                  backgroundColor: ghost
                    ? "transparent"
                    : showNow
                      ? t.accent
                      : done
                        ? t.accentRamp[800]
                        : t.neutral[800],
                }}
              />
              <View style={{ flex: 1, paddingVertical: 9 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    paddingVertical: 11,
                    paddingHorizontal: 11,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderStyle: ghost ? "dashed" : "solid",
                    borderColor: ghost
                      ? t.neutral[700]
                      : showNow
                        ? t.accentRamp[700]
                        : t.neutral[800],
                    backgroundColor: ghost ? "transparent" : showNow ? t.accentRamp[900] : t.surface,
                  }}
                >
                  <Icon
                    name={b.icon}
                    size={17}
                    color={
                      ghost
                        ? t.neutral[500]
                        : b.kind === "anchor" || b.kind === "school"
                          ? t.accent
                          : done
                            ? t.neutral[600]
                            : t.neutral[300]
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <T
                      size={13.5}
                      weight="medium"
                      color={done ? t.neutral[500] : ghost ? t.neutral[400] : t.text}
                      style={done ? { textDecorationLine: "line-through" } : undefined}
                    >
                      {b.title}
                    </T>
                    <T size={11} color={t.neutral[500]}>
                      {ghost ? copy.schedule.ghostHint(b.sub) : b.sub}
                    </T>
                  </View>

                  {ghost || b.tag || b.suggest ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={b.suggest ? copy.a11y.unAdd(b.title) : copy.a11y.removeNamed(b.title)}
                      onPress={() => {
                        if (ghost) return;
                        if (b.suggest) {
                          const next = { ...s.accepted };
                          delete next[b.id];
                          s.update({ accepted: next });
                        } else if (b.removable) {
                          // Your own blocks are deleted; generated care blocks
                          // are only hidden, so they come back tomorrow.
                          if (b.id.startsWith("c")) {
                            s.update({ customBlocks: s.customBlocks.filter((c) => c.id !== b.id) });
                          } else {
                            s.update({ hiddenBlocks: { ...s.hiddenBlocks, [b.id]: true } });
                          }
                        }
                      }}
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: 6,
                        borderWidth: 1,
                        borderColor: t.accentRamp[700],
                        borderRadius: radius.pill,
                      }}
                    >
                      <T
                        size={9.5}
                        color={ghost ? t.neutral[400] : t.accentRamp[300]}
                        style={{ letterSpacing: 0.5 }}
                      >
                        {ghost ? copy.schedule.suggestionTag : b.removable ? `${b.tag} ×` : copy.schedule.addedTag}
                      </T>
                    </Pressable>
                  ) : null}

                  <CheckCircleBtn
                    size={24}
                    done={done}
                    ghost={ghost}
                    label={b.title}
                    onPress={() => {
                      if (ghost) {
                        s.update({ accepted: { ...s.accepted, [b.id]: true } });
                        s.cheer(copy.toast.suggestionAdded);
                        return;
                      }
                      if (b.id === "gym") {
                        if (s.workoutDone === null) s.logWorkout("full", copy.toast.workoutHeld);
                        else s.update({ workoutDone: null });
                        return;
                      }
                      const was = !!s.schedDone[b.id];
                      s.update({ schedDone: { ...s.schedDone, [b.id]: !was } });
                      if (!was) s.cheer(copy.toast.blockHeld);
                    }}
                  />
                </View>

                {showNow ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: t.accent }} />
                    <View style={{ flex: 1, height: 1, backgroundColor: t.accentRamp[800] }} />
                    <T size={10} color={t.accentRamp[300]} style={{ letterSpacing: 0.8 }}>
                      {copy.schedule.now}
                    </T>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
