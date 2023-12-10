import { Icon, RowView, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { WorkoutId, WorkoutInteraction } from "app/data/model"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, ViewStyle } from "react-native"

type WorkoutSocialButtonGroupProps = {
  workoutSource: WorkoutSource
  workoutId: WorkoutId
  onPressComments: () => void
}

const buttonGroupIconSize = 24

export const WorkoutSocialButtonGroup = observer((props: WorkoutSocialButtonGroupProps) => {
  const { workoutSource, workoutId, onPressComments } = props
  const { userStore, feedStore } = useStores()
  const [workoutInteractions, setInteractions] = useState<WorkoutInteraction>(undefined)
  const [isLikedByUser, setIsLikedByUser] = useState(false)
  const [likesCount, setLikesCount] = useState(undefined)

  useEffect(() => {
    console.debug("WorkoutSocialButtonGroup useEffect [getInteractionsForWorkout] called")
    setInteractions(feedStore.getInteractionsForWorkout(workoutSource, workoutId))
  }, [feedStore.getInteractionsForWorkout(workoutSource, workoutId)])

  useEffect(() => {
    setIsLikedByUser(workoutInteractions?.likedByUserIds?.includes(userStore.userId) ?? false)
    setLikesCount(workoutInteractions?.likedByUserIds?.length ?? 0)
  }, [workoutInteractions, userStore.userId])

  const handleLike = () => {
    if (isLikedByUser) {
      feedStore.unlikeWorkout(workoutId, userStore.userId)
      setLikesCount((prev) => Math.max(0, prev - 1))
      setIsLikedByUser(false)
    } else {
      feedStore.likeWorkout(workoutId, userStore.userId)
      setLikesCount((prev) => prev + 1)
      setIsLikedByUser(true)
    }
  }

  return (
    <RowView>
      <TouchableOpacity onPress={handleLike} style={$socialButton}>
        <RowView style={styles.alignCenter}>
          <Icon
            name={isLikedByUser ? "thumbs-up" : "thumbs-up-outline"}
            size={buttonGroupIconSize}
          />
          <Spacer type="horizontal" size="micro" />
          <Text preset="light" size="sm">
            {likesCount}
          </Text>
        </RowView>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressComments} style={$socialButton}>
        <RowView style={styles.alignCenter}>
          <Icon name="chatbubble-outline" size={buttonGroupIconSize} />
          <Spacer type="horizontal" size="micro" />
          <Text preset="light" size="sm">
            {workoutInteractions?.comments?.length ?? 0}
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
