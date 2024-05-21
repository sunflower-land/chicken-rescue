import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "lib/i18n/dictionaries/dictionary";

if (process.env.NODE_ENV !== "metadata") {
  const language =
    // Passed in through URL
    new URLSearchParams(window.location.search).get("language") ||
    // Save in local storage
    localStorage.getItem("language") ||
    // Default to english
    "en";

  i18n.use(initReactI18next).init(
    {
      resources,
      lng: language,
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
    },
    (err, t) => {
      // eslint-disable-next-line no-console
      if (err) return console.error("Something went wrong loading", err);
      t("key"); // initialized and ready to go!
    }
  );
}

export default i18n;
