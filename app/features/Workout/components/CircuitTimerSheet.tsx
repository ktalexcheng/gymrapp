import { Button, RowView, Sheet, SheetProps, Spacer, Text, TextField, Toggle } from "app/components"
import { TimePickerModal } from "app/components/TimePickerModal"
import { ISetPerformedModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { MinusIcon, PlusIcon, X } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"
import { Easing, cancelAnimation, useSharedValue, withTiming } from "react-native-reanimated"
import { TimerProgressCircular } from "./TimerProgressCircular"

type CircuitEntryProps = {
  workTime: number
  onChangeWorkTime: (value?: number) => void
  restTime: number
  onChangeRestTime: (value?: number) => void
  sets: number
  onChangeSets: (value?: number) => void
  currentSet: number
  isRunning: boolean
  circuitStatus: "work" | "rest" | "completed" // circuit will always progress from work to rest to completed
}

const CircuitEntry = observer((props: CircuitEntryProps) => {
  const {
    workTime,
    onChangeWorkTime,
    restTime,
    onChangeRestTime,
    sets,
    onChangeSets,
    isRunning,
    circuitStatus,
  } = props

  // hooks
  const { themeStore } = useStores()

  // derived states
  const isCompleted = circuitStatus === "completed"
  const isReadOnly = isRunning || isCompleted

  function handleChangeRounds(value: string) {
    const number = parseInt(value)
    if (isNaN(number)) {
      onChangeSets(undefined)
      return
    } else if (number < 0) {
      onChangeSets(0)
      return
    }

    onChangeSets(number)
  }

  function handleStepRounds(step: number) {
    onChangeSets((sets ?? 0) + step)
  }

  const $circuitEntryCellContainer: ViewStyle = {
    flex: 1,
    // borderWidth: 0,
  }

  const $circuitEntryCell: ViewStyle = {
    borderWidth: 0,
    flex: 1,
    alignItems: "center",
    backgroundColor: isReadOnly ? undefined : themeStore.colors("elevatedBackground"),
  }

  const $circuitEntryText: TextStyle = {
    color: themeStore.colors(isCompleted ? "actionableForeground" : "text"),
    opacity: 1, // Override opacity when TextField is not editable
  }

  return (
    <RowView
      style={{
        gap: spacing.small,
        paddingHorizontal: spacing.screenPadding,
        backgroundColor: themeStore.colors(
          isCompleted ? "actionable" : isRunning ? "lightTint" : "transparent",
        ),
        marginTop: spacing.tiny,
      }}
    >
      <TimePickerModal
        disabled={isReadOnly}
        style={$circuitEntryCell}
        textStyle={$circuitEntryText}
        time={workTime}
        onChangeTime={onChangeWorkTime}
      />
      <TimePickerModal
        disabled={isReadOnly}
        style={$circuitEntryCell}
        textStyle={$circuitEntryText}
        time={restTime}
        onChangeTime={onChangeRestTime}
      />
      <TextField
        editable={false}
        containerStyle={$circuitEntryCellContainer}
        inputWrapperStyle={$circuitEntryCell}
        style={$circuitEntryText}
        textAlign="center"
        value={sets !== undefined ? sets.toString() : undefined}
        onChangeText={handleChangeRounds}
        LeftAccessory={() =>
          !isReadOnly && (
            <TouchableOpacity onPress={() => handleStepRounds(-1)}>
              <MinusIcon color={themeStore.colors("actionable")} />
            </TouchableOpacity>
          )
        }
        RightAccessory={() =>
          !isReadOnly && (
            <TouchableOpacity onPress={() => handleStepRounds(1)}>
              <PlusIcon color={themeStore.colors("actionable")} />
            </TouchableOpacity>
          )
        }
      />
    </RowView>
  )
})

type CircuitTimerProps = {
  initialWorkTime?: number
  initialRestTime?: number
  initialSets?: number
  onComplete?: (sets: Partial<ISetPerformedModel>[]) => void
}

type Circuit = Omit<CircuitEntryProps, "onChangeWorkTime" | "onChangeRestTime" | "onChangeSets">

// Global interval reference to ensure it is not lost when the component re-renders
// TODO: Make sure to clear this interval when the component unmounts, probably from the parent
let __interval
const CircuitTimer = observer((props: CircuitTimerProps) => {
  const { initialWorkTime = 0, initialRestTime = 0, initialSets = 0, onComplete } = props

  // states
  // const timerRef = React.useRef<TimerProgressCircularRef>(null)
  const [circuits, setCircuits] = React.useState<Circuit[]>([
    {
      workTime: initialWorkTime,
      restTime: initialRestTime,
      sets: initialSets,
      currentSet: Math.min(1, initialSets),
      isRunning: false,
      circuitStatus: "work",
    },
  ])
  const [timeRemaining, setTimeRemaining] = React.useState<number>(initialWorkTime)
  const [shouldUpdateSetsPerformed, setShouldUpdateSetsPerformed] = React.useState<boolean>(false)
  const [inProgress, setInProgress] = React.useState<boolean>(false)

  // derived states
  const currentCircuitIdx = circuits.findIndex((c) => c.circuitStatus !== "completed")
  const allCircuitsCompleted = currentCircuitIdx === -1
  const currentCircuit = !allCircuitsCompleted ? circuits[currentCircuitIdx] : undefined
  // const currentCircuitSet = currentCircuit && currentCircuit.currentSet
  // const currentCircuitTotalSets = currentCircuit && currentCircuit.sets
  // const currentCircuitIsRunning = currentCircuit && currentCircuit.isRunning
  const currentCircuitTotalTime =
    currentCircuit?.circuitStatus === "work"
      ? currentCircuit.workTime
      : currentCircuit?.circuitStatus === "rest"
      ? currentCircuit.restTime
      : 0

  // animations
  const progressRt = useSharedValue(0)
  const animatedProgressRt = (seconds: number, reset?: boolean) => {
    if (reset) progressRt.value = 0
    progressRt.value = withTiming(1, { duration: seconds * 1000, easing: Easing.linear })
  }

  useEffect(() => {
    // Deal with advancing to the next set
    if (timeRemaining > 0 || allCircuitsCompleted || !currentCircuit || !currentCircuit?.currentSet)
      return

    // Before attempting to advance, make sure to clear the current interval
    clearInterval(__interval)

    const nextRoundNumber = currentCircuit.currentSet + 1
    switch (currentCircuit.circuitStatus) {
      case "work":
        // Move to rest
        setCircuitStatus(currentCircuitIdx, "rest")
        setTimeRemaining(currentCircuit.restTime)
        startTimer(currentCircuit.restTime, true)

        break
      case "rest":
        // Move to next set
        if (nextRoundNumber <= currentCircuit.sets) {
          _setCircuitProps(currentCircuitIdx, { currentSet: nextRoundNumber })
          setCircuitStatus(currentCircuitIdx, "work")
          setTimeRemaining(currentCircuit.workTime)
          startTimer(currentCircuit.workTime, true)
        } else {
          setCircuitStatus(currentCircuitIdx, "completed")
          setIsRunning(currentCircuitIdx, false)
          if (shouldUpdateSetsPerformed) {
            const setsPerformed: Partial<ISetPerformedModel>[] = []
            for (const circuit of circuits) {
              for (let i = 0; i < circuit.sets; i++) {
                setsPerformed.push({
                  time: circuit.workTime,
                  isCompleted: true,
                })
              }
            }
            onComplete && onComplete(setsPerformed)
          }
        }

        break
    }
  }, [timeRemaining, allCircuitsCompleted, shouldUpdateSetsPerformed])

  function _setCircuitProps(circuitIndex: number, props: Partial<Circuit>) {
    setCircuits((prev) => prev.map((c, index) => (index === circuitIndex ? { ...c, ...props } : c)))
  }

  function setWorkTime(circuitIndex: number, value?: number) {
    _setCircuitProps(circuitIndex, { workTime: value })
    setTimeRemaining(value ?? 0)
    progressRt.value = 0
  }

  function setRestTime(circuitIndex: number, value?: number) {
    _setCircuitProps(circuitIndex, { restTime: value })
  }

  function setRounds(circuitIndex: number, value?: number) {
    if (value && value < 0) return
    _setCircuitProps(circuitIndex, { sets: value })
  }

  function setIsRunning(circuitIndex: number, value?: boolean) {
    _setCircuitProps(circuitIndex, { isRunning: value })
  }

  function setCircuitStatus(circuitIndex: number, value: "work" | "rest" | "completed") {
    _setCircuitProps(circuitIndex, { circuitStatus: value })
  }

  const startTimer = (seconds: number, reset?: boolean) => {
    clearInterval(__interval)

    setIsRunning(currentCircuitIdx, true)
    __interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(prev - 1, 0))
    }, 1000)
    // timerRef.current?.startAnimation(seconds, reset)
    animatedProgressRt(seconds, reset)
    setInProgress(true)
  }

  const pauseTimer = () => {
    clearInterval(__interval)

    setIsRunning(currentCircuitIdx, false)
    // timerRef.current?.pauseAnimation()
    cancelAnimation(progressRt)
  }

  const toggleStartPause = () => {
    if (!currentCircuit) return

    if (currentCircuit.isRunning) {
      pauseTimer()
    } else {
      startTimer(timeRemaining)
    }
  }

  function resetTimer() {
    clearInterval(__interval)

    const resetCircuits = circuits.map(
      (circuit) =>
        ({
          ...circuit,
          currentSet: Math.min(1, circuit.sets),
          isRunning: false,
          circuitStatus: "work",
        } as Circuit),
    )
    // console.debug("resetCircuits", resetCircuits)
    setCircuits(resetCircuits)
    // Reset to the work time of the first circuit
    setTimeRemaining(resetCircuits[0].workTime)
    // timerRef.current?.resetAnimation()
    progressRt.value = 0
    setInProgress(false)
  }

  // styles
  const $timerControlsButtonGroup: ViewStyle = {
    paddingHorizontal: spacing.screenPadding,
    // gap: spacing.medium,
  }

  const $timerControlsButton: ViewStyle = {
    flex: 3,
  }

  return (
    <View style={styles.flex1}>
      <TimerProgressCircular
        // ref={timerRef}
        progressRt={progressRt}
        circleDiameter={250}
        strokeWidth={15}
        totalTime={currentCircuitTotalTime || 0}
        remainingTime={timeRemaining}
        set={currentCircuit?.currentSet || undefined}
        totalSets={currentCircuit?.sets || undefined}
        timerTitleTx={
          currentCircuit?.circuitStatus === "work"
            ? "circuitTimer.work"
            : currentCircuit?.circuitStatus === "rest"
            ? "circuitTimer.rest"
            : undefined
        }
        overlayMessageTx={allCircuitsCompleted ? "circuitTimer.finishedMessage" : undefined}
      />

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <View style={{ maxHeight: 200 }}>
        <ScrollView>
          <RowView style={$circuitEntryHeader}>
            <Text style={styles.flex1} textAlign="center" tx="circuitTimer.work" />
            <Text style={styles.flex1} textAlign="center" tx="circuitTimer.rest" />
            <Text style={styles.flex1} textAlign="center" tx="circuitTimer.sets" />
          </RowView>
          {circuits.map((circuit, index) => (
            <CircuitEntry
              key={index}
              {...circuit}
              isRunning={circuit.isRunning || inProgress}
              onChangeWorkTime={(time) => setWorkTime(index, time)}
              onChangeRestTime={(time) => setRestTime(index, time)}
              onChangeSets={(sets) => setRounds(index, sets)}
            />
          ))}
        </ScrollView>
      </View>

      <Spacer type="vertical" size="large" />

      <View style={$timerControlsButtonGroup}>
        <RowView style={styles.alignCenter}>
          <Text style={styles.flex1} tx="circuitTimer.updateSetsPerformedMessage" />
          <Toggle
            disabled={currentCircuit?.isRunning || allCircuitsCompleted}
            variant="switch"
            value={shouldUpdateSetsPerformed}
            onValueChange={() => setShouldUpdateSetsPerformed((prev) => !prev)}
          />
        </RowView>

        <RowView>
          <Button
            disabled={allCircuitsCompleted}
            style={$timerControlsButton}
            preset={
              allCircuitsCompleted ? "default" : currentCircuit?.isRunning ? "default" : "emphasis"
            }
            tx={currentCircuit?.isRunning ? "circuitTimer.pause" : "circuitTimer.start"}
            onPress={toggleStartPause}
          />
          <Button
            style={[styles.flex1, { minHeight: undefined }]}
            preset="text"
            tx="circuitTimer.reset"
            onPress={resetTimer}
          />
        </RowView>
      </View>
    </View>
  )
})

