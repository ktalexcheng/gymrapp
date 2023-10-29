import { Translations } from "./en"

const ar: Translations = {
  common: {
    ok: "نعم",
    cancel: "حذف",
    back: "خلف",
    delete: "",
    loading: "",
    exercise: "",
    bestSet: "",
    kg: "",
    lbs: "",
    appTitle: "",
    leaderboard: "",
    firstName: "",
    lastName: "",
    search: undefined,
    activities: "",
    followers: "",
    following: "",
    comments: "",
    copiedToClipboard: "",
    selected: "",
  },
  welcomeScreen: {
    postscript:
      "ربما لا يكون هذا هو الشكل الذي يبدو عليه تطبيقك مالم يمنحك المصمم هذه الشاشات وشحنها في هذه الحالة",
    readyForLaunch: "تطبيقك تقريبا جاهز للتشغيل",
    exciting: "اوه هذا مثير",
  },
  errorScreen: {
    title: "هناك خطأ ما",
    friendlySubtitle:
      "هذه هي الشاشة التي سيشاهدها المستخدمون في عملية الانتاج عند حدوث خطأ. سترغب في تخصيص هذه الرسالة ( الموجودة في 'ts.en/i18n/app') وربما التخطيط ايضاً ('app/screens/ErrorScreen'). إذا كنت تريد إزالة هذا بالكامل، تحقق من 'app/app.tsp' من اجل عنصر <ErrorBoundary>.",
    reset: "اعادة تعيين التطبيق",
  },
  emptyStateComponent: {
    generic: {
      heading: "فارغة جداً....حزين",
      content: "لا توجد بيانات حتى الآن. حاول النقر فوق الزر لتحديث التطبيق او اعادة تحميله.",
      button: "لنحاول هذا مرّة أخرى",
    },
  },
  tabNavigator: undefined,
  signInScreen: undefined,
  signUpScreen: undefined,
  profileScreen: undefined,
  editProfileForm: undefined,
  newActivityScreen: undefined,
  activeWorkoutScreen: undefined,
  exerciseDetailsScreen: undefined,
  addExerciseScreen: undefined,
  exerciseEntrySettings: undefined,
  feedScreen: undefined,
  restTimerScreen: undefined,
  userSettingsScreen: undefined,
  createNewGymScreen: undefined,
  gymSearchScreen: undefined,
  gymDetailsScreen: undefined,
  gymPickerScreen: undefined,
  discoverScreen: undefined,
  profileVisitorViewScreen: undefined,
  workoutSummaryScreen: undefined,
}

export default ar
