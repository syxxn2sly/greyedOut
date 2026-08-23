# Greyed Out

A daily navigator for ADHD brains. Blunt copy, zero guilt, and a home screen
that shows three things instead of everything.

The premise: the app states what it can see ("Nothing eaten since you woke
up") and never issues a command. Every response is a tap you choose. Effort
counts as completion everywhere — "Bail — still counts" is a real button and
it is styled like one.

## The loop

| Screen | What it's for |
| --- | --- |
| Check-in | One question, three answers, no wrong one. Sets how loud the rest of the app is for today. |
| Home | Next 3 + anchors + one-tap food/water/movement logging. Everything else is a tap away, not on screen. |
| The blunt list | Home with the decoration removed. Numbered lines, nothing else. |
| Low-capacity | Three things. Any one of them is a win. Nothing behind it. |
| Capture | A dump box and exactly two triage questions, then it's filed. |
| Focus | A timer, a stray-thought box, and two ways out that both count. |
| Schedule | The day rebuilt from your anchors. Dashed blocks are suggestions until you accept them. |
| Edit day | Set the anchors once; the rest flexes around them. |
| Log workout | Templates, a week cycle where rest is a plan, and sets you can ignore. |

## Design

Nocturne, with the design system's blurple accent deliberately overridden to a
steel that matches the neutral ramp — a monochrome accent is what keeps the
interface quiet enough to use on a bad day. JetBrains Mono throughout,
lowercase everywhere, applied once in `components/ui.tsx` so a new screen
cannot forget it.

Palette and typography live in `constants/theme.ts`. State lives in
`lib/store.ts` and persists to `AsyncStorage`; screens consume it through
`useStore()` rather than adding a second storage layer.

The app icon is generated, not drawn: `node scripts/make-icons.mjs`.

## Run it

```bash
npm install
npm start
```

```bash
npm run typecheck
npm run lint
```

## Ship it

```bash
npm run ship
```

Bumps the iOS build number, commits it, builds on EAS, and hands the result to
App Store Connect. `npm run ship -- --no-submit` builds without uploading.

The build number lives in `app.json` (`appVersionSource` is `local`), and App
Store Connect rejects a build number it has seen before — which is why the
bump is part of the ship command rather than something to remember.
