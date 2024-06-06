import { Divider, Icon, Picker, RestTimePicker, Text } from "app/components"
import { MenuListItem, MenuListItemProps } from "app/components/"
import { useLocale } from "app/context"
import {
  AppColorSchemeLabelValuePairs,
  AppLocaleLabel,
  AppLocaleLabelValuePairs,
  WeightUnit,
} from "app/data/constants"
import { UserPreferences } from "app/data/types"
import { translate, TxKeyPath } from "app/i18n"
import { spacing } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import React from "react"
import { View } from "react-native"
import { SwitchSettingTile } from "./UserSettingTile"

type UserPreferencesMenuProps = {
  privateAccount: boolean
  onPrivateAccountChange: (value: boolean) => void
  userPreferences: UserPreferences
  onUserPreferencesChange: (value: UserPreferences) => void
  additionalMenuItems?: {
    positionIndex: number
    menuListItemProps: MenuListItemProps
  }[]
}

export const UserPreferencesMenu = (props: UserPreferencesMenuProps) => {
  const {
    privateAccount,
    onPrivateAccountChange,
    userPreferences,
    onUserPreferencesChange,
    additionalMenuItems,
  } = props
  // Form input values
  const { weightUnit, autoRestTimerEnabled, restTime, appColorScheme, appLocale } = userPreferences
  const { setLocale } = useLocale()

  const onPreferenceChange = (preferenceId: keyof UserPreferences, value: any) => {
    onUserPreferencesChange({ ...userPreferences, [preferenceId]: value })
  }

  const preferencesData: MenuListItemProps[] = [
    {
      itemId: "privateAccount",
      itemNameLabelTx: "editProfileForm.privateAccountTitle",
      // preferenceDescriptionLabelTx: "editProfileForm.privateAccountDescription",
      currentValue: privateAccount,
      currentValueFormatted: privateAccount ? translate("common.yes") : translate("common.no"),
      onValueChange: onPrivateAccountChange,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <SwitchSettingTile
          titleTx="editProfileForm.privateAccountTitle"
          descriptionTx="editProfileForm.privateAccountDescription"
          toggleState={selectedValue}
          isOffIcon={<Icon name="lock-open-outline" size={30} />}
          isOnIcon={<Icon name="lock-closed" size={30} />}
          onToggle={onSelectionChange}
        />
      ),
    },
    {
      itemId: "weightUnit",
      itemNameLabelTx: "editProfileForm.weightUnitLabel",
      currentValue: weightUnit,
      currentValueFormatted: translate(("common." + weightUnit) as TxKeyPath),
      onValueChange: (value) => onPreferenceChange("weightUnit", value),
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="editProfileForm.weightUnitLabel"
          itemsList={[
            { label: translate(("common." + WeightUnit.kg) as TxKeyPath), value: WeightUnit.kg },
            { label: translate(("common." + WeightUnit.lbs) as TxKeyPath), value: WeightUnit.lbs },
          ]}
          selectedValue={selectedValue}
        />
      ),
    },
    {
      itemId: "autoRestTimer",
      itemNameLabelTx: "editProfileForm.autoRestTimerLabel",
      currentValue: autoRestTimerEnabled,
      currentValueFormatted: autoRestTimerEnabled
        ? translate("common.yes")
        : translate("common.no"),
      onValueChange: (value) => onPreferenceChange("autoRestTimerEnabled", value),
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <SwitchSettingTile
          titleTx="editProfileForm.autoRestTimerLabel"
          descriptionTx="editProfileForm.autoRestTimerDescription"
          toggleState={selectedValue}
          onToggle={onSelectionChange}
        />
      ),
    },
    {
      itemId: "defaultRestTime",
      itemNameLabelTx: "editProfileForm.defaultRestTimeLabel",
      currentValue: restTime,
      currentValueFormatted: formatSecondsAsTime(restTime),
      onValueChange: (value) => onPreferenceChange("restTime", value),
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <>
          <Text tx="editProfileForm.defaultRestTimeSelectorLabel" preset="formLabel" />
          <RestTimePicker initialRestTime={selectedValue} onRestTimeChange={onSelectionChange} />
        </>
      ),
    },
    {
      itemId: "appColorScheme",
      itemNameLabelTx: "editProfileForm.appAppearanceLabel",
      currentValue: appColorScheme,
      currentValueFormatted: translate(`common.colorScheme.${appColorScheme}`),
      onValueChange: (value) => onPreferenceChange("appColorScheme", value),
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="editProfileForm.appAppearanceLabel"
          itemsList={AppColorSchemeLabelValuePairs()}
          selectedValue={selectedValue}
        />
      ),
    },
    {
      itemId: "appLocale",
      itemNameLabelTx: "editProfileForm.appLocaleLabel",
      currentValue: appLocale,
      currentValueFormatted: AppLocaleLabel[appLocale],
      onValueChange: (value) => {
        onPreferenceChange("appLocale", value)
        setLocale(value)
      },
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="editProfileForm.appLocaleLabel"
          itemsList={AppLocaleLabelValuePairs()}
          selectedValue={selectedValue}
        />
      ),
    },
  ]

  // Insert additional menu items if provided
  if (additionalMenuItems) {
    additionalMenuItems.forEach((additionalItem) => {
      preferencesData.splice(additionalItem.positionIndex, 0, additionalItem.menuListItemProps)
    })
  }

  return (
    <>
      <View>
        {preferencesData.map((prefData, i) => {
          return (
            <View key={prefData.itemId}>
              {i > 0 && (
                <Divider orientation="horizontal" spaceSize={spacing.small} lineWidth={0} />
              )}
              <MenuListItem {...prefData} />
            </View>
          )
        })}
      </View>
    </>
  )
}
