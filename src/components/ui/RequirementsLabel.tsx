import Decimal from "decimal.js-light";
import { InventoryItemName } from "features/game/types/game";
import React, { useContext } from "react";
import { LABEL_STYLES, Label } from "./Label";
import { SquareIcon } from "./SquareIcon";
import { ITEM_DETAILS } from "features/game/types/images";
import levelup from "assets/icons/level_up.png";
import token from "assets/icons/sfl.webp";
import coins from "assets/icons/coins.webp";
import { secondsToString } from "lib/utils/time";
import classNames from "classnames";
import { SUNNYSIDE } from "assets/sunnyside";
import { formatNumber } from "lib/utils/formatNumber";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { BumpkinItem } from "features/game/types/bumpkin";
import { isWearableActive } from "features/game/lib/wearables";
import { useActor } from "@xstate/react";
import { Context } from "features/game/GameProvider";

/**
 * The props for SFL requirement label. Use this when the item costs SFL.
 * @param type The type is SFL.
 * @param balance The SFL balance of the player.
 * @param requirement The SFL requirement.
 */
interface SFLProps {
  type: "sfl";
  balance: Decimal;
  requirement: Decimal;
  showLabel?: boolean;
}
/**
 * The props for sell for SFL requirement label. Use this when selling the item gives players SFL.
 * @param type The type is sell for SFL.
 * @param requirement The SFL requirement.
 */
interface SellSFLProps {
  type: "sellForSfl";
  requirement: Decimal;
}

/**
 * The props for Coins requirement label. Use this when the item costs Coins.
 * @param type The type is Coins.
 * @param balance The Coins balance of the player.
 * @param requirement The Coins requirement.
 */
interface CoinsProps {
  type: "coins";
  balance: number;
  requirement: number;
  showLabel?: boolean;
}

/**
 * The props for sell for Coins requirement label. Use this when selling the item gives players Coins.
 * @param type The type is sell for Coins.
 * @param requirement The Coins requirement.
 */
interface SellCoinsProps {
  type: "sellForCoins";
  requirement: number;
}

/**
 * The props for item requirement label.
 * @param type The type is item.
 * @param item The item name.
 * @param balance The item balance of the player.
 * @param requirement The item quantity requirement.
 */
interface ItemProps {
  type: "item";
  item: InventoryItemName;
  balance: Decimal;
  requirement: Decimal;
  showLabel?: boolean;
}

interface WearableProps {
  type: "wearable";
  item: BumpkinItem;
  balance: number;
  requirement: BumpkinItem;
  showLabel?: boolean;
}

/**
 * The props for time requirement label.
 * @param type The type is time.
 * @param balance The time requirement.
 */
interface TimeProps {
  type: "time";
  waitSeconds: number;
}

/**
 * The props for XP requirement label.
 * @param type The type is XP.
 * @param xp The XP requirement.
 */
interface XPProps {
  type: "xp";
  xp: Decimal;
}

/**
 * The props for level requirement label.
 * @param type The type is level.
 * @param currentLevel The current level.
 * @param requirement The level requirement.
 */
interface LevelProps {
  type: "level";
  currentLevel: number;
  requirement: number;
}

/**
 * The props for harvests requirement label.
 * @param type The type is harvests.
 * @param minHarvest The minimum number of harvests.
 * @param maxHarvest The maximum number of harvests.
 */
interface HarvestsProps {
  type: "harvests";
  minHarvest: number;
  maxHarvest: number;
}

/**
 * The default props.
 * @param className The class name for the label.
 */
interface defaultProps {
  className?: string;
  textColor?: string;
  hideIcon?: boolean;
}

type Props = (
  | CoinsProps
  | SellCoinsProps
  | SFLProps
  | SellSFLProps
  | ItemProps
  | WearableProps
  | TimeProps
  | XPProps
  | LevelProps
  | HarvestsProps
) &
  defaultProps;

/**
 * The requirement label that consists of an icon and a requirement description.
 * This component is used when displaying individual crafting requirements in a crafting recipe.
 * @props The component props.
 */
