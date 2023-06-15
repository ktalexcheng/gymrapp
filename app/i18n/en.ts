const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    delete: "Delete",
    loading: "Loading",
  },
  welcomeScreen: {
    postscript:
      "psst  — This probably isn't what your app looks like. (Unless your designer handed you these screens, and in that case, ship it!)",
    readyForLaunch: "Your app, almost ready for launch!",
    exciting: "(ohh, this is exciting!)",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },
  onboarding: {
    onboardingTitle: "Create your profile",
    createProfile: "I'm done, let's go!",
  },
  tabNavigator: {
    feedTab: "Feed",
    activityTab: "Activity",
    profileTab: "You",
    startWorkout: "Start a workout",
    manageExercises: "Manage exercises",
  },
  signInScreen: {
    signIn: "Sign In",
    enterDetails:
      "Enter your details below to unlock top secret info. You'll never guess what we've got waiting. Or maybe you will; it's not rocket science here.",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    tapToSignIn: "Tap to sign in!",
    hint: "Hint: you can use any email address and your favorite password :)",
    tapToSignUp: "Create a new account",
    signInWithGoogle: "Sign in with Google",
  },
  signUpScreen: {
    signUp: "Sign Up",
    tapToCreateAccount: "Create new account",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
  },
  profileScreen: {
    userSettings: "Settings",
    userActivities: "Activities",
    noActivityhistory: "No activity history",
  },
  userSettingsScreen: {
    preferencesSectionLabel: "Preferences",
    privateAccountTitle: "Private account",
    privateAccountDescription:
      "Private account activity is only visible to friends. Activities must be performed with a public profile to participate in the leaderboard.",
    deleteAccount: "Delete account",
    deleteAccountConfirmationMessage:
      "This will remove all user data. This action cannot be reversed. Are you sure?",
  },
  newActivityScreen: {
    startNewWorkoutText: "Start new workout",
    nextWorkoutHeading: "Next workout in program",
    savedWorkoutHeading: "Saved workouts",
    resumeWorkoutPromptMessage: "Resume or start new workout?",
    resumeWorkout: "Resume",
  },
  activeWorkoutScreen: {
    newActiveWorkoutTitle: "New workout",
    finishWorkoutButton: "Finish",
    setOrderColumnHeader: "Set",
    previousColumnHeader: "Previous",
    weightColumnHeader: "Weight",
    repsColumnHeader: "Reps",
    rpeColumnHeader: "RPE",
    addNotesPlaceholder: "Add notes...",
    addSetAction: "Add set",
    addExerciseAction: "Add exercise",
    dialogRemoveIncompletedSets: "Incompleted sets will be removed, are you sure?",
    confirmRemoveIncompletedSets: "Yes, remove incompleted sets",
    rejectRemoveIncompletedSets: "Go back",
    dialogSaveWorkout: "Do you want to save this workout?",
    saveWorkout: "Save",
    discardWorkout: "Discard",
    cancelAction: "Cancel",
    timeElapsedLabel: "Time elapsed:",
    totalVolumeLabel: "Total volume:",
  },
  addExerciseScreen: {
    exerciseType: "Type",
    exerciseSubtype: "Subtype",
    exerciseCategory: "Category",
    exerciseName: "Name",
    addExerciseButton: "Add exercise",
  },
  exerciseEntrySettings: {
    restTimerEnabledLabel: "Enabled",
  },
}

export default en
export type Translations = typeof en
