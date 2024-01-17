import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Icon, Screen, Spacer, Text } from "app/components"
import { translate } from "app/i18n"
import { AuthStackParamList } from "app/navigators"
import { useAuthNavigation } from "app/navigators/navigationUtilities"
import { styles } from "app/theme"
import React from "react"
import { View } from "react-native"

type EmailVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, "EmailVerification">

export const EmailVerificationScreen = ({ route }: EmailVerificationScreenProps) => {
  const email = route.params?.email
  const authNavigation = useAuthNavigation()

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <View style={[styles.flex1, styles.centeredContainer]}>
        <Icon name="mail-unread-outline" size={80} />
        <Text tx="emailVerificationScreen.emailVerificationTitle" preset="heading" />
        <Spacer type="vertical" size="medium" />
        <Text textAlign="center">
          {translate("emailVerificationScreen.emailVerificationMessage", {
            email,
          })}
        </Text>
      </View>
      <Button
        tx="common.ok"
        onPress={() =>
          authNavigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          })
        }
      />
    </Screen>
  )
}
