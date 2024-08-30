import React, { SyntheticEvent, useContext, useRef, useState } from "react";
import { useActor } from "@xstate/react";
import { Box } from "components/ui/Box";
import { Button } from "components/ui/Button";
import { CraftingRequirements } from "components/ui/layouts/CraftingRequirements";
import { SplitScreenView } from "components/ui/SplitScreenView";
import Decimal from "decimal.js-light";
import { Context } from "features/game/GameProvider";
import { getKeys } from "features/game/types/decorations";
import { ITEM_DETAILS } from "features/game/types/images";
import { TREASURE_TOOLS, TreasureToolName } from "features/game/types/tools";
import { makeBulkBuyTools } from "features/island/buildings/components/building/market/lib/makeBulkBuyAmount";
import { Restock } from "features/island/buildings/components/building/market/Restock";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  TREASURE_COLLECTIBLE_ITEM,
  TreasureCollectibleItem,
} from "features/game/types/collectibles";
import { gameAnalytics } from "lib/gameAnalytics";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import {
  ARTEFACT_SHOP_WEARABLES,
  ArtefactShopWearables,
} from "features/game/types/artefactShop";
import { getSeasonalTicket } from "features/game/types/seasons";
import { BumpkinItem, ITEM_IDS } from "features/game/types/bumpkin";
import { getImageUrl } from "lib/utils/getImageURLS";
import { BUMPKIN_ITEM_BUFF_LABELS } from "features/game/types/bumpkinItemBuffs";
import { COLLECTIBLE_BUFF_LABELS } from "features/game/types/collectibleItemBuffs";

import lightning from "assets/icons/lightning.png";

interface ToolContentProps {
  selectedName: TreasureToolName;
  onClose: () => void;
}

const ToolContent: React.FC<ToolContentProps> = ({ onClose, selectedName }) => {
  const { t } = useAppTranslation();

  const { gameService, shortcutItem } = useContext(Context);

  const [
    {
      context: { state },
    },
  ] = useActor(gameService);

  const stock = state.stock[selectedName] || new Decimal(0);
  const selected = TREASURE_TOOLS[selectedName];
  const inventory = state.inventory;
  const bulkToolCraftAmount = makeBulkBuyTools(stock);

  const lessFunds = (amount = 1) => {
    if (!selected.price) return;

    return state.coins < selected.price * amount;
  };
  const lessIngredients = (amount = 1) =>
    getKeys(selected.ingredients).some((name) =>
      selected.ingredients[name]?.mul(amount).greaterThan(inventory[name] || 0),
    );

  const craft = (event: SyntheticEvent, amount: number) => {
    event.stopPropagation();
    gameService.send("tool.crafted", {
      tool: selectedName,
      amount,
    });

    shortcutItem(selectedName);
  };

  return (
    <CraftingRequirements
      gameState={state}
      stock={stock}
      details={{ item: selectedName }}
      requirements={{
        coins: selected.price,
        resources: selected.ingredients,
      }}
      actionView={
        <>
          {stock.equals(0) ? (
            <Restock onClose={onClose} />
          ) : (
            <div className="flex space-x-1 sm:space-x-0 sm:space-y-1 sm:flex-col w-full">
              <Button
                disabled={lessFunds() || lessIngredients() || stock.lessThan(1)}
                onClick={(e) => craft(e, 1)}
              >
                {t("craft")} {"1"}
              </Button>
              {bulkToolCraftAmount > 1 && (
                <Button
                  disabled={
                    lessFunds(bulkToolCraftAmount) ||
                    lessIngredients(bulkToolCraftAmount)
                  }
                  onClick={(e) => craft(e, bulkToolCraftAmount)}
                >
                  {t("craft")} {bulkToolCraftAmount}
                </Button>
              )}
            </div>
          )}
        </>
      }
    />
  );
};

interface CollectibleContentProps {
  selectedName: TreasureCollectibleItem;
  onClose: () => void;
}

