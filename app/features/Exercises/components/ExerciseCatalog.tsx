import { Icon, LoadingIndicator, RowView, Spacer, TabBar, Text } from "app/components"
import { ExerciseSource } from "app/data/constants"
import { TxKeyPath } from "app/i18n"
import { IExerciseModel, useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useMemo, useState } from "react"
import { SectionList, TouchableOpacity, View, ViewStyle } from "react-native"
import { Route, TabView } from "react-native-tab-view"

type ExerciseTagProps = {
  txTag?: TxKeyPath
  tag?: string
  backgroundColor?: string
}

const ExerciseTag = observer(({ txTag, tag, backgroundColor }: ExerciseTagProps) => {
  const { themeStore } = useStores()

  const $tagContainer: ViewStyle = {
    backgroundColor: backgroundColor || themeStore.colors("contentBackground"),
    borderRadius: 4,
    padding: spacing.tiny,
    marginRight: spacing.tiny,
  }

  return (
    <View style={$tagContainer}>
      <Text size="xxs" tx={txTag} text={tag} />
    </View>
  )
})

interface ExerciseListProps extends ExerciseCatalogProps {
  sectionsData: {
    title: string
    data: IExerciseModel[]
  }[]
  listFooterComponent?: SectionList["props"]["ListFooterComponent"]
}

const ExerciseList: FC<ExerciseListProps> = function ExerciseList(props: ExerciseListProps) {
  const { sectionsData, onItemPress, listFooterComponent } = props
  const { themeStore } = useStores()

  const $sectionHeader: ViewStyle = {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    backgroundColor: themeStore.colors("separator"),
  }

  const $sectionListContainer: ViewStyle = {
    flex: 1,
    backgroundColor: themeStore.colors("background"),
  }

  return (
    <View style={$sectionListContainer}>
      <SectionList
        sections={sectionsData}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onItemPress(item)}>
            <RowView style={$listItem}>
              {item.exerciseSource === ExerciseSource.Private && (
                <>
                  <Icon name="lock-closed" size={16} />
                  <Spacer type="horizontal" size="tiny" />
                </>
              )}
              <ExerciseTag
                txTag={`volumeType.${item.volumeType?.toLowerCase()}` as TxKeyPath}
                backgroundColor={
                  item.volumeType === "Time" ? themeStore.palette("secondary050") : undefined
                }
              />
              <Text size="md">{item.exerciseName}</Text>
            </RowView>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section }) => (
          <Text weight="bold" style={$sectionHeader}>
            {section.title}
          </Text>
        )}
        keyExtractor={(item) => item.exerciseId}
        ListFooterComponent={listFooterComponent}
      />
    </View>
  )
}

interface ExerciseCatalogProps {
  onItemPress: (exercise: IExerciseModel) => void
  listFooterComponent?: SectionList["props"]["ListFooterComponent"]
}

interface ExerciseCatalogTabRoute extends Route {
  title: string
  data: ExerciseListProps["sectionsData"]
}

export const ExerciseCatalog: FC<ExerciseCatalogProps> = observer((props: ExerciseCatalogProps) => {
  const { onItemPress, listFooterComponent } = props
  const [tabIndex, setTabIndex] = useState(0)
  const { exerciseStore } = useStores()

  // createSectionsData creates the section data for each tab, grouping exercises by first letter of name
  // Sorting of exercise by name is also done here
  const createSectionedData = (exercises: IExerciseModel[]): ExerciseListProps["sectionsData"] => {
    const groupedExercises: { [initialLetter: string]: IExerciseModel[] } = {}
    exercises.forEach((exercise) => {
      // In each tab, group exercises by first letter of name
      const initialLetter = exercise.exerciseName[0].toUpperCase()
      if (initialLetter in groupedExercises) {
        groupedExercises[initialLetter].push(exercise)
      } else {
        groupedExercises[initialLetter] = [exercise]
      }
    })

    const sectionedData: ExerciseListProps["sectionsData"] = []
    Object.entries(groupedExercises).forEach(([initialLetter, exercises]) => {
      // Sort exercises within each section by exercise name
      exercises.sort((a, b) => (a.exerciseName < b.exerciseName ? -1 : 1))

      sectionedData.push({
        title: initialLetter,
        data: exercises,
      })
    })

    // Sort sections by by initial letter
    sectionedData.sort((a, b) => (a.title < b.title ? -1 : 1))

    return sectionedData
  }

  const routes = useMemo(() => {
    // Exercises are grouped by category for each tab
    const groupedAllExercises: {
      [category: string]: IExerciseModel[]
    } = {}
    exerciseStore.allExercises.forEach((e) => {
      if (e.exerciseCat1 in groupedAllExercises) {
        groupedAllExercises[e.exerciseCat1].push(e)
      } else {
        groupedAllExercises[e.exerciseCat1] = [e]
      }

      // Add to "All" category
      if ("All" in groupedAllExercises) {
        groupedAllExercises.All.push(e)
      } else {
        groupedAllExercises.All = [e]
      }
    })

    // Generate tab routes
    const routes: ExerciseCatalogTabRoute[] = []
    Object.entries(groupedAllExercises).forEach(([category, exercises]) => {
      // Group exercises within each category by first letter of name
      // {
      //   title: 'B',
      //   data: ExerciseData[]
      // }
      const sectionedListData = createSectionedData(exercises)

      routes.push({
        // Special key for "All" category to sure that it is always the first tab
        key: category === "All" ? "_All" : category,
        title: category,
        data: sectionedListData,
      })
    })

    // Sort by category
    routes.sort((a, b) => (a.title < b.title ? -1 : 1))

    return routes
  }, [exerciseStore.lastUpdated])

  // Create custom renderScene function to avoid passing inline function to SceneMap()
  // See doc: https://www.npmjs.com/package/react-native-tab-view
  const renderScene = ({ route }) => {
    return (
      <ExerciseList
        sectionsData={route.data}
        onItemPress={onItemPress}
        listFooterComponent={listFooterComponent}
      />
    )
  }

  const renderTabBar = (props) => {
    return (
      <TabBar
        {...props}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        scrollEnabled={true}
        dynamicTabWidth={true}
      />
    )
  }

  if (!routes) return null

  // Note that tab press does not work properly when a debugger is attached
  // See: https://github.com/satya164/react-native-tab-view/issues/703
  console.debug("ExerciseCatalog rendering")
  return (
    <TabView
      navigationState={{ index: tabIndex, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setTabIndex}
      lazy={true}
      renderLazyPlaceholder={() => <LoadingIndicator />}
    />
  )
})

const $listItem: ViewStyle = {
  alignItems: "center",
  padding: 10,
  height: 44,
}
