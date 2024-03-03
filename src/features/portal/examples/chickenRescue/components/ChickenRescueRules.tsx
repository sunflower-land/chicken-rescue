import React from "react";

import tutorial from "assets/announcements/chicken_rescue_rules.png";

import { SUNNYSIDE } from "assets/sunnyside";
import { Button } from "components/ui/Button";
import { ITEM_DETAILS } from "features/game/types/images";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Label } from "components/ui/Label";

interface Props {
  onAcknowledged: () => void;
}
export const ChickenRescueRules: React.FC<Props> = ({ onAcknowledged }) => {
  const { t } = useAppTranslation();
  return (
    <>
      <div className="p-2">
        <div className="w-full relative">
          <img src={tutorial} className="w-full mx-auto rounded-lg mb-2" />
          <Label
            className="absolute left-3 top-2"
            type="default"
            icon={ITEM_DETAILS["Chicken"].image}
          >
            Chicken Rescue
          </Label>
        </div>
        <div className="flex mb-2">
          <div className="w-12 flex justify-center">
            <img
              src={ITEM_DETAILS["Chicken"].image}
              className="h-6 mr-2 object-contain"
            />
          </div>
          <p className="text-sm  flex-1">Rescue as many chickens as you can.</p>
        </div>
        <div className="flex mb-2">
          <div className="w-12 flex justify-center">
            <img
              src={SUNNYSIDE.icons.death}
              className="h-6 mr-2 object-contain"
            />
          </div>
          <p className="text-sm  flex-1">
            Watch out for obstacles and hungry goblins!
          </p>
        </div>
      </div>
      <Button
        className="text-xxs sm:text-sm mt-1 whitespace-nowrap"
        onClick={() => {
          onAcknowledged();
        }}
      >
        {t("ok")}
      </Button>
    </>
  );
};
