import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Platform, Pressable, ScrollView, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Calendar from "expo-calendar";

import { Icon } from "@/components/icon";
import {
  Btn,
  Card,
  CheckCircleBtn,
  IconBtn,
  Kicker,
  Screen,
  T,
  useTheme,
} from "@/components/ui";
import { radius } from "@/constants/theme";
import {
  accountsOf,
  addDays,
  askCalendarAccess,
  dateKeyOf,
  readEvents,
  type FoundEvent,
} from "@/lib/calendar-sync";
import { copy } from "@/lib/copy";
import { fmtTime, useStore } from "@/lib/store";
import type { CustomBlock } from "@/lib/types";

/** How far ahead you can import. A week is the horizon people actually plan
 *  against, and every extra day is another row to scroll past. */
const DAYS_AHEAD = 7;

/**
 * Offers calendar events as blocks, for today or any of the next few days.
 *
 * Imports keep the source event id, so a block can follow its event when the
 * meeting moves and come off the day when the meeting is cancelled. Picking a
 * day pins the block to it, which is what stops a one-off appointment
 * reappearing every morning.
 */
export default function ImportCalendar() {
  const t = useTheme();
  const s = useStore();

  const [status, setStatus] = useState<
    "asking" | "denied" | "loading" | "ready" | "unsupported"
  >(Platform.OS === "web" ? "unsupported" : "asking");
  const [events, setEvents] = useState<FoundEvent[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = addDays(today, i);
      return {
        offset: i,
        dateKey: dateKeyOf(d),
        label:
          i === 0
            ? copy.importCalendar.dayToday
            : i === 1
              ? copy.importCalendar.dayTomorrow
              : d.toLocaleDateString(undefined, { weekday: "short" }),
      };
    });
  }, []);

  const dateKey = days[dayOffset]?.dateKey ?? dateKeyOf(new Date());

  const load = useCallback(async (key: string) => {
    try {
      if (!(await askCalendarAccess())) {
        setStatus("denied");
        return;
      }
      setStatus("loading");

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      setAccounts(accountsOf(calendars));
      if (!calendars.length) {
        setEvents([]);
        setStatus("ready");
        return;
      }

      const found = await readEvents([key]);
      setEvents(found);
      setPicked(Object.fromEntries(found.map((f) => [f.eventId, true])));
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.importCalendar.error);
      setStatus("ready");
    }
  }, []);

  /**
   * Focus covers the first mount too, so there is no separate initial load.
   *
   * The calendar can change while the screen is sitting there — the usual case
   * being that you left to add the very event you came here to import. Re-read
   * whenever the screen is focused again or the app returns from the
   * background, so what is on screen is never a stale answer.
   */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "web") load(dateKey);
    }, [load, dateKey]),
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") load(dateKey);
    });
    return () => sub.remove();
  }, [load, dateKey]);

  // Matched on the event id now, not title plus time. Those were the two
  // fields that change when a meeting moves, so the old check called a moved
  // event a new one and let you import it twice.
  const isExisting = (e: FoundEvent) =>
    s.customBlocks.some((b) => b.source?.eventId === e.eventId);

  const importPicked = () => {
    const chosen = events.filter((e) => picked[e.eventId] && !isExisting(e));
    if (!chosen.length) {
      router.back();
      return;
    }
    const blocks: CustomBlock[] = chosen.map((e, i) => ({
      id: `c${Date.now() + i}`,
      min: e.min,
      title: e.title,
      sub: copy.importCalendar.fromCalendar(e.calendarTitle),
      icon: "calendar-blank",
      kind: "school",
      source: {
        eventId: e.eventId,
        calendarId: e.calendarId,
        dateKey: e.dateKey,
      },
    }));
    s.update({ customBlocks: [...s.customBlocks, ...blocks] });
    s.cheer(copy.toast.imported(blocks.length));
    router.back();
  };

  const pickedCount = events.filter(
    (e) => picked[e.eventId] && !isExisting(e),
  ).length;

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 16,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconBtn
            icon="arrow-left"
            size={32}
            label={copy.a11y.back}
            onPress={() => router.back()}
          />
          <T size={16} weight="medium">
            {copy.importCalendar.title}
          </T>
        </View>

        {status === "unsupported" ? (
          <T size={13} color={t.neutral[400]} style={{ lineHeight: 19 }}>
            {copy.importCalendar.unsupported}
          </T>
        ) : null}

        {status === "loading" || status === "asking" ? (
          <T size={13} color={t.neutral[400]}>
            {copy.importCalendar.loading}
          </T>
        ) : null}

        {status === "denied" ? (
          <View style={{ gap: 12 }}>
            <T size={13} color={t.neutral[400]} style={{ lineHeight: 19 }}>
              {copy.importCalendar.denied}
            </T>
            <Btn
              label={copy.importCalendar.back}
              variant="primary"
              onPress={() => router.back()}
            />
          </View>
        ) : null}

        {error ? (
          <T size={13} color={t.neutral[400]} style={{ lineHeight: 19 }}>
            {error}
          </T>
        ) : null}

        {/* Which accounts the events came from. A service that looks
            unsupported is almost always an account the phone never had. */}
        {status === "ready" && !error ? (
          <View style={{ gap: 6 }}>
            <T size={11} color={t.neutral[500]}>
              {accounts.length
                ? copy.importCalendar.accountsLabel
                : copy.importCalendar.noAccounts}
            </T>
            {accounts.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {accounts.map((a) => (
                  <View
                    key={a}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingVertical: 4,
                      paddingHorizontal: 9,
                      borderWidth: 1,
                      borderColor: t.neutral[800],
                      borderRadius: radius.pill,
                    }}
                  >
                    <Icon
                      name="calendar-blank"
                      size={11}
                      color={t.neutral[500]}
                    />
                    <T size={11} color={t.neutral[400]} numberOfLines={1}>
                      {a}
                    </T>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Day picker. Sits above the empty state too, so a day with nothing on
            it is still a day you can move off rather than a dead end. */}
        {status === "ready" && !error ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            style={{ flexGrow: 0, marginBottom: 10 }}
          >
            {days.map((d) => {
              const on = d.offset === dayOffset;
              return (
                <Pressable
                  key={d.dateKey}
                  onPress={() => setDayOffset(d.offset)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: on ? t.accent : t.neutral[800],
                    backgroundColor: on ? t.accentRamp[900] : "transparent",
                    borderRadius: radius.pill,
                  }}
                >
                  <T
                    size={11}
                    weight={on ? "medium" : "regular"}
                    color={on ? t.accent : t.neutral[400]}
                    numberOfLines={1}
                  >
                    {d.label}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {status === "ready" && !error ? (
          events.length === 0 ? (
            <View style={{ gap: 12 }}>
              <T size={13} color={t.neutral[400]} style={{ lineHeight: 19 }}>
                {copy.importCalendar.empty}
              </T>
              <T size={12} color={t.neutral[500]} style={{ lineHeight: 18 }}>
                {copy.importCalendar.addAccount}
              </T>
              <Btn
                label={copy.importCalendar.back}
                variant="primary"
                onPress={() => router.back()}
              />
            </View>
          ) : (
            <>
              <Kicker>{copy.importCalendar.listLabel}</Kicker>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {events.map((e) => (
                  <Card
                    key={e.eventId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 13,
                      opacity: isExisting(e) ? 0.55 : 1,
                    }}
                  >
                    <T
                      size={11}
                      tabular
                      color={t.neutral[500]}
                      style={{ width: 44 }}
                    >
                      {fmtTime(e.min)}
                    </T>
                    <View style={{ flex: 1 }}>
                      <T size={13.5} weight="medium" numberOfLines={2}>
                        {e.title}
                      </T>
                      <T size={11} color={t.neutral[500]}>
                        {isExisting(e)
                          ? copy.importCalendar.alreadyAdded
                          : e.calendarTitle}
                      </T>
                    </View>
                    <CheckCircleBtn
                      size={24}
                      done={isExisting(e) || !!picked[e.eventId]}
                      label={e.title}
                      onPress={() => {
                        if (isExisting(e)) return;
                        setPicked((p) => ({
                          ...p,
                          [e.eventId]: !p[e.eventId],
                        }));
                      }}
                    />
                  </Card>
                ))}
              </ScrollView>

              <Btn
                label={
                  pickedCount === 0
                    ? copy.importCalendar.nothingSelected
                    : copy.importCalendar.addBlocks(pickedCount)
                }
                variant="primary"
                size={14}
                style={{ paddingVertical: 13 }}
                disabled={pickedCount === 0}
                onPress={importPicked}
              />
              <T size={11} color={t.neutral[600]} style={{ lineHeight: 16 }}>
                {copy.importCalendar.readOnlyNote}
              </T>
            </>
          )
        ) : null}

        {status === "unsupported" ? (
          <Pressable
            onPress={() => router.back()}
            style={{ paddingVertical: 8 }}
          >
            <T size={13} color={t.accentRamp[300]}>
              <Icon name="arrow-left" size={12} color={t.accentRamp[300]} />{" "}
              {copy.a11y.back}
            </T>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
