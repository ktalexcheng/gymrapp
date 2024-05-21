import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Button, Icon, RowView, Screen, Spacer, Text } from "app/components"
import { useUserProfileEdit } from "app/hooks"
import { translate } from "app/i18n"
import { OnboardingStackParamList } from "app/navigators/OnboardingNavigator"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { logError } from "app/utils/logger"
import * as Linking from "expo-linking"
import { observer } from "mobx-react-lite"
import React, { createRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  TextStyle,
  View,
  ViewStyle,
  ViewToken,
} from "react-native"
import { FlatList } from "react-native-gesture-handler"
import { GymPicker } from "../Gym"
import { AboutYouForm, UserPreferencesMenu } from "../UserProfile/components"

export const CreateProfileScreen = observer(() => {
  const onboardingNavigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>()
  const { authenticationStore: authStore, themeStore } = useStores()
  const flatListRef = createRef<FlatList>()
  const [parentLayout, setParentLayout] = useState<{ width: number; height: number }>()
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // createProfile page state
  const [isAgreeToEula, setIsAgreeToEula] = useState(false)
  const [isAgreeToEulaError, setIsAgreeToEulaError] = useState(false)

  const {
    userProfile,
    setUserProfile,
    isInvalidUserInfo,
    saveUserProfile,
    isSaving,
    userHandleHelper,
    userHandleError,
    firstNameMissingError,
    lastNameMissingError,
  } = useUserProfileEdit()

  const onLayout = (event: LayoutChangeEvent) => {
    setParentLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }

  const updateCurrentPageIndex = (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
    setCurrentPageIndex(info.viewableItems[0].index ?? 0)
  }

  const goToPreviousPage = () => {
    const onBackPressValidation = onboardingScreens[currentPageIndex]?.onBackPressValidation
    if (onBackPressValidation && !onBackPressValidation()) return

    if (currentPageIndex === 0) {
      Alert.alert(
        translate("createProfileScreen.confirmExitTitle"),
        translate("createProfileScreen.confirmExitMessage"),
        [
          { text: translate("common.cancel"), style: "cancel" },
          {
            text: translate("common.exit"),
            style: "destructive",
            onPress: () => {
              authStore.logout()
            },
          },
        ],
      )

      return
    }

    flatListRef.current?.scrollToIndex({ index: currentPageIndex - 1 })
  }

  const goToNextPage = () => {
    const onNextPressValidation = onboardingScreens[currentPageIndex]?.onNextPressValidation
    if (onNextPressValidation && !onNextPressValidation()) return

    if (currentPageIndex === onboardingScreens.length - 1) {
      saveUserProfile()
        .then(() => {
          onboardingNavigation.reset({
            index: 0,
            routes: [{ name: "OnboardingSuccess" }],
          })
        })
        .catch((e) => {
          logError(e, "CreateProfileScreen.saveUserProfile error")
        })

      return
    }

    flatListRef.current?.scrollToIndex({ index: currentPageIndex + 1 })
  }

  const toggleAgreeToEula = () => {
    setIsAgreeToEula(!isAgreeToEula)
    setIsAgreeToEulaError(false)
  }

  const onboardingScreens: {
    key: string
    render: React.ComponentType
    backDisabled?: boolean
    nextDisabled?: boolean
    onBackPressValidation?: () => boolean // Return false to prevent navigation
    onNextPressValidation?: () => boolean // Return false to prevent navigation
  }[] = [
    {
      key: "gettingStarted",
      render: () => {
        return (
          <View style={styles.screenContainer}>
            <View style={[styles.flex1, styles.justifyCenter]}>
              <Text
                tx="createProfileScreen.hi"
                preset="screenTitle"
                textColor={themeStore.colors("logo")}
              />
              <Spacer type="vertical" size="large" />
              <Text tx="createProfileScreen.welcomeMessage" />
            </View>
          </View>
        )
      },
    },
    {
      key: "createProfile",
      render: () => {
        return (
          <View style={styles.screenContainer}>
            <Text preset="heading" tx="createProfileScreen.aboutYouTitle" />
            <View style={[styles.flex1, styles.justifyCenter]}>
              <AboutYouForm
                userProfile={userProfile}
                onUserProfileChange={setUserProfile}
                userHandleHelper={userHandleHelper}
                userHandleError={userHandleError}
                firstNameError={firstNameMissingError}
                lastNameError={lastNameMissingError}
              />
              <Spacer type="vertical" size="massive" />
              <View style={{ gap: spacing.small }}>
                <Text>
                  <Text tx="createProfileScreen.agreeToEulaMessage1" />
                  <Text
                    // size="xs"
                    // textColor={themeStore.colors("textDim")}
                    style={$textUnderline}
                    tx="createProfileScreen.eula"
                    onPress={() => Linking.openURL("https://gymrapp.com/legal/eula")}
                  />
                </Text>
                <RowView style={styles.alignCenter}>
                  <Icon
                    name={isAgreeToEula ? "checkbox-outline" : "square-outline"}
                    size={20}
                    color={isAgreeToEulaError ? themeStore.colors("error") : undefined}
                    onPress={toggleAgreeToEula}
                  />
                  <Spacer type="horizontal" size="small" />
                  <Text
                    tx="createProfileScreen.agreeCheckboxLabel"
                    textColor={isAgreeToEulaError ? themeStore.colors("error") : undefined}
                  />
                </RowView>
              </View>
            </View>
          </View>
        )
      },
      onNextPressValidation: () => {
        if (!isAgreeToEula) {
          setIsAgreeToEulaError(true)
        }

        return !isInvalidUserInfo() && isAgreeToEula
      },
    },
    {
      key: "yourPreferences",
      render: () => {
        return (
          <View style={styles.screenContainer}>
            <Text preset="heading" tx="createProfileScreen.yourPreferencesTitle" />
            <View style={[styles.flex1, styles.justifyCenter]}>
              <UserPreferencesMenu
                privateAccount={userProfile.privateAccount!}
                onPrivateAccountChange={(privateAccount) => setUserProfile({ privateAccount })}
                userPreferences={userProfile.preferences!}
                onUserPreferencesChange={(preferences) => setUserProfile({ preferences })}
              />
            </View>
          </View>
        )
      },
    },
    {
      key: "addMyFavoriteGyms",
      render: () => {
        return (
          <View style={styles.screenContainer}>
            <Text preset="heading" tx="createProfileScreen.yourFavoriteGymsTitle" />
            <GymPicker
              myGyms={userProfile?.myGyms ?? []}
              onPressFavoriteGym={() => {}}
              onPressGymSearchResult={(gym) => {
                // if gym does not exist in userProfile.myGyms, add it
                if (!userProfile?.myGyms?.find((myGym) => myGym.gymId === gym.gymId)) {
                  setUserProfile({
                    myGyms: [
                      ...(userProfile?.myGyms ?? []),
                      { gymId: gym.gymId, gymName: gym.gymName },
                    ],
                  })
                }
              }}
              MyGymsItemRightAccessory={({ gym }) => (
                <Icon
                  name="remove-circle"
                  size={20}
                  onPress={() =>
                    setUserProfile({
                      myGyms: userProfile?.myGyms?.filter((myGym) => myGym.gymId !== gym.gymId),
                    })
                  }
                />
              )}
            />
          </View>
        )
      },
    },
  ]

  const $swiperPageContainer: ViewStyle = {
    width: parentLayout?.width,
    height: parentLayout?.height,
  }

  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === onboardingScreens.length - 1

  if (isSaving) {
    return (
      <View style={styles.fillAndCenter}>
        <ActivityIndicator size={"large"} color={themeStore.colors("tint")} />
        <Spacer type="vertical" size="large" />
        <Text tx="createProfileScreen.creatingYourProfileMessage" />
      </View>
    )
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContainer}
      isBusy={isSaving}
    >
      {/* Just an additional wrapper to pass onLayout, didn't want to modify the Screen component just to support this */}
      <View style={$screenContainer} onLayout={onLayout}>
        {/* Only render when parent layout is ready to prevent unpleasant flicker */}
        {parentLayout && (
          <FlatList
            ref={flatListRef}
            horizontal={true}
            data={onboardingScreens}
            extraData={userProfile}
            renderItem={({ item }) => <View style={$swiperPageContainer}>{item.render()}</View>}
            keyExtractor={(item) => item.key}
            disableIntervalMomentum={true}
            onViewableItemsChanged={updateCurrentPageIndex}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            initialScrollIndex={0}
          />
        )}
      </View>
      <RowView style={$pageIndicatorContent}>
        <View style={styles.flex1}>
          <Button
            preset="text"
            LeftAccessory={() =>
              !isFirstPage && (
                <Icon
                  name="chevron-back"
                  size={20}
                  color={
                    isFirstPage ? themeStore.colors("textDim") : themeStore.colors("actionable")
                  }
                />
              )
            }
            tx="common.back"
            onPress={goToPreviousPage}
          />
        </View>
        <RowView style={$indicators}>
          {onboardingScreens.map((_, index) =>
            currentPageIndex === index ? (
              <Text key={index} text={"●"} textColor={themeStore.colors("logo")} size="lg" />
            ) : (
              <Text key={index} text={"●"} textColor={themeStore.colors("textDim")} />
            ),
          )}
        </RowView>
        <View style={styles.flex1}>
          <Button
            preset="text"
            RightAccessory={() =>
              !isLastPage && (
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={
                    isLastPage ? themeStore.colors("textDim") : themeStore.colors("actionable")
                  }
                />
              )
            }
            tx={isLastPage ? "common.finish" : "common.next"}
            onPress={goToNextPage}
          />
        </View>
      </RowView>
    </Screen>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
}

const $pageIndicatorContent: ViewStyle = {
  justifyContent: "space-evenly",
  alignItems: "center",
  gap: spacing.small,
}

const $indicators: ViewStyle = {
  flex: 1,
  gap: spacing.small,
  justifyContent: "center",
  alignItems: "center",
  maxWidth: "50%",
}

const $textUnderline: TextStyle = {
  textDecorationLine: "underline",
}
