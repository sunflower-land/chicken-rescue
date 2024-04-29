import React from "react";

import tutorial from "assets/announcements/chicken_rescue_rules.png";

import { SUNNYSIDE } from "assets/sunnyside";
import { Button } from "components/ui/Button";
import { ITEM_DETAILS } from "features/game/types/images";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Label } from "components/ui/Label";
import { OuterPanel } from "components/ui/Panel";

import coins from "assets/icons/coins.webp";
import flagIcon from "assets/icons/faction_point.webp";

interface Props {
  onAcknowledged: () => void;
}
export const ChickenRescueRules: React.FC<Props> = ({ onAcknowledged }) => {
  const { t } = useAppTranslation();
  return (
    <>
      <div className="p-2">
        <div className="w-full relative flex justify-between">
          <Label
            className="mb-2"
            type="default"
            icon={ITEM_DETAILS["Chicken"].image}
          >
            Chicken Rescue
          </Label>
          <Label className="mb-2" type="vibrant">
            3 Attempts Remaining
          </Label>
        </div>
        <OuterPanel>
          <div className="px-1">
            <span className="text-xs mb-2">Mission: Rescue 50 chickens</span>
            <div className="flex justify-between mt-2 flex-wrap">
              <Label type="info" icon={SUNNYSIDE.icons.stopwatch}>
                3 Hrs Left
              </Label>
              <div className="flex items-center space-x-2">
                <Label icon={flagIcon} type="warning">
                  10 Points
                </Label>
                <Label icon={coins} type="warning">
                  220
                </Label>
              </div>
            </div>
          </div>
        </OuterPanel>
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
