import React from "react";

import { SUNNYSIDE } from "assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";

export const Blacklisted: React.FC = () => {
  const { t } = useAppTranslation();
  return (
    <div className="flex flex-col items-center p-2">
      <span className="text-center">{t("farm.banned")}</span>
      <img
        src={SUNNYSIDE.npcs.suspiciousGoblin}
        alt="Warning"
        className="w-16 m-2"
      />
      <span className="text-sm mt-2 mb-2">{t("statements.blacklist.one")}</span>
      <a
        href={`https://sunflowerland.freshdesk.com/support/tickets/new`}
        className="underline text-center text-sm hover:text-blue-500 mt-1 mb-2 block"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("statements.blacklist.two")}
      </a>
    </div>
  );
};
