import { WorkoutSource } from "app/data/constants"
import { User, UserId, WorkoutComment, WorkoutId, WorkoutInteraction } from "app/data/model"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatDate } from "app/utils/formatDate"
import { BlurView } from "expo-blur"
import * as Clipboard from "expo-clipboard"
import { observer } from "mobx-react-lite"
import React, { useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleProp, TouchableOpacity, View, ViewStyle } from "react-native"
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  AnimatedStyleProp,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Toast from "react-native-root-toast"
import { Avatar, Button, Icon, RowView, Spacer, Text, TextField } from "../../components"

const WorkoutCommentTile = (props: {
  byUserId: UserId
  comment: string
  commentDate: Date
  onLongPress: () => void
  selectedState?: boolean
}) => {
  const { byUserId, comment, commentDate, onLongPress, selectedState } = props
  const { userStore, themeStore } = useStores()
  const [user, setUser] = useState<User>(undefined)

  useEffect(() => {
    userStore.getOtherUser(byUserId).then((user) => setUser(user))
  }, [])

  const $commentContainer: StyleProp<ViewStyle> = [
    {
      padding: spacing.small,
      alignItems: "center",
    },
    selectedState && {
      backgroundColor: themeStore.colors("contentBackground"),
    },
  ]

  const $commentHeader: ViewStyle = {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  }

  return (
    <TouchableOpacity onLongPress={onLongPress}>
      <RowView style={$commentContainer}>
        <Avatar user={user} size="sm" />
        <Spacer type="horizontal" size="small" />
        <View style={styles.flex1}>
          <RowView style={$commentHeader}>
            <Text weight="bold" size="xs">
              {user ? `${user.firstName} ${user.lastName}` : "..."}
            </Text>
            <Text size="xs">{formatDate(commentDate)}</Text>
          </RowView>
          <Text style={styles.flex1}>{comment}</Text>
        </View>
      </RowView>
    </TouchableOpacity>
  )
}

const PANEL_INITIAL_Y_POSITION = 250
const PANEL_MAXIMIZE_Y_THRESHOLD = PANEL_INITIAL_Y_POSITION - 100
const PANEL_MINIMIZE_Y_THRESHOLD = PANEL_INITIAL_Y_POSITION + 200
const PANEL_HIDDEN_Y_POSITION = 1000

type WorkoutCommentsPanelProps = {
  workoutSource: WorkoutSource
  workoutId: WorkoutId
  workoutByUserId: UserId
  toggleShowCommentsPanel: () => void
}

