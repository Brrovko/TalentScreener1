import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ruTranslation from "./locales/ru";
import enTranslation from "./locales/en";

// Языковые ресурсы
const resources = {
  ru: {
    translation: ruTranslation
  },
  en: {
    translation: enTranslation
  }
};

// Инициализация i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru", // Язык по умолчанию
    fallbackLng: "ru", // Запасной язык
    interpolation: {
      escapeValue: false // Разрешаем React сам обрабатывать эскейпинг
    }
  });

export default i18n;