type CircuitTimerSheetProps = SheetProps &
  CircuitTimerProps & {
    exerciseName?: string
  }

export const CircuitTimerSheet = observer((props: CircuitTimerSheetProps) => {
  const {
    exerciseName,
    initialWorkTime,
    initialRestTime,
    initialSets,
    onComplete,
    onOpenChange,
    ...sheetProps
  } = props

  const { themeStore } = useStores()

  const $sheetHeader: ViewStyle = {
    borderBottomWidth: 1,
    borderBottomColor: themeStore.colors("border"),
    padding: spacing.screenPadding,
    justifyContent: "space-between",
  }

  return (
    <Sheet {...sheetProps} disableDrag={true} onOpenChange={onOpenChange}>
      <RowView style={$sheetHeader}>
        <RowView>
          <Text weight="bold" tx="circuitTimer.title" />
          {exerciseName && <Text weight="bold" text={` - ${exerciseName}`} />}
        </RowView>
        <TouchableOpacity onPress={() => onOpenChange && onOpenChange(false)}>
          <X color={themeStore.colors("foreground")} />
        </TouchableOpacity>
      </RowView>
      <CircuitTimer
        initialWorkTime={initialWorkTime}
        initialRestTime={initialRestTime}
        initialSets={initialSets}
        onComplete={onComplete}
      />
    </Sheet>
  )
})

const $circuitEntryHeader: ViewStyle = {
  paddingHorizontal: spacing.screenPadding,
  justifyContent: "space-between",
}
