import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import tr from "../locales/tr.json";

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
};

const locales = getLocales();
const languageTag = locales?.[0]?.languageTag ?? "en";
const languageCode = languageTag.split("-")[0]; // Use base language (e.g., 'en' from 'en-US')

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: "v4", // Add this to fix compatibility issues with Expo
    resources,
    lng: languageCode, // language to use
    fallbackLng: "en", // use en if detected lng is not available

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
