/**
 * Turn a pasted workout into exercises the app can hold.
 *
 * People keep workouts in Notes, and everyone writes them differently:
 * "bench 135 for 8", "squat 3x5 @ 225", "lat pulldown 90lb x 12",
 * "dips bodyweight". Rather than demand one format, this reads the shapes
 * that actually turn up and gives back what it understood.
 *
 * It never guesses at a name it cannot find, and it never invents numbers.
 * A line it cannot read comes back in `skipped` so the screen can say so
 * instead of quietly dropping it.
 */
import type { ExStat } from "@/lib/types";

export type ParsedExercise = {
  name: string;
  sets: number | null;
  stat: ExStat;
};

export type ParseResult = {
  found: ParsedExercise[];
  skipped: string[];
};

/** Words that describe the set rather than name the lift. */
const NOISE =
  /\b(reps?|rep|sets?|set|for|of|x|by|at|each|total|superset|ss|amrap|to failure|failure|seconds?|secs?|minutes?|mins?)\b/gi;

/** "60 seconds", "2 min" — a duration, never a weight. */
const DURATION = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)\b/i;

const BODYWEIGHT = /\b(bodyweight|body ?weight|bw|no weight|unweighted)\b/i;

/** "3x8", "3 x 8", "3×8" — either sets by reps, or weight by reps. */
const SETS_X_REPS = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+)/i;

/**
 * Nobody does more than a dozen sets of anything, so a first number above
 * this is a weight, not a set count. It is what separates "3 x 8" (three
 * sets of eight) from "315 x 3" (three reps at 315).
 */
const MAX_SETS = 12;

/** A weight, optionally with a unit attached: "135", "60kg", "90 lb". */
const WEIGHT_UNIT = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|lbs?|pounds?)\b/i;

const isKg = (u: string) => /^k/i.test(u);

/**
 * Split on newlines first, then on commas and semicolons, so both a pasted
 * column of lines and a single "bench 135x5, squat 225x5" line work.
 */
const lines = (raw: string): string[] =>
  raw
    .split(/[\n;]+/)
    .flatMap((l) => (/\d/.test(l) && l.split(",").length > 2 ? l.split(",") : [l]))
    .map((l) => l.replace(/^\s*(?:\d+[.)]\s+|[-–—*•]\s*)?/, "").trim())
    .filter(Boolean);

const parseLine = (line: string): ParsedExercise | null => {
  // A line with no number and no bodyweight marker is prose, not a lift.
  // "rest day" and a stray note should be reported, not silently invented
  // into an exercise with nothing in it.
  if (!/\d/.test(line) && !BODYWEIGHT.test(line)) return null;

  let rest = line;
  let sets: number | null = null;
  let reps: number | null = null;
  let weight: number | null = null;
  let unit: "lb" | "kg" = "lb";

  // Strip durations before any number-hunting, so "plank 60 seconds" does
  // not come back as sixty pounds.
  rest = rest.replace(DURATION, " ");

  const bodyweight = BODYWEIGHT.test(rest);
  if (bodyweight) rest = rest.replace(BODYWEIGHT, " ");

  // A unit-tagged number is unambiguous, so take it before anything else
  // can claim it — "60kg x 5" must not read 60 as a set count.
  const withUnit = rest.match(WEIGHT_UNIT);
  if (withUnit) {
    weight = Number(withUnit[1]);
    unit = isKg(withUnit[2]) ? "kg" : "lb";
    rest = rest.replace(withUnit[0], " ");
  }

  // Dumbbell shorthand: "50s" means fifty-pound dumbbells, not fifty sets.
  rest = rest.replace(/(\d+(?:\.\d+)?)\s*s\b/gi, "$1 ");

  // "3 sets of 12", "4 sets x 10" — the same thing written out.
  const spelled = rest.match(/(\d+)\s*sets?\s*(?:of|x|×)?\s*(\d+)/i);
  if (spelled) {
    sets = Number(spelled[1]);
    reps = Number(spelled[2]);
    rest = rest.replace(spelled[0], " ");
  }

  const sxr = sets !== null ? null : rest.match(SETS_X_REPS);
  if (sxr) {
    const first = Number(sxr[1]);
    const second = Number(sxr[2]);
    if (first > MAX_SETS) {
      if (weight === null) weight = first;
      reps = second;
    } else {
      sets = first;
      reps = second;
    }
    rest = rest.replace(sxr[0], " ");
  }

  // Remaining bare numbers, in order. After sets/reps and a unit-tagged
  // weight are gone, the biggest one left is almost always the weight.
  const bare = (rest.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  let leftovers = [...bare];

  if (reps === null) {
    // "for 8" / "x 8" / "8 reps" all put the rep count next to a keyword.
    const near = line.match(/(?:for|x|×)\s*(\d+)\s*(?:reps?)?\s*$/i) ?? line.match(/(\d+)\s*reps?\b/i);
    if (near) {
      reps = Number(near[1]);
      leftovers = leftovers.filter((n) => n !== reps);
    }
  }

  if (weight === null && leftovers.length) {
    weight = Math.max(...leftovers);
    leftovers = leftovers.filter((n) => n !== weight);
  }

  if (reps === null && leftovers.length) reps = leftovers[0];

  for (const n of [sets, reps, weight]) {
    if (n !== null && !Number.isFinite(n)) return null;
  }

  const name = rest
    .replace(/\d+(?:\.\d+)?/g, " ")
    .replace(NOISE, " ")
    .replace(/[@#:+\-–—*•/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || name.length < 2) return null;

  return {
    name: name.toLowerCase(),
    sets,
    stat: { weight: bodyweight ? null : weight, unit, reps },
  };
};

export const parseWorkout = (raw: string): ParseResult => {
  const found: ParsedExercise[] = [];
  const skipped: string[] = [];
  for (const line of lines(raw)) {
    const p = parseLine(line);
    if (p) found.push(p);
    else skipped.push(line);
  }
  return { found, skipped };
};
