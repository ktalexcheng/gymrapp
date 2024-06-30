import { Icon, RowView, Spacer, Text } from "app/components"
import { WorkoutId } from "app/data/types"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { simplifyNumber } from "app/utils/formatNumber"
import { observer } from "mobx-react-lite"
import React from "react"
import { TouchableOpacity, ViewStyle } from "react-native"
import { useGetWorkoutInteractions } from "../services/useGetWorkoutInteractions"
import { useLikeWorkout } from "../services/useLikeWorkout"

type WorkoutSocialButtonGroupProps = {
  workoutId: WorkoutId
  onPressComments: () => void
}

const buttonGroupIconSize = 24

export const WorkoutSocialButtonGroup = observer((props: WorkoutSocialButtonGroupProps) => {
  const { workoutId, onPressComments } = props

  // hooks
  const { userStore, themeStore } = useStores()

  // queries
  const workoutInteractionsQuery = useGetWorkoutInteractions(workoutId)
  const workoutInteractions = workoutInteractionsQuery.data
  const { likeWorkout, unlikeWorkout } = useLikeWorkout()

  // derived states
  const isLikedByUser = userStore.userId
    ? workoutInteractions?.likedByUserIds?.includes(userStore.userId)
    : false
  const likesCount = workoutInteractions?.likedByUserIds?.length ?? 0

  const handleLike = () => {
    if (!userStore.userId) {
      return
    }

    if (isLikedByUser) {
      unlikeWorkout.mutate({ workoutId, byUserId: userStore.userId })
    } else {
      likeWorkout.mutate({ workoutId, likedByUserId: userStore.userId })
    }
  }

  return (
    <RowView>
      <TouchableOpacity
        disabled={workoutInteractionsQuery.isFetching}
        onPress={handleLike}
        style={$socialButton}
      >
        <RowView style={styles.alignCenter}>
          <Icon
            name={isLikedByUser ? "thumbs-up" : "thumbs-up-outline"}
            color={isLikedByUser ? themeStore.colors("actionable") : undefined}
            size={buttonGroupIconSize}
          />
          <Spacer type="horizontal" size="micro" />
          <Text preset="light" size="sm">
            {simplifyNumber(likesCount)}
          </Text>
        </RowView>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressComments} style={$socialButton}>
        <RowView style={styles.alignCenter}>
          <Icon name="chatbubble-outline" size={buttonGroupIconSize} />
          <Spacer type="horizontal" size="micro" />
          <Text preset="light" size="sm">
            {simplifyNumber(workoutInteractions?.comments?.length ?? 0)}
          </Text>
        </RowView>
      </TouchableOpacity>
      {/* <TouchableOpacity style={$socialButton}>
        <RowView>
          <Icon name="share-social-outline" size={buttonGroupIconSize} />
        </RowView>
      </TouchableOpacity> */}
    </RowView>
  )
})

const $socialButton: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  marginVertical: spacing.small,
}
