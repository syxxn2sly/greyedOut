# Every word in Greyed Out

316 strings · roughly 1015 words. Generated from `lib/copy.ts` —
edit that file, not this one, then run `npm run copy:report`.

`{braces}` mark values filled in at runtime, not literal text.

## setup

| key | text |
| --- | --- |
| `setup.kicker` | First run · 20 seconds |
| `setup.title` | When does your day happen? |
| `setup.intro` | Everything else builds around these times, and you can change them later. |
| `setup.rows.wake.label` | Wake |
| `setup.rows.wake.sub` | everything counts from here |
| `setup.rows.meds.label` | Meds + breakfast |
| `setup.rows.meds.sub` | the peak window starts here |
| `setup.rows.lunch.label` | Lunch |
| `setup.rows.lunch.sub` | food check-in happens here |
| `setup.rows.gym.label` | Workout slot |
| `setup.rows.gym.sub` | move it any day |
| `setup.rows.wind.label` | Wind-down |
| `setup.rows.wind.sub` | the day stops here |
| `setup.wakeNote` | Nudge any of these later from Edit day. |
| `setup.confirm` | That's my day |

## notify

| key | text |
| --- | --- |
| `notify.wake.title` | Wake |
| `notify.wake.body` | Everything counts from here. |
| `notify.meds.title` | Breakfast + meds |
| `notify.meds.body` | Food before the pill. |
| `notify.lunch.title` | Lunch |
| `notify.lunch.body` | Go-tos are loaded. |
| `notify.gym.title` | Workout slot |
| `notify.gym.body` | The 10-minute version still counts. |
| `notify.wind.title` | Wind-down |
| `notify.wind.body` | The day stops here. |
| `notify.blockBody` | On your day. |

## checkIn

| key | text |
| --- | --- |
| `checkIn.kicker` | Daily check-in · 10 seconds |
| `checkIn.title` | How do you want today served? |
| `checkIn.sub` | Change it anytime. |
| `checkIn.regular.title` | Regular |
| `checkIn.regular.sub` | Next 3, food, schedule, movement. |
| `checkIn.blunt.title` | The blunt list |
| `checkIn.blunt.sub` | Just the tasks, in order. |
| `checkIn.cant.title` | I can't today |
| `checkIn.cant.sub` | Three things, nothing else. |
| `checkIn.times.summary` | Up {time}, done {wind} |
| `checkIn.times.carried` | same as yesterday |
| `checkIn.times.adjust` | Change |
| `checkIn.times.close` | Done |
| `checkIn.times.wake` | Wake |
| `checkIn.times.wind` | Wind-down |

## home

| key | text |
| --- | --- |
| `home.today` | Today |
| `home.modeRegular` | regular |
| `home.modeLow` | low-capacity |
| `home.noticing.skipped` | Meal skipped, next food window is around 2pm. |
| `home.noticing.nothingEaten` | Nothing eaten yet today. |
| `home.noticing.noWater` | Food is handled, water is at zero. |
| `home.noticing.allClear` | List cleared. |
| `home.noticing.remaining` | Fed and watered, {n} left. |
| `home.nextLabel.low` | next 1 |
| `home.nextLabel.high` | next 3, big one first |
| `home.nextLabel.mid` | next 3 |
| `home.undo` | undo |
| `home.emptyTitle` | Nothing on the list. |
| `home.emptyBody` | Add one below, or use Capture. |
| `home.start` | Start |
| `home.addTaskPlaceholder` | add anything |
| `home.queueLabel` | in line |
| `home.anchorsLabel` | Anchors |
| `home.anchor.wake` | Up by {time} |
| `home.anchor.lunch` | Eat lunch |
| `home.anchor.wind` | Wind-down at {time} |
| `home.foodLabel` | Food & water |
| `home.food.none` | Eat something. |
| `home.food.skipped` | Skipped. |
| `home.food.well` | Ate well. |
| `home.food.ate` | Ate. |
| `home.ate` | Ate |
| `home.ateWell` | Ate well |
| `home.skipped` | Skipped |
| `home.undoShort` | undo |
| `home.goTosLabel` | go-tos · hold to drop |
| `home.mealPlaceholder` | what did you eat? |
| `home.calPlaceholder` | cal |
| `home.proPlaceholder` | g pro |
| `home.mealTotals` | today: {cal} cal · {pro}g pro |
| `home.water` | Water · {n} today |
| `home.movementLabel` | Movement |
| `home.movement.lowTitle` | 20-min walk |
| `home.movement.lowSub` | outside counts double |
| `home.movement.noneTitle` | Move a bit |
| `home.movement.noneSub` | nothing planned · 10 minutes counts |
| `home.workedOut` | I worked out |
| `home.miniWorkout` | 10-min version |
| `home.workoutDoneFull` | Logged. |
| `home.workoutDoneMini` | 10 minutes, counts as done. |
| `home.capture` | Capture |
| `home.schedule` | Schedule |
| `home.cantToday` | I can't today |

