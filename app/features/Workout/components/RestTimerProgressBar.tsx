import { Icon, RowView, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

type RestTimerProgressBarProps = {
  isRestTimerRunning: boolean
  restTimeRemaining: number
  totalRestTime: number
}

export const RestTimerProgressBar = observer((props: RestTimerProgressBarProps) => {
  const { isRestTimerRunning, restTimeRemaining, totalRestTime } = props
  const { themeStore } = useStores()
  const mainNavigation = useMainNavigation()

  const progressBarWidth = 75

  const $timeProgressContainer: ViewStyle = {
    width: progressBarWidth,
    height: 40,
    borderRadius: 10,
    backgroundColor: themeStore.colors("contentBackground"),
    overflow: "hidden",
    alignItems: "center",
  }

  const $timeProgressRemainingContainer: ViewStyle = {
    position: "absolute",
    height: "100%",
    width: `${Math.floor((restTimeRemaining / totalRestTime) * 100)}%`,
    backgroundColor: themeStore.colors("lightTint"),
  }

  const $restTimeDisplayView: ViewStyle | TextStyle = {
    flex: 1,
    width: progressBarWidth,
    justifyContent: "center",
    alignItems: "center",
  }

  return (
    <TouchableOpacity onPress={() => mainNavigation.navigate("RestTimer")}>
      {isRestTimerRunning ? (
        <RowView style={$timeProgressContainer}>
          <View style={$timeProgressRemainingContainer} />
          <View style={$restTimeDisplayView}>
            <Text numberOfLines={1} text={formatSecondsAsTime(restTimeRemaining)} />
          </View>
        </RowView>
      ) : (
        <Icon name="stopwatch-outline" color={themeStore.colors("foreground")} size={30} />
      )}
    </TouchableOpacity>
  )
})
