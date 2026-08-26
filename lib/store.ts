import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { copy } from "@/lib/copy";
import { hasNotifyPermission, syncNotifications } from "@/lib/notify";
import type {
  Anchor,
  SafeFood,
  AnchorTimes,
  CustomBlock,
  Energy,
  FoodState,
  Meal,
  Mode,
  Task,
  WeekPlan,
  WorkoutState,
  WorkoutTemplate,
  ExStat,
} from "@/lib/types";
import type { ThemeName } from "@/constants/theme";

// Bump this when the saved shape changes. Everyone loses today's data once,
// which beats maintaining a migration for every old format.
const STORAGE_KEY = "procrastin8r.state.v3";

// 3h between nudges. Was seconds originally and it felt like nagging.
const NUDGE_GAP_MS = 3 * 60 * 60 * 1000;

// minutes past midnight
const MIN = { wake: 480, meds: 510, lunch: 780, gym: 1050, wind: 1320 };

export type Nudge = {
  text: string;
  doLabel: string;
  /** Which fix the "do it" button applies. */
  kind: "water" | "food";
};

type State = {
  /** Which day the daily counters belong to, as YYYY-MM-DD in local time. */
  dayKey: string;
  /** False until the anchor times have been set once, which gates first run. */
  onboarded: boolean;
  mode: Mode | null;
  energy: Energy | null;
  tasks: Task[];
  anchors: Anchor[];
  inbox: string[];
  water: number;
  food: FoodState;
  meals: Meal[];
  safeFoods: SafeFood[];
  workoutDone: WorkoutState;
  crisisAte: boolean;
  crisisAnchorDone: boolean;
  schedDone: Record<string, boolean>;
  /** Suggestion blocks the user has explicitly pulled into the day. */
  accepted: Record<string, boolean>;
  hiddenBlocks: Record<string, boolean>;
  customBlocks: CustomBlock[];
  times: AnchorTimes;
  autoGym: boolean;
  /**
   * Off until asked for. Reminders need an iOS permission prompt, and a first
   * run that opens with a permission dialog is a first run people leave.
   */
  notify: boolean;
  weekPlan: WeekPlan;
  wTemplate: string;
  wSets: Record<string, number>;
  customTpls: WorkoutTemplate[];
  hiddenTpls: Record<string, boolean>;
  exStats: Record<string, ExStat>;
  theme: ThemeName;
  focusTotalMin: number;
};

const seedAnchors: Anchor[] = [
  { id: "wake", icon: "sun-horizon", done: false },
  { id: "lunch", icon: "bowl-food", done: false },
  { id: "wind", icon: "moon-stars", done: false },
];

export const anchorLabel = (id: Anchor["id"], times: AnchorTimes) =>
  id === "wake"
    ? copy.home.anchor.wake(fmtTime(times.wake))
    : id === "lunch"
      ? copy.home.anchor.lunch
      : copy.home.anchor.wind(fmtTime(times.wind));

const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const initial: State = {
  dayKey: todayKey(),
  onboarded: false,
  mode: null,
  energy: null,
  tasks: [],
  anchors: seedAnchors,
  inbox: [],
  water: 0,
  food: null,
  meals: [],
  // Starters, not gospel — hold one to drop it, save your own from the meal row.
  safeFoods: [
    { id: "f1", name: "chicken bowl", cal: 620, pro: 45 },
    { id: "f2", name: "pb toast", cal: 340, pro: 14 },
    { id: "f3", name: "yogurt + granola", cal: 280, pro: 18 },
    { id: "f4", name: "protein shake", cal: 200, pro: 30 },
  ],
  workoutDone: null,
  crisisAte: false,
  crisisAnchorDone: false,
  schedDone: {},
  accepted: {},
  hiddenBlocks: {},
  customBlocks: [],
  times: MIN,
  autoGym: true,
  notify: false,
  weekPlan: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
  wTemplate: "push",
  wSets: {},
  customTpls: [],
  hiddenTpls: {},
  exStats: {},
  theme: "dark",
  focusTotalMin: 25,
};

