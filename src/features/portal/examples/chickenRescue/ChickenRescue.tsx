import React, { useContext, useEffect } from "react";

import { useActor } from "@xstate/react";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";

import { PortalContext, PortalProvider } from "./lib/PortalProvider";
import { Ocean } from "features/world/ui/Ocean";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { NPC_WEARABLES } from "lib/npcs";
import { secondsTillReset } from "features/helios/components/hayseedHank/HayseedHankV2";
import { secondsToString } from "lib/utils/time";
import {
  authorisePortal,
  goHome,
} from "features/portal/examples/cropBoom/lib/portalUtil";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { ChickenRescueHUD } from "./components/ChickenRescueHUD";
import {
  ChickenRescueRules,
  MinigameAttempts,
  MinigamePrizeUI,
} from "./components/ChickenRescueRules";
import { ChickenRescueGame } from "./ChickenRescueGame";
import { ITEM_DETAILS } from "features/game/types/images";
import { MinigamePrize } from "features/game/types/game";

import lock from "assets/skills/lock.png";
import sfl from "assets/icons/sfl.webp";
import { complete, purchase } from "./lib/portalUtil";

export const ChickenRescueApp: React.FC = () => {
  return (
    <PortalProvider>
      <Ocean>
        <ChickenRescue />
      </Ocean>
    </PortalProvider>
  );
};

