import React, { useContext } from "react";

import tutorial from "assets/announcements/chicken_rescue_rules.png";

import { SUNNYSIDE } from "assets/sunnyside";
import { Button } from "components/ui/Button";
import { ITEM_DETAILS } from "features/game/types/images";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Label } from "components/ui/Label";
import { OuterPanel } from "components/ui/Panel";

import coins from "assets/icons/coins.webp";
import sfl from "assets/icons/sfl.webp";
import flagIcon from "assets/icons/faction_point.webp";
import {
  Minigame,
  MinigameHistory,
  MinigamePrize,
} from "features/game/types/game";
import { secondsToString } from "lib/utils/time";
import { PortalContext } from "../lib/PortalProvider";
import { useActor } from "@xstate/react";
import { InlineDialogue } from "features/world/ui/TypingMessage";

interface Props {
  onAcknowledged: () => void;
}

export const MinigamePrizeUI: React.FC<{
  prize?: MinigamePrize;
  history?: MinigameHistory;
}> = ({ prize, history }) => {
  if (!prize) {
    return (
      <OuterPanel>
        <div className="px-1">
          <Label type="danger" icon={SUNNYSIDE.icons.sad}>
            No daily prize available
          </Label>
        </div>
      </OuterPanel>
    );
  }

  const isComplete = history && prize.score > history.highscore;
  const secondsLeft = (prize.endAt - Date.now()) / 1000;

  return (
    <OuterPanel>
      <div className="px-1">
        <span className="text-xs mb-2">{`Mission: Rescue ${prize.score} chickens`}</span>
        <div className="flex justify-between mt-2 flex-wrap">
          {isComplete ? (
            <Label type="success" icon={SUNNYSIDE.icons.confirm}>
              Completed
            </Label>
          ) : (
            <Label type="info" icon={SUNNYSIDE.icons.stopwatch}>
              {secondsToString(secondsLeft, { length: "medium" })}
            </Label>
          )}
          <div className="flex items-center space-x-2">
            {prize.factionPoints && (
              <Label icon={flagIcon} type="warning">
                {`${prize.factionPoints} Faction Points`}
              </Label>
            )}
            {!!prize.coins && (
              <Label icon={coins} type="warning">
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
  // There is only one type of purchase with chicken rescue - if they have activated in last 7 days
  const hasUnlimitedAttempts = purchases.some(
    (purchase) => purchase.purchasedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  const hasMoreAttempts = attemptsLeft > 0;

  if (hasUnlimitedAttempts) {
    return <Label type="success">{`Unlimited attempts`}</Label>;
  }

  if (hasMoreAttempts) {
    return <Label type="vibrant">{`${attemptsLeft} Attempts Remaining`}</Label>;
  }

  return <Label type="danger">{`No attempts remaining`}</Label>;
};

export const ChickenRescueRules: React.FC<Props> = ({ onAcknowledged }) => {
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

  console.log({ attemptsLeft });
  return (
    <>
      <div>
        <div className="w-full relative flex justify-between p-1 items-center mb-2">
          <Label type="default" icon={ITEM_DETAILS["Chicken"].image}>
            Chicken Rescue
          </Label>

          <MinigameAttempts
            attemptsLeft={attemptsLeft}
            purchases={minigame?.purchases}
          />
        </div>
        <MinigamePrizeUI history={dailyAttempt} prize={prize} />
      </div>
      <Button
        className="mt-1 whitespace-nowrap capitalize"
        onClick={() => {
          onAcknowledged();
        }}
      >
        {t("start")}
      </Button>
    </>
  );
};
