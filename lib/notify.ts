/**
 * Local notifications for the day's anchors and blocks.
 *
 * Local only, on purpose. Nothing is scheduled on a server and nothing leaves
 * the phone, so the app keeps making no network requests at all — which is
 * what the privacy policy and the store listing both claim.
 *
 * Everything here is written to be safe to call at any time: scheduling always
 * clears what it previously set before laying down the new set, so a double
 * call cannot produce two of the same reminder.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { copy } from "@/lib/copy";
import type { AnchorTimes, CustomBlock } from "@/lib/types";

/** The simulator delivers these, the web build has nowhere to put them. */
export const canNotify = Platform.OS !== "web";

/**
 * iOS swallows notifications while the app is in the foreground unless it is
 * told otherwise. An anchor that fires silently because you happened to have
 * the app open is the one case where the reminder was needed and missing.
 *
 * No sound and no badge: this is a nudge, not an alarm, and a badge is a
 * number the user then has to go and clear.
 */
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

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest, so a day with a very long imported calendar cannot be allowed to
 * push the anchors out. Anchors are laid down first and this cap only ever
 * bites the blocks after them.
 */
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

/**
 * Ask once. A denial is a real answer, so this never nags: if the user has
 * turned it off in Settings, `canAskAgain` is false and iOS would ignore the
 * request anyway.
 */
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
 * Rebuild the whole schedule from scratch. Cheaper to reason about than
 * diffing against what iOS currently holds, and the set is small enough that
 * the cost does not matter.
 *
 * Times are minutes past midnight, which is how the rest of the app stores
 * them; a daily trigger wants hour and minute separately.
 */
export async function syncNotifications(
  enabled: boolean,
  times: AnchorTimes,
  blocks: CustomBlock[],
): Promise<void> {
  if (!canNotify) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    if (!(await hasNotifyPermission())) return;

    const slots = [...anchorSlots(times), ...blockSlots(blocks)]
      .filter((s) => Number.isFinite(s.min) && s.min >= 0 && s.min < 24 * 60)
      .slice(0, MAX_SCHEDULED);

    for (const slot of slots) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: slot.title,
          body: slot.body,
          // Nothing here is urgent enough to earn a badge the user then has
          // to clear. The notification is the whole message.
          badge: undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: Math.floor(slot.min / 60),
          minute: slot.min % 60,
        },
      });
    }
  } catch {
    // A reminder that fails to schedule is not worth interrupting the app
    // over. The day still works; it is just quieter than the user asked for.
  }
}

/** Used when the user turns reminders off, and on a permission revoke. */
export async function clearNotifications(): Promise<void> {
  if (!canNotify) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing to recover from: the worst case is a stale reminder the user
    // can turn off in Settings.
  }
}
