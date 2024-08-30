import React, { useContext, useEffect, useState } from "react";
import { Label } from "components/ui/Label";
import { Modal } from "components/ui/Modal";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";

import blockBuckIcon from "assets/icons/block_buck.png";
import vipIcon from "assets/icons/vip.webp";
import exchangeIcon from "assets/icons/exchange.png";
import coinsIcon from "assets/icons/coins.webp";
import coinsStack from "assets/icons/coins_stack.webp";
import coinsScattered from "assets/icons/coins_scattered.webp";
import sflIcon from "assets/icons/sfl.webp";
import { SFL_TO_COIN_PACKAGES } from "features/game/events/landExpansion/exchangeSFLtoCoins";
import { ButtonPanel } from "components/ui/Panel";
import * as AuthProvider from "features/auth/lib/Provider";
import { XsollaLoading } from "features/game/components/modal/components/XsollaLoading";
import { XsollaIFrame } from "features/game/components/modal/components/XsollaIFrame";
import { Context } from "features/game/GameProvider";
import { AuthMachineState } from "features/auth/lib/authMachine";
import { MachineState } from "features/game/lib/gameMachine";
import { useActor, useSelector } from "@xstate/react";
import { onboardingAnalytics } from "lib/onboardingAnalytics";
import { randomID } from "lib/utils/random";
import { buyBlockBucksXsolla } from "features/game/actions/buyBlockBucks";
import {
  BuyBlockBucks,
  Price,
} from "features/game/components/modal/components/BuyBlockBucks";
import { Button } from "components/ui/Button";
import { SUNNYSIDE } from "assets/sunnyside";
import { SquareIcon } from "components/ui/SquareIcon";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { hasFeatureAccess } from "lib/flags";
import { VIPItems } from "../../../game/components/modal/components/VIPItems";
import { PIXEL_SCALE } from "features/game/lib/constants";

const COIN_IMAGES = [coinsScattered, coinsIcon, coinsStack];

type Props = {
  initialTab?: number;
  show: boolean;
  onClose: () => void;
};

const _token = (state: AuthMachineState) =>
  state.context.user.rawToken as string;
const _farmId = (state: MachineState) => state.context.farmId;
const _autosaving = (state: MachineState) => state.matches("autosaving");

