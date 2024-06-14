import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Screen, Spacer, Text } from "app/components"
import { ActivityType } from "app/data/constants"
import { ExerciseSummary } from "app/features/WorkoutSummary"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import React, { useState } from "react"
import { TextStyle, TouchableOpacity } from "react-native"
import { useGetTemplate } from "../services/useGetTemplate"

interface TemplateDetailsScreenProps
  extends NativeStackScreenProps<MainStackParamList, "TemplateDetails"> {}

export const TemplateDetailsScreen = ({ route }: TemplateDetailsScreenProps) => {
  const { workoutTemplateId } = route.params

  // utilities
  const mainNavigation = useMainNavigation()
  const { themeStore, userStore, activeWorkoutStore, workoutEditorStore } = useStores()
  const workoutTemplate = useGetTemplate(workoutTemplateId)

  // states
  const [showEntireTitle, setShowEntireTitle] = useState(false)

  if (workoutTemplate.isPending) {
    return null
  }

  if (workoutTemplate.isError || !workoutTemplate.data || !userStore.userId) {
    // TODO: Add a generic "oops! something went wrong" screen
    return null
  }

  const startWorkoutWithTemplate = () => {
    activeWorkoutStore.startNewWorkout(ActivityType.Gym)
    activeWorkoutStore.hydrateWithTemplate(workoutTemplate.data!)
    mainNavigation.navigate("ActiveWorkout")
  }

  const editTemplate = () => {
    workoutEditorStore.resetWorkout()
    workoutEditorStore.hydrateWithTemplate(workoutTemplate.data!)
    mainNavigation.navigate("EditTemplate", {
      workoutTemplateId,
    })
  }

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={styles.screenContainer}
      preset="scroll"
    >
      <TouchableOpacity onPress={() => setShowEntireTitle((prev) => !prev)}>
        <Text
          size="lg"
          style={$workoutTitleText}
          text={workoutTemplate.data.workoutTemplateName}
          numberOfLines={showEntireTitle ? undefined : 2}
        />
      </TouchableOpacity>
      {workoutTemplate.data.workoutTemplateNotes && (
        <Text text={workoutTemplate.data.workoutTemplateNotes} />
      )}
      {workoutTemplate.data.exercises.map((e) => (
        <ExerciseSummary
          key={e.exerciseId}
          isTemplate={true}
          exercise={e as any}
          setKey="sets"
          showSetStatus={false}
          byUserId={userStore.userId!}
        />
      ))}

      <Spacer type="vertical" size="large" />
      <Button
        style={{
          backgroundColor: themeStore.colors("actionable"),
        }}
        textStyle={{
          color: themeStore.colors("actionableForeground"),
        }}
        tx="templateDetailsScreen.startWorkoutButtonLabel"
        onPress={startWorkoutWithTemplate}
      />
      <Button
        preset="text"
        tx="templateDetailsScreen.editTemplateButtonLabel"
        onPress={editTemplate}
      />
    </Screen>
  )
}

const $workoutTitleText: TextStyle = {
  fontFamily: "lexendExaBold",
  lineHeight: 24,
}
