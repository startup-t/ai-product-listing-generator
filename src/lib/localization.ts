import packageJson from "../../package.json";

export type CountryCode = "PH" | "US" | "CA" | "CN" | "FR" | "PL";
export type CurrencyCode = "PHP" | "USD" | "CAD" | "CNY" | "EUR" | "PLN";
export type LanguageCode = "en" | "fil" | "zh-CN" | "fr" | "pl";

export type TranslationKey =
  | "headerTitle"
  | "headerSub"
  | "uploadTitle"
  | "uploadSub"
  | "generate"
  | "generating"
  | "startOver"
  | "listingSuccess"
  | "listingGenerated"
  | "countryLabel"
  | "languageLabel"
  | "currencyLabel"
  | "examplePrompt"
  | "feedbackButton"
  | "feedbackTitle"
  | "feedbackDescription"
  | "feedbackCategory"
  | "feedbackMessage"
  | "feedbackEmail"
  | "feedbackSubmit"
  | "feedbackSubmitting"
  | "feedbackCancel"
  | "feedbackSuccess"
  | "feedbackError"
  | "feedbackCategoryBug"
  | "feedbackCategoryFeature"
  | "feedbackCategoryListingOutput"
  | "feedbackCategoryPrice"
  | "feedbackCategoryOther"
  | "feedbackMessagePlaceholder"
  | "feedbackEmailPlaceholder"
  | "priceEstimate"
  | "readyToPost"
  | "copyListing"
  | "copied"
  | "keyFeatures"
  | "shortDescription"
  | "fullDescription"
  | "specifications"
  | "tags"
  | "platformTips"
  | "confidenceNotes"
  | "overallConfidence"
  | "conditionUncertain"
  | "priceRange"
  | "validationCategory"
  | "validationMessage"
  | "validationEmail"
  | "regionalContext"
  | "downloadCleanedImage"
  | "networkErrorTitle"
  | "apiErrorTitle"
  | "parseErrorTitle"
  | "validationErrorTitle"
  | "noticeTitle"
  | "preparingListing"
  | "creatingListing"
  | "usualTimeHint"
  | "processingSummary"
  | "removingBackground"
  | "cleaningProductImage"
  | "analysingProduct"
  | "visionStepSub"
  | "estimatingPrice"
  | "priceStepSub"
  | "writingListing"
  | "listingStepSub"
  | "couldNotReadImage"
  | "tryDifferentImage"
  | "backgroundFallbackNotice"
  | "backgroundFallbackHint"
  | "serverReturnedNoListing"
  | "tryAgain"
  | "couldNotReachServer"
  | "devServerHint"
  | "unexpectedError"
  | "consoleHint"
  | "close";

type Translations = Record<LanguageCode, Record<TranslationKey, string>>;

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version;

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: "English",
  fil: "Filipino / Tagalog",
  "zh-CN": "Chinese (Simplified)",
  fr: "French",
  pl: "Polish",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  PHP: "₱ PHP",
  USD: "$ USD",
  CAD: "$ CAD",
  CNY: "¥ CNY",
  EUR: "€ EUR",
  PLN: "zł PLN",
};

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  PH: "Philippines",
  US: "United States",
  CA: "Canada",
  CN: "China",
  FR: "France",
  PL: "Poland",
};

export const COUNTRY_FLAGS: Record<CountryCode, string> = {
  US: "🇺🇸",
  CN: "🇨🇳",
  FR: "🇫🇷",
  PL: "🇵🇱",
  CA: "🇨🇦",
  PH: "🇵🇭",
};

export const LANGUAGE_LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  fil: "fil-PH",
  "zh-CN": "zh-CN",
  fr: "fr-FR",
  pl: "pl-PL",
};

export const COUNTRY_CONFIG: Record<
  CountryCode,
  {
    defaultCurrency: CurrencyCode;
    defaultLanguage: LanguageCode;
    locale: string;
    languages: LanguageCode[];
  }