const CollectibleContent: React.FC<CollectibleContentProps> = ({
  selectedName,
  onClose,
}) => {
  const { t } = useAppTranslation();

  const selected = TREASURE_COLLECTIBLE_ITEM[selectedName];
  const { gameService, shortcutItem } = useContext(Context);
  const [
    {
      context: { state },
    },
  ] = useActor(gameService);
  const inventory = state.inventory;

  const lessIngredients = () =>
    getKeys(selected.ingredients).some((name) =>
      selected.ingredients[name]?.greaterThan(inventory[name] || 0),
    );
  const isAlreadyCrafted = inventory[selectedName]?.greaterThanOrEqualTo(1);
  const isBoost = COLLECTIBLE_BUFF_LABELS[selectedName]?.shortDescription;

  const craft = () => {
    gameService.send("collectible.crafted", {
      name: selectedName,
    });

    const count = inventory[selectedName]?.toNumber() ?? 1;
    gameAnalytics.trackMilestone({
      event: `Crafting:Collectible:${selectedName}${count}`,
    });

    shortcutItem(selectedName);
  };

  return (
    <CraftingRequirements
      gameState={state}
      details={{
        item: selectedName,
        from: selected.from,
        to: selected.to,
      }}
      boost={isBoost}
      requirements={{
        resources: selected.ingredients,
        coins: selected.coins,
      }}
      actionView={
        isAlreadyCrafted && isBoost ? (
          <p className="text-xxs text-center mb-1 font-secondary">
            {t("alr.crafted")}
          </p>
        ) : (
          <Button disabled={lessIngredients()} onClick={craft}>
            {t("craft")}
          </Button>
        )
      }
    />
  );
};

interface WearableContentProps {
  selectedName: keyof ArtefactShopWearables;
  onClose: () => void;
}

const WearableContent: React.FC<WearableContentProps> = ({
  selectedName,
  onClose,
}) => {
  const { t } = useAppTranslation();

  const selected = ARTEFACT_SHOP_WEARABLES[selectedName];
  const { gameService, shortcutItem } = useContext(Context);
  const [
    {
      context: { state },
    },
  ] = useActor(gameService);
  const inventory = state.inventory;
  const wardrobe = state.wardrobe;

  if (!selected) return null;

  const lessIngredients = () =>
    getKeys(selected.ingredients).some((name) =>
      selected.ingredients[name]?.greaterThan(inventory[name] || 0),
    );
  const isAlreadyCrafted = (wardrobe[selectedName] ?? 0) >= 1;
  const isBoost = BUMPKIN_ITEM_BUFF_LABELS[selectedName]?.shortDescription;

  const craft = () => {
    gameService.send("wearable.bought", {
      name: selectedName,
    });

    if (selected.ingredients["Block Buck"]) {
      gameAnalytics.trackSink({
        currency: "Block Buck",
        amount: selected.ingredients["Block Buck"].toNumber() ?? 1,
        item: selectedName,
        type: "Wearable",
      });
    }

    if (selected.ingredients[getSeasonalTicket()]) {
      gameAnalytics.trackSink({
        currency: "Seasonal Ticket",
        amount: selected.ingredients[getSeasonalTicket()]?.toNumber() ?? 1,
        item: selectedName,
        type: "Wearable",
      });
    }
  };

  return (
    <CraftingRequirements
      gameState={state}
      details={{
        wearable: selectedName,
        from: selected.from,
        to: selected.to,
      }}
      boost={isBoost}
      requirements={{
        resources: selected.ingredients,
        coins: selected.coins,
      }}
      actionView={
        isAlreadyCrafted && isBoost ? (
          <p className="text-xxs text-center mb-1 font-secondary">
            {t("alr.crafted")}
          </p>
        ) : (
          <Button disabled={lessIngredients()} onClick={craft}>
            {t("craft")}
          </Button>
        )
      }
    />
  );
};

interface Props {
  onClose: (e?: SyntheticEvent) => void;
}

