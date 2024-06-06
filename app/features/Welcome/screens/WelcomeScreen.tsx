import { Button, Icon, PickerModal, RowView, Screen, Spacer, Text } from "app/components"
import { useLocale } from "app/context"
import { AppLocaleLabelValuePairs } from "app/data/constants"
import { translate } from "app/i18n"
import { useAuthNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import * as Linking from "expo-linking"
import { observer } from "mobx-react-lite"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"

export const WelcomeScreen = observer(() => {
  const authNavigation = useAuthNavigation()
  const { themeStore } = useStores()
  const { locale, setLocale } = useLocale()

  // Use the locale as key to force re-render when locale changes
  return (
    <Screen
      key={`welcomeScreen_${locale}`}
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$container}
    >
      <RowView style={[styles.alignCenter, styles.justifyFlexEnd]}>
        <Icon name="globe-outline" size={20} />
        <View style={$localeSelectorContainer}>
          <PickerModal
            value={locale}
            onChange={setLocale}
            itemsList={AppLocaleLabelValuePairs()}
            modalTitleTx={"welcomeScreen.appLocalePickerLabel"}
            wrapperStyle={$localeSelector}
          />
        </View>
      </RowView>
      <View style={[styles.flex1, styles.alignCenter, styles.justifyCenter]}>
        <Text tx="common.appTitle" preset="screenTitle" textColor={themeStore.colors("logo")} />
      </View>
      <View style={$bottomContainer}>
        <Text tx="welcomeScreen.welcomeTitle" preset="subheading" />
        <Text tx="welcomeScreen.welcomeMessage" preset="default" />
        <Spacer type="vertical" size="massive" />
        <Text size="xs" textColor={themeStore.colors("textDim")}>
          {translate("welcomeScreen.agreeToTermsMessage1")}
          <Text
            size="xs"
            textColor={themeStore.colors("textDim")}
            style={$textUnderline}
            tx="welcomeScreen.termsOfService"
            onPress={() => Linking.openURL("https://gymrapp.com/legal/terms")}
          />
          {translate("welcomeScreen.agreeToTermsMessage2")}
          <Text
            size="xs"
            textColor={themeStore.colors("textDim")}
            style={$textUnderline}
            tx="welcomeScreen.privacyPolicy"
            onPress={() => Linking.openURL("https://gymrapp.com/legal/privacy")}
          />
        </Text>
        <Spacer type="vertical" size="small" />
        <Button
          tx="welcomeScreen.getStartedButtonLabel"
          preset="default"
          style={$button}
          onPress={() => authNavigation.navigate("SignIn")}
        />
      </View>
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

const $bottomContainer: ViewStyle = {
  justifyContent: "flex-end",
  padding: spacing.medium,
}

const $button: ViewStyle = {
  width: "100%",
}

const $localeSelector: ViewStyle = {
  borderWidth: 0,
}

const $localeSelectorContainer: ViewStyle = {
  minWidth: "20%",
}

const $textUnderline: TextStyle = {
  textDecorationLine: "underline",
}