> = {
  PH: {
    defaultCurrency: "PHP",
    defaultLanguage: "en",
    locale: "en-PH",
    languages: ["en", "fil"],
  },
  US: {
    defaultCurrency: "USD",
    defaultLanguage: "en",
    locale: "en-US",
    languages: ["en"],
  },
  CA: {
    defaultCurrency: "CAD",
    defaultLanguage: "en",
    locale: "en-CA",
    languages: ["en", "fr"],
  },
  CN: {
    defaultCurrency: "CNY",
    defaultLanguage: "zh-CN",
    locale: "zh-CN",
    languages: ["zh-CN", "en"],
  },
  FR: {
    defaultCurrency: "EUR",
    defaultLanguage: "fr",
    locale: "fr-FR",
    languages: ["fr", "en"],
  },
  PL: {
    defaultCurrency: "PLN",
    defaultLanguage: "pl",
    locale: "pl-PL",
    languages: ["pl", "en"],
  },
};

export function isSupportedCountry(value: unknown): value is CountryCode {
  return typeof value === "string" && value in COUNTRY_CONFIG;
}

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCY_LABELS;
}

export function isSupportedLanguage(value: unknown): value is LanguageCode {
  return typeof value === "string" && value in LANGUAGE_LABELS;
}

export function getAllowedLanguages(country: CountryCode): LanguageCode[] {
  return COUNTRY_CONFIG[country].languages;
}

export function getDefaultLanguage(country: CountryCode): LanguageCode {
  return COUNTRY_CONFIG[country].defaultLanguage;
}

export function getDefaultCurrency(country: CountryCode): CurrencyCode {
  return COUNTRY_CONFIG[country].defaultCurrency;
}

export function getLocaleForLanguage(language: LanguageCode, country: CountryCode): string {
  return LANGUAGE_LOCALES[language] ?? COUNTRY_CONFIG[country].locale;
}

export function formatCurrencyValue(
  value: number,
  currency: CurrencyCode,
  language: LanguageCode,
  country: CountryCode
): string {
  return new Intl.NumberFormat(getLocaleForLanguage(language, country), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyRange(
  range: string,
  currency: CurrencyCode,
  language: LanguageCode,
  country: CountryCode
): string {
  return range
    .split("-")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))
    .map((value) => formatCurrencyValue(value, currency, language, country))
    .join(" – ");
}