export const TreasureShopBuy: React.FC<Props> = ({ onClose }) => {
  const { t } = useAppTranslation();

  const [selectedName, setSelectedName] = useState<
    TreasureToolName | TreasureCollectibleItem | BumpkinItem
  >("Sand Shovel");
  const { gameService, shortcutItem } = useContext(Context);

  const [
    {
      context: { state },
    },
  ] = useActor(gameService);

  const divRef = useRef<HTMLDivElement>(null);

  const inventory = state.inventory;
  const wardobe = state.wardrobe;

  const onToolClick = (toolName: TreasureToolName) => {
    setSelectedName(toolName);
    shortcutItem(toolName);
  };

  const isTool = (
    name: TreasureToolName | TreasureCollectibleItem | BumpkinItem,
  ): name is TreasureToolName => name in TREASURE_TOOLS;

  const isCollectible = (
    name: TreasureToolName | TreasureCollectibleItem | BumpkinItem,
  ): name is TreasureCollectibleItem => name in TREASURE_COLLECTIBLE_ITEM;

  const now = Date.now();
  const shopCollectibles = getKeys(TREASURE_COLLECTIBLE_ITEM).filter(
    (itemName) =>
      (TREASURE_COLLECTIBLE_ITEM[itemName].from?.getTime() ?? 0) <= now &&
      (TREASURE_COLLECTIBLE_ITEM[itemName].to?.getTime() ?? Infinity) > now,
  );

  const unlimitedCollectibles = shopCollectibles.filter(
    (itemName) => !TREASURE_COLLECTIBLE_ITEM[itemName].to,
  );

  const limitedCollectibles = shopCollectibles.filter(
    (itemName) => !!TREASURE_COLLECTIBLE_ITEM[itemName].to,
  );

  const shopWearables = getKeys(ARTEFACT_SHOP_WEARABLES).filter(
    (itemName) =>
      (ARTEFACT_SHOP_WEARABLES[itemName]?.from?.getTime() ?? 0) <= now &&
      (ARTEFACT_SHOP_WEARABLES[itemName]?.to?.getTime() ?? Infinity) > now,
  );
  const unlimitedWearables = shopWearables.filter(
    (itemName) => !ARTEFACT_SHOP_WEARABLES[itemName]?.to,
  );

  const limitedWearables = shopWearables.filter(
    (itemName) => !!ARTEFACT_SHOP_WEARABLES[itemName]?.to,
  );

  return (
    <SplitScreenView
      divRef={divRef}
      panel={
        isTool(selectedName) ? (
          <ToolContent onClose={onClose} selectedName={selectedName} />
        ) : isCollectible(selectedName) ? (
          <CollectibleContent onClose={onClose} selectedName={selectedName} />
        ) : (
          <WearableContent onClose={onClose} selectedName={selectedName} />
        )
      }
      content={
        <div className="flex flex-col w-full">
          <Label type="default">{t("tools")}</Label>
          <div className="flex flex-wrap mb-2">
            {getKeys(TREASURE_TOOLS).map((toolName) => {
              return (
                <Box
                  isSelected={selectedName === toolName}
                  key={toolName}
                  onClick={() => onToolClick(toolName)}
                  image={ITEM_DETAILS[toolName].image}
                  count={inventory[toolName]}
                />
              );
            })}
          </div>

          <Label type="default">{t("collectibles")}</Label>
          <div className="flex flex-wrap mb-2">
            {limitedCollectibles.map((name) => (
              <Box
                isSelected={selectedName === name}
                secondaryImage={SUNNYSIDE.icons.stopwatch}
                alternateIcon={
                  COLLECTIBLE_BUFF_LABELS[name] ? lightning : undefined
                }
                key={name}
                onClick={() => setSelectedName(name)}
                count={inventory[name]}
                image={ITEM_DETAILS[name].image}
              />
            ))}
            {unlimitedCollectibles.map((name) => {
              return (
                <Box
                  isSelected={selectedName === name}
                  key={name}
                  alternateIcon={
                    COLLECTIBLE_BUFF_LABELS[name] ? lightning : undefined
                  }
                  onClick={() => setSelectedName(name)}
                  count={inventory[name]}
                  image={ITEM_DETAILS[name].image}
                />
              );
            })}
          </div>

          <Label type="default">{t("wearables")}</Label>
          <div className="flex flex-wrap mb-2">
            {limitedWearables.map((name) => (
              <Box
                isSelected={selectedName === name}
                secondaryImage={SUNNYSIDE.icons.stopwatch}
                alternateIcon={
                  BUMPKIN_ITEM_BUFF_LABELS[name] ? lightning : undefined
                }
                key={name}
                onClick={() => setSelectedName(name)}
                count={new Decimal(wardobe[name] ?? 0)}
                image={getImageUrl(ITEM_IDS[name])}
              />
            ))}
            {unlimitedWearables.map((name) => {
              return (
                <Box
                  isSelected={selectedName === name}
                  key={name}
                  onClick={() => setSelectedName(name)}
                  count={new Decimal(wardobe[name] ?? 0)}
                  image={getImageUrl(ITEM_IDS[name])}
                  alternateIcon={
                    BUMPKIN_ITEM_BUFF_LABELS[name] ? lightning : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      }
    />
  );
};
