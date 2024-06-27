import React, { useContext } from "react";
import { useActor } from "@xstate/react";
import { PortalContext } from "../lib/PortalProvider";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { SUNNYSIDE } from "assets/sunnyside";
import worldIcon from "assets/icons/world.png";
import { goHome } from "../lib/portalUtil";
import { HudContainer } from "components/ui/HudContainer";
import { Balances } from "components/Balances";
import Decimal from "decimal.js-light";
import { Label } from "components/ui/Label";

export const ChickenRescueHUD: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);

  const travelHome = () => {
    goHome();
  };

  const { score, endAt, state } = portalState.context;

  // const timer = useCountdown(endAt);

  // const secondsLeft = !portalState.matches("playing")
  //   ? GAME_SECONDS
  //   : timer.seconds;

  const target = state.minigames.prizes["chicken-rescue"]?.score;

  return (
    <>
      <HudContainer>
        <Balances
          sfl={portalState.context.state.balance}
          coins={portalState.context.state.coins}
          blockBucks={
            portalState.context.state.inventory["Block Buck"] ?? new Decimal(0)
          }
        />
        <div className="absolute top-4 left-4">
          {!!target && (
            <Label icon={SUNNYSIDE.resource.chicken} type="vibrant">
              {`Target: ${target}`}
            </Label>
          )}
          <div className="relative ">
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
        {/* <InnerPanel className="absolute top-4 left-4">
          <div className="flex items-center p-1">
            <img src={SUNNYSIDE.icons.stopwatch} className="h-6 mr-1" />
            <span className="text-sm">{`${secondsLeft} seconds`}</span>
          </div>
        </InnerPanel> */}
        <div
          className="fixed z-50 flex flex-col justify-between"
          style={{
            left: `${PIXEL_SCALE * 3}px`,
            bottom: `${PIXEL_SCALE * 3}px`,
            width: `${PIXEL_SCALE * 22}px`,
          }}
        >
          <div
            id="deliveries"
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
      </HudContainer>
    </>
  );
};
