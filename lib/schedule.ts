import { copy } from "@/lib/copy";
import { fmtTime } from "@/lib/store";
import type {
  AnchorTimes, CustomBlock, Energy, ScheduleBlock, Task, WorkoutState,
} from "@/lib/types";

const workoutName = (energy: Energy | null) =>
  energy === "low" ? copy.schedule.workoutName.low : energy === "high" ? copy.schedule.workoutName.high : copy.schedule.workoutName.mid;

/** The one that reads as the hard task: flagged "big", else the longest title. */
function pickBig(open: Task[]): Task | null {
  if (!open.length) return null;
  const flagged = open.find((t) => t.meta.includes("big"));
  if (flagged) return flagged;
  return [...open].sort((a, b) => b.title.length - a.title.length)[0];
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The day is rebuilt from the anchors every time rather than stored as a list
 * of events. Move lunch and everything that keys off lunch moves with it —
 * which is the whole promise of "set the anchors once".
 *
 * The work blocks are generated from the user's own Next 3, not from fixtures:
 * the hard task goes in the medication peak window and the quick ones stack up
 * before lunch. A schedule that names someone else's tasks is furniture.
 *
 * Blocks marked `suggest` are proposals: they render dashed and do nothing
 * until the user accepts them. The app is allowed to have opinions; it is not
 * allowed to put things on your day without asking.
 */
export function buildSchedule(opts: {
  times: AnchorTimes;
  energy: Energy | null;
  workoutDone: WorkoutState;
  customBlocks: CustomBlock[];
  hiddenBlocks: Record<string, boolean>;
  tasks: Task[];
}): ScheduleBlock[] {
  const { times, energy, workoutDone, customBlocks, hiddenBlocks, tasks } = opts;

  const open = tasks.filter((t) => !t.done);
  const big = pickBig(open);
  const quick = open.filter((t) => t.id !== big?.id).slice(0, 2);

  const peakStart = times.meds + 120;
  const peakEnd = times.meds + 300;

  const blocks: ScheduleBlock[] = [
    {
      id: "meds",
      min: times.meds,
      title: copy.schedule.blocks.meds.title,
      sub: copy.schedule.blocks.meds.sub,
      icon: "pill",
      kind: "anchor",
    },
    ...(big
      ? [
          {
            id: "deep",
            min: peakStart,
            title: copy.schedule.blocks.deep.title(lower(big.title)),
            sub: copy.schedule.blocks.deep.sub(fmtTime(peakStart), fmtTime(peakEnd)),
            icon: "brain" as const,
            kind: "work" as const,
            suggest: true,
          },
        ]
      : []),
    {
      id: "break",
      min: times.meds + 180,
      title: copy.schedule.blocks.break.title,
      sub: copy.schedule.blocks.break.sub,
      icon: "drop",
      kind: "care",
      tag: copy.schedule.blocks.break.tag,
      removable: true,
    },
    ...(quick.length
      ? [
          {
            id: "light",
            min: times.lunch - 60,
            title: copy.schedule.blocks.light.title(quick.map((t) => lower(t.title)).join(", ")),
            sub: copy.schedule.blocks.light.sub(quick.length),
            icon: "list-checks" as const,
            kind: "work" as const,
            suggest: true,
          },
        ]
      : []),
    {
      id: "lunch",
      min: times.lunch,
      title: copy.schedule.blocks.lunch.title,
      sub: copy.schedule.blocks.lunch.sub,
      icon: "bowl-food",
      kind: "anchor",
    },
    {
      id: "gym",
      min: times.gym,
      title: workoutName(energy),
      sub: copy.schedule.blocks.gym.sub,
      icon: "barbell",
      kind: "work",
      suggest: true,
      done: workoutDone !== null,
    },
    {
      id: "dinner",
      min: times.wind - 180,
      title: copy.schedule.blocks.dinner.title,
      sub: copy.schedule.blocks.dinner.sub,
      icon: "fork-knife",
      kind: "care",
      tag: "hide",
      removable: true,
    },
    {
      id: "wind",
      min: times.wind,
      title: copy.schedule.blocks.wind.title,
      sub: copy.schedule.blocks.wind.sub,
      icon: "moon-stars",
      kind: "anchor",
    },
    ...customBlocks.map((c) => ({ ...c, tag: "yours" as const, removable: true })),
  ];

  return blocks.filter((b) => !hiddenBlocks[b.id]).sort((a, b) => a.min - b.min);
}

/**
 * "Now" is the last block you have already reached — the one you are inside,
 * not the next one coming up. Before the first block of the day nothing is
 * marked, rather than falsely pointing at breakfast.
 *
 * Suggestions are skipped: they are not on your day until you accept them, and
 * letting an unaccepted one claim "now" makes the marker vanish from the
 * timeline entirely for the hours it happens to cover.
 */
export function currentBlockId(
  blocks: ScheduleBlock[],
  nowMin: number,
  isGhost: (b: ScheduleBlock) => boolean,
): string | null {
  let id: string | null = null;
  for (const b of blocks) {
    if (isGhost(b)) continue;
    if (b.min <= nowMin) id = b.id;
    else break;
  }
  return id;
}

/** Where a newly added block lands: mid-afternoon, then nudge it from Edit day. */
export const defaultBlockTime = (times: AnchorTimes) => times.lunch + 120;
