export enum AuthStoreError {
  EmailMissingError = "Email is not provided",
  EmailDuplicateError = "Email is already in use",
  EmailInvalidError = "Email is invalid",
  EmailLengthError = "Email is too short",
  PasswordMissingError = "Password is not set",
  PasswordWrongError = "Password is wrong",
  UserNotFoundError = "User not found",
  TooManyRequestsError = "Too many failed attempts, please try again later",
  FirstNameMissingError = "First name is not provided",
  LastNameMissingError = "Last name is not provided",
  // GenericError = "Something went wrong during authentication",
}