export const BuyCurrenciesModal: React.FC<Props> = ({
  show,
  onClose,
  initialTab = 0,
}) => {
  const { authService } = useContext(AuthProvider.Context);
  const { gameService } = useContext(Context);
  const [tab, setTab] = useState(initialTab);

  const [
    {
      context: { state },
    },
  ] = useActor(gameService);

  const { t } = useAppTranslation();

  // Block bucks
  const [showXsolla, setShowXsolla] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<Price>();
  const [hideBuyBBLabel, setHideBuyBBLabel] = useState(false);

  // SFL to Coins
  const [exchangePackageId, setExchangePackageId] = useState<number>();

  const token = useSelector(authService, _token);
  const farmId = useSelector(gameService, _farmId);
  const autosaving = useSelector(gameService, _autosaving);

  const showStarter = useEffect(() => {
    // Trigger an autosave in case they have changes so user can sync right away
    gameService.send("SAVE");

    onboardingAnalytics.logEvent("begin_checkout");
  }, []);

  const handleSFLtoCoinsExchange = (packageId: number) => {
    gameService.send("sfl.exchanged", { packageId });
    setExchangePackageId(undefined);
    onClose();
  };

  const onMaticBuy = async () => {
    gameService.send("BUY_BLOCK_BUCKS", {
      currency: "MATIC",
      amount: price?.amount,
    });
    onClose();
  };

  const handleExited = () => {
    setShowXsolla(undefined);
    setPrice(undefined);
    setLoading(false);
  };

  const handleCreditCardBuy = async () => {
    setLoading(true);
    try {
      const amount = price?.amount ?? 0;

      const { url } = await buyBlockBucksXsolla({
        amount,
        farmId,
        transactionId: randomID(),
        token,
      });

      setShowXsolla(url);
      setLoading(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setLoading(false);
    }
  };

  const handleCreditCardSuccess = () => {
    gameService.send("UPDATE_BLOCK_BUCKS", { amount: price?.amount });
    onClose();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      onExited={handleExited}
      size={showXsolla ? "lg" : undefined}
    >
      {showXsolla ? (
        <div className="relative w-full h-full min-h-[65vh] min-w[65vw] px-1">
          <XsollaLoading autoClose={true} />
          <XsollaIFrame
            url={showXsolla}
            onSuccess={handleCreditCardSuccess}
            onClose={onClose}
          />
        </div>
      ) : loading ? (
        <div className="h-32 flex items-center justify-center">
          <XsollaLoading autoClose={false} />
        </div>
      ) : (
        <CloseButtonPanel
          onBack={price ? () => setPrice(undefined) : undefined}
          currentTab={tab}
          setCurrentTab={(tab) => {
            setTab(tab);
          }}
          onClose={onClose}
          tabs={[
            { icon: blockBuckIcon, name: `Block Bucks` },
            { icon: exchangeIcon, name: `${t("sfl/coins")}` },
            ...(hasFeatureAccess(state, "BANNER_SALES")
              ? [{ icon: vipIcon, name: "VIP" }]
              : []),
          ]}
        >
          {tab === 0 && (
            <div className="flex flex-col space-y-1">
              {!hideBuyBBLabel && (
                <div className="flex justify-between pt-2 px-1">
                  <Label icon={blockBuckIcon} type="default" className="ml-2">
                    {`${t("transaction.buy.BlockBucks")}`}
                  </Label>
                  <a
                    href="https://docs.sunflower-land.com/fundamentals/blockchain-fundamentals#block-bucks"
                    className="text-xxs underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("read.more")}
                  </a>
                </div>
              )}
              <BuyBlockBucks
                isSaving={autosaving}
                price={price}
                setPrice={setPrice}
                onMaticBuy={onMaticBuy}
                onCreditCardBuy={handleCreditCardBuy}
                onHideBuyBBLabel={(hide) => setHideBuyBBLabel(hide)}
              />
            </div>
          )}
          {tab === 1 && (
            <div className="flex flex-col space-y-2">
              <Label icon={exchangeIcon} type="default" className="mt-2 ml-1">
                {`${t("exchange")} SFL ${t("for")} Coins`}
              </Label>
              {/* Exchange packages */}
              {!exchangePackageId && (
                <div className="flex px-1 pb-2 justify-between gap-1  sm:text-sm sm:gap-2 overflow-x-scroll overflow-y-hidden scrollable">
                  {Object.keys(SFL_TO_COIN_PACKAGES).map((packageId, index) => {
                    const option = SFL_TO_COIN_PACKAGES[Number(packageId)];

                    return (
                      <ButtonPanel
                        key={JSON.stringify(option)}
                        className="flex relative flex-col flex-1 items-center p-2 cursor-pointer hover:bg-brown-300"
                        onClick={() => setExchangePackageId(Number(packageId))}
                      >
                        <span className="whitespace-nowrap mb-2">{`${option.coins} coins`}</span>
                        <div className="flex flex-1 justify-center items-center mb-6 w-full relative">
                          <SquareIcon width={24} icon={COIN_IMAGES[index]} />
                        </div>
                        <Label
                          icon={sflIcon}
                          type="warning"
                          iconWidth={11}
                          className="absolute h-7  -bottom-2"
                          style={{
                            left: `${PIXEL_SCALE * -3}px`,
                            right: `${PIXEL_SCALE * -3}px`,
                            width: `calc(100% + ${PIXEL_SCALE * 6}px)`,
                          }}
                        >
                          {`${option.sfl} SFL`}
                        </Label>
                      </ButtonPanel>
                    );
                  })}
                </div>
              )}
              {/* Exchange confirmation */}
              {!!exchangePackageId && (
                <div className="flex flex-col space-y-1">
                  <div className="py-1">
                    <img
                      src={SUNNYSIDE.icons.arrow_left}
                      className="h-6 w-6 ml-2 cursor-pointer"
                      onClick={() => setExchangePackageId(undefined)}
                    />
                  </div>
                  <div className="flex px-1 pb-1 w-full items-center text-sm justify-between">
                    <div className="flex items-center space-x-2">
                      <span>
                        {t("item")}{" "}
                        {SFL_TO_COIN_PACKAGES[Number(exchangePackageId)].coins}{" "}
                        {"x"}
                      </span>
                      <img src={coinsIcon} className="w-6" />
                    </div>
                    <span>{`${t("total")} ${
                      SFL_TO_COIN_PACKAGES[Number(exchangePackageId)].sfl
                    } SFL`}</span>
                  </div>
                  <Button
                    onClick={() => handleSFLtoCoinsExchange(exchangePackageId)}
                  >
                    {t("confirm")}
                  </Button>
                </div>
              )}
            </div>
          )}
          {tab === 2 && hasFeatureAccess(state, "BANNER_SALES") && (
            <VIPItems onClose={onClose} />
          )}
        </CloseButtonPanel>
      )}
    </Modal>
  );
};
