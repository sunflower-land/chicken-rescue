import React, { useContext, useEffect } from "react";

import { useActor, useSelector } from "@xstate/react";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";

import { PortalContext, PortalProvider } from "./lib/PortalProvider";
import { Ocean } from "features/world/ui/Ocean";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { NPC_WEARABLES } from "lib/npcs";

import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { ChickenRescueHUD } from "./components/ChickenRescueHUD";
import {
  ChickenRescueRules,
  MinigameAttempts,
  MinigamePrizeUI,
} from "./components/ChickenRescueRules";
import { ChickenRescueGame } from "./ChickenRescueGame";
import { ITEM_DETAILS } from "features/game/types/images";

import lock from "assets/skills/lock.png";
import sfl from "assets/icons/sfl.webp";
import { complete, goHome, purchase } from "./lib/portalUtil";
import { PortalMachineState } from "./lib/chickenRescueMachine";

export const ChickenRescueApp: React.FC = () => {
  return (
    <PortalProvider>
      <Ocean>
        <ChickenRescue />
      </Ocean>
    </PortalProvider>
  );
};

const _gameState = (state: PortalMachineState) => state.context.state;

export const ChickenRescue: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);
  const { t } = useAppTranslation();

  const gameState = useSelector(portalService, _gameState);

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
        // eslint-disable-next-line no-console
        console.error("Received message from untrusted origin:", event.origin);
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

  if (portalState.matches("error")) {
    return (
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
    );
  }

  if (portalState.matches("unauthorised")) {
    return (
      <Modal show>
        <Panel>
          <div className="p-2">
            <Label type="danger">{t("error")}</Label>
            <span className="text-sm my-2">{t("session.expired")}</span>
          </div>
          <Button onClick={goHome}>{t("close")}</Button>
        </Panel>
      </Modal>
    );
  }

  if (portalState.matches("loading")) {
    return (
      <Modal show>
        <Panel>
          <span className="loading">{t("loading")}</span>
        </Panel>
      </Modal>
    );
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const minigame = gameState.minigames.games["chicken-rescue"];
  const history = minigame?.history ?? {};

  const prize = gameState.minigames.prizes["chicken-rescue"];

  const dailyAttempt = history[dateKey] ?? {
    attempts: 0,
    highscore: 0,
  };

  const attemptsLeft = portalState.context.attemptsLeft;

  return (
    <div>
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
                  {t("minigame.noAttemptsRemaining")}
                </Label>
                <Label
                  icon={sfl}
                  type={gameState.balance.lt(10) ? "danger" : "default"}
                >
                  {`10 ${t("minigame.sflRequired")}`}
                </Label>
              </div>

              <p className="text-sm mb-2">
                {t("minigame.youHaveRunOutOfAttempts")}
              </p>
              <p className="text-sm mb-2">
                {t("minigame.wouldYouLikeToUnlock")}
              </p>
            </div>
            <div className="flex">
              <Button onClick={goHome} className="mr-1">
                {t("exit")}
              </Button>
              <Button
                disabled={gameState.balance.lt(5)}
                onClick={() => purchase({ sfl: 5 })}
              >
                {t("minigame.unlockAttempts")}
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
              onClose={() => goHome()}
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
                    {t("minigame.chickenRescue")}
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
                    {t("minigame.missionComplete")}
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

      {portalState.matches("complete") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <div className="w-full relative flex justify-between p-1 items-center">
              <Label type="default" icon={SUNNYSIDE.icons.death}>
                {t("minigame.chickenRescue")}
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

      {portalState.matches("loser") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.chicken}>
            <div className="w-full relative flex justify-between p-1 items-center">
              <Label type="danger" icon={SUNNYSIDE.icons.death}>
                {t("minigame.missionFailed")}
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

      {gameState && (
        <>
          <ChickenRescueHUD />
          <ChickenRescueGame />
        </>
      )}
    </div>
  );
};
