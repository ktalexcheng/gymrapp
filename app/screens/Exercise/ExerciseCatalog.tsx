import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { Animated, SectionList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { TabView } from "react-native-tab-view"
import { RowView, Text } from "../../components"
import { Exercise } from "../../data/model"
import { useStores } from "../../stores"
import { colors, spacing } from "../../theme"

interface ExerciseListScreenProps extends ExerciseCatalogProps {
  sectionsData: {
    title: string
    data: Exercise[]
  }[]
}

const ExerciseListScreen: FC<ExerciseListScreenProps> = (props: ExerciseListScreenProps) => {
  return (
    <View style={$sectionListContainer}>
      <SectionList
        sections={props.sectionsData}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => props.onItemPress(item.exerciseId)}>
            <Text style={[$listItem, $listItemText]}>{item.exerciseName}</Text>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={[$sectionHeader, $sectionHeaderText]}>{section.title}</Text>
        )}
        keyExtractor={(item) => item.exerciseId}
      />
    </View>
  )
}

interface ExerciseCatalogProps {
  onItemPress: (exerciseId: string) => void
}

export const ExerciseCatalog: FC<ExerciseCatalogProps> = observer((props: ExerciseCatalogProps) => {
  const [index, setIndex] = useState(0)
  const [routes, setRoutes] = useState([])
  const { exerciseStore } = useStores()

  useEffect(() => {
    const refreshExercisesData = async () => {
      await exerciseStore
        .getAllExercises()
        .catch((e) => console.error("ExerciseCatalog().useEffect([]).error:", e))
    }

    refreshExercisesData()
  }, [])

  useEffect(() => {
    const createSectionsData = (exercises: Exercise[]): ExerciseListScreenProps["sectionsData"] => {
      const groupedExercises: { [group: string]: Exercise[] } = {}
      exercises.forEach((exercise) => {
        const groupId = exercise.exerciseName[0].toUpperCase()
        if (groupId in groupedExercises) {
          groupedExercises[groupId].push(exercise)
        } else {
          groupedExercises[groupId] = [exercise]
        }
      })

      const sectionsData: ExerciseListScreenProps["sectionsData"] = []
      Object.entries(groupedExercises).forEach(([exerciseType, exercises]) => {
        sectionsData.push({
          title: exerciseType,
          data: exercises,
        })
      })

      return sectionsData
    }

    // Categorize exercises into CategorizedExerciseList
    const groupedAllExercises: {
      [category: string]: Exercise[]
    } = {}
    exerciseStore.allExercises.forEach((e: Exercise) => {
      if (e.exerciseCategory in groupedAllExercises) {
        groupedAllExercises[e.exerciseCategory].push(e)
      } else {
        groupedAllExercises[e.exerciseCategory] = [e]
      }
    })

    // Sort by exercise name
    Object.values(groupedAllExercises).forEach((d) =>
      d.sort((a, b) => (a.exerciseName[0] < b.exerciseName[0] ? -1 : 1)),
    )

    // Generate routes
    const routes = []
    Object.entries(groupedAllExercises).forEach(([category, exercises]: [string, Exercise[]]) => {
      // Group exercises within each category by first letter of name
      // {
      //   title: 'B',
      //   data: ExerciseData[]
      // }
      const sectionedListData = createSectionsData(exercises)

      routes.push({
        key: category,
        title: category,
        data: sectionedListData,
      })
    })

    setRoutes(routes)
  }, [exerciseStore.lastUpdated])

  // Create custom renderScene function to avoid passing inline function to SceneMap()
  // See doc: https://www.npmjs.com/package/react-native-tab-view
  const renderScene = ({ route }) => {
    return <ExerciseListScreen sectionsData={route.data} onItemPress={props.onItemPress} />
  }

  const renderTabBar = (props) => {
    const inputRange = props.navigationState.routes.map((x, i) => i)

    return (
      <RowView>
        {props.navigationState.routes.map((route, i) => {
          const opacity = props.position.interpolate({
            inputRange,
            outputRange: inputRange.map((inputIndex) => (inputIndex === i ? 1 : 0.5)),
          })
          const textColor = index === i ? colors.actionable : colors.textDim
          const borderColor = index === i ? colors.actionable : colors.disabled

          const $tabBarItem: ViewStyle = {
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: spacing.extraSmall,
            borderBottomWidth: 3,
            height: 40,
            borderColor,
          }

          const $tabText: TextStyle = {
            fontSize: 16,
            color: textColor,
            opacity,
          }

          return (
            <View key={i} style={$tabBarItem}>
              <TouchableOpacity
                onPress={() => {
                  setIndex(i)
                }}
              >
                <Animated.Text style={$tabText}>{route.title}</Animated.Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </RowView>
    )
  }

  // Note that tab press does not work properly when a debugger is attached
  // See: https://github.com/satya164/react-native-tab-view/issues/703
  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
    />
  )
})

const $listItem: ViewStyle = {
  padding: 10,
  height: 44,
}

const $listItemText: TextStyle = {
  fontSize: 18,
}

const $sectionHeader: ViewStyle = {
  paddingTop: 2,
  paddingLeft: 10,
  paddingRight: 10,
  paddingBottom: 2,
  backgroundColor: colors.separator,
}

const $sectionHeaderText: TextStyle = {
  fontSize: 14,
  fontWeight: "bold",
}

const $sectionListContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}
