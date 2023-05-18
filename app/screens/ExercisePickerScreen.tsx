import firestore from "@react-native-firebase/firestore"
import { useNavigation } from "@react-navigation/native"
import React, { FC, useEffect, useState } from "react"
import {
  SectionList,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TabView } from "react-native-tab-view"
import { Text } from "../components"
import { useStores } from "../models"
import { ActivityStackScreenProps } from "../navigators"
import { colors } from "../theme"

type ExerciseItem = {
  exerciseId: string
  exerciseName: string
}

type CategorizedExerciseList = {
  [category: string]: ExerciseItem[]
}

type ExerciseListScreenProps = {
  sectionsData: {
    title: string
    data: ExerciseItem[]
  }[]
}

// type SceneMapData = {
//   [key: string]: React.ComponentType
// }

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
  backgroundColor: "rgba(247,247,247,1.0)",
}

const $sectionHeaderText: TextStyle = {
  fontSize: 14,
  fontWeight: "bold",
}

const $sectionListContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const ExerciseListScreen: FC<ExerciseListScreenProps> = (props: ExerciseListScreenProps) => {
  const navigation = useNavigation()
  const { workoutStore } = useStores()

  function handleSelectExercise(exerciseId: string, exerciseName: string) {
    workoutStore.addExercise(exerciseId, exerciseName)
    navigation.goBack()
  }

  return (
    <View style={$sectionListContainer}>
      <SectionList
        sections={props.sectionsData}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelectExercise(item.exerciseId, item.exerciseName)}
          >
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

interface ExercisePickerScreenProps extends ActivityStackScreenProps<"ExercisePicker"> {}

export const ExercisePickerScreen: FC<ExercisePickerScreenProps> = () => {
  const layout = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [allExercises, setAllExercises] = useState({})
  const [index, setIndex] = useState(0)
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    const getExercises = async () => {
      const exercisesCollection = firestore().collection("exercises")
      const exercisesSnapshot = await exercisesCollection.get()
      return exercisesSnapshot
    }

    getExercises()
      .then((snapshot) => {
        if (snapshot.empty) return

        const _allExercises: CategorizedExerciseList = {}
        snapshot.forEach((e) => {
          const { category: cat, exerciseName: name } = e.data()

          const newExercise: ExerciseItem = {
            exerciseId: cat,
            exerciseName: name,
          }

          if (cat in _allExercises) {
            _allExercises[cat].push(newExercise)
          } else {
            _allExercises[cat] = [newExercise]
          }
        })

        // Sort by exercise name
        Object.values(_allExercises).forEach((d) => d.sort())

        setAllExercises(_allExercises)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    const routes = []

    const createSectionsData = (
      exercises: ExerciseItem[],
    ): ExerciseListScreenProps["sectionsData"] => {
      const groupedExercises: { [group: string]: ExerciseItem[] } = {}
      exercises.forEach((exercise) => {
        const groupId = exercise.exerciseName[0].toUpperCase()
        if (groupId in groupedExercises) {
          groupedExercises[groupId].push(exercise)
        } else {
          groupedExercises[groupId] = [exercise]
        }
      })

      const sectionsData: ExerciseListScreenProps["sectionsData"] = []
      Object.entries(groupedExercises).forEach(([t, d]) => {
        sectionsData.push({
          title: t,
          data: d,
        })
      })

      return sectionsData
    }

    Object.entries(allExercises).forEach(([category, exercises]: [string, ExerciseItem[]]) => {
      // Group by first letter of name
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
  }, [allExercises])

  // Create custom renderScene function to avoid passing inline function to SceneMap()
  // See doc: https://www.npmjs.com/package/react-native-tab-view
  const renderScene = ({ route }) => {
    return <ExerciseListScreen sectionsData={route.data} />
  }

  const $tabViewContainer: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      style={$tabViewContainer}
      initialLayout={{ height: 1234, width: layout.width }}
    />
  )
}
