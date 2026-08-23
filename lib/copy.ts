/**
 * Every user-facing word in the app, in one place.
 *
 * Edit here and the app changes — nothing below is duplicated in a screen.
 * Anything taking arguments is a function; everything else is a plain string.
 *
 * `npm run copy:report` dumps this to docs/copy.md and docs/copy.json if you
 * want to read or mark it up outside the editor.
 *
 * House style:
 *   - One sentence. If it needs two, it needs fewer words.
 *   - No dashes joining clauses. Split the sentence or cut the clause.
 *   - State the fact, stop. No reassurance, no commentary, no jokes.
 *   - Everything renders lowercase, so capitals here are only for readability.
 */

export const copy = {
  // ── first run ───────────────────────────────────────────────────────────
  setup: {
    kicker: "First run · 20 seconds",
    title: "When does your day happen?",
    intro: "Everything else builds around these times, and you can change them later.",
    rows: {
      wake: { label: "Wake", sub: "everything counts from here" },
      meds: { label: "Meds + breakfast", sub: "the peak window starts here" },
      lunch: { label: "Lunch", sub: "food check-in happens here" },
      gym: { label: "Workout slot", sub: "move it any day" },
      wind: { label: "Wind-down", sub: "the day stops here" },
    },
    wakeNote: "Nudge any of these later from Edit day.",
    confirm: "That's my day",
  },

  // ── daily check-in ──────────────────────────────────────────────────────
  checkIn: {
    kicker: "Daily check-in · 10 seconds",
    title: "How do you want today served?",
    sub: "Change it anytime.",
    regular: {
      title: "Regular",
      sub: "Next 3, food, schedule, movement.",
    },
    blunt: {
      title: "The blunt list",
      sub: "Just the tasks, in order.",
    },
    cant: {
      title: "I can't today",
      sub: "Three things, nothing else.",
    },

    /**
     * Wake and wind-down carry over from yesterday on their own. This row
     * exists so that carrying over is visibly a choice rather than something
     * the app did quietly, and it stays collapsed so the check-in is still
     * one question for anyone whose hours have not moved.
     */
    times: {
      summary: (wake: string, wind: string) => `Up ${wake}, done ${wind}`,
      carried: "same as yesterday",
      adjust: "Change",
      close: "Done",
      wake: "Wake",
      wind: "Wind-down",
    },
  },

  // ── home ────────────────────────────────────────────────────────────────
  home: {
    today: "Today",
    modeRegular: "regular",
    modeLow: "low-capacity",

    /** The passive line at the top. States what it sees; never commands. */
    noticing: {
      skipped: "Meal skipped, next food window is around 2pm.",
      nothingEaten: "Nothing eaten yet today.",
      noWater: "Food is handled, water is at zero.",
      allClear: "List cleared.",
      remaining: (open: number) => `Fed and watered, ${open} left.`,
    },

    nextLabel: {
      low: "next 1",
      high: "next 3, big one first",
      mid: "next 3",
    },
    undo: "undo",
    emptyTitle: "Nothing on the list.",
    emptyBody: "Add one below, or use Capture.",
    start: "Start",
    addTaskPlaceholder: "add anything",
    queueLabel: "in line",

    anchorsLabel: "Anchors",
    anchor: {
      wake: (time: string) => `Up by ${time}`,
      lunch: "Eat lunch",
      wind: (time: string) => `Wind-down at ${time}`,
    },

    foodLabel: "Food & water",
    food: {
      none: "Eat something.",
      skipped: "Skipped.",
      well: "Ate well.",
      ate: "Ate.",
    },
    ate: "Ate",
    ateWell: "Ate well",
    skipped: "Skipped",
    undoShort: "undo",
    goTosLabel: "go-tos · hold to drop",
    mealPlaceholder: "what did you eat?",
    calPlaceholder: "cal",
    proPlaceholder: "g pro",
    mealTotals: (cal: number, pro: number) => `today: ${cal} cal · ${pro}g pro`,
    water: (count: number) => `Water · ${count} today`,

    movementLabel: "Movement",
    movement: {
      lowTitle: "20-min walk",
      lowSub: "outside counts double",
      noneTitle: "Move a bit",
      noneSub: "nothing planned · 10 minutes counts",
    },
    workedOut: "I worked out",
    miniWorkout: "10-min version",
    workoutDoneFull: "Logged.",
    workoutDoneMini: "10 minutes, counts as done.",

    capture: "Capture",
    schedule: "Schedule",
    cantToday: "I can't today",
  },

  // ── the blunt list ──────────────────────────────────────────────────────
  blunt: {
    heading: "the list.",
    mode: "mode",
    addPlaceholder: "+ add",
    water: (count: number) => `water: ${count}`,
    food: { none: "food: none yet", skipped: "food: skipped", handled: "food: handled" },
    ate: "ate",
  },

  // ── low-capacity mode ───────────────────────────────────────────────────
  crisis: {
    kicker: "Low-capacity mode",
    title: "Everything else is gone until you say so.",
    sub: "Any one of these counts.",
    eat: "Eat one thing",
    ateButton: "Ate",
    doneButton: "Done",
    doneCheck: "Done ✓",
    water: (count: number) => `Water · ${count}`,
    plusOne: "+1",
    bringBack: "Bring the rest back",
    fallbackAnchor: "Wind-down",
  },

  // ── capture + triage ────────────────────────────────────────────────────
  capture: {
    title: "Capture",
    prompt: "Dump it, sort it later.",
    placeholder: "e.g. cancel the free trial",
    save: "Save it",
    laterLabel: "later",
    laterFooter: "Nothing expires.",
    laterEmpty: "Anything you file lands here.",

    triageKicker: "Two questions, then it's filed.",
    q1: "Due soon?",
    yes: "Yes",
    no: "Nah",
    q2: "If you skip it?",
    shrug: "Nothing happens",
    bad: "Someone's waiting on it",
    veryBad: "Real consequences",

    filedToday: "Filed: Today.",
    filedLater: "Filed: Later.",
    filedTodaySub: "It's in the Next 3 line.",
    filedLaterSub: "It's in the later pile, pull it up whenever.",
    backToToday: "Back to Today",
  },

  // ── focus timer ─────────────────────────────────────────────────────────
  focus: {
    title: "Focus",
    running: "running",
    paused: "paused",
    pause: "Pause",
    resume: "Resume",
    extend: "+5",
    lengthLabel: "how long · saved for next time",
    interruptPlaceholder: "stray thought? dump it here",
    done: "Done",
    bail: "Bail, still counts",
  },

  // ── schedule ────────────────────────────────────────────────────────────
  schedule: {
    title: "Schedule",
    progress: (held: number, total: number) => `${held} of ${total} held · dashed = suggestions`,
    editDay: "Edit day",
    statTasks: "Tasks",
    statBlocks: "Blocks held",
    statWorkout: "Workout",
    workoutDone: "Done ✓",
    workoutMini: "10-min ✓",
    medsNote: (from: string, to: string) => `Meds peak ${from} to ${to}, so hard work sits there.`,
    now: "now",
    suggestionTag: "suggestion",
    addedTag: "added ×",
    ghostHint: (sub: string) => `${sub} · tap + to add`,

    /** Block titles and subtitles built into every day. */
    blocks: {
      meds: { title: "Breakfast + meds", sub: "anchor · food before the pill" },
      deep: {
        title: (task: string) => `Deep work · ${task}`,
        sub: (from: string, to: string) => `meds peak ${from} to ${to}`,
      },
      break: { title: "Water + move for 5", sub: "break, not a reward", tag: "hide" },
      light: {
        title: (tasks: string) => `Small stuff · ${tasks}`,
        sub: (count: number) => `${count === 1 ? "a quick win" : "two quick wins"} before lunch`,
      },
      lunch: { title: "Lunch", sub: "anchor · go-tos loaded" },
      gym: { sub: "10-min version still counts" },
      dinner: { title: "Dinner", sub: "food · one-tap log", tag: "hide" },
      wind: { title: "Wind-down", sub: "anchor · set tomorrow's Next 3" },
    },
    workoutName: {
      low: "20-min walk",
      mid: "Push day · 40 min",
      high: "Push day + extras · 50 min",
    },
  },

  // ── edit day ────────────────────────────────────────────────────────────
  editDay: {
    title: "Edit day",
    intro: "Everything else moves around these anchors.",
    rows: {
      wake: { label: "Wake", sub: "anchor · everything counts from here" },
      meds: { label: "Meds + breakfast", sub: "work blocks follow the peak window" },
      lunch: { label: "Lunch", sub: "anchor · food check-in happens here" },
      gym: { label: "Workout slot", subAuto: "auto · adjust anytime", subManual: "manual" },
      wind: { label: "Wind-down", sub: "anchor · drift alerts use this" },
    },
    yourBlockSub: (sub: string) => `${sub} · remove with ×`,
    addBlockPlaceholder: "Add a block: class, shift, appointment…",
    addedBlockSub: "you added this",
    importCalendar: "Import a calendar, events land as blocks",
    autoGym: "Auto-slot the workout",
    autoGymSub: "Off means you pick the time.",
    done: "Rebuild my day",
  },

  // ── calendar import ─────────────────────────────────────────────────────
  importCalendar: {
    title: "Import from calendar",
    loading: "Reading today's events…",
    unsupported: "Calendar access only works on your phone.",
    denied: "Calendar access is off, turn it on in Settings › Greyed Out › Calendars.",
    error: "Could not read the calendar.",
    empty: "Nothing timed on your calendar today, all-day events are skipped.",
    listLabel: "today's events · untick what you don't want",
    alreadyAdded: "already on your day",
    fromCalendar: (name: string) => `from ${name}`,
    untitledEvent: "untitled event",
    nothingSelected: "Nothing selected",
    addBlocks: (n: number) => `Add ${n} ${n === 1 ? "block" : "blocks"}`,
    readOnlyNote: "Nothing is written back to your calendar.",
    back: "Back to Edit day",
  },

  // ── workout log ─────────────────────────────────────────────────────────
  workout: {
    title: "Log workout",
    templatesLabel: "saved templates · hold one to edit",
    newNamePlaceholder: "name it, e.g. Pull day",
    saveTemplate: "Save",
    updateTemplate: "Update",
    deleteTemplate: "Delete this template",
    weekLabel: "this week · tap a day to set a plan",
    rest: "rest",
    weekSummary: (n: number) => `${n} sessions planned`,
    setsLabel: (name: string) => `${name} · nothing required`,
    noStat: "tap to add weight · reps",
    sets: (n: number) => `${n} sets`,
    voicePlaceholder: 'e.g. "bench, 135 for 8"',
    save: "Save",
    editExercise: "edit",
    deleteExercise: "delete",
    renamePlaceholder: "rename it",
    exerciseRenamed: "Renamed.",
    exerciseRemoved: "Removed.",
    exerciseAdded: "Added.",
    addExercisePlaceholder: "add an exercise",
    weightPlaceholder: "weight",
    repsPlaceholder: "reps",
    reps: "reps",
    bodyweight: "bodyweight",
  },

  // ── the nudge card ──────────────────────────────────────────────────────
  nudge: {
    from: "navigator · now",
    later: "later",
    water: {
      messages: ["water's at zero.", "still zero water.", "last ask about water."],
      action: "logged +1",
    },
    food: {
      messages: ["nothing eaten yet.", "still nothing eaten.", "last ask about food."],
      action: "ate something",
    },
  },

  // ── toasts ──────────────────────────────────────────────────────────────
  toast: {
    /** Picked at random when nothing more specific fits. */
    wins: ["Logged.", "Done.", "One less thing."],
    taskAdded: "On the list.",
    taskErased: "Erased, undo is above.",
    taskSplit: "First step is the task now.",
    pulledUp: "Pulled up.",
    dumped: "Dumped to inbox.",
    anchorHeld: "Anchor held.",
    fed: "Fed.",
    fedWell: "Fed well.",
    firstWater: "First water today.",
    mealLogged: (pro: number) => `Logged, ${pro}g protein.`,
    macrosCounted: "Counted.",
    goToSaved: "Saved as a go-to.",
    goToDuplicate: "Already one of your go-tos.",
    goToDropped: "Dropped from your go-tos.",
    workoutLogged: "Workout logged.",
    workoutMini: "10 minutes logged.",
    workoutDetailed: "Workout logged.",
    workoutHeld: "Workout logged.",
    numbersSaved: "Saved, pre-filled next time.",
    templateSaved: "Template saved.",
    templateUpdated: "Template updated.",
    templateDeleted: "Template deleted.",
    voiceLogged: "Logged.",
    blockAdded: (time: string) => `On the timeline at ${time}.`,
    blockHeld: "Block held.",
    suggestionAdded: "Added.",
    focusExtended: "Five more minutes.",
    focusBailed: "You started, that counts.",
    crisisAte: "That's the big one.",
    crisisAnchor: "Anchor held.",
    imported: (n: number) => `${n} ${n === 1 ? "event" : "events"} on the timeline.`,
  },

  /** The three ways a task gets shrunk when it is too big to start. */
  splitSteps: [
    "First step: open it.",
    "First step: 3 minutes, then you can stop.",
    "First step: write one bad sentence.",
  ],

  /** Task metadata lines the app writes itself. */
  meta: {
    addedByYou: "added by you",
    autoTriaged: "new · auto-triaged",
    pulledUp: "pulled up from later",
  },

  /** Screen-reader labels. Never shown on screen, but still read aloud. */
  a11y: {
    back: "Back",
    done: "Done",
    addTask: "Add task",
    moveUp: "Move up",
    shrink: "Shrink to the first step",
    eraseTask: "Erase from list",
    remove: "Remove",
    toggleTheme: "Toggle dark or light",
    lessWater: "One less water",
    moreWater: "One more water",
    logMeal: "Log meal",
    saveGoTo: "Save as a go-to",
    dumpToInbox: "Dump to inbox",
    addBlock: "Add block",
    newTemplate: "New template",
    editTemplate: (name: string) => `Edit ${name}`,
    logByVoice: "Log by voice",
    minutes: (n: number) => `${n} minutes`,
    earlier: (label: string) => `${label} earlier`,
    later: (label: string) => `${label} later`,
    removeNamed: (name: string) => `Remove ${name}`,
    pullUp: (name: string) => `Pull up ${name}`,
    drop: (name: string) => `Drop ${name}`,
    unAdd: (name: string) => `Un-add ${name}`,
    lessSets: (name: string) => `One less set of ${name}`,
    moreSets: (name: string) => `One more set of ${name}`,
    editExercise: (name: string) => `Edit ${name}`,
    deleteExercise: (name: string) => `Delete ${name}`,
    addExercise: "Add exercise",
    toggleUnit: (unit: string) => `Switch from ${unit}`,
  },
} as const;