const TRANSLATIONS: Translations = {
  en: {
    headerTitle: "AI Product Listing Generator",
    headerSub: "Photo → Instant Listing. Upload a product photo and generate a ready-to-post marketplace listing in seconds.",
    uploadTitle: "Drop a product photo here",
    uploadSub: "or click to browse — JPG, PNG, WEBP",
    generate: "Generate listing",
    generating: "Generating listing...",
    startOver: "Start over",
    listingSuccess: "Listing generated successfully",
    listingGenerated: "Listing ready",
    countryLabel: "Country",
    languageLabel: "Language",
    currencyLabel: "Currency",
    examplePrompt: "Example style: concise marketplace copy with realistic pricing and practical selling tips.",
    feedbackButton: "💬 Feedback",
    feedbackTitle: "Help us improve",
    feedbackDescription: "Share a quick issue report or suggestion without interrupting your workflow.",
    feedbackCategory: "Category",
    feedbackMessage: "Your feedback",
    feedbackEmail: "Email (optional)",
    feedbackSubmit: "Send feedback",
    feedbackSubmitting: "Sending...",
    feedbackCancel: "Cancel",
    feedbackSuccess: "Thanks for the feedback. This helps improve the product.",
    feedbackError: "We couldn't send your feedback right now. Please try again.",
    feedbackCategoryBug: "Bug report",
    feedbackCategoryFeature: "Feature request",
    feedbackCategoryListingOutput: "Confusing listing output",
    feedbackCategoryPrice: "Wrong price estimate",
    feedbackCategoryOther: "Other",
    feedbackMessagePlaceholder: "What happened, what you expected, or what would make this better?",
    feedbackEmailPlaceholder: "name@example.com",
    priceEstimate: "AI price estimate · based on comparable listings",
    readyToPost: "Ready-to-post listing",
    copyListing: "Copy listing",
    copied: "Copied!",
    keyFeatures: "Key features",
    shortDescription: "Short description",
    fullDescription: "Full description",
    specifications: "Specifications",
    tags: "Tags",
    platformTips: "Platform tips",
    confidenceNotes: "Confidence notes",
    overallConfidence: "overall confidence",
    conditionUncertain: "uncertain",
    priceRange: "range",
    validationCategory: "Choose a feedback category.",
    validationMessage: "Add a short message before submitting.",
    validationEmail: "Enter a valid email address or leave it blank.",
    regionalContext: "Regional context",
    downloadCleanedImage: "Download cleaned image",
    networkErrorTitle: "Network error",
    apiErrorTitle: "API error",
    parseErrorTitle: "Parse error",
    validationErrorTitle: "Validation error",
    noticeTitle: "Notice",
    preparingListing: "Preparing listing...",
    creatingListing: "Creating your listing",
    usualTimeHint: "Usually takes 5-10 seconds",
    processingSummary: "We’re processing your image and drafting the listing.",
    removingBackground: "Removing background",
    cleaningProductImage: "Cleaning product image",
    analysingProduct: "Analysing product",
    visionStepSub: "Category, condition, material, colour, attributes",
    estimatingPrice: "Estimating price",
    priceStepSub: "Category, quality signals and market patterns",
    writingListing: "Writing listing",
    listingStepSub: "Title, descriptions, bullets, tags, platform tips",
    couldNotReadImage: "Image data could not be read.",
    tryDifferentImage: "Try a different image file.",
    backgroundFallbackNotice: "Could not remove the image background, so the original upload will be used.",
    backgroundFallbackHint: "Listing generation will continue with the original uploaded image.",
    serverReturnedNoListing: "Server returned no listing data.",
    tryAgain: "Try again.",
    couldNotReachServer: "Could not reach the server.",
    devServerHint: "Make sure the dev server is running on localhost:3000 and your internet connection is active.",
    unexpectedError: "An unexpected error occurred.",
    consoleHint: "Check the browser console for details.",
    close: "Close",
  },
  fil: {
    headerTitle: "AI Product Listing Generator",
    headerSub: "Larawan → Instant Listing. Mag-upload ng product photo at gumawa ng ready-to-post marketplace listing sa ilang segundo.",
    uploadTitle: "I-drop dito ang product photo",
    uploadSub: "o i-click para pumili — JPG, PNG, WEBP",
    generate: "Gumawa ng listing",
    generating: "Gumagawa ng listing...",
    startOver: "Magsimula ulit",
    listingSuccess: "Matagumpay na nagawa ang listing",
    listingGenerated: "Handa na ang listing",
    countryLabel: "Bansa",
    languageLabel: "Wika",
    currencyLabel: "Currency",
    examplePrompt: "Halimbawa: maikling marketplace copy na may makatotohanang presyo at praktikal na selling tips.",
    feedbackButton: "💬 Feedback",
    feedbackTitle: "Tulungan kaming gumanda",
    feedbackDescription: "Magbahagi ng mabilis na issue report o suhestyon nang hindi naaantala ang workflow mo.",
    feedbackCategory: "Kategorya",
    feedbackMessage: "Iyong feedback",
    feedbackEmail: "Email (opsyonal)",
    feedbackSubmit: "Ipadala",
    feedbackSubmitting: "Ipinapadala...",
    feedbackCancel: "Isara",
    feedbackSuccess: "Salamat sa feedback. Malaking tulong ito para mapabuti ang produkto.",
    feedbackError: "Hindi namin maipadala ang feedback ngayon. Pakisubukang muli.",
    feedbackCategoryBug: "I-report ang bug",
    feedbackCategoryFeature: "Kahilingan sa feature",
    feedbackCategoryListingOutput: "Nakakalitong listing output",
    feedbackCategoryPrice: "Maling price estimate",
    feedbackCategoryOther: "Iba pa",
    feedbackMessagePlaceholder: "Ano ang nangyari, ano ang inaasahan mo, o ano ang puwedeng pagandahin?",
    feedbackEmailPlaceholder: "pangalan@example.com",
    priceEstimate: "Tantyang presyo ng AI · batay sa kahalintulad na listings",
    readyToPost: "Ready-to-post listing",
    copyListing: "Kopyahin ang listing",
    copied: "Nakopya!",
    keyFeatures: "Mahahalagang detalye",
    shortDescription: "Maikling paglalarawan",
    fullDescription: "Buong paglalarawan",
    specifications: "Specifications",
    tags: "Tags",
    platformTips: "Mga tip sa platform",
    confidenceNotes: "Mga paalala sa confidence",
    overallConfidence: "kabuuang confidence",
    conditionUncertain: "hindi tiyak",
    priceRange: "saklaw",
    validationCategory: "Pumili ng kategorya ng feedback.",
    validationMessage: "Maglagay ng maikling mensahe bago magsumite.",
    validationEmail: "Maglagay ng wastong email o iwanang blangko.",
    regionalContext: "Rehiyonal na setting",
    downloadCleanedImage: "I-download ang nilinis na larawan",
    networkErrorTitle: "Error sa network",
    apiErrorTitle: "Error sa API",
    parseErrorTitle: "Error sa parse",
    validationErrorTitle: "Error sa validation",
    noticeTitle: "Paunawa",
    preparingListing: "Inihahanda ang listing...",
    creatingListing: "Ginagawa ang listing mo",
    usualTimeHint: "Karaniwang tumatagal ng 5-10 segundo",
    processingSummary: "Pinoproseso namin ang larawan mo at ginagawa ang listing.",
    removingBackground: "Inaalis ang background",
    cleaningProductImage: "Nililinis ang larawan ng produkto",
    analysingProduct: "Sinusuri ang produkto",
    visionStepSub: "Kategorya, kondisyon, materyal, kulay, mga detalye",
    estimatingPrice: "Tinatantiya ang presyo",
    priceStepSub: "Kategorya, quality signals, at market patterns",
    writingListing: "Isinusulat ang listing",
    listingStepSub: "Pamagat, paglalarawan, bullets, tags, at platform tips",
    couldNotReadImage: "Hindi mabasa ang image data.",
    tryDifferentImage: "Subukan ang ibang image file.",
    backgroundFallbackNotice: "Hindi natanggal ang background ng larawan kaya ang orihinal na upload ang gagamitin.",
    backgroundFallbackHint: "Magpapatuloy ang listing generation gamit ang orihinal na larawan.",
    serverReturnedNoListing: "Walang listing data na ibinalik ang server.",
    tryAgain: "Subukan muli.",
    couldNotReachServer: "Hindi maabot ang server.",
    devServerHint: "Tiyaking tumatakbo ang dev server sa localhost:3000 at may internet connection ka.",
    unexpectedError: "May nangyaring hindi inaasahang error.",
    consoleHint: "Tingnan ang browser console para sa detalye.",
    close: "Isara",
  },
  "zh-CN": {
    headerTitle: "AI 商品文案生成器",
    headerSub: "照片 → 即时商品文案。上传产品图片，几秒内生成可直接发布的商品 listing。",
    uploadTitle: "将商品图片拖到这里",
    uploadSub: "或点击上传 — JPG、PNG、WEBP",
    generate: "生成商品文案",
    generating: "正在生成...",
    startOver: "重新开始",
    listingSuccess: "商品文案生成成功",
    listingGenerated: "商品文案已就绪",
    countryLabel: "国家",
    languageLabel: "语言",
    currencyLabel: "货币",
    examplePrompt: "示例风格：简洁的商品文案、真实价格建议，以及实用的平台发布建议。",
    feedbackButton: "💬 反馈",
    feedbackTitle: "帮助我们改进",
    feedbackDescription: "快速提交问题或建议，不打断当前流程。",
    feedbackCategory: "类别",
    feedbackMessage: "你的反馈",
    feedbackEmail: "邮箱（可选）",
    feedbackSubmit: "发送反馈",
    feedbackSubmitting: "发送中...",
    feedbackCancel: "取消",
    feedbackSuccess: "感谢你的反馈。这将帮助我们改进产品。",
    feedbackError: "暂时无法发送反馈，请稍后重试。",
    feedbackCategoryBug: "问题反馈",
    feedbackCategoryFeature: "功能建议",
    feedbackCategoryListingOutput: "文案结果令人困惑",
    feedbackCategoryPrice: "价格估算错误",
    feedbackCategoryOther: "其他",
    feedbackMessagePlaceholder: "请描述发生了什么、你原本期望什么，或怎样改进会更好。",
    feedbackEmailPlaceholder: "name@example.com",
    priceEstimate: "AI 价格建议 · 基于相似商品",
    readyToPost: "可直接发布的文案",
    copyListing: "复制文案",
    copied: "已复制",
    keyFeatures: "核心卖点",
    shortDescription: "简短描述",
    fullDescription: "完整描述",
    specifications: "规格",
    tags: "标签",
    platformTips: "平台建议",
    confidenceNotes: "置信说明",
    overallConfidence: "整体置信度",
    conditionUncertain: "不确定",
    priceRange: "区间",
    validationCategory: "请选择反馈类别。",
    validationMessage: "请先填写反馈内容。",
    validationEmail: "请输入有效邮箱，或留空。",
    regionalContext: "地区设置",
    downloadCleanedImage: "下载处理后的图片",
    networkErrorTitle: "网络错误",
    apiErrorTitle: "API 错误",
    parseErrorTitle: "解析错误",
    validationErrorTitle: "校验错误",
    noticeTitle: "提示",
    preparingListing: "正在准备文案...",
    creatingListing: "正在生成你的商品文案",
    usualTimeHint: "通常需要 5-10 秒",
    processingSummary: "我们正在处理图片并起草商品文案。",
    removingBackground: "移除背景",
    cleaningProductImage: "清理商品图片",
    analysingProduct: "分析商品",
    visionStepSub: "类别、成色、材质、颜色、属性",
    estimatingPrice: "估算价格",
    priceStepSub: "类别、质量信号与市场规律",
    writingListing: "撰写文案",
    listingStepSub: "标题、描述、卖点、标签、平台建议",
    couldNotReadImage: "无法读取图片数据。",
    tryDifferentImage: "请尝试其他图片文件。",
    backgroundFallbackNotice: "无法移除图片背景，因此将使用原始上传图片。",
    backgroundFallbackHint: "系统会继续使用原始图片生成商品文案。",
    serverReturnedNoListing: "服务器未返回商品文案数据。",
    tryAgain: "请重试。",
    couldNotReachServer: "无法连接到服务器。",
    devServerHint: "请确认 dev server 正在 localhost:3000 运行，并且网络连接正常。",
    unexpectedError: "发生了意外错误。",
    consoleHint: "请查看浏览器控制台了解详情。",
    close: "关闭",
  },
  fr: {
    headerTitle: "Générateur IA d'annonces produit",
    headerSub: "Photo → Annonce instantanée. Importez une photo produit et générez une annonce prête à publier en quelques secondes.",
    uploadTitle: "Déposez une photo produit ici",
    uploadSub: "ou cliquez pour parcourir — JPG, PNG, WEBP",
    generate: "Générer l'annonce",
    generating: "Génération en cours...",
    startOver: "Recommencer",
    listingSuccess: "Annonce générée avec succès",
    listingGenerated: "Annonce prête",
    countryLabel: "Pays",
    languageLabel: "Langue",
    currencyLabel: "Devise",
    examplePrompt: "Exemple : texte marketplace concis, prix réaliste et conseils de vente utiles.",
    feedbackButton: "💬 Retour",
    feedbackTitle: "Aidez-nous à progresser",
    feedbackDescription: "Partagez rapidement un problème ou une suggestion sans interrompre votre flux.",
    feedbackCategory: "Catégorie",
    feedbackMessage: "Votre retour",
    feedbackEmail: "Email (optionnel)",
    feedbackSubmit: "Envoyer",
    feedbackSubmitting: "Envoi...",
    feedbackCancel: "Annuler",
    feedbackSuccess: "Merci pour votre retour. Cela nous aide à améliorer le produit.",
    feedbackError: "Impossible d'envoyer votre retour pour le moment. Réessayez.",
    feedbackCategoryBug: "Signaler un bug",
    feedbackCategoryFeature: "Demande de fonctionnalité",
    feedbackCategoryListingOutput: "Résultat d'annonce confus",
    feedbackCategoryPrice: "Estimation de prix incorrecte",
    feedbackCategoryOther: "Autre",
    feedbackMessagePlaceholder: "Expliquez ce qui s'est passé, ce que vous attendiez, ou ce qui améliorerait l'expérience.",
    feedbackEmailPlaceholder: "nom@example.com",
    priceEstimate: "Estimation IA · basée sur des annonces comparables",
    readyToPost: "Annonce prête à publier",
    copyListing: "Copier l'annonce",
    copied: "Copié !",
    keyFeatures: "Points clés",
    shortDescription: "Description courte",
    fullDescription: "Description complète",
    specifications: "Caractéristiques",
    tags: "Tags",
    platformTips: "Conseils plateforme",
    confidenceNotes: "Notes de confiance",
    overallConfidence: "niveau de confiance global",
    conditionUncertain: "incertain",
    priceRange: "fourchette",
    validationCategory: "Choisissez une catégorie de retour.",
    validationMessage: "Ajoutez un message avant l'envoi.",
    validationEmail: "Saisissez un email valide ou laissez vide.",
    regionalContext: "Contexte régional",
    downloadCleanedImage: "Télécharger l'image nettoyée",
    networkErrorTitle: "Erreur réseau",
    apiErrorTitle: "Erreur API",
    parseErrorTitle: "Erreur d'analyse",
    validationErrorTitle: "Erreur de validation",
    noticeTitle: "Information",
    preparingListing: "Préparation de l'annonce...",
    creatingListing: "Création de votre annonce",
    usualTimeHint: "Prend généralement 5 à 10 secondes",
    processingSummary: "Nous traitons votre image et rédigeons l'annonce.",
    removingBackground: "Suppression de l'arrière-plan",
    cleaningProductImage: "Nettoyage de l'image produit",
    analysingProduct: "Analyse du produit",
    visionStepSub: "Catégorie, état, matière, couleur, attributs",
    estimatingPrice: "Estimation du prix",
    priceStepSub: "Catégorie, signaux de qualité et tendances du marché",
    writingListing: "Rédaction de l'annonce",
    listingStepSub: "Titre, descriptions, puces, tags, conseils plateforme",
    couldNotReadImage: "Impossible de lire les données de l'image.",
    tryDifferentImage: "Essayez un autre fichier image.",
    backgroundFallbackNotice: "Impossible de supprimer l'arrière-plan, l'image originale sera donc utilisée.",
    backgroundFallbackHint: "La génération continuera avec l'image produit d'origine.",
    serverReturnedNoListing: "Le serveur n'a renvoyé aucune donnée d'annonce.",
    tryAgain: "Réessayez.",
    couldNotReachServer: "Impossible de joindre le serveur.",
    devServerHint: "Vérifiez que le serveur de développement tourne sur localhost:3000 et que votre connexion internet est active.",
    unexpectedError: "Une erreur inattendue s'est produite.",
    consoleHint: "Consultez la console du navigateur pour plus de détails.",
    close: "Fermer",
  },
  pl: {
    headerTitle: "Generator AI ofert produktowych",
    headerSub: "Zdjęcie → gotowa oferta. Dodaj zdjęcie produktu i wygeneruj ofertę gotową do publikacji w kilka sekund.",
    uploadTitle: "Upuść tutaj zdjęcie produktu",
    uploadSub: "lub kliknij, aby wybrać — JPG, PNG, WEBP",
    generate: "Generuj ofertę",
    generating: "Generowanie...",
    startOver: "Zacznij od nowa",
    listingSuccess: "Oferta została wygenerowana",
    listingGenerated: "Oferta gotowa",
    countryLabel: "Kraj",
    languageLabel: "Język",
    currencyLabel: "Waluta",
    examplePrompt: "Przykład: zwięzły tekst marketplace, realistyczna cena i praktyczne wskazówki sprzedażowe.",
    feedbackButton: "💬 Opinia",
    feedbackTitle: "Pomóż nam się poprawić",
    feedbackDescription: "Szybko zgłoś problem lub sugestię bez przerywania pracy.",
    feedbackCategory: "Kategoria",
    feedbackMessage: "Twoja opinia",
    feedbackEmail: "Email (opcjonalnie)",
    feedbackSubmit: "Wyślij",
    feedbackSubmitting: "Wysyłanie...",
    feedbackCancel: "Anuluj",
    feedbackSuccess: "Dziękujemy za opinię. To pomaga ulepszać produkt.",
    feedbackError: "Nie udało się wysłać opinii. Spróbuj ponownie.",
    feedbackCategoryBug: "Zgłoszenie błędu",
    feedbackCategoryFeature: "Prośba o funkcję",
    feedbackCategoryListingOutput: "Niejasny wynik oferty",
    feedbackCategoryPrice: "Błędna wycena",
    feedbackCategoryOther: "Inne",
    feedbackMessagePlaceholder: "Opisz, co się stało, czego oczekiwałeś lub co warto poprawić.",
    feedbackEmailPlaceholder: "nazwa@example.com",
    priceEstimate: "Szacunek AI · na podstawie podobnych ofert",
    readyToPost: "Oferta gotowa do publikacji",
    copyListing: "Kopiuj ofertę",
    copied: "Skopiowano!",
    keyFeatures: "Najważniejsze cechy",
    shortDescription: "Krótki opis",
    fullDescription: "Pełny opis",
    specifications: "Specyfikacja",
    tags: "Tagi",
    platformTips: "Wskazówki dla platform",
    confidenceNotes: "Uwagi o pewności",
    overallConfidence: "ogólna pewność",
    conditionUncertain: "niepewne",
    priceRange: "zakres",
    validationCategory: "Wybierz kategorię opinii.",
    validationMessage: "Dodaj wiadomość przed wysłaniem.",
    validationEmail: "Wpisz poprawny adres email albo zostaw puste.",
    regionalContext: "Kontekst regionalny",
    downloadCleanedImage: "Pobierz oczyszczone zdjęcie",
    networkErrorTitle: "Błąd sieci",
    apiErrorTitle: "Błąd API",
    parseErrorTitle: "Błąd parsowania",
    validationErrorTitle: "Błąd walidacji",
    noticeTitle: "Informacja",
    preparingListing: "Przygotowywanie oferty...",
    creatingListing: "Tworzenie Twojej oferty",
    usualTimeHint: "Zwykle trwa 5-10 sekund",
    processingSummary: "Przetwarzamy zdjęcie i przygotowujemy treść oferty.",
    removingBackground: "Usuwanie tła",
    cleaningProductImage: "Czyszczenie zdjęcia produktu",
    analysingProduct: "Analiza produktu",
    visionStepSub: "Kategoria, stan, materiał, kolor, atrybuty",
    estimatingPrice: "Szacowanie ceny",
    priceStepSub: "Kategoria, sygnały jakości i wzorce rynkowe",
    writingListing: "Pisanie oferty",
    listingStepSub: "Tytuł, opisy, wypunktowania, tagi, wskazówki dla platform",
    couldNotReadImage: "Nie udało się odczytać danych obrazu.",
    tryDifferentImage: "Spróbuj użyć innego pliku obrazu.",
    backgroundFallbackNotice: "Nie udało się usunąć tła, więc użyjemy oryginalnego zdjęcia.",
    backgroundFallbackHint: "Generowanie oferty będzie kontynuowane z oryginalnym zdjęciem produktu.",
    serverReturnedNoListing: "Serwer nie zwrócił danych oferty.",
    tryAgain: "Spróbuj ponownie.",
    couldNotReachServer: "Nie udało się połączyć z serwerem.",
    devServerHint: "Upewnij się, że serwer developerski działa na localhost:3000 i masz aktywne połączenie z internetem.",
    unexpectedError: "Wystąpił nieoczekiwany błąd.",
    consoleHint: "Sprawdź konsolę przeglądarki, aby zobaczyć szczegóły.",
    close: "Zamknij",
  },
};

export function t(language: LanguageCode, key: TranslationKey): string {
  return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key];
}
