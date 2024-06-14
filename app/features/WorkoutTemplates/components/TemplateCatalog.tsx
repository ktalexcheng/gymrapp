import { RowView, Spacer, Text } from "app/components"
import { WorkoutTemplate } from "app/data/repository/workoutTemplateRepository"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { Alert, FlatList, TouchableOpacity, View } from "react-native"
import { useDeleteTemplate } from "../services/useDeleteTemplate"
import { useGetTemplates } from "../services/useGetTemplates"
import { TemplateCatalogItemMenu } from "./TemplateCatalogItemMenu"

type TemplatePreviewProps = {
  template: WorkoutTemplate
}

const TemplatePreview = observer((props: TemplatePreviewProps) => {
  const { template } = props
  const mainNavigation = useMainNavigation()
  const { themeStore, workoutEditorStore } = useStores()

  // queries and mutations
  const deleteTemplate = useDeleteTemplate()

  const goToTemplateDetails = () => {
    mainNavigation.navigate("TemplateDetails", {
      workoutTemplateId: template.workoutTemplateId,
    })
  }

  const onEditTemplate = () => {
    workoutEditorStore.resetWorkout()
    workoutEditorStore.hydrateWithTemplate(template)
    mainNavigation.navigate("EditTemplate", { workoutTemplateId: template.workoutTemplateId })
  }

  const onDeleteTemplate = () => {
    Alert.alert(
      translate("templateManagerScreen.listItemMenu.confirmDeleteTemplateTitle"),
      translate("templateManagerScreen.listItemMenu.confirmDeleteTemplateMessage"),
      [
        {
          text: translate("common.cancel"),
          style: "cancel",
        },
        {
          text: translate("common.delete"),
          style: "destructive",
          onPress: () => deleteTemplate.mutate(template.workoutTemplateId),
        },
      ],
    )
  }

  return (
    <TouchableOpacity onPress={goToTemplateDetails}>
      <View style={themeStore.styles("listItemContainer")}>
        <RowView style={styles.justifyBetween}>
          <Text
            style={styles.flex1}
            numberOfLines={2}
            weight="bold"
            text={template.workoutTemplateName}
          />
          <View>
            <TemplateCatalogItemMenu
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          </View>
        </RowView>
        <Spacer type="vertical" size="large" />

        <RowView style={styles.justifyBetween}>
          <Text weight="bold" tx="templateSummaryCard.exercises" />
          <Text weight="bold" tx="templateSummaryCard.sets" />
        </RowView>
        {template.exercises.map((e) => (
          <View key={e.exerciseId}>
            <RowView style={styles.justifyBetween}>
              <Text text={e.exerciseName} />
              {e.sets?.length > 0 && <Text text={`${e.sets.length}`} />}
            </RowView>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  )
})

const NoTemplates = () => {
  return (
    <View style={styles.fillAndCenter}>
      <Text tx="templateManagerScreen.noTemplatesMessage" />
    </View>
  )
}

export const TemplateCatalog = observer(() => {
  const { userStore } = useStores()
  const allTemplates = useGetTemplates(userStore.userId!)

  return (
    <View style={styles.flexGrow}>
      <FlatList
        // refreshControl={
        //   <ThemedRefreshControl
        //     refreshing={allTemplates.isLoading}
        //     onRefresh={allTemplates.refetch}
        //   />
        // }
        data={allTemplates.data}
        renderItem={({ item }) => <TemplatePreview template={item} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={NoTemplates}
      />
    </View>
  )
})
