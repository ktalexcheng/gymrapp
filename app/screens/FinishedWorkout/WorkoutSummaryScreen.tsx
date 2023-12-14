import { firebase } from "@react-native-firebase/firestore"
import { useHeaderHeight } from "@react-navigation/elements"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Spacer, Text } from "app/components"
import { Workout, WorkoutInteraction } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { LoadingScreen } from "../LoadingScreen"
import { ExerciseSummary } from "./ExerciseSummary"
import { WorkoutCommentsPanel } from "./WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "./WorkoutSocialButtonGroup"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { workoutSource, workoutId, jumpToComments } = route.params
  const mainNavigation = useMainNavigation()
  // See why useHeaderHeight() is needed: https://stackoverflow.com/questions/48420468/keyboardavoidingview-not-working-properly
  const navigationHeaderHeight = useHeaderHeight()
  const { feedStore } = useStores()
  const [workout, setWorkout] = useState<Workout>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showCommentsPanel, setShowCommentsPanel] = useState<boolean>(jumpToComments)

  const toggleShowCommentsPanel = () => {
    setShowCommentsPanel(!showCommentsPanel)
  }

  useEffect(() => {
    return firebase
      .firestore()
      .collection("workoutInteractions")
      .doc(workoutId)
      .onSnapshot((doc) => {
        const data = convertFirestoreTimestampToDate(doc.data()) as WorkoutInteraction
        console.debug("workoutInteraction update received:", data)
        console.debug("workoutInteractions likes count:", data?.likedByUserIds?.length)
        console.debug("workoutInteractions comments count:", data?.comments?.length)
        if (!doc.exists) return

        feedStore.updateWorkoutInteractions(data)
      })
  }, [])

  useEffect(() => {
    const workout = feedStore.getWorkout(workoutSource, workoutId)
    console.debug("WorkoutSummaryScreen workout:", workout)
    if (workout) {
      setWorkout(workout)
      setIsLoading(false)
    }
  }, [feedStore.isLoadingFeed, feedStore.isLoadingUserWorkouts])

  if (isLoading || !workout) return <LoadingScreen />

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$screenContentContainer}
      keyboardOffset={navigationHeaderHeight}
    >
      <View style={$menuButton}>
        <PopupMenu />
      </View>
      <Text preset="heading">{workout.workoutTitle}</Text>
      <Text preset="subheading">{workout.startTime.toLocaleString()}</Text>

      {workout.performedAtGymName && (
        <>
          <Spacer type="vertical" size="medium" />
          <TouchableOpacity
            onPress={() =>
              mainNavigation.navigate("GymDetails", { gymId: workout.performedAtGymId })
            }
          >
            <Text weight="bold">{workout.performedAtGymName}</Text>
          </TouchableOpacity>
        </>
      )}
      <WorkoutSocialButtonGroup
        workoutSource={workoutSource}
        workoutId={workoutId}
        onPressComments={toggleShowCommentsPanel}
      />
      {workout.exercises.map((e, _) => {
        return <ExerciseSummary key={e.exerciseId} exercise={e} />
      })}
      {showCommentsPanel && (
        <WorkoutCommentsPanel
          workoutSource={workoutSource}
          workoutId={workoutId}
          toggleShowCommentsPanel={toggleShowCommentsPanel}
        />
      )}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

// PopupMenu is a temporary component to show the menu button

interface PopupMenuProps {
  onPress?: () => void
  showMenu?: boolean
}

const PopupMenu = (props: PopupMenuProps) => {
  // const {
  //   onPress,
  //   showMenu,
  // } = props
  // const [showMenu, setShowMenu] = useState<boolean>(false)

  return (
    <>
      {/* <Icon name="ellipsis-vertical" size={24} onPress={() => setShowMenu(true)} />
      {showMenu && (
        <View>
          <RowView></RowView>
        </View>
      )} */}
    </>
  )
}

const $menuButton: ViewStyle = {
  position: "absolute",
  zIndex: 1,
  top: spacing.screenPadding + spacing.tiny,
  right: spacing.screenPadding + spacing.tiny,
}
