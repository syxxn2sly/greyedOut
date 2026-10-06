import type { IconName } from "@/components/icon";

export type Mode = "regular" | "blunt" | "cant";
export type Energy = "low" | "mid" | "high";

/** null = nothing logged yet. "skipped" is a logged choice, not an absence. */
export type FoodState = null | "ate" | "well" | "skipped";

/** null = not done. "mini" is the 10-minute version, which counts fully. */
export type WorkoutState = null | "full" | "mini";

export type Task = {
  id: string;
  title: string;
  meta: string;
  done: boolean;
};

/**
 * Anchors carry no stored label — it is derived from the times so that moving
 * wind-down to 11 doesn't leave a card still reading "wind-down at 10".
 */
export type Anchor = {
  id: "wake" | "lunch" | "wind";
  /** Phosphor icon name, resolved through components/icon.tsx. */
  icon: IconName;
  done: boolean;
};

/**
 * A one-tap food. The point is zero decisions on a bad day, which only works
 * if the list is the user's own — so these are stored, not hardcoded.
 */
export type SafeFood = {
  id: string;
  name: string;
  cal: number;
  pro: number;
};

export type Meal = {
  id: string;
  name: string;
  cal: number;
  pro: number;
  /** Formatted clock time, e.g. "1:15p". */
  at: string;
};

/** The five movable points the rest of the day is laid out around. */
export type AnchorTimes = {
  /** Set directly rather than derived from meds, so it can be moved on its own. */
  wake: number;
  meds: number;
  lunch: number;
  gym: number;
  wind: number;
};

export type WorkoutTemplate = {
  id: string;
  /** Built-ins can be hidden but not deleted; yours can be edited and deleted. */
  custom?: boolean;
  name: string;
  icon: IconName;
  sub: string;
  /** [id, display name, fallback text shown until a real stat is logged] */
  ex: [string, string, string][];
};

/** Weight is optional — bodyweight exercises log reps with no number attached. */
export type ExStat = {
  weight: number | null;
  unit: "lb" | "kg";
  reps: number | null;
};

export type CustomBlock = {
  id: string;
  min: number;
  title: string;
  sub: string;
  icon: IconName;
  kind: BlockKind;
};

export type BlockKind = "anchor" | "school" | "work" | "care";

export type ScheduleBlock = {
  id: string;
  min: number;
  title: string;
  sub: string;
  icon: IconName;
  kind: BlockKind;
  /** Suggestions render dashed and do nothing until accepted. */
  suggest?: boolean;
  tag?: string;
  removable?: boolean;
  done?: boolean;
};

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** null on a day means rest, which is a plan rather than a gap. */
export type WeekPlan = Record<WeekDay, string | null>;

export type Triage = "q1" | "q2" | "done";