export const RequirementLabel: React.FC<Props> = (props) => {
  const { t } = useAppTranslation();
  const { gameService } = useContext(Context);

  const [
    {
      context: { state },
    },
  ] = useActor(gameService);

  const getIcon = () => {
    switch (props.type) {
      case "coins":
      case "sellForCoins":
        return coins;
      case "sfl":
      case "sellForSfl":
        return token;
      case "item":
        return ITEM_DETAILS[props.item].image;
      case "time":
        return SUNNYSIDE.icons.stopwatch;
      case "xp":
      case "level":
        return levelup;
      case "harvests":
        return SUNNYSIDE.icons.seedling;
    }
  };

  const getText = () => {
    switch (props.type) {
      case "coins":
      case "sellForCoins":
        return `${formatNumber(props.requirement)}`;
      case "sfl":
        return `${props.requirement.toNumber()}`;
      case "sellForSfl": {
        return `${props.requirement.toNumber()}`;
      }
      case "item": {
        const roundedDownInventory = formatNumber(props.balance);
        const roundedDownRequirement = formatNumber(props.requirement);
        return `${roundedDownInventory}/${roundedDownRequirement}`;
      }
      case "wearable": {
        return `${props.requirement}`;
      }
      case "time": {
        return secondsToString(props.waitSeconds, {
          length: "medium",
          removeTrailingZeros: true,
        });
      }
      case "xp": {
        return `${formatNumber(props.xp)}XP`;
      }
      case "level": {
        return `${t("level.number", { level: props.requirement })}`;
      }
      case "harvests": {
        return `${t("harvest.number", {
          minHarvest: props.minHarvest,
          maxHarvest: props.maxHarvest,
        })}`;
      }
    }
  };

  const isRequirementMet = () => {
    switch (props.type) {
      case "coins":
        return props.balance >= props.requirement;
      case "sfl":
        return props.balance.greaterThanOrEqualTo(props.requirement);
      case "item":
        return props.balance.greaterThanOrEqualTo(props.requirement);
      case "wearable":
        return props.balance > 0;
      case "level":
        return props.currentLevel >= props.requirement;
      case "sellForSfl":
      case "sellForCoins":
      case "time":
      case "xp":
      case "harvests":
        return true;
    }
  };
  const requirementMet = isRequirementMet();

  const labelType = () => {
    if (props.type === "wearable") {
      if (
        requirementMet &&
        !isWearableActive({ game: state, name: props.requirement })
      ) {
        return "success";
      }
      return "danger";
    }

    return requirementMet ? "transparent" : "danger";
  };

  return (
    <div
      className={classNames(
        props.className,
        "flex justify-between min-h-[26px]",
      )}
    >
      <div className="flex items-center">
        {!props.hideIcon && <SquareIcon icon={getIcon()} width={7} />}
        {props.type === "sfl" && props.showLabel && (
          <span className="text-xs ml-1 ">{"SFL"}</span>
        )}
        {props.type === "item" && props.showLabel && (
          <span className="text-xs ml-1 ">{props.item}</span>
        )}
        {props.type === "wearable" && props.showLabel && (
          <span className="text-xs ml-1 ">{props.item}</span>
        )}
        {props.type === "coins" && props.showLabel && (
          <span className="text-xs ml-1 ">{t("coins")}</span>
        )}
      </div>

      <Label
        className={classNames("whitespace-nowrap font-secondary relative", {
          "ml-1": !requirementMet,
        })}
        type={labelType()}
        secondaryIcon={
          props.type === "wearable"
            ? requirementMet &&
              !isWearableActive({ game: state, name: props.requirement })
              ? SUNNYSIDE.icons.confirm
              : SUNNYSIDE.icons.cancel
            : undefined
        }
        style={{
          color: props.textColor ?? LABEL_STYLES[labelType()].textColour,
        }}
      >
        {getText()}
      </Label>
    </div>
  );
};
