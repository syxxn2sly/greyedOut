import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, Pressable, ScrollView, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Calendar from "expo-calendar";

import { Icon } from "@/components/icon";
import { Btn, Card, CheckCircleBtn, IconBtn, Kicker, Screen, T, useTheme } from "@/components/ui";
import { radius } from "@/constants/theme";
import { copy } from "@/lib/copy";
import { fmtTime, useStore } from "@/lib/store";
import type { CustomBlock } from "@/lib/types";

type Found = {
  key: string;
  title: string;
  min: number;
  calendarTitle: string;
};

const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/**
 * The accounts these calendars sync from — a Gmail address, an Exchange
 * account, iCloud. iOS hands every one of them to the same API, so this is
 * label only and changes nothing about how events are read. It is here
 * because a missing account is the only reason a service looks unsupported.
 */
const accountsOf = (calendars: Calendar.Calendar[]) => {
  const seen = new Set<string>();
  for (const c of calendars) {
    const name = c.source?.name?.trim();
    if (name) seen.add(name);
  }
  return [...seen];
};

/**
 * Reads today's events and offers them as blocks. Read-only on purpose: the
 * app never writes to the calendar, so an import can always be undone by
 * removing the block, and a bug here cannot damage anything outside the app.
 */
export default function ImportCalendar() {
  const t = useTheme();
  const s = useStore();

  const [status, setStatus] = useState<"asking" | "denied" | "loading" | "ready" | "unsupported">(
    Platform.OS === "web" ? "unsupported" : "asking",
  );
  const [events, setEvents] = useState<Found[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { status: perm } = await Calendar.requestCalendarPermissionsAsync();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      setStatus("loading");

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setAccounts(accountsOf(calendars));
      if (!calendars.length) {
        setEvents([]);
        setStatus("ready");
        return;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const raw = await Calendar.getEventsAsync(
        calendars.map((c) => c.id),
        start,
        end,
      );

      const byCalendar = new Map(calendars.map((c) => [c.id, c.title]));
      const found = raw
        // All-day events have no time to sit at, and a day-long band would
        // swamp a timeline whose whole point is where things sit in the day.
        .filter((e) => !e.allDay && e.startDate)
        .map((e): Found => {
          const startsAt = new Date(e.startDate as string);
          const min = minutesOf(startsAt);
          const title = (e.title ?? "").trim() || copy.importCalendar.untitledEvent;
          return {
            key: String(e.id),
            title,
            min,
            calendarTitle: byCalendar.get(e.calendarId) ?? "calendar",
          };
        })
        .sort((a, b) => a.min - b.min);

      setEvents(found);
      setPicked(Object.fromEntries(found.map((f) => [f.key, true])));
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.importCalendar.error);
      setStatus("ready");
    }
    // Deliberately depends on nothing: whether an event is already on the day
    // is derived at render, which keeps this callback stable enough to hang
    // the focus and foreground listeners off without a reload loop.
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
      if (Platform.OS !== "web") load();
    }, [load]),
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") load();
    });
    return () => sub.remove();
  }, [load]);

  const isExisting = (e: Found) =>
    s.customBlocks.some((b) => b.title === e.title && b.min === e.min);

  const importPicked = () => {
    const chosen = events.filter((e) => picked[e.key] && !isExisting(e));
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
    }));
    s.update({ customBlocks: [...s.customBlocks, ...blocks] });
    s.cheer(copy.toast.imported(blocks.length));
    router.back();
  };

  const pickedCount = events.filter((e) => picked[e.key] && !isExisting(e)).length;

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconBtn icon="arrow-left" size={32} label={copy.a11y.back} onPress={() => router.back()} />
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
            <Btn label={copy.importCalendar.back} variant="primary" onPress={() => router.back()} />
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
              {accounts.length ? copy.importCalendar.accountsLabel : copy.importCalendar.noAccounts}
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
                    <Icon name="calendar-blank" size={11} color={t.neutral[500]} />
                    <T size={11} color={t.neutral[400]} numberOfLines={1}>
                      {a}
                    </T>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
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
              <Btn label={copy.importCalendar.back} variant="primary" onPress={() => router.back()} />
            </View>
          ) : (
            <>
              <Kicker>{copy.importCalendar.listLabel}</Kicker>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
                {events.map((e) => (
                  <Card
                    key={e.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 13,
                      opacity: isExisting(e) ? 0.55 : 1,
                    }}
                  >
                    <T size={11} tabular color={t.neutral[500]} style={{ width: 44 }}>
                      {fmtTime(e.min)}
                    </T>
                    <View style={{ flex: 1 }}>
                      <T size={13.5} weight="medium" numberOfLines={2}>
                        {e.title}
                      </T>
                      <T size={11} color={t.neutral[500]}>
                        {isExisting(e) ? copy.importCalendar.alreadyAdded : e.calendarTitle}
                      </T>
                    </View>
                    <CheckCircleBtn
                      size={24}
                      done={isExisting(e) || !!picked[e.key]}
                      label={e.title}
                      onPress={() => {
                        if (isExisting(e)) return;
                        setPicked((p) => ({ ...p, [e.key]: !p[e.key] }));
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
          <Pressable onPress={() => router.back()} style={{ paddingVertical: 8 }}>
            <T size={13} color={t.accentRamp[300]}>
              <Icon name="arrow-left" size={12} color={t.accentRamp[300]} /> {copy.a11y.back}
            </T>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
