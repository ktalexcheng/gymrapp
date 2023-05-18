import firestore from "@react-native-firebase/firestore"
import React, { FC, useEffect, useState } from "react"
import { SectionList, ViewStyle, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SceneMap, TabView } from "react-native-tab-view"
import { Text } from "../components"

type ExerciseData = {
  exerciseId: string
  exerciseName: string
}

type CategorizedExerciseList = {
  [category: string]: ExerciseData[]
}

type ExerciseListScreenProps = {
  sectionsData: {
    title: string
    data: ExerciseData[]
  }[]
}

type SceneMapData = {
  [key: string]: React.ComponentType
}

const ExerciseListScreen: FC<ExerciseListScreenProps> = (props: ExerciseListScreenProps) => {
  return (
    <SectionList
      sections={props.sectionsData}
      renderItem={({ item }) => <Text>{item.exerciseName}</Text>}
      renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
      keyExtractor={(item) => item.exerciseId}
    />
  )
}

export const ExercisePickerScreen: FC = () => {
  const layout = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [allExercises, setAllExercises] = useState({})
  const [index, setIndex] = useState(0)
  const [routes, setRoutes] = useState([])
  const [renderScene, setRenderScene] = useState<SceneMapData>({})

  useEffect(() => {
    console.log("firebase fetch effect")
    const getExercises = async () => {
      const exercisesCollection = firestore().collection("exercises")
      const exercisesSnapshot = await exercisesCollection.get()
      return exercisesSnapshot
    }

    getExercises()
      .then((snapshot) => {
        if (snapshot.empty) return

        const exercises: CategorizedExerciseList = {}
        snapshot.forEach((e) => {
          const { category: cat, exerciseName: name } = e.data()

          const newExercise: ExerciseData = {
            exerciseId: cat,
            exerciseName: name,
          }

          if (cat in exercises) {
            exercises[cat].push(newExercise)
          } else {
            exercises[cat] = [newExercise]
          }
        })

        // Sort by exercise name
        Object.values(exercises).forEach((d) => d.sort())

        setAllExercises(exercises)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    console.log("screen update effect")
    const routes = []
    const scenes = {}

    const createSectionsData = (
      exercises: ExerciseData[],
    ): ExerciseListScreenProps["sectionsData"] => {
      const groupedExercises: { [group: string]: ExerciseData[] } = {}
      exercises.forEach((exercise) => {
        const group = exercise.exerciseName[0].toUpperCase()
        if (group in groupedExercises) {
          groupedExercises[group].push(exercise)
        } else {
          groupedExercises[group] = [exercise]
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

    Object.entries(allExercises).forEach(([category, exercises]: [string, ExerciseData[]]) => {
      routes.push({
        key: category,
        title: category,
      })

      // Group by first letter of name
      // {
      //   title: 'B',
      //   data: ExerciseData[]
      // }
      const sectionedListData = createSectionsData(exercises)

      scenes[category] = () => <ExerciseListScreen sectionsData={sectionedListData} />
    })

    setRoutes(routes)
    setRenderScene(scenes)
  }, [allExercises])

  const $tabViewContainer: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap(renderScene)}
      onIndexChange={setIndex}
      style={$tabViewContainer}
      initialLayout={{ height: 1234, width: layout.width }}
    />
  )
}
