import React, { useContext } from "react";

import { useActor } from "@xstate/react";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";

import { PortalContext, PortalProvider } from "./lib/PortalProvider";
import { Ocean } from "features/world/ui/Ocean";
import { CropBoomHud } from "features/portal/examples/cropBoom/components/CropBoomHud";
import { CropBoomPhaser } from "./CropBoomPhaser";
import { Label } from "components/ui/Label";
import { NPC_WEARABLES } from "lib/npcs";
import { authorisePortal } from "features/portal/examples/cropBoom/lib/portalUtil";
import { CropBoomRules } from "./components/CropBoomRules";
import { useAppTranslation } from "lib/i18n/useAppTranslations";

export const CropBoomApp: React.FC = () => {
  return (
    <PortalProvider>
      <Ocean>
        <CropBoom />
      </Ocean>
    </PortalProvider>
  );
};

export const CropBoom: React.FC = () => {
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

      {portalState.matches("rules") && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.wizard}>
            <CropBoomRules
              onAcknowledged={() => portalService.send("CONTINUE")}
            />
          </Panel>
        </Modal>
      )}

      {portalState.context.state && (
        <>
          <CropBoomHud />
          <CropBoomPhaser />
        </>
      )}
    </div>
  );
};
