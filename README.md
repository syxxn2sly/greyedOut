# Greyed Out

An iOS day planner for the days where the plan and the energy don't match.

Most planners assume you woke up as the person who wrote yesterday's list. This
one asks how today is going first, then decides how much to put on screen. Pick
"regular" and you get the next three things, food, water, your schedule and
movement. Pick "i can't today" and you get three items total, none of them
optional-feeling, and everything else disappears until you say otherwise.

The rule the whole app is built on: it states what it can see and never tells
you what to do. "nothing eaten yet today." is a sentence, not an instruction.
Every response to it is a tap you chose. And bailing counts. The focus timer
has a button that literally says "bail, still counts", styled the same as the
one that says done, because a timer you can only exit by failing is a timer you
stop starting.

## The screens

**Check-in** is the only gate. One question, three answers, none of them wrong.
It also shows what time you were up and when the day stops, carried over from
yesterday, in case today is different.

**Home** is next 3, your anchors, one-tap food and water, and movement. The
list is capped on purpose. On low-capacity days it shows one thing.

**The blunt list** is home with everything decorative stripped out. Numbered
lines. That's it.

**Capture** is a dump box and two triage questions, then it's filed and out of
your head.

**Focus** is a timer, a box for stray thoughts so they stop circling, and two
ways out that both count.

**Schedule** rebuilds the day from your anchors and drops deep work inside your
meds window, because that's when it'll actually happen. Dashed blocks are
suggestions until you accept them. It'll also pull in today's calendar events.

**Log workout** has templates, a week cycle where "rest" is a real plan rather
than a blank, and sets you're allowed to ignore.

## Calendars

There's no Google or Outlook integration to set up, and that's deliberate. iOS
hands the app every calendar the phone syncs through EventKit, so a Gmail
calendar and an Exchange calendar arrive looking exactly like an iCloud one.
The read is read-only. Nothing is ever written back.

The thing that trips people up: the account has to be added to the *phone*
(Settings › Apps › Calendar › Accounts). Having the Outlook app installed does
nothing, because it keeps its own store that EventKit never sees. The import
screen lists which accounts it found so you can tell the difference between
"no events today" and "you never connected that account".

## Design

Dark by default. The accent is deliberately desaturated down to a steel grey
that sits on the neutral ramp instead of fighting it, which is the whole reason
the interface is quiet enough to open on a bad day. JetBrains Mono, lowercase
everywhere, applied once in `components/ui.tsx` so a new screen can't forget.

Colours and type live in `constants/theme.ts`. State lives in `lib/store.ts`
and persists to `AsyncStorage`. Screens read it through `useStore()` — don't
add a second storage layer.

Every user-facing string is in `lib/copy.ts`, nowhere else. `npm run
copy:report` dumps the lot to `docs/copy.md` if you want to read the app's
voice in one sitting.

The icon is generated, not drawn: `node scripts/make-icons.mjs`.

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

```bash
npm run lint
```

## Shipping it

```bash
npm run ship
```

Bumps the build number, commits, builds on EAS, and hands the result to App
Store Connect. `npm run build:ios` is the same thing without the upload.

The bump is the whole reason the script exists. `appVersionSource` is `local`,
so the number lives in `app.json`, and App Store Connect refuses a build number
it has already seen. Making it part of shipping means it isn't something you
have to remember at the worst possible moment.

To build on this machine instead of waiting in the EAS queue, add `--local`:

```bash
npx --yes eas-cli@latest build --platform ios --profile production --local --output build.ipa
```

That one hands you an `.ipa` to drag into Transporter yourself.

## Things that will bite you

**`ios/` is generated and gitignored.** Editing `app.json` does nothing to the
binary until you run `expo prebuild`. Ask me how I know: the app was renamed
from Procrastin8r, everything looked right in the repo, and the built IPA still
had the old name in its display name and every permission dialog.

**The bundle ID is still `app.procrastin8r`.** Renaming the app didn't rename
that, and it can't be changed now without a new App Store Connect record.
Nobody sees it. Leave it alone.

**CocoaPods dies with a Unicode error if `LANG` isn't set.** If `pod install`
throws `Unicode Normalization not appropriate for ASCII-8BIT`, prefix it with
`LANG=en_US.UTF-8`. Nothing is actually wrong.

**Local EAS builds need real disk.** Somewhere north of 10GB free. The failure
mode is a confusing codesigning error partway through `pod install`, not an
honest "out of space".

**`STORAGE_KEY` in `lib/store.ts` is versioned, not migrated.** Bump it when
the persisted shape changes incompatibly and everyone loses today's data once.
That's the trade: no migration code to carry forever. Don't bump it casually.

**`Icon` takes a plain string and renders nothing for a name that isn't in the
map.** It typechecks, it ships, and there's just a hole where the icon should
be. Check `components/icon.tsx` before using a new one.
