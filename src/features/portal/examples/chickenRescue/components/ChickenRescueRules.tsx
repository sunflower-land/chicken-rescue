import React, { useContext } from "react";

import { SUNNYSIDE } from "assets/sunnyside";
import { Button } from "components/ui/Button";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Label } from "components/ui/Label";
import { OuterPanel } from "components/ui/Panel";

import coins from "assets/icons/coins.webp";
import factions from "assets/icons/factions.webp";
import {
  Minigame,
  MinigameHistory,
  MinigamePrize,
} from "features/game/types/game";
import { secondsToString } from "lib/utils/time";
import { useActor } from "@xstate/react";
import { ITEM_DETAILS } from "features/game/types/images";
import { PortalContext } from "../lib/PortalProvider";
import { getKeys } from "features/game/types/craftables";
import giftIcon from "assets/icons/gift.png";

interface Props {
  onAcknowledged: () => void;
  onClose: () => void;
}

export const MinigamePrizeUI: React.FC<{
  prize?: MinigamePrize;
  history?: MinigameHistory;
}> = ({ prize, history }) => {
  const { t } = useAppTranslation();
  if (!prize) {
    return (
      <OuterPanel>
        <div className="px-1">
          <Label type="danger" icon={SUNNYSIDE.icons.sad}>
            {t("minigame.noPrizeAvailable")}
          </Label>
        </div>
      </OuterPanel>
    );
  }

  const isComplete = history && history.highscore > prize.score;
  const secondsLeft = (prize.endAt - Date.now()) / 1000;

  return (
    <OuterPanel>
      <div className="px-1">
        <span className="text-xs mb-2">{`Mission: Rescue ${prize.score} chickens`}</span>
        <div className="flex justify-between mt-2 flex-wrap">
          {isComplete ? (
            <Label type="success" icon={SUNNYSIDE.icons.confirm}>
              {t("minigame.completed")}
            </Label>
          ) : (
            <Label type="info" icon={SUNNYSIDE.icons.stopwatch}>
              {secondsToString(secondsLeft, { length: "medium" })}
            </Label>
          )}
          <div className="flex flex-wrap justify-between items-center gap-2">
            {getKeys(prize.items).map((item) => (
              <Label key={item} type="warning" icon={ITEM_DETAILS[item].image}>
                {`${prize.items[item]} x ${item}`}
              </Label>
            ))}
            {getKeys(prize.wearables).map((item) => (
              <Label key={item} type="warning" icon={giftIcon}>
                {`${prize.wearables[item]} x ${item}`}
              </Label>
            ))}
            {!!prize.coins && (
              <Label type="warning" icon={coins}>
                {prize.coins}
              </Label>
            )}
          </div>
        </div>
      </div>
    </OuterPanel>
  );
};

export const MinigameAttempts: React.FC<{
  attemptsLeft: number;
  purchases: Minigame["purchases"];
}> = ({ attemptsLeft, purchases = [] }) => {
  const { t } = useAppTranslation();

  // There is only one type of purchase with chicken rescue - if they have activated in last 7 days
  const hasUnlimitedAttempts = purchases.some(
    (purchase) => purchase.purchasedAt > Date.now() - 24 * 60 * 60 * 1000,
  );

  const hasMoreAttempts = attemptsLeft > 0;

  if (hasUnlimitedAttempts) {
    return <Label type="success">{t("minigame.unlimitedAttempts")}</Label>;
  }

  if (hasMoreAttempts) {
    return (
      <Label type="vibrant">{`${attemptsLeft}  ${t(
        "minigame.attemptsRemaining",
      )}`}</Label>
    );
  }

  return <Label type="danger">{t("minigame.noAttemptsRemaining")}</Label>;
};

export const ChickenRescueRules: React.FC<Props> = ({
  onAcknowledged,
  onClose,
}) => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);
  const { t } = useAppTranslation();

  const dateKey = new Date().toISOString().slice(0, 10);
  const minigame = portalState.context.state.minigames.games["chicken-rescue"];
  const history = minigame?.history ?? {};
  const attemptsLeft = portalState.context.attemptsLeft;

  const dailyAttempt = history[dateKey] ?? {
    attempts: 0,
    highscore: 0,
  };

  const prize = portalState.context.state.minigames.prizes["chicken-rescue"];

  return (
    <>
      <div>
        <div className="w-full relative flex justify-between p-1 items-center mb-2">
          <Label type="default" icon={factions}>
            {t("minigame.chickenRescue")}
          </Label>

          <MinigameAttempts
            attemptsLeft={attemptsLeft}
            purchases={minigame?.purchases}
          />
        </div>
        <MinigamePrizeUI history={dailyAttempt} prize={prize} />
      </div>
      <div className="flex space-x-1">
        <Button
          className="mt-1 whitespace-nowrap capitalize"
          onClick={() => {
            onClose();
          }}
        >
          {t("exit")}
        </Button>
        <Button
          className="mt-1 whitespace-nowrap capitalize"
          onClick={() => {
            onAcknowledged();
          }}
        >
          {t("start")}
        </Button>
      </div>
    </>
  );
};
