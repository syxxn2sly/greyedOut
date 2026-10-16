import type { IconName } from "@/components/icon";
import type { WorkoutTemplate } from "@/lib/types";

/**
 * The stock three. They are deliberately few — a template picker with fifteen
 * options is another decision to make on a day when deciding is the problem.
 * Users add their own from the log screen, capped at seven total.
 */
export const builtInTemplates: Record<string, WorkoutTemplate> = {
  push: {
    id: "push",
    name: "Push day",
    icon: "barbell",
    sub: "3 lifts · ~40 min",
    ex: [
      ["bench", "Bench press", "tap to add weight · reps"],
      ["ohp", "Overhead press", "tap to add weight · reps"],
      ["dips", "Dips", "bodyweight"],
    ],
  },
  legs: {
    id: "legs",
    name: "Leg day",
    icon: "person-simple-run",
    sub: "3 lifts · ~45 min",
    ex: [
      ["squat", "Squat", "tap to add weight · reps"],
      ["rdl", "Romanian deadlift", "tap to add weight · reps"],
      ["lunge", "Walking lunges", "bodyweight"],
    ],
  },
  walk: {
    id: "walk",
    name: "Walk",
    icon: "footprints",
    sub: "outside counts double",
    ex: [["walk", "Walk", "20+ min, any pace"]],
  },
};

export const MAX_TEMPLATES = 7;

export const customIcons: IconName[] = ["hand-fist", "heartbeat", "bicycle", "mountains"];

/** Exercises typed into the template form start with no numbers attached. */
export const BLANK_DETAIL = "tap to add weight · reps";
