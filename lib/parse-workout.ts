// Parses workouts pasted out of Notes. Everyone writes them differently
// ("bench 135 for 8", "squat 3x5 @ 225", "dips bodyweight") so this handles
// the shapes I actually see. Lines it can't read go in `skipped` instead of
// being dropped silently.
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

// words that describe the set, not the lift
const NOISE =
  /\b(reps?|rep|sets?|set|for|of|x|by|at|each|total|superset|ss|amrap|to failure|failure|seconds?|secs?|minutes?|mins?)\b/gi;

/** "60 seconds", "2 min" — a duration, never a weight. */
const DURATION = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)\b/i;

const BODYWEIGHT = /\b(bodyweight|body ?weight|bw|no weight|unweighted)\b/i;

/** "3x8", "3 x 8", "3×8" — either sets by reps, or weight by reps. */
const SETS_X_REPS = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+)/i;

// Nobody does more than a dozen sets, so a bigger first number is a weight.
// This is what tells "3 x 8" apart from "315 x 3".
const MAX_SETS = 12;

/** A weight, optionally with a unit attached: "135", "60kg", "90 lb". */
const WEIGHT_UNIT = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|lbs?|pounds?)\b/i;

const isKg = (u: string) => /^k/i.test(u);

// newlines first, then commas — handles both a pasted column and a single
// "bench 135x5, squat 225x5" line
const lines = (raw: string): string[] =>
  raw
    .split(/[\n;]+/)
    .flatMap((l) => (/\d/.test(l) && l.split(",").length > 2 ? l.split(",") : [l]))
    .map((l) => l.replace(/^\s*(?:\d+[.)]\s+|[-–—*•]\s*)?/, "").trim())
    .filter(Boolean);

const parseLine = (line: string): ParsedExercise | null => {
  // no number and no bodyweight marker = prose, not a lift ("rest day")
  if (!/\d/.test(line) && !BODYWEIGHT.test(line)) return null;

  let rest = line;
  let sets: number | null = null;
  let reps: number | null = null;
  let weight: number | null = null;
  let unit: "lb" | "kg" = "lb";

  // strip durations first or "plank 60 seconds" becomes 60 lb
  rest = rest.replace(DURATION, " ");

  const bodyweight = BODYWEIGHT.test(rest);
  if (bodyweight) rest = rest.replace(BODYWEIGHT, " ");

  // grab the unit-tagged number first or "60kg x 5" reads 60 as sets
  const withUnit = rest.match(WEIGHT_UNIT);
  if (withUnit) {
    weight = Number(withUnit[1]);
    unit = isKg(withUnit[2]) ? "kg" : "lb";
    rest = rest.replace(withUnit[0], " ");
  }

  // "50s" = fifty-pound dumbbells, not fifty sets
  rest = rest.replace(/(\d+(?:\.\d+)?)\s*s\b/gi, "$1 ");

  // "3 sets of 12" written out
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

  // whatever's left: biggest number is almost always the weight
  const bare = (rest.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  let leftovers = [...bare];

  if (reps === null) {
    // "for 8" / "x 8" / "8 reps"
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
