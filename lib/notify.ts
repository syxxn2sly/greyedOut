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

type Slot = { min: number; title: string; body: string };

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
  }));

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

// Just wipe and rebuild. Diffing against what iOS holds isn't worth it
// for five items.
export async function syncNotifications(
  enabled: boolean,
  times: AnchorTimes,
  blocks: CustomBlock[],
): Promise<number> {
  if (!canNotify) return 0;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return 0;
    if (!(await hasNotifyPermission())) return 0;

    const slots = [...anchorSlots(times), ...blockSlots(blocks)]
      .filter((s) => Number.isFinite(s.min) && s.min >= 0 && s.min < 24 * 60)
      .slice(0, MAX_SCHEDULED);

    for (const slot of slots) {
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, badge: undefined },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: Math.floor(slot.min / 60),
          minute: slot.min % 60,
        },
      });
    }
    return slots.length;
  } catch {
    // Not worth blowing up the app over. Worst case it's quieter than asked.
    return 0;
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
