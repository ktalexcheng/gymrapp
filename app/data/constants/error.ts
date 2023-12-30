import { TxKeyPath } from "app/i18n"

export enum UserErrorType {
  UserHandleAlreadyTakenError = "user-handle-already-taken",
}

export enum AuthErrorType {
  EmailMissingError = "email-missing",
  EmailDuplicateError = "email-already-in-use",
  EmailInvalidError = "email-invalid",
  PasswordMissingError = "password-missing",
  PasswordWrongError = "password-wrong",
  UserNotFoundError = "user-not-found",
  TooManyRequestsError = "too-many-requests",
  FirstNameMissingError = "first-name-missing",
  LastNameMissingError = "last-name-missing",
  LoginCancelledError = "login-cancelled",
  NetworkError = "network-request-failed",
  UnknownError = "unknown-error",
}

export const AuthErrorTxKey: Record<AuthErrorType, TxKeyPath> = {
  [AuthErrorType.FirstNameMissingError]: "signUpScreen.error.firstNameMissing",
  [AuthErrorType.LastNameMissingError]: "signUpScreen.error.lastNameMissing",
  [AuthErrorType.EmailMissingError]: "signUpScreen.error.emailMissing",
  [AuthErrorType.EmailDuplicateError]: "signUpScreen.error.emailDuplicate",
  [AuthErrorType.EmailInvalidError]: "signUpScreen.error.emailInvalid",
  [AuthErrorType.PasswordMissingError]: "signUpScreen.error.passwordMissing",
  [AuthErrorType.UserNotFoundError]: "signInScreen.error.invalidCredentials",
  [AuthErrorType.PasswordWrongError]: "signInScreen.error.invalidCredentials",
  [AuthErrorType.TooManyRequestsError]: "signInScreen.error.tooManyRequests",
  [AuthErrorType.LoginCancelledError]: "signInScreen.error.loginCancelled",
  [AuthErrorType.NetworkError]: "common.networkError",
  [AuthErrorType.UnknownError]: "common.unknownError",
}
