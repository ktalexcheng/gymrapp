import { Icon, RowView, Screen, Spacer, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import React from "react"
import { TemplateCatalog } from "../components/TemplateCatalog"

export const TemplateManagerScreen = () => {
  const mainNavigation = useMainNavigation()
  const { workoutEditorStore } = useStores()

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.screenContainer}>
      <RowView style={[styles.alignCenter, styles.justifyBetween]}>
        <Text preset="heading" tx="templateManagerScreen.screenTitle" />
        <Icon
          name="create-outline"
          size={30}
          onPress={() => {
            workoutEditorStore.resetWorkout()
            mainNavigation.navigate("EditTemplate")
          }}
        />
      </RowView>
      <Spacer type="vertical" size="small" />
      <TemplateCatalog />
    </Screen>
  )
}
