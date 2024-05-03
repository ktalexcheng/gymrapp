import { WorkoutSource } from "app/data/constants"
import { UserId, WorkoutId } from "app/data/types"
import { useToast } from "app/hooks"
import { translate, TxKeyPath } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IUserModel, IWorkoutCommentModel, IWorkoutInteractionModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatDate } from "app/utils/formatDate"
import { logError } from "app/utils/logger"
import { BlurView } from "expo-blur"
import * as Clipboard from "expo-clipboard"
import { MessageSquareWarning } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleProp,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { Sheet } from "tamagui"
import { Avatar, Button, Divider, Icon, RowView, Spacer, Text, TextField } from "../../components"

const WorkoutCommentTile = (props: {
  workoutId: WorkoutId
  byUserId: UserId
  commentId: string
  comment: string
  commentDate: Date
  onLongPress: () => void
  selectedState?: boolean
  alwaysShow?: boolean
}) => {
  const mainNavigation = useMainNavigation()
  const { feedStore, userStore, themeStore } = useStores()
  const {
    workoutId,
    byUserId,
    commentId,
    comment,
    commentDate,
    onLongPress,
    selectedState,
    alwaysShow,
  } = props

  const isFlagged = feedStore.isCommentFlagged(workoutId, commentId)

  const [user, setUser] = useState<IUserModel>()
  const [isHidden, setIsHidden] = useState(!alwaysShow && isFlagged)

  useEffect(() => {
    feedStore.fetchUserProfileToStore(byUserId).then((user) => setUser(user))
  }, [])

  useEffect(() => {
    setIsHidden(!alwaysShow && isFlagged)
  }, [isFlagged])

  const showCommentIfHidden = () => {
    if (!isHidden) return

    Alert.alert(
      translate("workoutCommentsPanel.showHiddenCommentTitle"),
      translate("workoutCommentsPanel.showHiddenCommentMessage"),
      [
        {
          text: translate("common.cancel"),
          style: "cancel",
        },
        {
          text: translate("common.yes"),
          onPress: () => setIsHidden(false),
        },
      ],
    )
  }

  const $commentContainer: StyleProp<ViewStyle> = [
    {
      padding: spacing.small,
      // alignItems: "center",
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

  const $skeletonDisplayName: ViewStyle = {
    height: 20,
    width: 100,
    borderRadius: 10,
    backgroundColor: themeStore.colors("contentBackground"),
  }

  return (
    <TouchableOpacity onPress={showCommentIfHidden} onLongPress={onLongPress}>
      {isHidden ? (
        <RowView style={$commentContainer}>
          <Avatar user={undefined} size="sm" />
          <Spacer type="horizontal" size="small" />
          <Text preset="light" tx="workoutCommentsPanel.commentIsHiddenMessage" />
        </RowView>
      ) : (
        <RowView style={$commentContainer}>
          <TouchableOpacity
            onPress={() => mainNavigation.navigate("ProfileVisitorView", { userId: byUserId })}
          >
            <Avatar user={user} size="sm" />
          </TouchableOpacity>
          <Spacer type="horizontal" size="small" />
          <View style={styles.flex1}>
            <RowView style={$commentHeader}>
              {user ? (
                <Text weight="bold" size="xs" text={`${user.firstName} ${user.lastName}`} />
              ) : (
                <View style={$skeletonDisplayName} />
              )}
              <Text size="xs">{formatDate(commentDate)}</Text>
            </RowView>
            <Text style={styles.flex1}>{comment}</Text>
          </View>
        </RowView>
      )}
    </TouchableOpacity>
  )
}

const reportCommentTypes: {
  reasonId: string
  labelTx: TxKeyPath
}[] = [
  {
    reasonId: "spam",
    labelTx: "workoutCommentsPanel.reportCommentReasonSpam",
  },
  {
    reasonId: "harassment",
    labelTx: "workoutCommentsPanel.reportCommentReasonHarassment",
  },
  {
    reasonId: "misinformation",
    labelTx: "workoutCommentsPanel.reportCommentReasonMisinformation",
  },
  {
    reasonId: "illegal",
    labelTx: "workoutCommentsPanel.reportCommentReasonIllegal",
  },
  {
    reasonId: "other",
    labelTx: "workoutCommentsPanel.reportCommentReasonOther",
  },
]

type WorkoutCommentsReportSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workoutId: WorkoutId
  selectedComment: IWorkoutCommentModel
}

const WorkoutCommentsReportSheet = (props: WorkoutCommentsReportSheetProps) => {
  const { open, onOpenChange, workoutId, selectedComment } = props
  const { feedStore, themeStore } = useStores()

  // Form states
  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([])
  const [otherReportReason, setOtherReportReason] = useState<string>()
  const [isBlockUserSelected, setIsBlockUserSelected] = useState(false)

  // Validation states
  const [isNoReasonSelected, setIsNoReasonSelected] = useState(false)
  const [isOtherReasonEmpty, setIsOtherReasonEmpty] = useState(false)

  // Status states
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [isReportSent, setIsReportSent] = useState(false)

  const toggleReportReasonSelection = (reasonId: string) => {
    if (selectedReportReasons.includes(reasonId)) {
      setSelectedReportReasons(selectedReportReasons.filter((reason) => reason !== reasonId))
    } else {
      setSelectedReportReasons([...selectedReportReasons, reasonId])
    }
  }

  const isReportReasonSelected = (reasonId: string) => {
    return selectedReportReasons.includes(reasonId)
  }

  const validateReportForm = () => {
    let isValid = true
    setIsNoReasonSelected(false)
    setIsOtherReasonEmpty(false)

    if (selectedReportReasons.length === 0) {
      setIsNoReasonSelected(true)
      isValid = false
    }

    if (selectedReportReasons.includes("other") && !otherReportReason) {
      setIsOtherReasonEmpty(true)
      isValid = false
    }

    return isValid
  }

  const sendCommentReport = async () => {
    if (!workoutId || !selectedComment || !validateReportForm()) return

    setIsSendingReport(true)

    try {
      console.debug("WorkoutCommentsPanel.sendCommentReport sending report", {
        workoutId,
        selectedComment,
        selectedReportReasons,
        otherReportReason,
      })

      await feedStore.reportComment(
        workoutId,
        selectedComment,
        selectedReportReasons,
        otherReportReason,
      )
      if (isBlockUserSelected) {
        await feedStore.blockUser(selectedComment.byUserId)
      }
    } catch (e) {
      logError("WorkoutCommentsPanel.sendCommentReport error", e)
    } finally {
      setIsSendingReport(false)
      setIsReportSent(true)
    }
  }

  const $panelDraggableIndicator: ViewStyle = {
    height: 5,
    width: 40,
    borderRadius: 5,
    backgroundColor: themeStore.colors("actionable"),
  }

  const $reportCommentContainer: ViewStyle = {
    padding: spacing.screenPadding,
    backgroundColor: themeStore.colors("background"),
  }

  const $reportCommentTypesContainer: ViewStyle = {
    padding: spacing.medium,
    paddingRight: 0,
  }

  const $reportCommentType: ViewStyle = {
    backgroundColor: themeStore.colors("background"),
    alignItems: "center",
    justifyContent: "space-between",
  }

  useEffect(() => {
    if (isReportSent) {
      setTimeout(() => {
        // Reset form state
        setSelectedReportReasons([])
        setOtherReportReason(undefined)
        setIsBlockUserSelected(false)
        setIsReportSent(false)
        onOpenChange(false)
      }, 6000)
    }
  }, [isReportSent])

  const renderReportCommentContent = () => {
    if (isReportSent) {
      return (
        <View style={styles.centeredContainer}>
          <Icon name="flag" size={40} color={themeStore.colors("actionable")} />
          <Spacer type="vertical" size="large" />
          <Text tx="workoutCommentsPanel.reportSentSuccessMessage" textAlign="center" />
        </View>
      )
    }

    return (
      <Sheet.ScrollView showsVerticalScrollIndicator={false}>
        <Text
          preset="formLabel"
          tx="workoutCommentsPanel.reportCommentTitle"
          textColor={isNoReasonSelected ? themeStore.colors("danger") : undefined}
        />
        <Text preset="light" tx="workoutCommentsPanel.reportCommentMessage" />
        <View style={$reportCommentTypesContainer}>
          {reportCommentTypes.map((reportType, i) => (
            <View key={reportType.reasonId}>
              {i > 0 ? <Divider orientation="horizontal" spaceSize={spacing.medium} /> : null}
              <TouchableOpacity onPress={() => toggleReportReasonSelection(reportType.reasonId)}>
                <RowView style={$reportCommentType}>
                  <Text
                    tx={reportType.labelTx}
                    textColor={
                      isReportReasonSelected(reportType.reasonId)
                        ? themeStore.colors("actionable")
                        : undefined
                    }
                    weight={isReportReasonSelected(reportType.reasonId) ? "bold" : "normal"}
                  />
                  {isReportReasonSelected(reportType.reasonId) && (
                    <Icon
                      name="checkmark-sharp"
                      size={20}
                      color={themeStore.colors("actionable")}
                    />
                  )}
                </RowView>
              </TouchableOpacity>
            </View>
          ))}
          {isReportReasonSelected("other") && (
            <TextField
              status={isOtherReasonEmpty ? "error" : undefined}
              placeholderTx="workoutCommentsPanel.reportCommentReasonOtherPlaceholder"
              value={otherReportReason}
              onChangeText={setOtherReportReason}
              containerStyle={{ marginTop: spacing.small }}
            />
          )}
        </View>
        <Spacer type="vertical" size="large" />
        <RowView style={styles.alignCenter}>
          <View style={styles.flex1}>
            <Text preset="formLabel" tx="workoutCommentsPanel.blockUserPromptTitle" />
            <Text preset="light" tx="workoutCommentsPanel.blockUserPromptMessage" />
          </View>
          <Icon
            onPress={() => setIsBlockUserSelected(!isBlockUserSelected)}
            name={isBlockUserSelected ? "checkbox-outline" : "square-outline"}
            size={20}
          />
        </RowView>
        <Spacer type="vertical" size="large" />
        <Button
          disabled={isSendingReport}
          preset="dangerOutline"
          tx="workoutCommentsPanel.reportConfirmButtonLabel"
          RightAccessory={() =>
            isSendingReport && (
              <ActivityIndicator
                size="small"
                color={themeStore.colors("logo")}
                style={{ paddingLeft: spacing.extraSmall }}
              />
            )
          }
          onPress={sendCommentReport}
        />
      </Sheet.ScrollView>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} dismissOnSnapToBottom={true}>
      <Sheet.Overlay />
      <Sheet.Handle alignSelf="center" style={$panelDraggableIndicator} />
      <Sheet.Frame style={$reportCommentContainer}>{renderReportCommentContent()}</Sheet.Frame>
    </Sheet>
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
  const [interactions, setInteractions] = useState<IWorkoutInteractionModel>()
  const [commentInput, setCommentInput] = useState("")
  const [commentInputHeight, setCommentInputHeight] = useState(50)
  const commentInputRef = useRef<TextInput>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [selectedComment, setSelectedComment] = useState<IWorkoutCommentModel>()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showReportSheet, setShowReportSheet] = useState(false)
  const [toastShowTx] = useToast()

  const thisWorkoutInteraction = feedStore.getInteractionsForWorkout(workoutSource, workoutId)

  useEffect(() => {
    commentInputRef.current?.focus()
  }, [])

  useEffect(() => {
    console.debug("WorkoutCommentsPanel.useEffect [getInteractionsForWorkout] called")
    setInteractions(thisWorkoutInteraction)
  }, [thisWorkoutInteraction])

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

  // This is a named function so that it can be called from runOnJS, using an anonymous functions in runOnJS led to a crash
  const dismissKeyboard = () => {
    Keyboard.dismiss()
  }

  const tapGestureHandler = Gesture.Tap().onEnd(() => {
    runOnJS(setSelectedComment)(undefined)
    runOnJS(setShowDeleteConfirmation)(false)
    runOnJS(dismissKeyboard)()
  })

  const $animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: panelTranslateY.value,
        },
      ],
    }
  })

  const commentInputHeightStyle = () => {
    return {
      height: commentInputHeight,
    }
  }

  const submitComment = () => {
    if (!commentInput || !userStore.userId) return

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

    const isEmptyInput = commentInput.trim().length === 0
    return (
      <Icon
        disabled={isEmptyInput}
        color={themeStore.colors(isEmptyInput ? "disabledBackground" : "actionable")}
        name="send-outline"
        size={28}
        onPress={submitComment}
        {...props}
      />
    )
  }

  const panelHeader = () => {
    if (showDeleteConfirmation) {
      return (
        <RowView style={[$panelHeaderSelected, { backgroundColor: themeStore.colors("danger") }]}>
          <Text tx="workoutCommentsPanel.deleteCommentConfirmationMessage" />
          <RowView style={$panelHeaderActionButtons}>
            <Button
              preset="text"
              tx="common.cancel"
              textStyle={{ color: themeStore.colors("text") }}
              onPress={() => setShowDeleteConfirmation(false)}
            />
            <Icon
              name="trash-bin-outline"
              size={28}
              onPress={() => {
                if (!selectedComment) return

                feedStore.removeCommentFromWorkout(workoutId, selectedComment.commentId)
                setSelectedComment(undefined)
                setShowDeleteConfirmation(false)
              }}
            />
          </RowView>
        </RowView>
      )
    } else if (selectedComment) {
      return (
        <RowView style={$panelHeaderSelected}>
          <Text tx="common.selected" textColor={themeStore.colors("actionableForeground")} />
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
      <RowView style={$panelHeaderActionButtons}>
        {selectedComment?.byUserId !== userStore.userId && (
          <MessageSquareWarning
            color={themeStore.colors("danger")}
            size={28}
            onPress={() => setShowReportSheet(true)}
          />
        )}
        {selectedComment?.byUserId === userStore.userId && (
          <Icon
            name="trash-bin-outline"
            color={themeStore.colors("actionableForeground")}
            size={28}
            onPress={() => setShowDeleteConfirmation(true)}
          />
        )}
        <Icon
          name="clipboard-outline"
          color={themeStore.colors("actionableForeground")}
          size={28}
          onPress={() => {
            if (!selectedComment) return

            Clipboard.setStringAsync(selectedComment.comment).then(() => {
              toastShowTx("common.copiedToClipboard")
            })
          }}
        />
      </RowView>
    )
  }

  const $panelContainer: ViewStyle = {
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

  const $panelContent: ViewStyle = {
    flex: 1,
    marginBottom: Math.max(40, Math.min(80, commentInputHeight)) + spacing.medium,
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
      <WorkoutCommentsReportSheet
        open={showReportSheet}
        onOpenChange={setShowReportSheet}
        workoutId={workoutId}
        selectedComment={selectedComment!}
      />
      <BlurView
        style={$blurView}
        tint="dark"
        intensity={Platform.select({ android: 100, ios: 20 })}
        onTouchEnd={() => {
          if (selectedComment) {
            setSelectedComment(undefined)
            setShowDeleteConfirmation(false)
            Keyboard.dismiss()
          } else {
            panelTranslateY.value = withTiming(
              PANEL_HIDDEN_Y_POSITION,
              {
                duration: 500,
                easing: Easing.out(Easing.exp),
              },
              () => runOnJS(toggleShowCommentsPanel)(),
            )
          }
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
                      workoutId={workoutId}
                      byUserId={item.byUserId}
                      commentId={item.commentId}
                      comment={item.comment}
                      commentDate={item._createdAt as Date}
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
        textAlignVertical="center" // This is Android only, there seems to be no solution for vertically centering multiline text input on iOS
        onContentSizeChange={(event) => {
          setCommentInputHeight(event.nativeEvent.contentSize.height)
        }}
        containerStyle={$commentInputContainerStyle}
        inputWrapperStyle={$commentInputWrapperStyle}
        style={[$commentInputStyle, commentInputHeightStyle()]}
        LeftAccessory={() => <Avatar user={userStore.user} size="sm" />}
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

const $panelHeaderActionButtons: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.medium,
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