export const ChickenRescue: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);
  const { t } = useAppTranslation();

  useEffect(() => {
    // If a player tries to quit while playing, mark it as an attempt
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      portalService.send("GAME_OVER");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const handleMessage = (event: MessageEvent) => {
      // TODO
      const isValidOrigin = true; //event.oring === 'https://example.com'

      // Check if the origin of the message is trusted
      if (isValidOrigin) {
        // Handle the received message
        if (event.data.event === "purchased") {
          portalService.send("PURCHASED");
        }
      } else {
        // If the origin is not trusted, handle it accordingly
        console.log("Received message from untrusted origin:", event.origin);
      }
    };

    // Add event listener to listen for messages from the parent window
    window.addEventListener("message", handleMessage);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const dateKey = new Date().toISOString().slice(0, 10);
  const minigame = portalState.context.state.minigames.games["chicken-rescue"];
  const history = minigame?.history ?? {};

  const prize = portalState.context.state.minigames.prizes["chicken-rescue"];

  const dailyAttempt = history[dateKey] ?? {
    attempts: 0,
    highscore: 0,
  };

  const attemptsLeft = portalState.context.attemptsLeft;

  return (
    <div>
      {portalState.matches("error") && (
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="danger">{t("error")}</Label>
              <span className="text-sm my-2">{t("error.wentWrong")}</span>
            </div>
            <Button onClick={() => portalService.send("RETRY")}>
              {t("retry")}
            </Button>
          </Panel>
        </Modal>
      )}

      {portalState.matches("loading") && (
        <Modal show>
          <Panel>
            <span className="loading">{t("loading")}</span>
          </Panel>
        </Modal>
      )}

      {portalState.matches("unauthorised") && (
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="danger">{t("error")}</Label>
              <span className="text-sm my-2">{t("session.expired")}</span>
            </div>
            <Button onClick={authorisePortal}>{t("welcome.login")}</Button>
          </Panel>
        </Modal>
      )}

      {portalState.matches("idle") && (
        <Modal show>
          <Panel>
            <Button onClick={() => portalService.send("START")}>
              {t("start")}
            </Button>
          </Panel>
        </Modal>
      )}

      {portalState.matches("noAttempts") && (
        <Modal show>
          <Panel>
            <div className="p-1">
              <div className="flex justify-between items-center mb-2">
                <Label icon={lock} type="danger">
                  No attempts remaining
                </Label>
                <Label
                  icon={sfl}
                  type={
                    portalState.context.state.balance.lt(10)
                      ? "danger"
                      : "default"
                  }
                >
                  10 SFL required
                </Label>
              </div>

              <p className="text-sm mb-2">
                You have ran out of daily attempts.
              </p>
              <p className="text-sm mb-2">
                Would you like to unlock unlimited attempts for 7 days?
              </p>
            </div>
            <div className="flex">
              <Button
                disabled={portalState.context.state.balance.lt(10)}
                onClick={goHome}
                className="mr-1"
              >
                Exit
              </Button>
              <Button
                disabled={portalState.context.state.balance.lt(10)}
                onClick={() => purchase({ sfl: 10 })}
              >
                Unlock attempts
              </Button>
            </div>
          </Panel>
        </Modal>
      )}

      {portalState.matches("introduction") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <ChickenRescueRules
              onAcknowledged={() => portalService.send("CONTINUE")}
            />
          </Panel>
        </Modal>
      )}

      {portalState.matches("loser") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <>
              <div>
                <div className="w-full relative flex justify-between p-1 items-center">
                  <Label type="default" icon={ITEM_DETAILS["Chicken"].image}>
                    Chicken Rescue
                  </Label>
                  <MinigameAttempts
                    attemptsLeft={attemptsLeft}
                    purchases={minigame?.purchases}
                  />
                </div>
                <div className="mt-1 flex justify-between flex-col space-y-1 px-1 mb-2">
                  <span className="text-sm">{`Score: ${portalState.context.score}`}</span>
                  <span className="text-xs">{`Highscore: ${Math.max(
                    portalState.context.score,
                    minigame?.highscore ?? 0
                  )}`}</span>
                </div>
                <MinigamePrizeUI history={dailyAttempt} prize={prize} />
              </div>
              <div className="flex items-center  mt-1">
                <Button
                  className="mr-1 whitespace-nowrap capitalize"
                  onClick={() => {
                    goHome();
                  }}
                >
                  {t("exit")}
                </Button>
                <Button
                  className="whitespace-nowrap capitalize"
                  onClick={() => {
                    portalService.send("RETRY");
                  }}
                >
                  {t("retry")}
                </Button>
              </div>
            </>
          </Panel>
        </Modal>
      )}

      {portalState.matches("winner") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <>
              <div>
                <div className="w-full relative flex justify-between p-1">
                  <Label type="success" icon={SUNNYSIDE.icons.confirm}>
                    Mission Complete
                  </Label>
                  <MinigameAttempts
                    attemptsLeft={attemptsLeft}
                    purchases={minigame?.purchases}
                  />
                </div>
                <div className="mt-1 flex justify-between flex-col space-y-1 px-1 mb-2">
                  <span className="text-sm">{`Score: ${portalState.context.score}`}</span>
                  <span className="text-xs">{`Highscore: ${Math.max(
                    portalState.context.score,
                    minigame?.highscore ?? 0
                  )}`}</span>
                </div>
                <MinigamePrizeUI history={dailyAttempt} prize={prize} />
              </div>
              <Button
                className="mt-1 whitespace-nowrap capitalize"
                onClick={() => {
                  complete();
                }}
              >
                {t("claim")}
              </Button>
            </>
          </Panel>
        </Modal>
      )}

      {portalState.matches("loser") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <div className="w-full relative flex justify-between p-1 items-center">
              <Label type="danger" icon={SUNNYSIDE.icons.death}>
                Mission failed
              </Label>
              <MinigameAttempts
                attemptsLeft={attemptsLeft}
                purchases={minigame?.purchases}
              />
            </div>
            <div className="mt-1 flex justify-between flex-col space-y-1 px-1 mb-2">
              <span className="text-sm">{`Score: ${portalState.context.score}`}</span>
              <span className="text-xs">{`Highscore: ${Math.max(
                portalState.context.score,
                minigame?.highscore ?? 0
              )}`}</span>
            </div>
            <MinigamePrizeUI history={dailyAttempt} prize={prize} />
            <div className="flex mt-1">
              <Button onClick={goHome} className="mr-1">
                {t("go.home")}
              </Button>
              <Button onClick={() => portalService.send("RETRY")}>
                {t("play.again")}
              </Button>
            </div>
          </Panel>
        </Modal>
      )}

      {portalState.context.state && (
        <>
          <ChickenRescueHUD />
          <ChickenRescueGame />
        </>
      )}
    </div>
  );
};
