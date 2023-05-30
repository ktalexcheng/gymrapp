import Ionicons from "@expo/vector-icons/Ionicons"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { Fab, Icon } from "native-base"
import React, { FC, useEffect, useState } from "react"
import { SectionList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { TabBar, TabView } from "react-native-tab-view"
import { Text } from "../../components"
import { Exercise } from "../../data/model"
import { ActivityStackScreenProps } from "../../navigators"
import { useStores } from "../../stores"
import { colors } from "../../theme"
import { useSafeAreaInsetsStyle } from "../../utils/useSafeAreaInsetsStyle"

type GroupedExerciseList = {
  [category: string]: Exercise[]
}

type ExerciseListScreenProps = {
  sectionsData: {
    title: string
    data: Exercise[]
  }[]
}

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

export const ExercisePickerScreen: FC<ExercisePickerScreenProps> = observer(({ navigation }) => {
  const [index, setIndex] = useState(0)
  const [routes, setRoutes] = useState([])
  const { exerciseStore } = useStores()

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
      Object.entries(groupedExercises).forEach(([t, d]) => {
        sectionsData.push({
          title: t,
          data: d,
        })
      })

      return sectionsData
    }

    // Categorize exercises into CategorizedExerciseList
    const groupedAllExercises: GroupedExerciseList = {}
    exerciseStore.allExercises.forEach((e: Exercise) => {
      if (e.exerciseCategory in groupedAllExercises) {
        groupedAllExercises[e.exerciseCategory].push(e)
      } else {
        groupedAllExercises[e.exerciseCategory] = [e]
      }
    })

    // Sort by exercise name
    Object.values(groupedAllExercises).forEach((d) => d.sort())

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

    console.debug("ExercisePickerScreen called setRoutes(routes)")
    setRoutes(routes)
  }, [exerciseStore.lastUpdated])

  // Create custom renderScene function to avoid passing inline function to SceneMap()
  // See doc: https://www.npmjs.com/package/react-native-tab-view
  const renderScene = ({ route }) => {
    return <ExerciseListScreen sectionsData={route.data} />
  }

  const $containerInsets = useSafeAreaInsetsStyle(["bottom", "left", "right"])

  const $screenContainer: ViewStyle = {
    flex: 1,
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <View style={[$screenContainer, $containerInsets]}>
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon color="white" as={Ionicons} name="add-outline" size="lg" />}
        onPress={() => navigation.navigate("CreateExercise")}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={(props) => <TabBar {...props} />}
        onIndexChange={setIndex}
      />
    </View>
  )
})
