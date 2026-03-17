export type Language = 'en' | 'my';

export const translations = {
  en: {
    // Header
    appName: 'FOOTSTREAM',
    allMatches: 'All Matches',
    live: 'Live',
    upcoming: 'Upcoming',
    searchTeams: 'Search teams...',
    
    // Match Status
    statusLive: 'LIVE',
    statusUpcoming: 'UPCOMING',
    statusFinished: 'FINISHED',
    
    // Match Detail
    backToMatches: 'Back to matches',
    home: 'Home',
    away: 'Away',
    matchNotFound: 'Match not found',
    matchNotFoundDesc: "The match you're looking for doesn't exist",
    
    // Streaming
    selectStream: 'Select a Stream',
    selectStreamDesc: 'Choose a stream from the list below to start watching',
    availableStreams: 'Available Streams',
    noStreams: 'No streams available',
    noStreamsDesc: 'Check back later for live streams',
    source: 'source',
    sources: 'sources',
    openInNewTab: 'Open in New Tab',
    playEmbedded: 'Play in Embedded Player',
    openExternal: 'Open External',
    currentlyStreaming: 'Currently streaming',
    active: 'Active',
    externalLink: 'External link',
    tryEmbeddedAgain: 'Try Embedded Player Again',
    embeddedUnavailable: 'Embedded player unavailable',
    watchOn: 'Watch on',
    clickToOpen: 'Click to open stream in new tab',
    
    // HLS Player
    loading: 'Loading...',
    retry: 'Retry',
    networkError: 'Network error. Trying to recover...',
    mediaError: 'Media error. Trying to recover...',
    streamUnavailable: 'Stream unavailable',
    streamsUnavailableTitle: 'Streams Unavailable',
    streamsUnavailableDesc: 'Streams will be available when the match goes live',
    failedToLoad: 'Failed to load video',
    hlsNotSupported: 'HLS is not supported in this browser',
    auto: 'Auto',
    quality: 'Quality',
    
    // Quality badges
    qualityHD: 'HD',
    qualitySD: 'SD',
    qualityLOW: 'LOW',
    
    // Stream types
    streamTypeHLS: 'HLS',
    streamTypeEmbed: 'Embed',
    streamTypeExternal: 'External',
    
    // Footer
    footerRights: '© 2024 FootStream. All rights reserved.',
    footerDesc: 'Live football streaming platform',
    developer: 'Developer',
    
    // Errors
    failedToLoadMatches: 'Failed to load matches',
    tryAgainLater: 'Please try again later',
    noMatchesFound: 'No matches found',
    adjustFilters: 'Try adjusting your filters',
    
    // Common
    watchNow: 'Watch Now',
    streams: 'streams',
    stream: 'stream',

    // Prediction Panel
    aiPrediction: 'AI Prediction',
    aiPredictionBeta: 'Beta',
    poweredByAI: 'Powered by AI analysis',
    aiPredictionUnavailable: 'AI Prediction Unavailable',
    couldNotAnalyze: 'Could not analyze this match',
    tryAgain: 'Try Again',
    predictedWinner: 'Predicted Winner',
    predictedScore: 'Score',
    confidenceLevel: 'Confidence Level',
    analysis: 'Analysis',
    bettingTips: 'Betting Tips',
    predictionDisclaimer: '⚠️ AI predictions are for entertainment only. Not financial advice.',

    // Admin Panel
    adminPanel: 'Admin Panel',
    adminPanelDesc: 'Manage app settings and branding',
    appNameSetting: 'App Name',
    appNameDesc: 'The name displayed in the header and browser title',
    enterAppName: 'Enter app name...',
    save: 'Save',
    appLogo: 'App Logo',
    appLogoDesc: 'Logo displayed in the header (recommended: 40x40px)',
    streamDialogLogo: 'Stream Dialog Logo',
    streamDialogLogoDesc: 'Logo displayed in the stream player placeholder',
    uploadLogo: 'Upload Logo',
    logoRequirements: 'PNG, JPG, or SVG. Max 5MB.',
    currentSettings: 'Current Settings',
    currentSettingsDesc: 'Preview of your current app configuration',
    uploaded: 'Uploaded',
    notSet: 'Not set',
    success: 'Success',
    error: 'Error',
    logoUpdated: 'Logo updated successfully',
    streamLogoUpdated: 'Stream dialog logo updated successfully',
    uploadFailed: 'Failed to upload logo. Please try again.',
    logoRemoved: 'Logo removed successfully',
    appNameUpdated: 'App name updated successfully',
    fileTooLarge: 'File is too large. Maximum size is 5MB.',
    
    // Favicon & Theme
    favicon: 'Favicon',
    faviconDesc: 'Browser tab icon (recommended: 32x32px ICO, PNG)',
    faviconUpdated: 'Favicon updated successfully',
    themeColor: 'Theme Color',
    themeColorDesc: 'Primary color used throughout the app',
    themeColorUpdated: 'Theme color updated successfully',
    selectColor: 'Select Color',
    
    // Overlay Ads
    overlayAds: 'Overlay Ads',
    overlayAdsDesc: 'Manage overlay advertisements shown during streams',
    createNewAd: 'Create New Ad',
    adName: 'Ad Name',
    adLinkUrl: 'Link URL (optional)',
    adPosition: 'Position',
    displayDuration: 'Close Button Delay (seconds)',
    durationHint: 'Time before the close button becomes active',
    adImage: 'Ad Image',
    uploadImage: 'Upload Image',
    adImageRequirements: 'PNG, JPG, GIF, or WebP. Max 2MB. Recommended: 280x180px',
    createAd: 'Create Ad',
    existingAds: 'Existing Ads',
    noAdsYet: 'No overlay ads created yet',
  },
  my: {
    // Header
    appName: 'FOOTSTREAM',
    allMatches: 'ပွဲစဉ်များ',
    live: 'တိုက်ရိုက်',
    upcoming: 'လာမည့်ပွဲ',
    searchTeams: 'အသင်းများရှာရန်...',
    
    // Match Status
    statusLive: 'တိုက်ရိုက်',
    statusUpcoming: 'လာမည့်ပွဲ',
    statusFinished: 'ပြီးဆုံး',
    
    // Match Detail
    backToMatches: 'ပွဲစဉ်များသို့',
    home: 'အိမ်ကွင်း',
    away: 'အဝေး',
    matchNotFound: 'ပွဲစဉ်မတွေ့ပါ',
    matchNotFoundDesc: 'သင်ရှာနေသောပွဲစဉ်မရှိပါ',
    
    // Streaming
    selectStream: 'လိုင်းရွေးချယ်ပါ',
    selectStreamDesc: 'ကြည့်ရှုရန် အောက်ပါလိုင်းတစ်ခုကို ရွေးချယ်ပါ',
    availableStreams: 'ရရှိနိုင်သောလိုင်းများ',
    noStreams: 'လိုင်းမရှိသေးပါ',
    noStreamsDesc: 'တိုက်ရိုက်လိုင်းများအတွက် နောက်မှပြန်စစ်ဆေးပါ',
    source: 'လိုင်း',
    sources: 'လိုင်းများ',
    openInNewTab: 'Tab အသစ်တွင်ဖွင့်ရန်',
    playEmbedded: 'ထည့်သွင်းထားသော Player ဖြင့်ဖွင့်ရန်',
    openExternal: 'ပြင်ပတွင်ဖွင့်ရန်',
    currentlyStreaming: 'လက်ရှိထုတ်လွှင့်နေသည်',
    active: 'လှုပ်ရှားနေသည်',
    externalLink: 'ပြင်ပလင့်',
    tryEmbeddedAgain: 'ထည့်သွင်းထားသော Player ကိုထပ်စမ်းပါ',
    embeddedUnavailable: 'ထည့်သွင်းထားသော player မရရှိနိုင်ပါ',
    watchOn: 'ကြည့်ရှုရန်',
    clickToOpen: 'Tab အသစ်တွင်ဖွင့်ရန် နှိပ်ပါ',
    
    // HLS Player
    loading: 'ဖွင့်နေသည်...',
    retry: 'ထပ်စမ်းပါ',
    networkError: 'ကွန်ရက်အမှား။ ပြန်လည်ရယူနေသည်...',
    mediaError: 'မီဒီယာအမှား။ ပြန်လည်ရယူနေသည်...',
    streamUnavailable: 'လိုင်းမရရှိနိုင်ပါ',
    streamsUnavailableTitle: 'လိုင်းများ မရရှိနိုင်သေးပါ',
    streamsUnavailableDesc: 'ပွဲစတင်သောအခါ လိုင်းများ ရရှိနိုင်ပါမည်',
    failedToLoad: 'ဗီဒီယိုဖွင့်ရန်မအောင်မြင်ပါ',
    hlsNotSupported: 'ဤ browser တွင် HLS ကိုမပံ့ပိုးပါ',
    auto: 'အော်တို',
    quality: 'အရည်အသွေး',
    
    // Quality badges
    qualityHD: 'HD',
    qualitySD: 'SD',
    qualityLOW: 'နိမ့်',
    
    // Stream types
    streamTypeHLS: 'HLS',
    streamTypeEmbed: 'ထည့်သွင်း',
    streamTypeExternal: 'ပြင်ပ',
    
    // Footer
    footerRights: '© ၂၀၂၄ FootStream။ မူပိုင်ခွင့်များ ထိန်းသိမ်းထားသည်။',
    footerDesc: 'တိုက်ရိုက်ဘောလုံးကြည့်ရှုရေး',
    developer: 'Developer',
    
    // Errors
    failedToLoadMatches: 'ပွဲစဉ်များဖွင့်ရန်မအောင်မြင်ပါ',
    tryAgainLater: 'နောက်မှထပ်စမ်းပါ',
    noMatchesFound: 'ပွဲစဉ်မတွေ့ပါ',
    adjustFilters: 'စစ်ထုတ်မှုများကိုချိန်ညှိပါ',
    
    // Common
    watchNow: 'ယခုကြည့်ရန်',
    streams: 'လိုင်းများ',
    stream: 'လိုင်း',

    // Prediction Panel
    aiPrediction: 'AI ခန့်မှန်းချက်',
    aiPredictionBeta: 'Beta',
    poweredByAI: 'AI ခွဲခြမ်းစိတ်ဖြာမှုဖြင့် ပံ့ပိုးထားသည်',
    aiPredictionUnavailable: 'AI ခန့်မှန်းချက် မရရှိနိုင်ပါ',
    couldNotAnalyze: 'ဤပွဲစဉ်ကို ခွဲခြမ်းစိတ်ဖြာ၍မရပါ',
    tryAgain: 'ထပ်စမ်းပါ',
    predictedWinner: 'ခန့်မှန်းအနိုင်ရအသင်း',
    predictedScore: 'ရမှတ်',
    confidenceLevel: 'ယုံကြည်မှုအဆင့်',
    analysis: 'ခွဲခြမ်းစိတ်ဖြာချက်',
    bettingTips: 'လောင်းကစားအကြံပြုချက်များ',
    predictionDisclaimer: '⚠️ AI ခန့်မှန်းချက်များသည် ဖျော်ဖြေရေးအတွက်သာဖြစ်ပါသည်။ ငွေကြေးအကြံပေးချက် မဟုတ်ပါ။',

    // Admin Panel
    adminPanel: 'စီမံခန့်ခွဲမှု',
    adminPanelDesc: 'အက်ပ် ဆက်တင်များနှင့် ဘရန်ဒင်ကို စီမံပါ',
    appNameSetting: 'အက်ပ်အမည်',
    appNameDesc: 'ခေါင်းစီးနှင့် browser title တွင် ပြသမည့်အမည်',
    enterAppName: 'အက်ပ်အမည် ထည့်ပါ...',
    save: 'သိမ်းမည်',
    appLogo: 'အက်ပ် Logo',
    appLogoDesc: 'ခေါင်းစီးတွင် ပြသမည့် Logo (အကြံပြု: 40x40px)',
    streamDialogLogo: 'Stream Dialog Logo',
    streamDialogLogoDesc: 'Stream player placeholder တွင် ပြသမည့် Logo',
    uploadLogo: 'Logo တင်ရန်',
    logoRequirements: 'PNG, JPG, သို့မဟုတ် SVG။ အများဆုံး 5MB။',
    currentSettings: 'လက်ရှိ ဆက်တင်များ',
    currentSettingsDesc: 'သင့်လက်ရှိ အက်ပ် ဖွဲ့စည်းပုံကို ကြည့်ရှုပါ',
    uploaded: 'တင်ပြီး',
    notSet: 'မသတ်မှတ်ရသေး',
    success: 'အောင်မြင်',
    error: 'အမှား',
    logoUpdated: 'Logo အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
    streamLogoUpdated: 'Stream dialog logo အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
    uploadFailed: 'Logo တင်ရန် မအောင်မြင်ပါ။ ထပ်စမ်းပါ။',
    logoRemoved: 'Logo အောင်မြင်စွာ ဖယ်ရှားပြီးပါပြီ',
    appNameUpdated: 'အက်ပ်အမည် အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
    fileTooLarge: 'ဖိုင်အရွယ်အစား ကြီးလွန်းသည်။ အများဆုံး 5MB။',
    
    // Favicon & Theme
    favicon: 'Favicon',
    faviconDesc: 'Browser tab icon (အကြံပြု: 32x32px ICO, PNG)',
    faviconUpdated: 'Favicon အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
    themeColor: 'အရောင်',
    themeColorDesc: 'အက်ပ်တစ်ခုလုံးတွင် သုံးသည့် အဓိကအရောင်',
    themeColorUpdated: 'အရောင် အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
    selectColor: 'အရောင်ရွေးပါ',
    
    // Overlay Ads
    overlayAds: 'Overlay ကြော်ငြာများ',
    overlayAdsDesc: 'လိုင်းများတွင် ပြသမည့် overlay ကြော်ငြာများကို စီမံပါ',
    createNewAd: 'ကြော်ငြာအသစ် ဖန်တီးရန်',
    adName: 'ကြော်ငြာအမည်',
    adLinkUrl: 'လင့် URL (ရွေးချယ်နိုင်)',
    adPosition: 'တည်နေရာ',
    displayDuration: 'ပိတ်ခလုတ် နှောင့်နှေးချိန် (စက္ကန့်)',
    durationHint: 'ပိတ်ခလုတ် အသက်ဝင်မည့် အချိန်',
    adImage: 'ကြော်ငြာပုံ',
    uploadImage: 'ပုံတင်ရန်',
    adImageRequirements: 'PNG, JPG, GIF, သို့မဟုတ် WebP။ အများဆုံး 2MB။ အကြံပြု: 280x180px',
    createAd: 'ကြော်ငြာဖန်တီးရန်',
    existingAds: 'ရှိပြီးသား ကြော်ငြာများ',
    noAdsYet: 'Overlay ကြော်ငြာ မရှိသေးပါ',
  },
};

export type TranslationKey = keyof typeof translations.en;
