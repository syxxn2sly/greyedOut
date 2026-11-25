// Reminders for the anchors. All local — no server, which keeps the
// "no network requests" claim in the privacy policy true.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { copy } from "@/lib/copy";
import type { AnchorTimes, CustomBlock } from "@/lib/types";

export const canNotify = Platform.OS !== "web";

// iOS drops these while the app is open unless you set a handler.
// No sound/badge on purpose — it's a nudge, not an alarm.
if (canNotify) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// iOS caps pending notifications at 64 and silently drops the rest.
// Anchors get scheduled first so a huge calendar import can't push them out.
const MAX_SCHEDULED = 40;

/**
 * A `dateKey` means fire once on that day; without one the slot repeats daily.
 *
 * The distinction arrived with dated blocks. A repeating reminder for a one-off
 * dentist appointment goes off every morning forever, which is the fastest way
 * to get reminders switched off altogether.
 */
type Slot = { min: number; title: string; body: string; dateKey?: string };

const anchorSlots = (times: AnchorTimes): Slot[] => [
  { min: times.wake, ...copy.notify.wake },
  { min: times.meds, ...copy.notify.meds },
  { min: times.lunch, ...copy.notify.lunch },
  { min: times.gym, ...copy.notify.gym },
  { min: times.wind, ...copy.notify.wind },
];

const blockSlots = (blocks: CustomBlock[]): Slot[] =>
  blocks.map((b) => ({
    min: b.min,
    title: b.title,
    body: copy.notify.blockBody,
    dateKey: b.source?.dateKey,
  }));

/**
 * The day's anchors and blocks as one list. Shared with calendar write-back so
 * both features describe the day from the same place.
 */
export const daySlots = (times: AnchorTimes, blocks: CustomBlock[]): Slot[] => [
  ...anchorSlots(times),
  ...blockSlots(blocks),
];

const atOf = (dateKey: string, min: number) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, Math.floor(min / 60), min % 60, 0, 0);
};

// Only ask once. If they said no in Settings, canAskAgain is false and
// iOS ignores the request anyway.
export async function requestNotifyPermission(): Promise<boolean> {
  if (!canNotify) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function hasNotifyPermission(): Promise<boolean> {
  if (!canNotify) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Wipe and rebuild. Diffing against what iOS holds isn't worth it for five
 * items.
 *
 * `ok` is separate from `count` on purpose. This used to return a bare number
 * and every failure path returned 0, so a scheduling error and a day with
 * nothing to schedule were the same answer — the switch went on, the toast
 * said "0 reminders set", and nothing ever fired. The caller needs to be able
 * to tell "none to set" from "could not set them".
 */
export type NotifyResult = { ok: boolean; count: number };

export async function syncNotifications(
  enabled: boolean,
  times: AnchorTimes,
  blocks: CustomBlock[],
): Promise<NotifyResult> {
  if (!canNotify) return { ok: false, count: 0 };
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return { ok: true, count: 0 };
    if (!(await hasNotifyPermission())) return { ok: false, count: 0 };

    const now = Date.now();
    const slots = [...anchorSlots(times), ...blockSlots(blocks)]
      .filter((s) => Number.isFinite(s.min) && s.min >= 0 && s.min < 24 * 60)
      // A dated slot whose moment has already gone would either be rejected by
      // iOS or fire immediately, so drop it rather than hand it over.
      .filter((s) => !s.dateKey || atOf(s.dateKey, s.min).getTime() > now)
      .slice(0, MAX_SCHEDULED);

    for (const slot of slots) {
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, badge: undefined },
        trigger: slot.dateKey
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: atOf(slot.dateKey, slot.min),
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: Math.floor(slot.min / 60),
              minute: slot.min % 60,
            },
      });
    }
    // Ask iOS what it actually holds rather than trusting the loop. A
    // scheduleNotificationAsync that resolves is not a promise that anything
    // was accepted, and the 64-pending cap is enforced on their side.
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    return { ok: pending.length > 0 || slots.length === 0, count: pending.length };
  } catch {
    // Not worth blowing up the app over, but the caller is told it failed so
    // it can say so instead of claiming zero reminders were wanted.
    return { ok: false, count: 0 };
  }
}

/** Used when the user turns reminders off, and on a permission revoke. */
export async function clearNotifications(): Promise<void> {
  if (!canNotify) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // nothing useful to do here
  }
}
