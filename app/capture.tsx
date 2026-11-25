import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Icon } from "@/components/icon";
import { Btn, Card, Field, IconBtn, Kicker, Screen, T, useTheme } from "@/components/ui";
import { copy } from "@/lib/copy";
import { useStore } from "@/lib/store";

type Step = "dump" | "q1" | "q2" | "done";

/**
 * Capture is a dump box plus exactly two questions. Two is the budget: it is
 * enough to sort today from later, and a third is where people abandon the
 * flow and the inbox silently becomes a place things go to die.
 */
export default function Capture() {
  const t = useTheme();
  const s = useStore();
  const [step, setStep] = useState<Step>("dump");
  const [text, setText] = useState("");
  const [pending, setPending] = useState("");
  const [dueSoon, setDueSoon] = useState(false);
  const [filedTo, setFiledTo] = useState<"today" | "later">("later");

  const file = (severity: "shrug" | "bad" | "verybad") => {
    setFiledTo(s.fileCapture(pending, dueSoon, severity));
    setStep("done");
  };

  /**
   * The only delete in the app that cannot be re-tapped back into existence.
   * Capture is where you put things so you stop holding them, so losing one
   * to a mis-tap costs more here than the extra tap costs.
   */
  const confirmDrop = (item: string, index: number) =>
    Alert.alert(copy.capture.dropTitle, copy.capture.dropBody(item), [
      { text: copy.capture.dropCancel, style: "cancel" },
      { text: copy.capture.dropConfirm, style: "destructive", onPress: () => s.removeFromInbox(index) },
    ]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconBtn icon="arrow-left" size={32} label={copy.a11y.back} onPress={() => router.back()} />
          <T size={16} weight="medium">
            {copy.capture.title}
          </T>
        </View>

        {step === "dump" ? (
          <>
            <T size={13} color={t.neutral[400]}>
              {copy.capture.prompt}
            </T>
            <Field
              value={text}
              onChangeText={setText}
              placeholder={copy.capture.placeholder}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 110, fontSize: 15, padding: 13 }}
            />
            <Btn
              label={copy.capture.save}
              variant="primary"
              size={14}
              style={{ paddingVertical: 12 }}
              onPress={() => {
                const clean = text.trim();
                if (!clean) return;
                setPending(clean);
                setText("");
                setStep("q1");
              }}
            />
            {/* The "later" pile, visible and reachable. Filing something away
                only feels safe if you can see it sitting there and pull it
                back up the moment it starts to matter. */}
            {/* Shrink rather than flex, so the pile hugs its contents and the
                reassurance line sits under the list instead of stranded at the
                bottom of an empty screen. */}
            {s.inbox.length ? (
              <View style={{ flexShrink: 1, gap: 8, minHeight: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <Kicker style={{ flex: 1 }}>{copy.capture.laterLabel}</Kicker>
                  <T size={11} color={t.neutral[600]} tabular>
                    {s.inbox.length}
                  </T>
                </View>
                <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled">
                  {s.inbox.map((item, i) => (
                    <Card
                      key={`${item}-${i}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                      }}
                    >
                      <T size={13} color={t.neutral[300]} style={{ flex: 1 }} numberOfLines={2}>
                        {item}
                      </T>
                      <IconBtn
                        icon="caret-up"
                        size={30}
                        accent
                        label={copy.a11y.pullUp(item)}
                        onPress={() => s.promoteFromInbox(i)}
                      />
                      <Pressable
                        onPress={() => confirmDrop(item, i)}
                        accessibilityRole="button"
                        accessibilityLabel={copy.a11y.drop(item)}
                        hitSlop={6}
                        style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon name="x" size={13} color={t.neutral[600]} />
                      </Pressable>
                    </Card>
                  ))}
                </ScrollView>
                <T size={11.5} color={t.neutral[600]}>
                  {copy.capture.laterFooter}
                </T>
              </View>
            ) : (
              <T size={11.5} color={t.neutral[600]}>
                {copy.capture.laterEmpty}
              </T>
            )}
          </>
        ) : null}

        {step === "q1" ? (
          <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
            <Kicker>{copy.capture.triageKicker}</Kicker>
            <Card>
              <T size={14.5} weight="medium">
                &quot;{pending}&quot;
              </T>
            </Card>
            <T size={21} weight="medium" style={{ marginTop: 6 }}>
              {copy.capture.q1}
            </T>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Btn
                label={copy.capture.yes}
                variant="primary"
                size={14}
                style={{ flex: 1, paddingVertical: 14 }}
                onPress={() => {
                  setDueSoon(true);
                  setStep("q2");
                }}
              />
              <Btn
                label={copy.capture.no}
                size={14}
                style={{ flex: 1, paddingVertical: 14 }}
                onPress={() => {
                  setDueSoon(false);
                  setStep("q2");
                }}
              />
            </View>
          </View>
        ) : null}

        {step === "q2" ? (
          <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
            <Card>
              <T size={14.5} weight="medium">
                &quot;{pending}&quot;
              </T>
            </Card>
            <T size={21} weight="medium" style={{ marginTop: 6 }}>
              {copy.capture.q2}
            </T>
            <View style={{ gap: 9 }}>
              <Btn
                label={copy.capture.shrug}
                variant="quiet"
                size={14}
                style={{ paddingVertical: 13, justifyContent: "flex-start" }}
                onPress={() => file("shrug")}
              />
              <Btn
                label={copy.capture.bad}
                variant="quiet"
                size={14}
                style={{ paddingVertical: 13, justifyContent: "flex-start" }}
                onPress={() => file("bad")}
              />
              <Btn
                label={copy.capture.veryBad}
                variant="quiet"
                size={14}
                style={{ paddingVertical: 13, justifyContent: "flex-start" }}
                onPress={() => file("verybad")}
              />
            </View>
          </View>
        ) : null}

        {step === "done" ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-start", gap: 12 }}>
            <Icon name="tray-arrow-down" size={34} color={t.accent} />
            <T size={21} weight="medium">
              {filedTo === "today" ? copy.capture.filedToday : copy.capture.filedLater}
            </T>
            <T size={13} color={t.neutral[400]} style={{ lineHeight: 19 }}>
              {filedTo === "today"
                ? copy.capture.filedTodaySub
                : copy.capture.filedLaterSub}
            </T>
            <Btn
              label={copy.capture.backToToday}
              variant="primary"
              size={14}
              style={{ marginTop: 8, paddingVertical: 12, paddingHorizontal: 22 }}
              onPress={() => router.back()}
            />
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
