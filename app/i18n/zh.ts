import { Translations } from "./en"

const zh: Translations = {
  common: {
    yes: "是",
    no: "否",
    ok: "確定",
    cancel: "取消",
    clear: "清除",
    back: "返回",
    delete: "刪除",
    loading: "進行中...",
    exercise: "動作",
    bestSet: "最佳組次",
    kg: "公斤",
    lbs: "磅",
    appTitle: "GYMRAPP",
    leaderboard: "排行榜",
    firstName: "名字",
    lastName: "姓氏",
    search: {
      inputPlaceholder: "搜尋任何東西",
      moreCharactersRequiredMessage: "請輸入至少 3 個字符",
      isSearchingMessage: "正在搜尋...",
      noResultsFoundMessage: "找不到任何結果",
      notWhatYouAreLookingForMessage: "不是你要找的嗎？",
    },
    activities: "活動",
    followers: "追蹤者",
    following: "追蹤中",
    comments: "評論",
    copiedToClipboard: "已複製到剪貼簿",
    selected: "已選取",
    discard: "捨棄",
    save: "儲存",
    user: "使用者",
    you: "你",
    next: "下一步",
    finish: "完成",
    exit: "退出",
    block: "封鎖",
    unblock: "解除封鎖",
    workouts: "訓練記錄",
    error: {
      networkErrorMessage: "網路未連線",
      unknownErrorMessage: "系統發生錯誤",
    },
    offlineMode: {
      firestoreNetworkDisabledMessage: "資料將暫存於本機上，並於網路連線後同步",
      firestoreNetworkEnabledMessage: "你已重新連線",
      pendingWritesFailedMessage: "離線資料同步失敗",
      pendingWritesSuccessMessage: "離線資料已同步至伺服器",
      localWorkoutsSyncedMessage: "你的訓練記錄已同步至伺服器",
    },
    colorScheme: {
      light: "淺色",
      dark: "暗色",
      auto: "自動",
    },
  },
  notification: {
    restTime: {
      channelName: "休息計時器",
      restTimeCompletedTitle: "休息時間結束!",
      restTimeCompletedGenericPrompt: "該做下一組了！",
      restTimeCompletedFromLastSetPrompt: "上次完成的組次: {{setDescription}}",
    },
    permissionAlert: {
      title: "需要權限",
      message: "請允許通知權限，以接收休息時間及朋友活動的通知",
      goToAppSettingsButtonLabel: "應用程式設定",
    },
  },
  updateApp: {
    update: "更新",
    updateAvailableTitle: "有新版本可用",
    updateAvailableMessage: "應用程式有更新的版本可用，請問是否立即更新呢?",
    forceUpdateTitle: "需要更新",
    forceUpdateMessage: "應用程式有重要的更新可用，請立即更新以繼續使用此應用程式",
    checkForUpdateErrorMessage: "檢查更新失敗，請確保你已連線至網路或重新啟動應用程式",
  },
  welcomeScreen: {
    welcomeTitle: "歡迎使用 GYMRAPP！",
    welcomeMessage:
      "這是個為健身愛好者量身打造的平台。開始記錄你的訓練歷程並分享每一次的進步，讓我們共同慶祝每個人的突破！",
    getStartedButtonLabel: "開始使用",
    appLocalePickerLabel: "選擇語言",
    agreeToTermsMessage1: "如繼續使用，即代表你同意我們的",
    termsOfService: "服務條款",
    agreeToTermsMessage2: "以及",
    privacyPolicy: "隱私政策",
  },
  errorScreen: {
    title: "糟糕...",
    message: "Gymrapp 遇到了一些問題。此問題將在你重置應用程式後自動回報給我們",
    reset: "重啟應用程式",
  },
  emptyStateComponent: {
    generic: {
      heading: "好空曠...好難過",
      content: "尚未找到任何資料。請嘗試點擊按鈕重新整理或重新載入應用程式",
      button: "讓我們再試一次",
    },
  },
  tabNavigator: {
    activityTab: "活動",
    feedTab: "動態",
    discoverTab: "探索",
    exercisesTab: "動作",
    profileTab: "你",
  },
  signInScreen: {
    signIn: "登入",
    orSignInWith: "或使用以下方式登入",
    emailFieldLabel: "電子郵件",
    passwordFieldLabel: "密碼",
    emailFieldPlaceholder: "請輸入你的電子郵件",
    passwordFieldPlaceholder: "請輸入你的密碼",
    tapToSignIn: "點擊登入",
    signUpWithEmail: "使用電子郵件註冊帳戶",
    signInWithGoogle: "使用 Google 登入",
    signInWithApple: "使用 Apple 登入",
    error: {
      invalidCredentials: "無效的帳戶密碼",
      tooManyRequests: "嘗試次數過多，請稍後再試",
      loginCancelled: "登入已取消",
    },
  },
  signUpScreen: {
    signUp: "註冊",
    tapToCreateAccount: "創建新帳戶",
    emailFieldLabel: "電子郵件",
    passwordFieldLabel: "密碼",
    passwordFieldHint: "至少 8 個字符，包含至少一個大寫字母、一個小寫字母和一個數字",
    confirmPasswordFieldLabel: "確認密碼",
    firstNamePlaceholder: "請輸入你的名字",
    lastNamePlaceholder: "請輸入你的姓氏",
    emailFieldPlaceholder: "請輸入你的電子郵件地址",
    passwordFieldPlaceholder: "請輸入你的密碼",
    confirmPasswordFieldPlaceholder: "再次輸入你的密碼",
    error: {
      firstNameMissing: "未填寫名字",
      lastNameMissing: "未填寫姓氏",
      emailMissing: "未填寫電子郵件",
      emailAlreadyInUse: "電子郵件已被使用",
      emailInvalid: "電子郵件格式錯誤",
      passwordMissing: "未設置密碼",
      passwordInsecure:
        "密碼強度太弱：請使用至少 8 個字符，包含至少一個大寫字母、一個小寫字母和一個數字",
      passwordMismatch: "密碼不一致",
    },
  },
  emailVerificationScreen: {
    emailVerificationTitle: "請查看你的收件匣",
    emailVerificationMessage: "我們發送了一則驗證信件至 {{email}}。請使用信件中的連結驗證你的帳戶",
  },
  emailVerifiedScreen: {
    emailVerifiedTitle: "電子郵件已驗證",
    emailVerifiedMessage: "你的電子郵件已驗證",
    continueButtonLabel: "讓我們開始吧！",
  },
  createProfileScreen: {
    hi: "嗨！",
    welcomeMessage: "我們非常期待你的加入！在開始之前，我們需要先建立你的帳戶資訊。",
    aboutYouTitle: "關於你",
    agreeToEulaMessage1: "使用此應用程式需要同意",
    eula: "終端使用者許可協議 (EULA)",
    agreeCheckboxLabel: "我同意",
    yourPreferencesTitle: "你的偏好設定",
    yourFavoriteGymsTitle: "你的訓練場所",
    confirmExitTitle: "回到登入頁面？",
    confirmExitMessage: "你就快完成了！你確定要退回到登入畫面嗎？",
    creatingYourProfileMessage: "正在建立你的帳戶...",
  },
  onboardingSuccessScreen: {
    onboardingSuccessTitle: "歡迎來到 GYMRAPP！",
    onboardingSuccessMessage: "一切都準備就緒了，開始訓練吧！",
  },
  feedScreen: {
    notFollowingAnyone: "開始追蹤你的朋友，即可在此處看到他們的訓練記錄",
    noFeedItems: "當你的朋友開始訓練後，將在此處看到他們的訓練記錄",
    noMoreFeedItems: "目前就只有這些！",
  },
  profileScreen: {
    userSettings: "設定",
    activitiesTabLabel: "活動",
    dashboardTabLabel: "儀表板",
    dashboardWeeklyWorkoutsTitle: "每周訓練記錄",
    noActivityHistory: "紀錄你的首個訓練，即可看到你的訓練記錄！",
    coachsCenterButtonLabel: "教練中心",
  },
  editProfileForm: {
    editProfileTitle: "你的個人資料",
    aboutYouSectionLabel: "關於你",
    userHandleLabel: "使用者代號",
    newUserHandleAvailableMessage: "此使用者代號可用",
    personaTypeLabel: "你是教練嗎？",
    // uploadAvatarLabel: "設置你的頭像",
    uploadAvatarPlaceholder: "選擇頭像",
    myGymsLabel: "我的健身房",
    myGymsDescription: "將你經常去的健身房加到你的最愛",
    addGymButtonLabel: "新增健身房",
    preferencesSectionLabel: "偏好設定",
    privateAccountTitle: "私人帳戶",
    privateAccountDescription: "私人帳戶的動態僅對朋友可見",
    weightUnitLabel: "重量單位",
    appLocaleLabel: "應用程式語言",
    autoRestTimerLabel: "組間休息自動計時",
    autoRestTimerDescription: "每組動作後自動啟動休息計時器",
    defaultRestTimeLabel: "預設休息時間",
    defaultRestTimeSelectorLabel: "選擇預設休息時間：",
    appAppearanceLabel: "應用程式主題",
    // saveProfileChanges: "儲存變更",
    discardAlertTitle: "捨棄變更？",
    discardAlertMessage: "你確定要捨棄所有變更嗎？你將失去所有未儲存的變更",
    alertDialogResume: "繼續編輯",
    error: {
      userHandleMissingMessage: "請輸入使用者代號",
      userHandleIsTakenMessage: "此使用者代號已被使用",
      userHandleInvalidMessage: "使用者代號僅能包含 30 個以内的英文字母、數字、下劃線和句點",
      firstNameMissingMessage: "請輸入你的名字",
      lastNameMissingMessage: "請輸入你的姓氏",
    },
    backButtonDisabledMessage: "請使用畫面頂部的按鈕退出",
  },
  manageMyGymsScreen: {
    manageMyGymsTitle: "我的健身房",
  },
  userSettingsScreen: {
    accountControlsSectionLabel: "帳戶管理",
    logoutAlertTitle: "登出",
    logoutAlertMessage: "你確定要登出嗎?",
    deleteAccountPasswordPrompt: "如欲刪除你的帳戶，請重新驗證你的密碼",
    deleteAccountAlertTitle: "刪除帳戶",
    deleteAccountAlertMessage:
      "這將移除你的所有資料且無法復原，你確定嗎？基於安全考量，我們將需要重新驗證你的身份",
    identityVerificationFailedTitle: "身份驗證失敗",
    identityVerificationFailedMessage: "無法經由你所提供的驗證資訊核對身份，請再嘗試一次",
    identityMismatchMessage: "驗證資訊與你目前登入的帳戶不符合，請再嘗試一次",
    tooManyFailedAttemptsMessage: "短時間內嘗試失敗過多次，請稍等一陣子後再嘗試",
    deleteFinalWarningTitle: "我們將會很不捨！",
    deleteFinalWarningMessage: "這是最後一個可以取消帳戶刪除的機會了，你確定嗎？",
    accountAuthenticationTypeLabel: "登入方式",
    emailPassword: "郵件/密碼",
    aboutGymrappSectionLabel: "關於 Gymrapp",
    appVersionLabel: "軟體版本",
  },
  newActivityScreen: {
    startNewWorkoutText: "開始新的訓練",
    nextWorkoutHeading: "計畫中的下個課表",
    savedWorkoutHeading: "已保存的訓練記錄",
    resumeWorkoutPromptMessage: "繼續或開始新的訓練記錄？",
    resumeWorkout: "繼續",
  },
  activeWorkoutScreen: {
    newActiveWorkoutTitle: "新的訓練記錄",
    setCurrentGymLabel: "設置訓練場所",
    finishWorkoutButton: "完成",
    setOrderColumnHeader: "組次",
    previousColumnHeader: "前次",
    weightColumnHeader: "重量",
    repsColumnHeader: "次數",
    rpeColumnHeader: "RPE",
    timeColumnHeader: "時間",
    enterTimeLabel: "輸入時間",
    addNotesPlaceholder: "填寫備註...",
    addSetAction: "新增組次",
    addExerciseAction: "新增動作",
    noExercisesMessage: "尚未紀錄任何動作",
    dialogRemoveIncompletedSets: "將移除未完成的組次，你確定嗎？",
    noExercisesAddedMessage: "訓練記錄中必須至少完成一組動作，請完成一組動作或捨棄此訓練記錄",
    confirmRemoveIncompletedSets: "是，移除未完成的組次",
    rejectRemoveIncompletedSets: "返回",
    dialogSaveWorkout: "確定儲存此訓練記錄嗎?",
    saveWorkout: "儲存",
    discardWorkout: "捨棄",
    cancelAction: "取消",
    timeElapsedLabel: "經過時間：",
    totalVolumeLabel: "總量：",
    timeSinceLastSetLabel: "休息時間：",
    rpeNullLabel: "無",
    ongoingWorkoutLabel: "正在進行的訓練記錄",
    gymPickerScreenTitle: "選擇健身房",
    emptyFavoriteGymsMessage:
      "你目前沒有任何最愛的健身房。將健身房加入你的最愛，以自動設置你的訓練場所",
    noFavoriteGymFoundMessage: "看起來你附近沒有任何你最愛的健身房",
    favoriteGymFoundMessage: "將訓練場所設置為 {{gymName}}",
  },
  editWorkoutScreen: {
    editWorkoutWarningTitle: "你確定嗎？",
    editWorkoutWarningMessage:
      "如果你編輯此訓練記錄，它將被標記為已編輯，並且編輯後的任何最佳紀錄將不會包含在你個人的動作歷史記錄中",
  },
  saveWorkoutScreen: {
    workoutTitleLabel: "訓練記錄標題",
    workoutTitlePlaceholder: "新的訓練記錄",
    resumeWorkoutButtonLabel: "繼續",
    discardWorkoutAlertTitle: "捨棄訓練記錄",
    discardWorkoutAlertMessage: "你確定要捨棄此訓練記錄嗎？",
    workoutSavedLocallyMessage: "網路連線不可用，訓練記錄已儲存於本機上，當連線可用時將同步",
  },
  workoutSettings: {
    setWorkoutVisibilityLabel: "設定訓練記錄分享對象",
    workoutHiddenLabel: "僅對你可見",
    workoutVisibleToFeedLabel: "可見於朋友動態",
    workoutSummaryLabel: "訓練記錄摘要",
  },
  workoutSummaryCard: {
    invalidUserMessage: "糟糕！這位用戶已不存在",
  },
  workoutSummaryScreen: {
    headerTitle: "訓練記錄摘要",
    commentInputPlaceholder: "留下評論...",
    noCommentsMessage: "為這項活動留下第一筆評論！",
    workoutUnavailableMessage: "此訓練記錄不存在，它可能已被使用者刪除。",
    workoutSavedLocallyMessage: "此訓練記錄未與伺服器同步",
    workoutIsHiddenMessage: "此訓練記錄為隱藏狀態，僅對你可見",
    workoutEditedMessage: "此訓練記錄已編輯過，因此個人紀錄可能不準確或缺失。",
    newRecordsMessageForYou: "恭喜你！你達成了 {{newRecordsCount}} 個新的個人紀錄！",
    newRecordsMessageForOthers:
      "恭喜 {{displayName}}！他達成了 {{newRecordsCount}} 個新的個人紀錄！",
  },
  exerciseSummary: {
    userExerciseHistoryHiddenMessage: "此使用者已隱藏他們的動作歷史紀錄",
  },
  workoutSummaryMenu: {
    editWorkoutButtonLabel: "編輯訓練記錄",
    deleteWorkoutAlertTitle: "刪除訓練記錄",
    deleteWorkoutAlertMessage: "你確定要刪除此訓練記錄嗎?",
    deleteWorkoutSuccessMessage: "訓練記錄已刪除",
    deleteWorkoutFailedMessage: "刪除訓練記錄失敗",
  },
  workoutCommentsPanel: {
    commentIsHiddenMessage: "評論已隱藏",
    showHiddenCommentTitle: "顯示可能冒犯的評論？",
    showHiddenCommentMessage: "此則評論已被使用者標記為可能冒犯。你確定要查看它嗎？",
    deleteCommentConfirmationMessage: "刪除評論？",
    reportCommentTitle: "請告訴我們舉發此則評論的原因",
    reportCommentMessage:
      "你的匿名舉發將會經由我們的團隊審查，以確認此則評論是否違反我們的社群規範",
    reportCommentReasonSpam: "垃圾訊息",
    reportCommentReasonHarassment: "騷擾",
    reportCommentReasonMisinformation: "誤導訊息",
    reportCommentReasonIllegal: "非法訊息",
    reportCommentReasonOther: "其他",
    reportCommentReasonOtherPlaceholder: "請與我們分享你的顧慮",
    blockUserPromptTitle: "你想要封鎖這位使用者嗎？",
    blockUserPromptMessage: "你們將不會再看到彼此的任何動態",
    reportConfirmButtonLabel: "舉發此則評論",
    reportSentSuccessMessage:
      "感謝你的舉發，協助我們共同維護並改進 Gymrapp ，我們將會進行調查並採取適應的處置。",
  },
  restTimerScreen: {
    headerTitle: "休息計時器",
    startTimer: "開始",
    resetTimer: "重設",
    minutes: "分",
    seconds: "秒",
    subtract15Seconds: "-15 秒",
    add15Seconds: "+15 秒",
    timesUpMessage: "時間到！",
  },
  exerciseManagerScreen: {
    exerciseManagerTitle: "動作",
  },
  exercisePickerScreen: {
    headerTitle: "選擇動作",
  },
  exerciseDetailsScreen: {
    headerTitle: "動作詳情",
    personalRecordsLabel: "個人紀錄",
    workoutHistoryLabel: "訓練記錄歷史",
    recordsHeaderDateLabel: "紀錄日期",
    recordsHeaderWeightLabel: "重量",
    recordsHeaderRepsLabel: "次數",
    recordsHeaderTimeLabel: "時間",
    noExerciseHistoryFound: "找不到動作歷史記錄。",
  },
  createExerciseScreen: {
    createExerciseTitle: "建立新的動作",
    disclaimer: "你建立的動作僅在你的訓練記錄中可用，不會與其他使用者分享。",
    activityType: "動作類型",
    exerciseCat1: "分類",
    exerciseCat2: "子分類 (可選)",
    volumeType: "次數類型",
    setAsBlankLabel: "設為空白",
    requiredFieldsMissingMessage: "請填寫所有必填欄位",
    exerciseName: "動作名稱",
    createExerciseButton: "建立動作",
    createExerciseSuccessfullMessage: "成功建立新的動作",
  },
  exerciseEntrySettings: {
    restTimerEnabledLabel: "啟用",
    restTimeLabel: "休息時間",
    createSupersetLabel: "建立複合組",
    removeExerciseLabel: "移除動作",
    weightUnitLabel: "重量單位",
  },
  createNewGymScreen: {
    createNewGymTitle: "建立新的健身房",
    howToCreateANewGymMessage: "從搜尋結果中選擇健身房，確認名稱和地址正確，然後建立你的健身房",
    gymNameLabel: "健身房名稱",
    gymNamePlaceholder: "從搜尋結果中選擇健身房時自動填入",
    gymLocationLabel: "健身房地址",
    gymLocationPlaceholder: "從搜尋結果中選擇健身房時自動填入",
    searchLabel: "搜尋健身房",
    searchPlaceholder: "輸入健身房名稱",
    createNewGymButtonLabel: "建立健身房",
    searchingForGymsLabel: "正在搜尋健身房...",
    noGymsFoundLabel: "找不到你周圍的任何健身房",
    gymAlreadyCreatedMessage: "這間健身房已經被建立了，點擊前往查看！",
  },
  userLocation: {
    gettingUserLocationLabel: "正在取得目前位置...",
    locationPermissionRequiredTitle: "需要開啟定位服務",
    locationPermissionRequiredMessage:
      "你的位置資訊用於驗證你是否靠近訓練場所。如果你想要使用此功能，請在你的手機設定中啟用定位服務。",
    goToAppSettingsButtonLabel: "應用程式設定",
    unableToAcquireLocationMessage: "無法取得目前位置",
  },
  gymPickerScreen: {
    selectFromMyGymsLabel: "我最愛的健身房",
    emptyMyGymsLabel: "你沒有任何最愛的健身房",
    searchForGymLabel: "搜尋健身房",
    gettingUserLocationLabel: "正在取得目前位置...",
    locationTooFarMessage:
      "你的位置似乎離此健身房太遠，這是正確的健身房嗎？你必須在距離健身房 500 公尺以內才能簽到。",
  },
  gymSearch: {
    searchBarPlaceholder: "搜尋健身房",
    createNewGymButtonLabel: "建立新的健身房",
    searchPromptMessage: "查看你最愛的健身房！",
  },
  gymDetailsScreen: {
    headerTitle: "健身房詳情",
    addToMyGymsLabel: "加入我的健身房",
    removeFromMyGymsLabel: "從我的健身房移除",
    alreadyAddedToMyGymsLabel: "已加入我的健身房",
    alreadyRemovedFromMyGymsLabel: "已從我的健身房移除",
    latestWorkoutsLabel: "最新訓練記錄",
    gymMembersLabel: "成員",
    noMoreWorkoutsMessage: "目前只有這些！",
    noMoreMembersMessage: "這是此健身房的所有成員！",
    noActivityMessage: "成為第一個在此訓練的人吧！",
    onlyPublicOrFollowingActivitiesMessage: "你只能看見公開或是來自你所追蹤的使用者的訓練記錄。",
  },
  userSearch: {
    searchBarPlaceholder: "搜尋使用者",
    inviteFriendsButtonLabel: "邀請朋友加入 Gymrapp",
    searchPromptMessage: "立即在 Gymrapp 上找到你的朋友！",
  },
  discoverScreen: {
    discoverTitle: "探索",
    allCategoriesLabel: "全部",
    usersCategoryLabel: "使用者",
    gymsCategoryLabel: "健身房",
  },
  profileVisitorViewScreen: {
    dateJoinedLabel: "加入日期",
    followButtonLabel: "追蹤",
    followBackButtonLabeL: "已追蹤",
    unfollowButtonLabel: "取消追蹤",
    followRequestSentMessage: "已送出追蹤邀請",
    followRequestAcceptedMessage: "你已拒绝此使用者的追蹤邀請",
    followRequestRejectedMessage: "你已拒绝此使用者的追蹤邀請",
    noActivityHistoryMessage: "沒有活動紀錄",
    userIsPrivateMessage: "此使用者為私人帳戶",
    endOfUserActivityMessage: "這已經是此使用者的所有紀錄了！",
    blockUserButtonLabel: "封鎖使用者",
    blockUserAlertTitle: "封鎖 {{userHandle}} ?",
    blockUserAlertMessage: "{{userHandle}} 將不能再看到你的帳戶以及活動資訊",
    unblockUserButtonLabel: "解除封鎖使用者",
    unblockUserAlertTitle: "解除封鎖 {{userHandle}} ?",
    unblockUserAlertMessage: "{{userHandle}} 將可再看到你的帳戶以及活動資訊",
    invalidUserMessage: "糟糕！這位用戶已不存在",
  },
  notificationsScreen: {
    notificationsTitle: "通知",
    noNotificationsMessage: "沒有通知",
    newNotificationsTitle: "新通知",
    olderNotificationsTitle: "較舊",
    followRequestsTitle: "追蹤請求",
    commentNotificationMessage: "{{senderDisplayName}} 對你的訓練記錄發表了評論",
    likeNotificationMessage: "{{senderDisplayName}} 對你的訓練記錄按了讚",
    followRequestNotificationMessage: "{{senderDisplayName}} 要求追蹤你",
    followAcceptedNotificationMessage: "{{senderDisplayName}} 接受了你的追蹤邀請",
    markAllAsReadButtonLabel: "標記全部為已讀",
  },
}

export default zh