## blunt

| key | text |
| --- | --- |
| `blunt.heading` | the list. |
| `blunt.mode` | mode |
| `blunt.addPlaceholder` | + add |
| `blunt.water` | water: {n} |
| `blunt.food.none` | food: none yet |
| `blunt.food.skipped` | food: skipped |
| `blunt.food.handled` | food: handled |
| `blunt.ate` | ate |

## crisis

| key | text |
| --- | --- |
| `crisis.kicker` | Low-capacity mode |
| `crisis.title` | Everything else is gone until you say so. |
| `crisis.sub` | Any one of these counts. |
| `crisis.eat` | Eat one thing |
| `crisis.ateButton` | Ate |
| `crisis.doneButton` | Done |
| `crisis.doneCheck` | Done ✓ |
| `crisis.water` | Water · {n} |
| `crisis.plusOne` | +1 |
| `crisis.bringBack` | Bring the rest back |
| `crisis.fallbackAnchor` | Wind-down |

## capture

| key | text |
| --- | --- |
| `capture.title` | Capture |
| `capture.prompt` | Dump it, sort it later. |
| `capture.placeholder` | e.g. cancel the free trial |
| `capture.save` | Save it |
| `capture.laterLabel` | later |
| `capture.laterFooter` | Nothing expires. |
| `capture.laterEmpty` | Anything you file lands here. |
| `capture.triageKicker` | Two questions, then it's filed. |
| `capture.q1` | Due soon? |
| `capture.yes` | Yes |
| `capture.no` | Nah |
| `capture.q2` | If you skip it? |
| `capture.shrug` | Nothing happens |
| `capture.bad` | Someone's waiting on it |
| `capture.veryBad` | Real consequences |
| `capture.filedToday` | Filed: Today. |
| `capture.filedLater` | Filed: Later. |
| `capture.filedTodaySub` | It's in the Next 3 line. |
| `capture.filedLaterSub` | It's in the later pile, pull it up whenever. |
| `capture.backToToday` | Back to Today |

## focus

| key | text |
| --- | --- |
| `focus.title` | Focus |
| `focus.running` | running |
| `focus.paused` | paused |
| `focus.pause` | Pause |
| `focus.resume` | Resume |
| `focus.extend` | +5 |
| `focus.lengthLabel` | how long · saved for next time |
| `focus.interruptPlaceholder` | stray thought? dump it here |
| `focus.done` | Done |
| `focus.bail` | Bail, still counts |

## schedule

| key | text |
| --- | --- |
| `schedule.title` | Schedule |
| `schedule.progress` | {held} of {total} held · dashed = suggestions |
| `schedule.editDay` | Edit day |
| `schedule.statTasks` | Tasks |
| `schedule.statBlocks` | Blocks held |
| `schedule.statWorkout` | Workout |
| `schedule.workoutDone` | Done ✓ |
| `schedule.workoutMini` | 10-min ✓ |
| `schedule.medsNote` | Meds peak {from} to {to}, so hard work sits there. |
| `schedule.now` | now |
| `schedule.suggestionTag` | suggestion |
| `schedule.addedTag` | added × |
| `schedule.ghostHint` | {sub} · tap + to add |
| `schedule.blocks.meds.title` | Breakfast + meds |
| `schedule.blocks.meds.sub` | anchor · food before the pill |
| `schedule.blocks.deep.title` | Deep work · {task} |
| `schedule.blocks.deep.sub` | meds peak {from} to {to} |
| `schedule.blocks.break.title` | Water + move for 5 |
| `schedule.blocks.break.sub` | break, not a reward |
| `schedule.blocks.break.tag` | hide |
| `schedule.blocks.light.title` | Small stuff · {tasks} |
| `schedule.blocks.light.sub` | two quick wins before lunch |
| `schedule.blocks.lunch.title` | Lunch |
| `schedule.blocks.lunch.sub` | anchor · go-tos loaded |
| `schedule.blocks.gym.sub` | 10-min version still counts |
| `schedule.blocks.dinner.title` | Dinner |
| `schedule.blocks.dinner.sub` | food · one-tap log |
| `schedule.blocks.dinner.tag` | hide |
| `schedule.blocks.wind.title` | Wind-down |
| `schedule.blocks.wind.sub` | anchor · set tomorrow's Next 3 |
| `schedule.workoutName.low` | 20-min walk |
| `schedule.workoutName.mid` | Push day · 40 min |
| `schedule.workoutName.high` | Push day + extras · 50 min |

