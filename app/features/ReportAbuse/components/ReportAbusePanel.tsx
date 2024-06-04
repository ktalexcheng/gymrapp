import { Button, Divider, Icon, RowView, Sheet, Spacer, Text, TextField } from "app/components"
import { ReportAbuseTypes, ReportAbuseTypesOptions } from "app/data/constants"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { logError } from "app/utils/logger"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle } from "react-native"

type ReportAbusePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitReport: (
    reasons: ReportAbuseTypes[],
    otherReason?: string,
    blockUser?: boolean,
  ) => void | Promise<void>
  txPanelTitle: TxKeyPath
  txPanelMessage: TxKeyPath
  txConfirmReportButtonLabel: TxKeyPath
  zIndex?: number // When there are multiple overlays, zIndex can be used to control the order of the overlays
}

export const ReportAbusePanel = (props: ReportAbusePanelProps) => {
  const {
    open,
    onOpenChange,
    onSubmitReport,
    txPanelTitle,
    txPanelMessage,
    txConfirmReportButtonLabel,
  } = props
  const { themeStore } = useStores()

  // Form states
  const [selectedReportReasons, setSelectedReportReasons] = useState<ReportAbuseTypes[]>([])
  const [otherReportReason, setOtherReportReason] = useState<string>()
  const [isBlockUserSelected, setIsBlockUserSelected] = useState(false)

  // Validation states
  const [isNoReasonSelected, setIsNoReasonSelected] = useState(false)
  const [isOtherReasonEmpty, setIsOtherReasonEmpty] = useState(false)

  // Status states
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [isReportSent, setIsReportSent] = useState(false)

  const toggleReportReasonSelection = (reasonId: ReportAbuseTypes) => {
    if (selectedReportReasons.includes(reasonId)) {
      setSelectedReportReasons(selectedReportReasons.filter((reason) => reason !== reasonId))
    } else {
      setSelectedReportReasons([...selectedReportReasons, reasonId])
    }
  }

  const isReportReasonSelected = (reasonId: ReportAbuseTypes) => {
    return selectedReportReasons.includes(reasonId)
  }

  const validateReportForm = () => {
    let isValid = true
    setIsNoReasonSelected(false)
    setIsOtherReasonEmpty(false)

    if (selectedReportReasons.length === 0) {
      setIsNoReasonSelected(true)
      isValid = false
    }

    if (selectedReportReasons.includes(ReportAbuseTypes.Other) && !otherReportReason) {
      setIsOtherReasonEmpty(true)
      isValid = false
    }

    return isValid
  }

  const sendReport = async () => {
    if (!validateReportForm()) return

    setIsSendingReport(true)

    try {
      await onSubmitReport(selectedReportReasons, otherReportReason, isBlockUserSelected)
    } catch (e) {
      logError("ReportAbusePanel.sendReport error", e)
    } finally {
      setIsSendingReport(false)
      setIsReportSent(true)
    }
  }

  const $panelContainer: ViewStyle = {
    padding: spacing.screenPadding,
    backgroundColor: themeStore.colors("background"),
  }

  const $reportTypesContainer: ViewStyle = {
    padding: spacing.medium,
    paddingRight: 0,
  }

  const $reportTypesContent: ViewStyle = {
    backgroundColor: themeStore.colors("background"),
    alignItems: "center",
    justifyContent: "space-between",
  }

  useEffect(() => {
    if (isReportSent) {
      setTimeout(() => {
        // Reset form state
        setSelectedReportReasons([])
        setOtherReportReason(undefined)
        setIsBlockUserSelected(false)
        setIsReportSent(false)
        onOpenChange(false)
      }, 6000)
    }
  }, [isReportSent])

  const renderReportAbuseContent = () => {
    if (isReportSent) {
      return (
        <View style={[styles.flex1, styles.alignCenter, styles.justifyCenter]}>
          <Icon name="flag" size={40} color={themeStore.colors("actionable")} />
          <Spacer type="vertical" size="large" />
          <Text tx="reportAbuse.reportSentSuccessMessage" textAlign="center" />
        </View>
      )
    }

    return (
      <Sheet.ScrollView showsVerticalScrollIndicator={false}>
        <View style={$panelContainer}>
          <Text
            preset="formLabel"
            tx={txPanelTitle}
            textColor={isNoReasonSelected ? themeStore.colors("danger") : undefined}
          />
          <Text preset="light" tx={txPanelMessage} />
          <View style={$reportTypesContainer}>
            {ReportAbuseTypesOptions.map((reportType, i) => (
              <View key={reportType.reasonId}>
                {i > 0 ? <Divider orientation="horizontal" spaceSize={spacing.medium} /> : null}
                <TouchableOpacity onPress={() => toggleReportReasonSelection(reportType.reasonId)}>
                  <RowView style={$reportTypesContent}>
                    <Text
                      tx={reportType.labelTx}
                      textColor={
                        isReportReasonSelected(reportType.reasonId)
                          ? themeStore.colors("actionable")
                          : undefined
                      }
                      weight={isReportReasonSelected(reportType.reasonId) ? "bold" : "normal"}
                    />
                    {isReportReasonSelected(reportType.reasonId) && (
                      <Icon
                        name="checkmark-sharp"
                        size={20}
                        color={themeStore.colors("actionable")}
                      />
                    )}
                  </RowView>
                </TouchableOpacity>
              </View>
            ))}
            {isReportReasonSelected(ReportAbuseTypes.Other) && (
              <TextField
                status={isOtherReasonEmpty ? "error" : undefined}
                placeholderTx="reportAbuse.reasons.otherPlaceholder"
                value={otherReportReason}
                onChangeText={setOtherReportReason}
                containerStyle={{ marginTop: spacing.small }}
              />
            )}
          </View>
          <Spacer type="vertical" size="large" />
          <RowView style={styles.alignCenter}>
            <View style={styles.flex1}>
              <Text preset="formLabel" tx="reportAbuse.blockUserPromptTitle" />
              <Text preset="light" tx="reportAbuse.blockUserPromptMessage" />
            </View>
            <Icon
              onPress={() => setIsBlockUserSelected(!isBlockUserSelected)}
              name={isBlockUserSelected ? "checkbox-outline" : "square-outline"}
              size={20}
            />
          </RowView>
          <Spacer type="vertical" size="large" />
          {isNoReasonSelected && (
            <Text
              tx="reportAbuse.invalidFormMessage"
              textColor={themeStore.colors("danger")}
              preset="formHelper"
            />
          )}
          {isOtherReasonEmpty && (
            <Text
              tx="reportAbuse.invalidOtherReasonMessage"
              textColor={themeStore.colors("danger")}
              preset="formHelper"
            />
          )}
          <Button
            disabled={isSendingReport}
            preset="dangerOutline"
            tx={txConfirmReportButtonLabel}
            RightAccessory={() =>
              isSendingReport && (
                <ActivityIndicator
                  size="small"
                  color={themeStore.colors("logo")}
                  style={{ paddingLeft: spacing.extraSmall }}
                />
              )
            }
            onPress={sendReport}
          />
          <Spacer type="vertical" size="large" />
        </View>
      </Sheet.ScrollView>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} showHandle={true}>
      {renderReportAbuseContent()}
    </Sheet>
  )
}
