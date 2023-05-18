const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
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
  tabNavigator: {
    feedTab: "Feed",
    activityTab: "Activity",
    profileTab: "Profile",
    startWorkout: "Start a workout",
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
  },
  newActivityScreen: {
    startNewWorkoutText: "Start new workout",
    nextWorkoutHeading: "Next workout in program",
    savedWorkoutHeading: "Saved workouts",
  },
  activeWorkoutScreen: {
    newActiveWorkoutTitle: "New workout",
    finishWorkoutButton: "Finish",
    setOrderColumnHeader: "Set",
    previousColumnHeader: "Previous",
    weightColumnHeader: "Weight",
    repsColumnHeader: "Reps",
    addNotesPlaceholder: "Add notes...",
    addSetAction: "Add set",
    addExerciseAction: "Add exercise",
  }
}

export default en
export type Translations = typeof en