## editDay

| key | text |
| --- | --- |
| `editDay.title` | Edit day |
| `editDay.intro` | Everything else moves around these anchors. |
| `editDay.rows.wake.label` | Wake |
| `editDay.rows.wake.sub` | anchor · everything counts from here |
| `editDay.rows.meds.label` | Meds + breakfast |
| `editDay.rows.meds.sub` | work blocks follow the peak window |
| `editDay.rows.lunch.label` | Lunch |
| `editDay.rows.lunch.sub` | anchor · food check-in happens here |
| `editDay.rows.gym.label` | Workout slot |
| `editDay.rows.gym.subAuto` | auto · adjust anytime |
| `editDay.rows.gym.subManual` | manual |
| `editDay.rows.wind.label` | Wind-down |
| `editDay.rows.wind.sub` | anchor · drift alerts use this |
| `editDay.yourBlockSub` | {sub} · remove with × |
| `editDay.addBlockPlaceholder` | Add a block: class, shift, appointment… |
| `editDay.addedBlockSub` | you added this |
| `editDay.importCalendar` | Import a calendar, events land as blocks |
| `editDay.autoGym` | Auto-slot the workout |
| `editDay.autoGymSub` | Off means you pick the time. |
| `editDay.notify` | Remind me |
| `editDay.notifySub` | A quiet notification at each time above. |
| `editDay.notifyDenied` | Notifications are off for the app, turn them on in Settings › Greyed Out. |
| `editDay.done` | Rebuild my day |

## importCalendar

| key | text |
| --- | --- |
| `importCalendar.title` | Import from calendar |
| `importCalendar.loading` | Reading today's events… |
| `importCalendar.unsupported` | Calendar access only works on your phone. |
| `importCalendar.denied` | Calendar access is off, turn it on in Settings › Greyed Out › Calendars. |
| `importCalendar.error` | Could not read the calendar. |
| `importCalendar.empty` | Nothing timed on your calendar today, all-day events are skipped. |
| `importCalendar.accountsLabel` | reading from |
| `importCalendar.noAccounts` | No calendar accounts on this phone yet. |
| `importCalendar.addAccount` | Google, Outlook and iCloud calendars all land here once the account is added to the phone, in the Settings app under Apps › Calendar › Accounts. |
| `importCalendar.listLabel` | today's events · untick what you don't want |
| `importCalendar.alreadyAdded` | already on your day |
| `importCalendar.fromCalendar` | from {name} |
| `importCalendar.untitledEvent` | untitled event |
| `importCalendar.nothingSelected` | Nothing selected |
| `importCalendar.addBlocks` | Add {n} blocks |
| `importCalendar.readOnlyNote` | Nothing is written back to your calendar. |
| `importCalendar.back` | Back to Edit day |

## workout

| key | text |
| --- | --- |
| `workout.title` | Log workout |
| `workout.templatesLabel` | saved templates · hold one to edit |
| `workout.newNamePlaceholder` | name it, e.g. Pull day |
| `workout.saveTemplate` | Save |
| `workout.updateTemplate` | Update |
| `workout.deleteTemplate` | Delete this template |
| `workout.weekLabel` | this week · tap a day to set a plan |
| `workout.rest` | rest |
| `workout.weekSummary` | {n} sessions planned |
| `workout.setsLabel` | {name} · nothing required |
| `workout.noStat` | tap to add weight · reps |
| `workout.sets` | {n} sets |
| `workout.voicePlaceholder` | e.g. "bench, 135 for 8" |
| `workout.save` | Save |
| `workout.editExercise` | edit |
| `workout.deleteExercise` | delete |
| `workout.renamePlaceholder` | rename it |
| `workout.exerciseRenamed` | Renamed. |
| `workout.exerciseRemoved` | Removed. |
| `workout.exerciseAdded` | Added. |
| `workout.addExercisePlaceholder` | add an exercise |
| `workout.weightPlaceholder` | weight |
| `workout.repsPlaceholder` | reps |
| `workout.reps` | reps |
| `workout.bodyweight` | bodyweight |

