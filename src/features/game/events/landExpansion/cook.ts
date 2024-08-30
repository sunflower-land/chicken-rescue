import cloneDeep from "lodash.clonedeep";
import Decimal from "decimal.js-light";
import {
  ConsumableName,
  CookableName,
  COOKABLES,
} from "features/game/types/consumables";
import { Bumpkin, GameState } from "features/game/types/game";
import { getKeys } from "features/game/types/craftables";
import { getCookingTime } from "features/game/expansion/lib/boosts";
import { translate } from "lib/i18n/translate";
import { FeatureName } from "lib/flags";
import {
  BuildingName,
  CookingBuildingName,
} from "features/game/types/buildings";

export const FLAGGED_RECIPES: Partial<Record<ConsumableName, FeatureName>> = {};

export type RecipeCookedAction = {
  type: "recipe.cooked";
  item: CookableName;
  buildingId: string;
};

type Options = {
  state: Readonly<GameState>;
  action: RecipeCookedAction;
  createdAt?: number;
};

type GetReadyAtArgs = {
  buildingId: string;
  item: CookableName;
  bumpkin: Bumpkin;
  createdAt: number;
  game: GameState;
};

export const BUILDING_OIL_BOOSTS: Record<CookingBuildingName, number> = {
  "Fire Pit": 0.2,
  Kitchen: 0.25,
  Bakery: 0.35,
  Deli: 0.4,
};

export function isCookingBuilding(
  building: BuildingName,
): building is CookingBuildingName {
  return Object.keys(BUILDING_OIL_BOOSTS).includes(building);
}

export function getCookingOilBoost(
  item: CookableName,
  game: GameState,
  buildingId?: string,
): { timeToCook: number; oilConsumed: number } {
  const buildingName = COOKABLES[item].building;

  if (!isCookingBuilding(buildingName) || !buildingId) {
    return { timeToCook: COOKABLES[item].cookingSeconds, oilConsumed: 0 };
  }

  const building = game.buildings?.[buildingName]?.find(
    (building) => building.id === buildingId,
  );

  const itemCookingTime = COOKABLES[item].cookingSeconds;

  const itemOilConsumption = getOilConsumption(buildingName, item);
  const oilRemaining = building?.oil || 0;

  const boostValue = BUILDING_OIL_BOOSTS[buildingName];
  const boostedCookingTime = itemCookingTime * (1 - boostValue);

  if (oilRemaining >= itemOilConsumption) {
    return { timeToCook: boostedCookingTime, oilConsumed: itemOilConsumption };
  }

  // Calculate the partial boost based on remaining oil
  const effectiveBoostValue = (oilRemaining / itemOilConsumption) * boostValue;
  const partialBoostedCookingTime = itemCookingTime * (1 - effectiveBoostValue);

  return {
    timeToCook: partialBoostedCookingTime,
    oilConsumed: (oilRemaining / itemOilConsumption) * itemOilConsumption,
  };
}

export const getReadyAt = ({
  buildingId,
  item,
  bumpkin,
  createdAt,
  game,
}: GetReadyAtArgs) => {
  const withOilBoost = getCookingOilBoost(item, game, buildingId).timeToCook;

  const seconds = getCookingTime(withOilBoost, bumpkin, game);

  return createdAt + seconds * 1000;
};

export const BUILDING_DAILY_OIL_CONSUMPTION: Record<
  CookingBuildingName,
  number
> = {
  "Fire Pit": 1,
  Kitchen: 5,
  Bakery: 10,
  Deli: 12,
};

export function getOilConsumption(
  buildingName: CookingBuildingName,
  food: CookableName,
) {
  const SECONDS_IN_A_DAY = 86400;
  const oilRequired = COOKABLES[food].cookingSeconds / SECONDS_IN_A_DAY;

  return BUILDING_DAILY_OIL_CONSUMPTION[buildingName] * oilRequired;
}

export function cook({
  state,
  action,
  createdAt = Date.now(),
}: Options): GameState {
  const stateCopy: GameState = cloneDeep(state);

  const { building: requiredBuilding, ingredients } = COOKABLES[action.item];
  const { buildings, bumpkin } = stateCopy;
  const buildingsOfRequiredType = buildings[requiredBuilding];

  if (!Object.keys(buildings).length || !buildingsOfRequiredType) {
    throw new Error(translate("error.requiredBuildingNotExist"));
  }

  const building = buildingsOfRequiredType.find(
    (building) => building.id === action.buildingId,
  );

  if (bumpkin === undefined) {
    throw new Error("You do not have a Bumpkin!");
  }

  if (!building) {
    throw new Error(translate("error.requiredBuildingNotExist"));
  }

  if (building.crafting !== undefined) {
    throw new Error(translate("error.cookingInProgress"));
  }

  const oilConsumed = getCookingOilBoost(
    action.item,
    stateCopy,
    action.buildingId,
  ).oilConsumed;

  stateCopy.inventory = getKeys(ingredients).reduce((inventory, ingredient) => {
    const count = inventory[ingredient] || new Decimal(0);
    const amount = ingredients[ingredient] || new Decimal(0);

    if (count.lessThan(amount)) {
      throw new Error(`Insufficient ingredient: ${ingredient}`);
    }

    return {
      ...inventory,
      [ingredient]: count.sub(amount),
    };
  }, stateCopy.inventory);

  building.crafting = {
    name: action.item,
    boost: { Oil: oilConsumed },
    readyAt: getReadyAt({
      buildingId: action.buildingId,
      item: action.item,
      bumpkin,
      createdAt,
      game: stateCopy,
    }),
  };

  const previousOilRemaining = building.oil || 0;

  building.oil = previousOilRemaining - oilConsumed;

  return stateCopy;
}
