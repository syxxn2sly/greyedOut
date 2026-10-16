# Greyed Out

An iOS day planner for days when the plan and the energy don't match.

I kept bouncing off normal planners. They assume you're the same person who
wrote yesterday's list, and when you're not, the list just sits there making
you feel worse. So this one asks how today is going *first*, then decides how
much to put on screen.

Three answers, and none of them are wrong:

- **regular** — next 3 tasks, food and water, your schedule, movement
- **the blunt list** — numbered lines, nothing else
- **i can't today** — three items total, everything else hidden until you ask
  for it back

The rule the whole thing is built on: it says what it can see and never tells
you what to do. "nothing eaten yet today." is a sentence, not an instruction.
And the focus timer's exit button says "bail, still counts", because a timer
you can only leave by failing is a timer you stop starting.

Built with Expo / React Native. On the App Store as of August 2026.

## Screens

**Check-in** is the only gate. One question, and it shows what time you were up
and when the day stops, carried over from yesterday.

**Home** is next 3, anchors, one-tap food and water, movement. The list is
capped on purpose — on low-capacity days it shows one thing.

**Capture** is a dump box and two triage questions so things stop circling.

**Focus** is a timer, a box for stray thoughts, and two ways out that both
count.

**Schedule** rebuilds the day from your anchors and puts deep work inside your
meds window, since that's when it'll actually happen. Dashed blocks are
suggestions until you accept them.

**Log workout** has templates, a week cycle, and a paste box — dump a workout
out of Notes and it reads the weights and reps off each line.

## Running it

```bash
npm install
```

```bash
npm start
```

```bash
npm run typecheck
```

## Shipping

```bash
npm run ship
```

Bumps the build number, commits, builds on EAS, submits. `npm run build:ios`
skips the submit. The bump is the point — App Store Connect rejects a build
number it's seen before and I kept forgetting.

To build locally instead of waiting in the EAS queue:

```bash
npx --yes eas-cli@latest build --platform ios --profile production --local --output build.ipa
```

## How it's organised

Nothing clever. `app/` is one file per screen (expo-router), `lib/store.ts`
holds all the state and persists to AsyncStorage, `lib/copy.ts` has every
user-facing string, `constants/theme.ts` has colours and type.

State goes through `useStore()`. Don't add a second storage layer.

## Assumptions and limits

- **iOS only in practice.** There's an Android config and it probably builds,
  but I've never run it on a real Android device.
- **Single device.** No account, no sync, no backend. Wipe the app and your
  data's gone. This is deliberate — no network calls at all — but it does mean
  no backup.
- **`STORAGE_KEY` is versioned, not migrated.** Bump it when the saved shape
  changes and everyone loses a day's data once. Fine at this size; would not
  be fine with real users' history.
- **Calendar import is read-only and today-only.** It never writes back.
- **No tests.** The parser in `lib/parse-workout.ts` is the one piece that
  really wants them.

## Things that caught me out

**`ios/` is generated and gitignored.** Editing `app.json` does nothing to the
binary until you run `expo prebuild`. I renamed the app, everything looked
right in the repo, and the built IPA still had the old name in its display
name and every permission dialog.

**Bundle ID is still `app.procrastin8r`** from before the rename. Can't change
it now without a new App Store Connect record. Nobody sees it.

**CocoaPods dies with a Unicode error if `LANG` isn't set.** If `pod install`
throws `Unicode Normalization not appropriate for ASCII-8BIT`, prefix it with
`LANG=en_US.UTF-8`.

**Local EAS builds need ~10GB free.** The failure looks like a codesigning
error partway through `pod install`, not an out-of-space message.

## Next

- Home screen widget (needs a WidgetKit target + a config plugin, since
  `prebuild` wipes anything added by hand in Xcode)
- Tests for the workout parser
- Actually try it on Android