export const WorkoutCommentsPanel = observer((props: WorkoutCommentsPanelProps) => {
  const { workoutSource, workoutId, workoutByUserId, toggleShowCommentsPanel } = props
  const { userStore, feedStore, themeStore } = useStores()
  const panelTranslateY = useSharedValue(PANEL_INITIAL_Y_POSITION)
  const context = useSharedValue({ yPosition: PANEL_INITIAL_Y_POSITION })
  const [interactions, setInteractions] = useState<WorkoutInteraction>(undefined)
  const [commentInput, setCommentInput] = useState("")
  const [commentInputHeight, setCommentInputHeight] = useState(50)
  const commentInputRef = useRef(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [selectedComment, setSelectedComment] = useState<WorkoutComment>(undefined)
  const [isCommentDeleteConfirmation, setIsCommentDeleteConfirmation] = useState(false)

  useEffect(() => {
    commentInputRef.current.focus()
  }, [])

  useEffect(() => {
    console.debug("WorkoutCommentsPanel.useEffect [getInteractionsForWorkout] called")
    setInteractions(feedStore.getInteractionsForWorkout(workoutSource, workoutId))
  }, [feedStore.getInteractionsForWorkout(workoutSource, workoutId)])

  const panGestureHandler = Gesture.Pan()
    .onStart(() => {
      context.value = { yPosition: panelTranslateY.value }
    })
    .onUpdate((event) => {
      if (context.value.yPosition === 0 && event.translationY < 0) {
        return
      }
      panelTranslateY.value = context.value.yPosition + event.translationY
    })
    .onEnd(() => {
      if (panelTranslateY.value < PANEL_MAXIMIZE_Y_THRESHOLD) {
        panelTranslateY.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        })
      } else if (panelTranslateY.value > PANEL_MINIMIZE_Y_THRESHOLD) {
        panelTranslateY.value = withTiming(PANEL_HIDDEN_Y_POSITION, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        })
        runOnJS(toggleShowCommentsPanel)()
      } else {
        panelTranslateY.value = withTiming(PANEL_INITIAL_Y_POSITION, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        })
      }
    })

  const tapGestureHandler = Gesture.Tap().onEnd(() => {
    runOnJS(setSelectedComment)(undefined)
    runOnJS(setIsCommentDeleteConfirmation)(false)
  })

  const $animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: panelTranslateY.value,
        },
      ],
    } as AnimatedStyleProp<ViewStyle>
  })

  const commentInputHeightStyle = () => {
    return {
      height: commentInputHeight,
    }
  }

  const submitComment = () => {
    if (!commentInput) return

    setIsSubmittingComment(true)
    feedStore
      .addCommentToWorkout(workoutId, workoutByUserId, userStore.userId, commentInput)
      .then(() => {
        setIsSubmittingComment(false)
        setCommentInput("")
      })
  }

  const commentSubmitButton = (props) => {
    if (isSubmittingComment) {
      return <ActivityIndicator size="small" color={themeStore.colors("actionable")} {...props} />
    }
    return <Icon name="send-outline" size={28} onPress={submitComment} {...props} />
  }

  const panelHeader = () => {
    if (isCommentDeleteConfirmation) {
      return (
        <RowView style={[$panelHeaderSelected, { backgroundColor: themeStore.colors("danger") }]}>
          <Text tx="workoutCommentsPanel.deleteCommentConfirmationMessage" />
          <RowView style={styles.alignCenter}>
            <Button
              preset="text"
              tx="common.cancel"
              textStyle={{ color: themeStore.colors("text") }}
              onPress={() => setIsCommentDeleteConfirmation(false)}
            />
            <Spacer type="horizontal" size="medium" />
            <Icon
              name="trash-bin-outline"
              size={28}
              onPress={() => {
                feedStore.removeCommentFromWorkout(workoutId, selectedComment)
                setSelectedComment(undefined)
              }}
            />
          </RowView>
        </RowView>
      )
    } else if (selectedComment) {
      return (
        <RowView style={$panelHeaderSelected}>
          <Text tx="common.selected" />
          {panelHeaderActionButton()}
        </RowView>
      )
    } else {
      return (
        <View style={$panelHeader}>
          <View style={$panelDraggableIndicator} />
          <Spacer type="vertical" size="small" />
          <Text tx="common.comments" />
        </View>
      )
    }
  }

  const panelHeaderActionButton = () => {
    return (
      <RowView>
        <Icon
          name="clipboard-outline"
          size={28}
          onPress={() => {
            Clipboard.setStringAsync(selectedComment.comment).then(() => {
              Toast.show(translate("common.copiedToClipboard"), { duration: Toast.durations.SHORT })
            })
          }}
        />
        {selectedComment.byUserId === userStore.userId && (
          <>
            <Spacer type="horizontal" size="medium" />
            <Icon
              name="trash-bin-outline"
              size={28}
              onPress={() => setIsCommentDeleteConfirmation(true)}
            />
          </>
        )}
      </RowView>
    )
  }

  const $panelContainer: AnimatedStyleProp<ViewStyle> = {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: themeStore.colors("background"),
    overflow: "hidden",
  }

  const $panelHeaderSelected: ViewStyle = {
    height: 80,
    padding: spacing.screenPadding,
    backgroundColor: themeStore.colors("actionable"),
    justifyContent: "space-between",
    alignItems: "center",
  }

  const $panelDraggableIndicator: ViewStyle = {
    height: 5,
    width: 40,
    borderRadius: 5,
    backgroundColor: themeStore.colors("actionable"),
  }

  const $separator: ViewStyle = {
    width: "100%",
    height: 1,
    backgroundColor: themeStore.colors("border"),
  }

  const $commentInputContainerStyle: ViewStyle = {
    position: "absolute",
    width: "100%",
    bottom: 0,
    paddingHorizontal: spacing.small,
    borderTopWidth: 1,
    borderColor: themeStore.colors("border"),
    backgroundColor: themeStore.colors("background"),
  }

  return (
    <View style={$container}>
      <BlurView
        style={$blurView}
        tint="dark"
        intensity={90}
        onTouchEnd={() => {
          setSelectedComment(undefined)
          setIsCommentDeleteConfirmation(false)
        }}
      />
      <GestureDetector gesture={panGestureHandler}>
        <Animated.View style={[$panelContainer, $animatedStyle]}>
          {panelHeader()}
          <View style={$separator} />
          <GestureDetector gesture={tapGestureHandler}>
            <View style={$panelContent}>
              {interactions?.comments?.length ? (
                <FlatList
                  data={interactions.comments}
                  scrollEnabled={true}
                  renderItem={({ item }) => (
                    <WorkoutCommentTile
                      byUserId={item.byUserId}
                      comment={item.comment}
                      commentDate={item._createdAt}
                      onLongPress={() => setSelectedComment(item)}
                      selectedState={selectedComment?.commentId === item.commentId}
                    />
                  )}
                  keyExtractor={(item) => item.commentId}
                />
              ) : (
                <View style={$noCommentsContainer}>
                  <Text preset="formHelper" tx="workoutSummaryScreen.noCommentsMessage" />
                </View>
              )}
            </View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
      <TextField
        ref={commentInputRef}
        placeholderTx="workoutSummaryScreen.commentInputPlaceholder"
        multiline={true}
        value={commentInput}
        onChangeText={setCommentInput}
        textAlignVertical="center"
        onContentSizeChange={(event) => {
          setCommentInputHeight(event.nativeEvent.contentSize.height)
        }}
        containerStyle={$commentInputContainerStyle}
        inputWrapperStyle={$commentInputWrapperStyle}
        style={[$commentInputStyle, commentInputHeightStyle()]}
        LeftAccessory={(props) => <Avatar user={userStore.user} size="sm" {...props} />}
        RightAccessory={commentSubmitButton}
      />
    </View>
  )
})

const $container: ViewStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
}

const $blurView: ViewStyle = {
  height: "100%",
  width: "100%",
}

const $panelHeader: ViewStyle = {
  height: 80,
  padding: spacing.screenPadding,
  alignItems: "center",
}

const $panelContent: ViewStyle = {
  flex: 1,
}

const $noCommentsContainer: ViewStyle = {
  paddingTop: spacing.massive,
  alignItems: "center",
  justifyContent: "center",
}

const $commentInputWrapperStyle: ViewStyle = {
  minHeight: null,
  alignItems: "center",
  borderWidth: 0,
}

const $commentInputStyle: ViewStyle = {
  minHeight: 40,
  maxHeight: 80,
}