## nudge

| key | text |
| --- | --- |
| `nudge.from` | navigator · now |
| `nudge.later` | later |
| `nudge.water.messages[0]` | water's at zero. |
| `nudge.water.messages[1]` | still zero water. |
| `nudge.water.messages[2]` | last ask about water. |
| `nudge.water.action` | logged +1 |
| `nudge.food.messages[0]` | nothing eaten yet. |
| `nudge.food.messages[1]` | still nothing eaten. |
| `nudge.food.messages[2]` | last ask about food. |
| `nudge.food.action` | ate something |

## toast

| key | text |
| --- | --- |
| `toast.wins[0]` | Logged. |
| `toast.wins[1]` | Done. |
| `toast.wins[2]` | One less thing. |
| `toast.taskAdded` | On the list. |
| `toast.taskErased` | Erased, undo is above. |
| `toast.taskSplit` | First step is the task now. |
| `toast.pulledUp` | Pulled up. |
| `toast.dumped` | Dumped to inbox. |
| `toast.anchorHeld` | Anchor held. |
| `toast.fed` | Fed. |
| `toast.fedWell` | Fed well. |
| `toast.firstWater` | First water today. |
| `toast.mealLogged` | Logged, {pro}g protein. |
| `toast.macrosCounted` | Counted. |
| `toast.goToSaved` | Saved as a go-to. |
| `toast.goToDuplicate` | Already one of your go-tos. |
| `toast.goToDropped` | Dropped from your go-tos. |
| `toast.workoutLogged` | Workout logged. |
| `toast.workoutMini` | 10 minutes logged. |
| `toast.workoutDetailed` | Workout logged. |
| `toast.workoutHeld` | Workout logged. |
| `toast.numbersSaved` | Saved, pre-filled next time. |
| `toast.templateSaved` | Template saved. |
| `toast.templateUpdated` | Template updated. |
| `toast.templateDeleted` | Template deleted. |
| `toast.voiceLogged` | Logged. |
| `toast.blockAdded` | On the timeline at {time}. |
| `toast.blockHeld` | Block held. |
| `toast.suggestionAdded` | Added. |
| `toast.focusExtended` | Five more minutes. |
| `toast.focusBailed` | You started, that counts. |
| `toast.crisisAte` | That's the big one. |
| `toast.crisisAnchor` | Anchor held. |
| `toast.imported` | {n} events on the timeline. |

## splitSteps[0]

| key | text |
| --- | --- |
| `splitSteps[0]` | First step: open it. |

## splitSteps[1]

| key | text |
| --- | --- |
| `splitSteps[1]` | First step: 3 minutes, then you can stop. |

## splitSteps[2]

| key | text |
| --- | --- |
| `splitSteps[2]` | First step: write one bad sentence. |

## meta

| key | text |
| --- | --- |
| `meta.addedByYou` | added by you |
| `meta.autoTriaged` | new · auto-triaged |
| `meta.pulledUp` | pulled up from later |

## a11y

| key | text |
| --- | --- |
| `a11y.back` | Back |
| `a11y.done` | Done |
| `a11y.addTask` | Add task |
| `a11y.moveUp` | Move up |
| `a11y.shrink` | Shrink to the first step |
| `a11y.eraseTask` | Erase from list |
| `a11y.remove` | Remove |
| `a11y.toggleTheme` | Toggle dark or light |
| `a11y.lessWater` | One less water |
| `a11y.moreWater` | One more water |
| `a11y.logMeal` | Log meal |
| `a11y.saveGoTo` | Save as a go-to |
| `a11y.dumpToInbox` | Dump to inbox |
| `a11y.addBlock` | Add block |
| `a11y.newTemplate` | New template |
| `a11y.editTemplate` | Edit {name} |
| `a11y.logByVoice` | Log by voice |
| `a11y.minutes` | {n} minutes |
| `a11y.earlier` | {label} earlier |
| `a11y.later` | {label} later |
| `a11y.removeNamed` | Remove {name} |
| `a11y.pullUp` | Pull up {name} |
| `a11y.drop` | Drop {name} |
| `a11y.unAdd` | Un-add {name} |
| `a11y.lessSets` | One less set of {name} |
| `a11y.moreSets` | One more set of {name} |
| `a11y.editExercise` | Edit {name} |
| `a11y.deleteExercise` | Delete {name} |
| `a11y.addExercise` | Add exercise |
| `a11y.toggleUnit` | Switch from {unit} |

