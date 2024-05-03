import { Screen } from "app/components"
import { Gym } from "app/data/types"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { GymPicker } from "../Gym"

export const ManageMyGymsScreen = observer(() => {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()

  const myGyms = userStore.getPropAsJS<Gym[]>("user.myGyms")

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.screenContainer}>
      <GymPicker
        myGyms={myGyms}
        onPressFavoriteGym={(gym) => mainNavigation.navigate("GymDetails", { gymId: gym.gymId })}
        onPressGymSearchResult={(gym) =>
          mainNavigation.navigate("GymDetails", { gymId: gym.gymId })
        }
      />
    </Screen>
  )
})
