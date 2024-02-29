import React, { useContext } from "react";

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
import { ChickenRescueRules } from "./components/ChickenRescueRules";
import { ChickenRescueGame } from "./ChickenRescueGame";

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

      {portalState.matches("introduction") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.wizard}>
            <ChickenRescueRules
              onAcknowledged={() => portalService.send("CONTINUE")}
            />
          </Panel>
        </Modal>
      )}

      {portalState.matches("gameOver") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.wizard}>
            <p>Game over</p>
            <Button onClick={() => portalService.send("RETRY")}>Retry</Button>
          </Panel>
        </Modal>
      )}

      {portalState.matches("claiming") && (
        <Modal show>
          <Panel>
            <p className="loading">{t("loading")}</p>
          </Panel>
        </Modal>
      )}

      {portalState.matches("completed") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.wizard}>
            <div className="p-2">
              <p className="mb-2">
                {`Congratulations, you have completed today's challenge.`}
              </p>
              <p className="text-sm mb-1">{t("crop.boom.back.puzzle")}</p>
              <Label type="info" icon={SUNNYSIDE.icons.timer}>
                {secondsToString(secondsTillReset(), { length: "medium" })}
              </Label>
            </div>
            <div className="flex">
              <Button onClick={goHome} className="mr-1">
                {t("go.home")}
              </Button>
              <Button onClick={() => portalService.send("CONTINUE")}>
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
