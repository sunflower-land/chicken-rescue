import React, { useContext, useState } from "react";
import { useSelector } from "@xstate/react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { SUNNYSIDE } from "assets/sunnyside";
import worldIcon from "assets/icons/world.png";
import { HudContainer } from "components/ui/HudContainer";
import { Label } from "components/ui/Label";
import { t } from "i18next";
import { isTouchDevice } from "features/world/lib/device";
import { PortalMachineState } from "../lib/chickenRescueMachine";
import { PortalContext } from "../lib/PortalProvider";
import { goHome } from "features/portal/lib/portalUtil";
import { formatNumber } from "lib/utils/formatNumber";
import sflIcon from "assets/icons/sfl.webp";
import trophy from "assets/icons/trophy.png";

const _score = (state: PortalMachineState) => state.context.score;
const _chickens = (state: PortalMachineState) =>
  state.context.progress.custom?.chickens ?? 0;
const _state = (state: PortalMachineState) => state.context.state;
const _ready = (state: PortalMachineState) => state.matches("ready");

export const ChickenRescueHUD: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [showGuide, setShowGuide] = useState(false);

  const travelHome = () => {
    goHome();
  };

  const state = useSelector(portalService, _state);
  const score = useSelector(portalService, _score);
  const chickens = useSelector(portalService, _chickens);
  const ready = useSelector(portalService, _ready);

  const target = state.minigames.prizes["chicken-rescue"]?.score ?? 0;

  const isTargetReached = score >= target;

  return (
    <HudContainer>
      {/* SFL balance */}
      <div className="flex flex-col absolute space-y-1 items-end z-50 right-3 top-3 !text-[28px] text-stroke pointer-events-none">
        <div className="flex items-center space-x-2 relative">
          <div className="h-9 w-full bg-black opacity-25 absolute sfl-hud-backdrop" />
          <span className="balance-text">
            {formatNumber(state.balance, { decimalPlaces: 4 })}
          </span>
          <img
            src={sflIcon}
            alt="SFL"
            style={{
              width: 26,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col absolute space-y-1 items-end z-50 right-3 top-12 !text-[28px] text-stroke pointer-events-none">
        <div className="flex items-center space-x-2 relative">
          <div className="h-9 w-full bg-black opacity-25 absolute sfl-hud-backdrop" />
          <span className="balance-text">{chickens}</span>
          <img
            src={trophy}
            alt="SFL"
            style={{
              width: 26,
            }}
          />
        </div>
      </div>

      {/* target and score */}
      <div className="absolute top-4 left-4 pointer-events-none">
        {!!target && (
          <Label
            icon={SUNNYSIDE.resource.chicken}
            secondaryIcon={
              isTargetReached ? SUNNYSIDE.icons.confirm : undefined
            }
            type={isTargetReached ? "success" : "vibrant"}
          >
            {`Target: ${target}`}
          </Label>
        )}
        <div className="relative">
          <div className="h-6 w-full bg-black opacity-30 absolute coins-bb-hud-backdrop-reverse" />
          {/* Coins */}
          <div
            className="flex items-center space-x-2 z-10 absolute"
            style={{
              width: "120px",
              paddingTop: "3px",
              paddingLeft: "3px",
            }}
          >
            <span className="balance-text">{`Score: ${score}`}</span>
          </div>
        </div>
      </div>

      {/* Travel icon */}
      <div
        className="fixed z-50 flex flex-col justify-between"
        style={{
          left: `${PIXEL_SCALE * 3}px`,
          bottom: `${PIXEL_SCALE * 3}px`,
          width: `${PIXEL_SCALE * 22}px`,
        }}
      >
        <div
          id="travel"
          className="flex relative z-50 justify-center cursor-pointer hover:img-highlight"
          style={{
            width: `${PIXEL_SCALE * 22}px`,
            height: `${PIXEL_SCALE * 23}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            travelHome();
          }}
        >
          <img
            src={SUNNYSIDE.ui.round_button}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 22}px`,
            }}
          />
          <img
            src={worldIcon}
            style={{
              width: `${PIXEL_SCALE * 12}px`,
              left: `${PIXEL_SCALE * 5}px`,
              top: `${PIXEL_SCALE * 4}px`,
            }}
            className="absolute"
          />
        </div>
      </div>

      {ready && (
        <div className="absolute w-full h-full pointer-events-none">
          <div className="absolute w-full h-full bg-black opacity-50" />
          <div className="flex items-center justify-center absolute inset-0">
            <span className="text-white text-center">
              {isTouchDevice()
                ? t("minigame.swipeToMove")
                : t("minigame.arrowKeysToMove")}
            </span>
          </div>
        </div>
      )}
    </HudContainer>
  );
};
