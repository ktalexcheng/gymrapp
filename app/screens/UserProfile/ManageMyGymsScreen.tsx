import { Screen } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { styles } from "app/theme"
import React from "react"
import { GymPicker } from "../Gym"

export const ManageMyGymsScreen = () => {
  const mainNavigation = useMainNavigation()
  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.screenContainer}>
      <GymPicker
        onGymSelected={(gym) => mainNavigation.navigate("GymDetails", { gymId: gym.gymId })}
      />
    </Screen>
  )
}

// import { Button, Icon, RowView, Screen, Text } from "app/components"
// import { Gym } from "app/data/types"
// import { useMainNavigation } from "app/navigators/navigationUtilities"
// import { useStores } from "app/stores"
// import { styles } from "app/theme"
// import React, { useEffect, useState } from "react"
// import { TouchableOpacity, View, ViewStyle } from "react-native"
// import { Popover } from "tamagui"

// export const ManageMyGymsScreen = () => {
//   const { userStore, themeStore } = useStores()
//   const mainNavigator = useMainNavigation()
//   const [myGyms, setMyGyms] = useState<Gym[]>([])

//   useEffect(() => {
//     // Populate form with user profile data
//     if (userStore.isLoadingProfile) return

//     setMyGyms(userStore.getPropAsJS("user.myGyms"))
//   }, [userStore.user])

//   const renderMyGymsItem = () => {
//     const $itemContainer: ViewStyle = {
//       alignItems: "center",
//       justifyContent: "space-between",
//     }

//     if (!myGyms?.length) {
//       return <Text tx="editProfileForm.myGymsDescription" preset="formHelper" />
//     }

//     return (
//       <>
//         {myGyms.map((myGym) => {
//           return (
//             <RowView key={myGym.gymId} style={$itemContainer}>
//               <View style={styles.flex3}>
//                 <TouchableOpacity
//                   onPress={() => mainNavigator.navigate("GymDetails", { gymId: myGym.gymId })}
//                 >
//                   <Text text={myGym.gymName} weight="normal" numberOfLines={1} />
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.flex1}>
//                 <Button
//                   tx="common.delete"
//                   preset="text"
//                   onPress={() => userStore.removeFromMyGyms(myGym)}
//                 />
//               </View>
//             </RowView>
//           )
//         })}
//       </>
//     )
//   }

//   return (
//     <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.screenContainer}>
//       <View>
//         <RowView style={styles.justifyBetween}>
//           <Text tx="editProfileForm.myGymsLabel" preset="formLabel" />
//           {userStore.profileIncomplete && (
//             <Popover placement="bottom-end">
//               <Popover.Trigger>
//                 <Icon name="information-circle-outline" size={24} />
//               </Popover.Trigger>

//               <Popover.Content unstyled style={themeStore.styles("walkthroughPopoverContainer")}>
//                 <Text
//                   tx="editProfileForm.availableAfterProfileCreatedMessage"
//                   preset="formHelper"
//                 />
//               </Popover.Content>
//             </Popover>
//           )}
//         </RowView>
//         <View
//           style={userStore.profileIncomplete ? styles.disabled : undefined}
//           pointerEvents={userStore.profileIncomplete ? "none" : "auto"}
//         >
//           {renderMyGymsItem()}
//           <Button
//             preset="text"
//             tx="editProfileForm.addGymButtonLabel"
//             onPress={() => mainNavigator.navigate("AddToMyGyms")}
//           />
//         </View>
//       </View>
//     </Screen>
//   )
// }
