import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Icon } from "@/components/icon";
import { Btn, Card, Field, IconBtn, Kicker, Screen, SwipeRow, T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";
import { copy } from "@/lib/copy";
import { parseWorkout } from "@/lib/parse-workout";
import { useStore } from "@/lib/store";
import { BLANK_DETAIL, MAX_TEMPLATES, builtInTemplates, customIcons } from "@/lib/workouts";
import type { ExStat, WeekDay } from "@/lib/types";

/** How a stat reads when nothing is being typed into it. */
const formatStat = (stat: ExStat | undefined) => {
  if (!stat || (stat.weight == null && stat.reps == null)) return null;
  const weight = stat.weight != null ? `${stat.weight}${stat.unit}` : copy.workout.bodyweight;
  const reps = stat.reps != null ? `${stat.reps} ${copy.workout.reps}` : null;
  return reps ? `${weight} · ${reps}` : weight;
};

const week: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const todayKey: WeekDay = week[(new Date().getDay() + 6) % 7];

export default function Workout() {
  const t = useTheme();
  const s = useStore();

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  /** null = the form is creating; an id = it is editing that template's name. */
  const [editingTpl, setEditingTpl] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editUnit, setEditUnit] = useState<"lb" | "kg">("lb");
  const [renamingEx, setRenamingEx] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [newExName, setNewExName] = useState("");

  const templates = Object.fromEntries(
    Object.entries({
      ...builtInTemplates,
      ...Object.fromEntries(s.customTpls.map((c) => [c.id, { ...c, custom: true }])),
    }).filter(([id]) => !s.hiddenTpls[id]),
  );
  const current = templates[s.wTemplate] ?? Object.values(templates)[0] ?? builtInTemplates.push;
  const canAdd = Object.keys(templates).length < MAX_TEMPLATES;

  const closeForm = () => {
    setNewOpen(false);
    setEditingTpl(null);
    setNewName("");
  };

  /**
   * The form only ever touches the template's name now. Exercises are added,
   * renamed and deleted one at a time in the list below — a comma-separated
   * text field asked people to retype the whole roster just to fix a typo,
   * and silently dropped anything already logged against an exercise it
   * couldn't match back up.
   */
  const openForEdit = (id: string) => {
    const tpl = templates[id];
    if (!tpl?.custom) return;
    setEditingTpl(id);
    setNewOpen(true);
    setNewName(tpl.name);
  };

  const saveTemplate = () => {
    const name = newName.trim();
    if (!name) return;

    if (editingTpl) {
      s.update({
        customTpls: s.customTpls.map((c) => (c.id === editingTpl ? { ...c, name } : c)),
      });
      closeForm();
      s.cheer(copy.toast.templateUpdated);
      return;
    }

    if (!canAdd) return;
    const id = `c${Date.now()}`;
    s.update({
      customTpls: [
        ...s.customTpls,
        {
          id,
          custom: true,
          name,
          icon: customIcons[s.customTpls.length % customIcons.length],
          sub: "yours",
          ex: [],
        },
      ],
      wTemplate: id,
    });
    closeForm();
    s.cheer(copy.toast.templateSaved);
  };

  /**
   * The built-in templates' exercises live in code (lib/workouts.ts), not
   * state, so there's nothing to update directly. The first edit, add or
   * delete on one copies it into customTpls under the same id — which,
   * because the merge in `templates` spreads built-ins first and customTpls
   * second, makes the copy override the built-in from then on. Deleting that
   * override later falls straight back to the original rather than losing it.
   */
  const withFork = (id: string, apply: (ex: [string, string, string][]) => [string, string, string][]) => {
    const existing = s.customTpls.find((c) => c.id === id);
    const base = existing ?? { ...templates[id], id };
    const ex = apply(base.ex);
    const next = {
      ...base,
      custom: true,
      ex,
      sub: `${ex.length} ${ex.length === 1 ? "lift" : "lifts"} · yours`,
    };
    s.update({
      customTpls: existing
        ? s.customTpls.map((c) => (c.id === id ? next : c))
        : [...s.customTpls, next],
    });
  };

  /**
   * Read a pasted workout onto the current template.
   *
   * Everything lands in one update: the exercises join the template and
   * their weights and reps go straight into exStats, so a paste produces a
   * day you can start from rather than a list you still have to fill in.
   *
   * Lines it could not read are counted in the toast rather than dropped
   * silently, because a paste that quietly loses two lifts is worse than
   * one that says so.
   */
  const readPaste = () => {
    const { found, skipped } = parseWorkout(paste);
    if (!found.length) {
      s.cheer(copy.toast.pastedNone);
      return;
    }

    const stamp = Date.now();
    const stats: Record<string, ExStat> = {};
    const sets: Record<string, number> = {};

    withFork(s.wTemplate, (ex) => {
      const next = [...ex];
      found.forEach((f, i) => {
        const id = `${s.wTemplate}-${stamp}-${i}`;
        next.push([id, f.name, BLANK_DETAIL]);
        stats[id] = f.stat;
        if (f.sets !== null) sets[id] = f.sets;
      });
      return next;
    });

    s.update({
      exStats: { ...s.exStats, ...stats },
      wSets: { ...s.wSets, ...sets },
    });

    setPaste("");
    s.cheer(
      skipped.length
        ? copy.toast.pastedSome(found.length, skipped.length)
        : copy.toast.pasted(found.length),
    );
  };

  const addExercise = (tplId: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const exId = `${tplId}-${Date.now()}`;
    withFork(tplId, (ex) => [...ex, [exId, clean, BLANK_DETAIL]]);
    s.cheer(copy.workout.exerciseAdded);
  };

  const renameExercise = (tplId: string, exId: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    withFork(tplId, (ex) =>
      ex.map(([id, oldName, detail]) => [id, id === exId ? clean : oldName, detail]),
    );
    s.cheer(copy.workout.exerciseRenamed);
  };

  const deleteExercise = (tplId: string, exId: string) => {
    withFork(tplId, (ex) => ex.filter(([id]) => id !== exId));
    s.cheer(copy.workout.exerciseRemoved);
  };

  /** Blank fields clear the stat rather than writing zeros over it. */
  const commitStat = (exId: string) => {
    const weight = editWeight.trim() ? Number(editWeight) : null;
    const reps = editReps.trim() ? Number(editReps) : null;
    s.update({ exStats: { ...s.exStats, [exId]: { weight, unit: editUnit, reps } } });
  };

  /**
   * Yours are deleted outright; the built-ins are only hidden, since they are
   * code rather than data and there is nothing to delete. Either way the week
   * plan has to let go of it or the calendar points at a template that is gone.
   */
  const deleteTemplate = (id: string) => {
    const tpl = templates[id];
    if (!tpl) return;
    const weekPlan = Object.fromEntries(
      Object.entries(s.weekPlan).map(([d, v]) => [d, v === id ? null : v]),
    ) as typeof s.weekPlan;
    const remaining = Object.keys(templates).filter((x) => x !== id);

    s.update({
      weekPlan,
      customTpls: tpl.custom ? s.customTpls.filter((c) => c.id !== id) : s.customTpls,
      hiddenTpls: tpl.custom ? s.hiddenTpls : { ...s.hiddenTpls, [id]: true },
      wTemplate: s.wTemplate === id ? (remaining[0] ?? "") : s.wTemplate,
    });
    closeForm();
    s.cheer(copy.toast.templateDeleted);
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconBtn icon="arrow-left" size={32} label={copy.a11y.back} onPress={() => router.back()} />
          <T size={16} weight="medium">
            {copy.workout.title}
          </T>
        </View>

        <View>
          <Kicker style={{ marginBottom: 8 }}>{copy.workout.templatesLabel}</Kicker>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(templates).map(([id, tpl]) => {
              const on = id === s.wTemplate;
              return (
                <Pressable
                  key={id}
                  onPress={() => s.update({ wTemplate: id })}
                  onLongPress={() => openForEdit(id)}
                  delayLongPress={450}
                  accessibilityLabel={tpl.custom ? copy.a11y.editTemplate(tpl.name) : tpl.name}
                  style={{
                    flexGrow: 1,
                    minWidth: 96,
                    gap: 4,
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: on ? t.accentRamp[700] : t.neutral[800],
                    backgroundColor: on ? t.accentRamp[900] : t.surface,
                  }}
                >
                  <Icon name={tpl.icon} size={18} color={on ? t.accentRamp[300] : t.neutral[400]} />
                  <T size={12} weight="medium">
                    {tpl.name}
                  </T>
                  <T size={10.5} color={t.neutral[500]}>
                    {tpl.sub}
                  </T>
                </Pressable>
              );
            })}
            {canAdd ? (
              <Pressable
                onPress={() => (newOpen ? closeForm() : setNewOpen(true))}
                accessibilityLabel={copy.a11y.newTemplate}
                style={{
                  width: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: t.neutral[700],
                  borderRadius: radius.md,
                }}
              >
                <Icon name={newOpen ? "x" : "plus"} size={16} color={t.neutral[400]} />
              </Pressable>
            ) : null}
          </View>

          {newOpen ? (
            <Card style={{ gap: 6, marginTop: 8 }}>
              <Field
                value={newName}
                onChangeText={setNewName}
                autoFocus
                placeholder={copy.workout.newNamePlaceholder}
                onSubmitEditing={saveTemplate}
                style={{ backgroundColor: t.bg, fontSize: 12 }}
              />
              <Btn
                label={editingTpl ? copy.workout.updateTemplate : copy.workout.saveTemplate}
                variant="primary"
                size={12}
                style={{ paddingVertical: 9 }}
                onPress={saveTemplate}
              />
              {editingTpl ? (
                <Btn
                  label={copy.workout.deleteTemplate}
                  variant="quiet"
                  size={12}
                  style={{ paddingVertical: 9 }}
                  onPress={() => deleteTemplate(editingTpl)}
                />
              ) : null}
            </Card>
          ) : null}
        </View>

        <View>
          <Kicker style={{ marginBottom: 8 }}>{copy.workout.weekLabel}</Kicker>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {week.map((d) => {
              const planned = s.weekPlan[d];
              const tpl = planned ? templates[planned] : null;
              const isToday = d === todayKey;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    // Cycle through rest → each template → rest again, so one
                    // control sets the whole week without a picker modal.
                    const cycle: (string | null)[] = [null, ...Object.keys(templates)];
                    const next = cycle[(cycle.indexOf(planned) + 1) % cycle.length];
                    s.update({ weekPlan: { ...s.weekPlan, [d]: next } });
                  }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: 3,
                    paddingVertical: 8,
                    paddingHorizontal: 2,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderStyle: planned || isToday ? "solid" : "dashed",
                    borderColor: isToday ? t.accentRamp[600] : planned ? t.accentRamp[800] : t.neutral[800],
                    backgroundColor: planned ? t.accentRamp[900] : "transparent",
                  }}
                >
                  <T size={10} color={isToday ? t.accentRamp[200] : t.neutral[500]}>
                    {d}
                  </T>
                  <Icon
                    name={tpl?.icon ?? "moon"}
                    size={15}
                    color={tpl ? t.accentRamp[300] : t.neutral[600]}
                  />
                  <T size={8.5} color={t.neutral[500]}>
                    {tpl ? tpl.name.split(" ")[0] : copy.workout.rest}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <T size={10.5} color={t.neutral[600]} style={{ marginTop: 6 }}>
            {copy.workout.weekSummary(Object.values(s.weekPlan).filter(Boolean).length)}
          </T>
        </View>

        <View>
          <Kicker style={{ marginBottom: 8 }}>{copy.workout.setsLabel(current.name)}</Kicker>
          <View style={{ gap: 8 }}>
            {current.ex.map(([id, name, detail]) => {
              const sets = s.wSets[id] ?? 3;
              return (
                <SwipeRow
                  key={id}
                  editLabel={copy.a11y.editExercise(name)}
                  deleteLabel={copy.a11y.deleteExercise(name)}
                  onEdit={() => {
                    setRenamingEx(id);
                    setRenameVal(name);
                  }}
                  onDelete={() => deleteExercise(s.wTemplate, id)}
                >
                <Card
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 13 }}
                >
                  <View style={{ flex: 1 }}>
                    {renamingEx === id ? (
                      <Field
                        value={renameVal}
                        onChangeText={setRenameVal}
                        autoFocus
                        placeholder={copy.workout.renamePlaceholder}
                        onBlur={() => {
                          renameExercise(s.wTemplate, id, renameVal);
                          setRenamingEx(null);
                        }}
                        onSubmitEditing={() => {
                          renameExercise(s.wTemplate, id, renameVal);
                          setRenamingEx(null);
                        }}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 6,
                          fontSize: 13.5,
                          backgroundColor: t.bg,
                          borderColor: t.accentRamp[700],
                        }}
                      />
                    ) : (
                      <T size={13.5} weight="medium">
                        {name}
                      </T>
                    )}
                    {editing === id ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <Field
                          value={editWeight}
                          onChangeText={(v) => setEditWeight(v.replace(/[^0-9.]/g, ""))}
                          autoFocus
                          keyboardType="decimal-pad"
                          placeholder={copy.workout.weightPlaceholder}
                          onBlur={() => commitStat(id)}
                          style={{ width: 54, paddingVertical: 4, paddingHorizontal: 6, fontSize: 11, backgroundColor: t.bg, borderColor: t.accentRamp[700] }}
                        />
                        <Pressable
                          onPress={() => setEditUnit((u) => (u === "lb" ? "kg" : "lb"))}
                          accessibilityLabel={copy.a11y.toggleUnit(editUnit)}
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: radius.md,
                            borderWidth: 1,
                            borderColor: t.neutral[700],
                          }}
                        >
                          <T size={11} weight="medium" color={t.neutral[300]}>
                            {editUnit}
                          </T>
                        </Pressable>
                        <Field
                          value={editReps}
                          onChangeText={(v) => setEditReps(v.replace(/[^0-9]/g, ""))}
                          keyboardType="number-pad"
                          placeholder={copy.workout.repsPlaceholder}
                          onBlur={() => commitStat(id)}
                          style={{ width: 48, paddingVertical: 4, paddingHorizontal: 6, fontSize: 11, backgroundColor: t.bg, borderColor: t.accentRamp[700] }}
                        />
                        <T size={10.5} color={t.neutral[500]}>
                          {copy.workout.reps}
                        </T>
                        {/* number-pad has no return key on iOS, so blur alone
                            can't signal "done" — this is the only explicit way
                            to close the row once both numbers are in. */}
                        <Pressable
                          onPress={() => {
                            commitStat(id);
                            setEditing(null);
                          }}
                          accessibilityLabel={copy.a11y.done}
                          hitSlop={6}
                        >
                          <Icon name="check" size={14} color={t.accent} />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setEditing(id);
                          const stat = s.exStats[id];
                          setEditWeight(stat?.weight != null ? String(stat.weight) : "");
                          setEditReps(stat?.reps != null ? String(stat.reps) : "");
                          setEditUnit(stat?.unit ?? "lb");
                        }}
                        style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                      >
                        <T size={11} color={t.neutral[500]}>
                          {formatStat(s.exStats[id]) ?? detail}
                        </T>
                        <Icon name="pencil-simple" size={10} color={t.neutral[500]} />
                      </Pressable>
                    )}
                  </View>
                  <IconBtn
                    icon="minus"
                    label={copy.a11y.lessSets(name)}
                    onPress={() => s.update({ wSets: { ...s.wSets, [id]: Math.max(0, sets - 1) } })}
                  />
                  <T size={14} weight="medium" tabular style={{ width: 52, textAlign: "center" }}>
                    {copy.workout.sets(sets)}
                  </T>
                  <IconBtn
                    icon="plus"
                    accent
                    label={copy.a11y.moreSets(name)}
                    onPress={() => s.update({ wSets: { ...s.wSets, [id]: sets + 1 } })}
                  />
                </Card>
                </SwipeRow>
              );
            })}
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Field
                value={newExName}
                onChangeText={setNewExName}
                placeholder={copy.workout.addExercisePlaceholder}
                onSubmitEditing={() => {
                  addExercise(s.wTemplate, newExName);
                  setNewExName("");
                }}
                style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 11, fontSize: 12 }}
              />
              <IconBtn
                icon="plus"
                accent
                label={copy.a11y.addExercise}
                onPress={() => {
                  addExercise(s.wTemplate, newExName);
                  setNewExName("");
                }}
              />
            </View>
          </View>
        </View>

        {/* Paste whatever your notes already look like. Reading the lines
            beats retyping them, which is the only reason this is here. */}
        <View style={{ gap: 6 }}>
          <T size={11} color={t.neutral[500]}>
            {copy.workout.pasteLabel}
          </T>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <Field
              value={paste}
              onChangeText={setPaste}
              placeholder={copy.workout.pastePlaceholder}
              multiline
              style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 13, minHeight: 76 }}
            />
            <IconBtn
              icon="tray-arrow-down"
              size={44}
              accent
              label={copy.a11y.pasteWorkout}
              onPress={readPaste}
            />
          </View>
          <T size={11} color={t.neutral[600]}>
            {copy.workout.pasteHint}
          </T>
        </View>

        <Btn
          label={copy.workout.save}
          variant="primary"
          size={14}
          style={{ paddingVertical: 13 }}
          onPress={() => {
            s.logWorkout("full", copy.toast.workoutDetailed);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
