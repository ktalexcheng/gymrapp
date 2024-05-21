import { TxKeyPath } from "app/i18n"

export enum ReportAbuseTypes {
  Span = "spam",
  Harassment = "harassment",
  Misinformation = "misinformation",
  Illegal = "illegal",
  Scam = "scam",
  Violence = "violence",
  Personal = "personal",
  Other = "other",
}

export const ReportAbuseTypesOptions: {
  reasonId: ReportAbuseTypes
  labelTx: TxKeyPath
}[] = Object.values(ReportAbuseTypes).map((reasonId) => ({
  reasonId,
  labelTx: `reportAbuse.reasons.${reasonId}`,
}))
