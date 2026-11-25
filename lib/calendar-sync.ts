import { Platform } from "react-native";
import * as Calendar from "expo-calendar";

import { copy } from "@/lib/copy";
import type { CustomBlock } from "@/lib/types";

/**
 * Reading and writing the device calendar.
 *
 * Everything here goes through EventKit, which hands over Google, Outlook and
 * iCloud through one API once the account is added to the phone. That is the
 * whole reason the app has no OAuth: the accounts are already there, and
 * talking to them directly would mean network calls the app otherwise never
 * makes.
 */

const canUse = Platform.OS !== "web";

/** The calendar the app writes its own blocks into. Never an existing one. */
const APP_CALENDAR_TITLE = "Greyed Out";

export const dateKeyOf = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const addDays = (d: Date, n: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

const startOf = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const endOf = (dateKey: string) => {
  const d = startOf(dateKey);
  d.setHours(23, 59, 59, 999);
  return d;
};

const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

export type FoundEvent = {
  eventId: string;
  calendarId: string;
  dateKey: string;
  title: string;
  min: number;
  calendarTitle: string;
};

export async function hasCalendarAccess() {
  if (!canUse) return false;
  try {
    return (await Calendar.getCalendarPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function askCalendarAccess() {
  if (!canUse) return false;
  try {
    return (await Calendar.requestCalendarPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Every account these calendars sync from, for display only. */
export function accountsOf(calendars: Calendar.Calendar[]) {
  const seen = new Set<string>();
  for (const c of calendars) {
    const name = c.source?.name?.trim();
    if (name) seen.add(name);
  }
  return [...seen];
}

/**
 * Read timed events across a span of days.
 *
 * All-day events are dropped: they have no time to sit at, and a band running
 * the length of the day swamps a timeline whose whole point is showing where
 * things fall within it.
 */
export async function readEvents(dateKeys: string[]): Promise<FoundEvent[]> {
  if (!canUse || !dateKeys.length) return [];
  try {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    // Never read back the app's own blocks, or every sync would re-import them.
    const readable = calendars.filter((c) => c.title !== APP_CALENDAR_TITLE);
    if (!readable.length) return [];

    const sorted = [...dateKeys].sort();
    const raw = await Calendar.getEventsAsync(
      readable.map((c) => c.id),
      startOf(sorted[0]),
      endOf(sorted[sorted.length - 1]),
    );

    const wanted = new Set(dateKeys);
    const byCalendar = new Map(readable.map((c) => [c.id, c.title]));

    return raw
      .filter((e) => !e.allDay && e.startDate)
      .map((e): FoundEvent => {
        const startsAt = new Date(e.startDate as string);
        return {
          eventId: String(e.id),
          calendarId: String(e.calendarId),
          dateKey: dateKeyOf(startsAt),
          title: (e.title ?? "").trim() || copy.importCalendar.untitledEvent,
          min: minutesOf(startsAt),
          calendarTitle: byCalendar.get(e.calendarId) ?? "calendar",
        };
      })
      .filter((e) => wanted.has(e.dateKey))
      .sort((a, b) =>
        a.dateKey === b.dateKey
          ? a.min - b.min
          : a.dateKey < b.dateKey
            ? -1
            : 1,
      );
  } catch {
    return [];
  }
}

export type SyncResult = {
  blocks: CustomBlock[];
  /** What actually changed, so the caller can decide whether to say anything. */
  moved: number;
  dropped: number;
};

/**
 * Bring imported blocks back in line with the calendar they came from.
 *
 * Blocks with no source are left alone: those are the recurring slots the user
 * made by hand. Imported ones either follow their event or go away with it,
 * which is the difference between a copy and a sync.
 *
 * Returns the same array when nothing changed, so a caller can skip the write.
 */
export async function syncImportedBlocks(
  blocks: CustomBlock[],
  todayKey: string,
): Promise<SyncResult> {
  const imported = blocks.filter((b) => b.source);
  if (!canUse || !imported.length) return { blocks, moved: 0, dropped: 0 };
  if (!(await hasCalendarAccess())) return { blocks, moved: 0, dropped: 0 };

  // Past days are never re-read; their blocks are dropped outright below.
  const live = [...new Set(imported.map((b) => b.source!.dateKey))].filter(
    (k) => k >= todayKey,
  );
  const events = await readEvents(live);
  const byId = new Map(events.map((e) => [e.eventId, e]));

  let moved = 0;
  let dropped = 0;

  const next = blocks.flatMap((b): CustomBlock[] => {
    if (!b.source) return [b];

    if (b.source.dateKey < todayKey) {
      dropped += 1;
      return [];
    }

    const live = byId.get(b.source.eventId);
    if (!live) {
      // Cancelled, deleted, or moved off this day entirely.
      dropped += 1;
      return [];
    }

    if (
      live.min === b.min &&
      live.title === b.title &&
      live.dateKey === b.source.dateKey
    ) {
      return [b];
    }

    moved += 1;
    return [
      {
        ...b,
        min: live.min,
        title: live.title,
        source: { ...b.source, dateKey: live.dateKey },
      },
    ];
  });

  if (!moved && !dropped) return { blocks, moved: 0, dropped: 0 };
  return { blocks: next, moved, dropped };
}

/** Blocks that belong on a given day: undated ones repeat, imported ones don't. */
export const blocksForDay = (blocks: CustomBlock[], dateKey: string) =>
  blocks.filter((b) => !b.source || b.source.dateKey === dateKey);

// ── write-back ────────────────────────────────────────────────────────────

/**
 * The calendar the app owns. Everything written goes here and nowhere else, so
 * turning write-back off is one delete and none of the user's real calendars
 * were ever touched.
 */
async function findAppCalendar() {
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  return (
    calendars.find(
      (c) => c.title === APP_CALENDAR_TITLE && c.allowsModifications,
    ) ?? null
  );
}

async function ensureAppCalendar() {
  const existing = await findAppCalendar();
  if (existing) return existing.id;

  // iOS wants a source to hang a new calendar off. The default one is local,
  // which is what we want: an app-made calendar has no business syncing up to
  // someone's Google or Exchange account.
  const source =
    Platform.OS === "ios"
      ? (await Calendar.getDefaultCalendarAsync()).source
      : {
          isLocalAccount: true,
          name: APP_CALENDAR_TITLE,
          type: Calendar.SourceType.LOCAL,
        };

  return Calendar.createCalendarAsync({
    title: APP_CALENDAR_TITLE,
    name: APP_CALENDAR_TITLE,
    color: "#6b7bd6",
    entityType: Calendar.EntityTypes.EVENT,
    source: source as Calendar.Source,
    sourceId:
      Platform.OS === "ios" ? (source as Calendar.Source).id : undefined,
    ownerAccount: APP_CALENDAR_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

/** How long a pushed block sits on the calendar. Long enough to see, short
 *  enough not to wall off an afternoon. */
const PUSH_MINUTES = 30;

export type PushItem = { key: string; title: string; min: number };

/**
 * Write the day's own blocks out to the app's calendar.
 *
 * Writes are scoped to the app's own calendar and to one day, and every event
 * the app previously wrote for that day is cleared first. That makes this
 * idempotent: running it twice leaves the same events, not two sets.
 */
export async function pushDayToCalendar(
  dateKey: string,
  items: PushItem[],
): Promise<{ written: number; calendarId: string | null }> {
  if (!canUse) return { written: 0, calendarId: null };
  try {
    if (!(await hasCalendarAccess())) return { written: 0, calendarId: null };

    const calendarId = await ensureAppCalendar();

    const existing = await Calendar.getEventsAsync(
      [calendarId],
      startOf(dateKey),
      endOf(dateKey),
    );
    await Promise.all(
      existing.map((e) => Calendar.deleteEventAsync(String(e.id))),
    );

    const base = startOf(dateKey);
    let written = 0;
    for (const item of items) {
      const startDate = new Date(base);
      startDate.setMinutes(item.min);
      const endDate = new Date(startDate.getTime() + PUSH_MINUTES * 60_000);
      await Calendar.createEventAsync(calendarId, {
        title: item.title,
        startDate,
        endDate,
        notes: copy.importCalendar.pushedNote,
      });
      written += 1;
    }
    return { written, calendarId };
  } catch {
    return { written: 0, calendarId: null };
  }
}

/**
 * Remove the app's calendar outright. Used when write-back is switched off, so
 * the user is not left with a stale copy of a day they stopped syncing.
 */
export async function removeAppCalendar() {
  if (!canUse) return false;
  try {
    const existing = await findAppCalendar();
    if (!existing) return false;
    await Calendar.deleteCalendarAsync(existing.id);
    return true;
  } catch {
    return false;
  }
}
