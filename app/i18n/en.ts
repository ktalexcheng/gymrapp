const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    delete: "Delete",
    loading: "Loading...",
    exercise: "Exercise",
    bestSet: "Best Set",
    kg: "kg",
    lbs: "lbs",
    appTitle: "GymRapp",
    leaderboard: "Leaderboard",
    firstName: "First name",
    lastName: "Last name",
    search: {
      inputPlaceholder: "Search for something",
      moreCharactersRequiredMessage: "Enter at least 3 characters",
      isSearchingMessage: "Searching...",
      noResultsFoundMessage: "No results found",
      notWhatYouAreLookingForMessage: "Not what you are looking for?",
    },
    activities: "Activities",
    followers: "Followers",
    following: "Following",
    comments: "Comments",
    copiedToClipboard: "Copied to clipboard!",
    selected: "Selected",
    discard: "Discard",
    save: "Save",
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
    discoverTab: "Discover",
    activityTab: "Activity",
    upcomingTab: "Upcoming",
    profileTab: "You",
    startWorkout: "Start a workout",
    manageExercises: "Manage exercises",
  },
  signInScreen: {
    signIn: "Sign In",
    orSignInWith: "Or sign in with",
    enterDetails:
      "Enter your details below to unlock top secret info. You'll never guess what we've got waiting. Or maybe you will; it's not rocket science here.",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    tapToSignIn: "Tap to sign in!",
    hint: "Hint: you can use any email address and your favorite password :)",
    signUpWithEmail: "Create account with email",
    signInWithGoogle: "Sign in with Google",
  },
  signUpScreen: {
    signUp: "Sign Up",
    tapToCreateAccount: "Create new account",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    confirmPasswordFieldLabel: "Confirm password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    confirmPasswordFieldPlaceholder: "Type your password again",
    passwordMismatchLabel: "Passwords do not match",
  },
  feedScreen: {
    notFollowingAnyone: "Start following people to see their workouts here",
    noFeedItems: "Once your friends start working out, you'll see their workouts here",
    noMoreFeedItems: "That's all we have for now!",
  },
  profileScreen: {
    userSettings: "Settings",
    activitiesTabLabel: "Activities",
    dashboardTabLabel: "Dashboard",
    dashboardWeeklyWorkoutsTitle: "Weekly Workouts",
    noActivityhistory: "No activity history",
    coachsCenterButtonLabel: "Coach's Center",
  },
  editProfileForm: {
    editProfileTitle: "Your profile",
    personaTypeLabel: "Are you a coach?",
    uploadAvatarLabel: "Set your avatar",
    uploadAvatarPlaceholder: "Choose a picture",
    myGymsLabel: "My gyms",
    myGymsDescription: "Add gyms you frequently visit to your profile",
    addGymButtonLabel: "Add gym",
    preferencesSectionLabel: "Preferences",
    privateAccountTitle: "Private account",
    privateAccountDescription:
      "Private account activity is only visible to friends. Activities must be performed with a public profile to participate in the leaderboard.",
    weightUnitLabel: "Weight unit",
    appLocaleLabel: "App language",
    autoRestTimerLabel: "Auto rest timer",
    autoRestTimerDescription: "Automatically start rest timer after each set.",
    defaultRestTimeLabel: "Default rest time",
    defaultRestTimeSelectorLabel: "Select default rest time:",
    saveProfileChanges: "Save changes",
    alertDialogTitle: "Discard changes?",
    alertDialogDiscardChangesMessage:
      "There are unsaved changes. Are you sure you want to discard them?",
    alertDialogResume: "Keep editing",
  },
  userSettingsScreen: {
    logout: "Logout",
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
    setCurrentGymLabel: "Set current gym",
    finishWorkoutButton: "Finish",
    setOrderColumnHeader: "Set",
    previousColumnHeader: "Prev",
    weightColumnHeader: "Weight",
    repsColumnHeader: "Reps",
    rpeColumnHeader: "RPE",
    timeColumnHeader: "Time",
    enterTimeLabel: "Enter time",
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
    timeSinceLastSetLabel: "Resting (set):",
    rpeNullLabel: "None",
  },
  workoutSettings: {
    setWorkoutVisibilityLabel: "Set workout visibility",
    workoutHiddenLabel: "Only for you",
    workoutVisibleToFeedLabel: "Visible to feed",
    workoutSummaryLabel: "Workout summary",
  },
  workoutSummaryScreen: {
    commentInputPlaceholder: "Leave a comment...",
    noCommentsMessage: "Start the conversation!",
  },
  restTimerScreen: {
    startTimer: "Start",
    pauseTimer: "Pause",
    resumeTimer: "Resume",
    resetTimer: "Reset",
    subtract15Seconds: "-15s",
    add15Seconds: "+15s",
  },
  exerciseDetailsScreen: {
    personalRecordsLabel: "Personal Records",
    workoutHistoryLabel: "Workout History",
    recordsHeaderDateLabel: "Date Performed",
    recordsHeaderWeightLabel: "Weight",
    recordsHeaderRepsLabel: "Reps",
    recordsHeaderTimeLabel: "Time",
    noExerciseHistoryFound: "No exercise history found.",
  },
  addExerciseScreen: {
    disclaimer:
      "Exercises you create will not be shared with other users and will not participate in the leaderboard.",
    activityType: "Activity Type",
    exerciseCat1: "Category",
    exerciseCat2: "Sub-Category (optional)",
    volumeType: "Volume Type",
    setAsBlankLabel: "Set as blank",
    requiredFieldsMissingMessage: "Please fill out all required fields",
    exerciseName: "Name",
    addExerciseButton: "Add exercise",
  },
  exerciseEntrySettings: {
    restTimerEnabledLabel: "Enabled",
    restTimeLabel: "Rest time",
    createSupersetLabel: "Create superset",
    removeExerciseLabel: "Remove exercise",
    weightUnitLabel: "Weight unit",
  },
  createNewGymScreen: {
    createNewGymTitle: "Create a new gym",
    gymNameLabel: "Gym name",
    gymNamePlaceholder: "Enter gym name",
    gymLocationLabel: "Gym address",
    gymLocationPlaceholder: "Enter gym address",
    createNewGymButtonLabel: "Create gym",
    checkingGymExistsLabel: "Checking if gym exists...",
    gymsNearYouLabel: "Gyms near you",
    noGymsFoundLabel: "No gyms found around your area",
    gettingUserLocationLabel: "Getting current location...",
    locationPermissionRequiredLabel: "Location permission is required",
    locationPermissionRequiredMessage:
      "Location permission is required to verify gym location. Please enable location permission in your device settings.",
  },
  gymPickerScreen: {
    gymPickerTitle: "Select the gym you are at",
    selectFromMyGymsLabel: "Your favorite gyms",
    emptyMyGymsLabel: "You have no favorite gyms",
    searchForGymLabel: "Search for gyms",
    gettingUserLocationLabel: "Getting current location...",
    locationTooFarMessage:
      "Your location seems too far from this gym, is this the right gym? You must be within 500 meters of the gym to check in.",
  },
  gymSearch: {
    searchBarPlaceholder: "Gym name",
    createNewGymButtonLabel: "Create a new gym",
  },
  gymDetailsScreen: {
    addToMyGymsLabel: "Add to my gyms",
    removeFromMyGymsLabel: "Remove from my gyms",
    alreadyAddedToMyGymsLabel: "Already added to my gyms",
    alreadyRemovedFromMyGymsLabel: "Already removed from my gyms",
    latestWorkoutsLabel: "Latest workouts",
    gymMembersLabel: "Members",
    noMoreWorkoutsMessage: "That's all we have for now!",
    noMoreMembersMessage: "That's all the members at this gym!",
    noActivityMessage: "Be the first to workout here!",
  },
  userSearch: {
    searchBarPlaceholder: "User name",
    inviteFriendsButtonLabel: "Invite your friends to join!",
  },
  discoverScreen: {
    discoverTitle: "Discover",
    allCategoriesLabel: "All",
    usersCategoryLabel: "Users",
    gymsCategoryLabel: "Gyms",
  },
  profileVisitorViewScreen: {
    dateJoinedLabel: "Date joined",
    followButtonLabel: "Follow",
    followBackButtonLabeL: "Follow back",
    unfollowButtonLabel: "Unfollow",
    followRequestSentMessage: "Follow request sent",
    followRequestAcceptedMessage: "You have rejected this user's follow request",
    followRequestRejectedMessage: "You have rejected this user's follow request",
    noActivityHistoryMessage: "No activity history",
    userIsPrivateMessage: "This user is private",
  },
  notificationsScreen: {
    notificationsTitle: "Notifications",
    noNotificationsMessage: "No notifications",
    newNotificationsTitle: "New",
    olderNotificationsTitle: "Older",
    followRequestsTitle: "Follow requests",
    commentNotificationMessage: "commented on your workout",
    likeNotificationMessage: "liked your workout",
    followRequestNotificationMessage: "requested to follow you",
    followAcceptedNotificationMessage: "accepted your follow request",
  },
}

export default en
export type Translations = typeof en
