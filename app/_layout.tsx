import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  useFonts,
} from "@expo-google-fonts/jetbrains-mono";

import { Nudge, Toast } from "@/components/overlays";
import { useTheme } from "@/components/ui";
import { StoreProvider, useStore } from "@/lib/store";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const t = useTheme();
  const { hydrated, onboarded } = useStore();
  const path = usePathname();
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  const ready = hydrated && fontsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // First launch goes to setup before anything else. Gating here rather than
  // in the index route means it survives a deep link straight into /home.
  useEffect(() => {
    if (ready && !onboarded && path !== "/setup") router.replace("/setup");
  }, [ready, onboarded, path]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.bg === "#18181b" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: "fade",
        }}
      />
      <Nudge />
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  return (
    // Swipe-to-reveal rows (workout exercises) need a gesture-handler root
    // somewhere above them, or the horizontal pan silently does nothing.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