// Clears the day but keeps anything the user set up: unfinished tasks,
// anchor times, templates, week plan, theme.
const rollDay = (s: State): State => ({
  ...s,
  dayKey: todayKey(),
  mode: null,
  energy: null,
  tasks: s.tasks.filter((t) => !t.done),
  anchors: s.anchors.map((a) => ({ ...a, done: false })),
  water: 0,
  food: null,
  meals: [],
  workoutDone: null,
  crisisAte: false,
  crisisAnchorDone: false,
  schedDone: {},
  accepted: {},
  hiddenBlocks: {},
});

export const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")}${h < 12 ? "a" : "p"}`;
};

export const nowStr = () => {
  const d = new Date();
  return fmtTime(d.getHours() * 60 + d.getMinutes());
};

const wins = copy.toast.wins;

export const splitSteps = copy.splitSteps;

export const [StoreProvider, useStore] = createContextHook(() => {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [prevTasks, setPrevTasks] = useState<Task[] | null>(null);

  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeLevel = useRef(0);
  const lastNudgeAt = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = { ...initial, ...(JSON.parse(raw) as Partial<State>) };
          // Old builds can have anchor ids that don't exist any more. Labels
          // are derived from the id so a stale one renders as the last case.
          const validAnchors =
            Array.isArray(saved.anchors) &&
            saved.anchors.length === seedAnchors.length &&
            saved.anchors.every((a) => seedAnchors.some((s) => s.id === a?.id));
          const withTimes = {
            ...saved,
            // merge, don't replace — older blobs are missing newer anchors
            times: { ...initial.times, ...(saved.times ?? {}) },
          };
          const merged = validAnchors
            ? withTimes
            : { ...withTimes, anchors: seedAnchors.map((a) => ({ ...a })) };
          setState(merged.dayKey === todayKey() ? merged : rollDay(merged));
        }
      } catch {
        // corrupt blob, just start fresh
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Hydration only runs on cold launch. If you background the app overnight
  // iOS keeps the JS context alive and the day never rolls — you come back to
  // yesterday's water count. Re-check on foreground.
  useEffect(() => {
    if (!hydrated) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      setState((s) => (s.dayKey === todayKey() ? s : rollDay(s)));

      // They can also turn reminders off in Settings and we never hear about
      // it, so the toggle would keep claiming to be on.
      hasNotifyPermission().then((granted) => {
        if (!granted) setState((s) => (s.notify ? { ...s, notify: false } : s));
      });
    });
    return () => sub.remove();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  // Anchor times get edited from three different screens, so reschedule off
  // the state they all write to. Deps are narrow on purpose or every water
  // tap rebuilds the whole set.
  useEffect(() => {
    if (!hydrated) return;
    syncNotifications(state.notify, state.times, state.customBlocks);
  }, [hydrated, state.notify, state.times, state.customBlocks]);

  const update = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const cheer = useCallback((msg?: string) => {
    setToast(msg ?? wins[Math.floor(Math.random() * wins.length)]);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (toastT.current) clearTimeout(toastT.current);
  }, []);

  /**
   * The nudge escalates over three messages and then goes quiet, which is the
   * whole point — an app that nags forever gets uninstalled or ignored, and
   * both failures cost the user the thing they installed it for.
   */
  const armNudge = useCallback(() => {
    if (nudge) return;
    if (Date.now() - lastNudgeAt.current < NUDGE_GAP_MS) return;
    const lvl = Math.min(nudgeLevel.current, 2);
    if (state.water === 0) {
      setNudge({
        text: [
          ...copy.nudge.water.messages,
        ][lvl],
        doLabel: copy.nudge.water.action,
        kind: "water",
      });
      nudgeLevel.current += 1;
      lastNudgeAt.current = Date.now();
    } else if (state.food === null) {
      setNudge({
        text: [
          ...copy.nudge.food.messages,
        ][lvl],
        doLabel: copy.nudge.food.action,
        kind: "food",
      });
      nudgeLevel.current += 1;
      lastNudgeAt.current = Date.now();
    }
  }, [nudge, state.water, state.food]);

  const dismissNudge = useCallback(() => {
    // Dismissing restarts the same three-hour gap; "later" is not a shorter
    // snooze, because a reminder that returns in a minute is the thing people
    // turn off entirely.
    lastNudgeAt.current = Date.now();
    setNudge(null);
  }, []);

  const applyNudge = useCallback(() => {
    if (!nudge) return;
    if (nudge.kind === "water") update((s) => ({ water: s.water + 1 }));
    else update({ food: "ate" });
    nudgeLevel.current = 0;
    lastNudgeAt.current = Date.now();
    setNudge(null);
  }, [nudge, update]);

  // ── tasks ───────────────────────────────────────────────────────────────

  const toggleTask = useCallback(
    (id: string) => {
      setPrevTasks(state.tasks);
      const was = state.tasks.find((t) => t.id === id)?.done;
      update({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
      if (!was) cheer();
    },
    [state.tasks, update, cheer],
  );

  const eraseTask = useCallback(
    (id: string) => {
      setPrevTasks(state.tasks);
      update({ tasks: state.tasks.filter((t) => t.id !== id) });
      cheer(copy.toast.taskErased);
    },
    [state.tasks, update, cheer],
  );

  const bumpTask = useCallback(
    (id: string) => {
      const i = state.tasks.findIndex((t) => t.id === id);
      if (i <= 0) return;
      const arr = [...state.tasks];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      update({ tasks: arr });
    },
    [state.tasks, update],
  );

  const splitTask = useCallback(
    (id: string) => {
      const step = splitSteps[Math.floor(Math.random() * splitSteps.length)];
      update({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, meta: step } : t)) });
      cheer(copy.toast.taskSplit);
    },
    [state.tasks, update, cheer],
  );

  const addTask = useCallback(
    (title: string, meta: string = copy.meta.addedByYou) => {
      const clean = title.trim();
      if (!clean) return;
      setPrevTasks(state.tasks);
      update({
        tasks: [...state.tasks, { id: `t${Date.now()}`, title: clean, meta, done: false }],
      });
      cheer(copy.toast.taskAdded);
    },
    [state.tasks, update, cheer],
  );

  const undoTasks = useCallback(() => {
    if (!prevTasks) return;
    update({ tasks: prevTasks });
    setPrevTasks(null);
  }, [prevTasks, update]);

  const completeTask = useCallback(
    (id: string) => update((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: true } : t)) })),
    [update],
  );

  // ── anchors, food, water, movement ──────────────────────────────────────

  const toggleAnchor = useCallback(
    (id: string) => {
      const was = state.anchors.find((a) => a.id === id)?.done;
      update({ anchors: state.anchors.map((a) => (a.id === id ? { ...a, done: !a.done } : a)) });
      if (!was) cheer(copy.toast.anchorHeld);
    },
    [state.anchors, update, cheer],
  );

  const logFood = useCallback(
    (v: FoodState) => {
      update({ food: v });
      if (v === "ate") cheer(copy.toast.fed);
      else if (v === "well") cheer(copy.toast.fedWell);
    },
    [update, cheer],
  );

  const addMeal = useCallback(
    (name: string, cal: number, pro: number, msg?: string) => {
      update((s) => ({
        meals: [...s.meals, { id: `m${Date.now()}`, name, cal, pro, at: nowStr() }],
        food: s.food === null || s.food === "skipped" ? "ate" : s.food,
      }));
      cheer(msg ?? copy.toast.macrosCounted);
    },
    [update, cheer],
  );

  const addSafeFood = useCallback(
    (name: string, cal: number, pro: number) => {
      const clean = name.trim();
      if (!clean) return;
      if (state.safeFoods.some((f) => f.name.toLowerCase() === clean.toLowerCase())) {
        cheer(copy.toast.goToDuplicate);
        return;
      }
      update((s) => ({ safeFoods: [...s.safeFoods, { id: `f${Date.now()}`, name: clean, cal, pro }] }));
      cheer(copy.toast.goToSaved);
    },
    [state.safeFoods, update, cheer],
  );

  const removeSafeFood = useCallback(
    (id: string) => {
      update((s) => ({ safeFoods: s.safeFoods.filter((f) => f.id !== id) }));
      cheer(copy.toast.goToDropped);
    },
    [update, cheer],
  );

  const removeMeal = useCallback(
    (id: string) =>
      update((s) => {
        const meals = s.meals.filter((m) => m.id !== id);
        return { meals, food: meals.length ? s.food : null };
      }),
    [update],
  );

  const addWater = useCallback(() => {
    update((s) => ({ water: s.water + 1 }));
    if (state.water === 0) cheer(copy.toast.firstWater);
  }, [state.water, update, cheer]);

  const removeWater = useCallback(
    () => update((s) => ({ water: Math.max(0, s.water - 1) })),
    [update],
  );

  const logWorkout = useCallback(
    (v: WorkoutState, msg?: string) => {
      update({ workoutDone: v });
      if (v) cheer(msg ?? copy.toast.workoutLogged);
    },
    [update, cheer],
  );

  // ── capture inbox ───────────────────────────────────────────────────────

  const toInbox = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      update((s) => ({ inbox: [...s.inbox, clean] }));
      cheer(copy.toast.dumped);
    },
    [update, cheer],
  );

  /**
   * Pull something out of the inbox and onto today's list. Without this the
   * "later" pile is write-only, and a pile you cannot get things back out of
   * is where you stop putting things — which kills the capture habit that the
   * rest of the app depends on.
   */
  const promoteFromInbox = useCallback(
    (index: number) => {
      const title = state.inbox[index];
      if (!title) return;
      update((s) => ({ inbox: s.inbox.filter((_, i) => i !== index) }));
      setPrevTasks(state.tasks);
      update((s) => ({
        tasks: [...s.tasks, { id: `t${Date.now()}`, title, meta: copy.meta.pulledUp, done: false }],
      }));
      cheer(copy.toast.pulledUp);
    },
    [state.inbox, state.tasks, update, cheer],
  );

  const removeFromInbox = useCallback(
    (index: number) => update((s) => ({ inbox: s.inbox.filter((_, i) => i !== index) })),
    [update],
  );

  /**
   * Triage is two questions on purpose. "Due soon" plus "what happens if you
   * skip it" is enough to sort today from later, and a third question is where
   * people quit and the inbox becomes a graveyard.
   */
  const fileCapture = useCallback(
    (title: string, dueSoon: boolean, severity: "shrug" | "bad" | "verybad") => {
      const today = dueSoon || severity === "verybad";
      if (today) addTask(title, copy.meta.autoTriaged);
      else update((s) => ({ inbox: [...s.inbox, title] }));
      return today ? "today" : "later";
    },
    [addTask, update],
  );

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      toast,
      cheer,
      nudge,
      armNudge,
      dismissNudge,
      applyNudge,
      canUndo: prevTasks !== null,
      undoTasks,
      update,
      toggleTask,
      eraseTask,
      bumpTask,
      splitTask,
      addTask,
      completeTask,
      toggleAnchor,
      logFood,
      addMeal,
      removeMeal,
      addSafeFood,
      removeSafeFood,
      addWater,
      removeWater,
      logWorkout,
      toInbox,
      promoteFromInbox,
      removeFromInbox,
      fileCapture,
    }),
    [
      state, hydrated, toast, cheer, nudge, armNudge, dismissNudge, applyNudge,
      prevTasks, undoTasks, update, toggleTask, eraseTask, bumpTask, splitTask,
      addTask, completeTask, toggleAnchor, logFood, addMeal, removeMeal,
      addSafeFood, removeSafeFood,
      addWater, removeWater, logWorkout, toInbox, promoteFromInbox,
      removeFromInbox, fileCapture,
    ],
  );

  return value;
});

// The line at the top of Home. States what it sees, never tells you to do
// anything. Order matters: food > water > list.
export const noticingLine = (food: FoodState, water: number, openTasks: number) => {
  if (food === "skipped") return copy.home.noticing.skipped;
  if (food === null) return copy.home.noticing.nothingEaten;
  if (water === 0) return copy.home.noticing.noWater;
  if (openTasks === 0) return copy.home.noticing.allClear;
  return copy.home.noticing.remaining(openTasks);
};
