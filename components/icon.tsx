import {
  AnchorSimple, ArrowCounterClockwise, ArrowLeft, ArrowsInLineHorizontal, Barbell,
  Bell, Bicycle, BookmarkSimple, Books, BowlFood, Brain, CalendarBlank, CalendarPlus,
  CaretLeft, CaretRight, CaretUp, Check, CheckCircle, Cloud, Drop, Eye, Footprints,
  ForkKnife, GraduationCap, HandFist, Heartbeat, ListChecks, Microphone, Minus,
  Moon, MoonStars, Mountains, NotePencil, PencilSimple, PersonSimpleRun, Pill,
  Plus, PlusCircle, SlidersHorizontal, Sparkle, SquaresFour, Sun, SunHorizon,
  Terminal, TrayArrowDown, X,
} from "phosphor-react-native";

/**
 * The design names icons in Phosphor's kebab form ("ph-sun-horizon"). Rather
 * than rewrite every reference, names are resolved here — which also means the
 * stored data (anchors, workout templates) can keep holding plain strings.
 */
const icons = {
  "anchor-simple": AnchorSimple,
  "arrow-counter-clockwise": ArrowCounterClockwise,
  "arrow-left": ArrowLeft,
  "arrows-in-line-horizontal": ArrowsInLineHorizontal,
  barbell: Barbell,
  bell: Bell,
  bicycle: Bicycle,
  "bookmark-simple": BookmarkSimple,
  books: Books,
  "bowl-food": BowlFood,
  brain: Brain,
  "calendar-blank": CalendarBlank,
  "calendar-plus": CalendarPlus,
  "caret-left": CaretLeft,
  "caret-right": CaretRight,
  "caret-up": CaretUp,
  check: Check,
  "check-circle": CheckCircle,
  cloud: Cloud,
  drop: Drop,
  eye: Eye,
  footprints: Footprints,
  "fork-knife": ForkKnife,
  "graduation-cap": GraduationCap,
  "hand-fist": HandFist,
  heartbeat: Heartbeat,
  "list-checks": ListChecks,
  microphone: Microphone,
  minus: Minus,
  moon: Moon,
  "moon-stars": MoonStars,
  mountains: Mountains,
  "note-pencil": NotePencil,
  "pencil-simple": PencilSimple,
  "person-simple-run": PersonSimpleRun,
  pill: Pill,
  plus: Plus,
  "plus-circle": PlusCircle,
  "sliders-horizontal": SlidersHorizontal,
  sparkle: Sparkle,
  "squares-four": SquaresFour,
  sun: Sun,
  "sun-horizon": SunHorizon,
  terminal: Terminal,
  "tray-arrow-down": TrayArrowDown,
  x: X,
} as const;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 16,
  color,
  weight = "regular",
}: {
  name: string;
  size?: number;
  color: string;
  weight?: "regular" | "bold" | "fill";
}) {
  const Cmp = icons[name as IconName];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} weight={weight} />;
}
