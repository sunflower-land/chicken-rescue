import React, { Dispatch, SetStateAction, useContext } from "react";
import { useActor } from "@xstate/react";
import Decimal from "decimal.js-light";

import { Box } from "components/ui/Box";
import { Button } from "components/ui/Button";
import { Context } from "features/game/GameProvider";
import { Label } from "components/ui/Label";
import { ITEM_DETAILS } from "features/game/types/images";
import { getKeys } from "features/game/types/craftables";
import {
  ConsumableName,
  Cookable,
  CookableName,
} from "features/game/types/consumables";

import { InProgressInfo } from "../building/InProgressInfo";
import { MachineInterpreter } from "../../lib/craftingMachine";
import {
  getCookingTime,
  getFoodExpBoost,
} from "features/game/expansion/lib/boosts";
import { Bumpkin } from "features/game/types/game";
import { SplitScreenView } from "components/ui/SplitScreenView";
import { CraftingRequirements } from "components/ui/layouts/CraftingRequirements";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  FLAGGED_RECIPES,
  getCookingOilBoost,
} from "features/game/events/landExpansion/cook";
import { FeatureName, hasFeatureAccess } from "lib/flags";
import { BuildingName } from "features/game/types/buildings";
import { BuildingOilTank } from "../building/BuildingOilTank";
import pumpkinSoup from "assets/food/pumpkin_soup.png";
import powerup from "assets/icons/level_up.png";

interface Props {
  selected: Cookable;
  setSelected: Dispatch<SetStateAction<Cookable>>;
  recipes: Cookable[];
  onClose: () => void;
  onCook: (name: CookableName) => void;
  craftingService?: MachineInterpreter;
  crafting: boolean;
  buildingName: BuildingName;
  buildingId?: string;
  currentlyCooking?: CookableName;
}

/**
 * The recipes of a food producing building.
 * @selected The selected food in the interface.  This prop is set in the parent so closing the modal will not reset the selected state.
 * @setSelected Sets the selected food in the interface.  This prop is set in the parent so closing the modal will not reset the selected state.
 * @recipes The list of available recipes.
 * @onClose The close action.
 * @onCook The cook action.
 * @crafting Whether the building is in the process of crafting a food item.
 * @craftingService The crafting service.
 */

export const Recipes: React.FC<Props> = ({
  selected,
  setSelected,
  recipes,
  onClose,
  onCook,
  crafting,
  craftingService,
  buildingId,
  currentlyCooking,
  buildingName,
}) => {
  const { gameService } = useContext(Context);
  const { t } = useAppTranslation();
  const [
    {
      context: { state },
    },
  ] = useActor(gameService);
  const inventory = state.inventory;

  const lessIngredients = () =>
    getKeys(selected.ingredients).some((name) =>
      selected?.ingredients[name]?.greaterThan(inventory[name] || 0),
    );

  const cook = async () => {
    onClose();
    // delay to allow the modal to close to avoid content flashing
    await new Promise((resolve) => setTimeout(resolve, 300));
    onCook(selected.name);
  };

  const validRecipes = recipes.filter((recipes) => {
    const flag = FLAGGED_RECIPES[recipes.name];
    if (!flag) {
      return true;
    }

    return hasFeatureAccess(
      state,
      FLAGGED_RECIPES[recipes.name as ConsumableName] as FeatureName,
    );
  });

  const isOilBoosted =
    state.buildings?.[buildingName]?.[0].crafting?.boost?.["Oil"];

  return (
    <SplitScreenView
      panel={
        <>
          {selected.name === "Reindeer Carrot" &&
            Date.now() < new Date("2024-06-22").getTime() && (
              <Label className="mx-auto" type="info" icon={powerup}>
                {t("firepit.increasedXP")}
              </Label>
            )}
          <CraftingRequirements
            gameState={state}
            details={{
              item: selected.name,
            }}
            hideDescription
            requirements={{
              resources: selected.ingredients,
              xp: new Decimal(
                getFoodExpBoost(
                  selected,
                  state.bumpkin as Bumpkin,
                  state,
                  state.buds ?? {},
                ),
              ),
              timeSeconds: getCookingTime(
                getCookingOilBoost(selected.name, state, buildingId).timeToCook,
                state.bumpkin,
                state,
              ),
            }}
            actionView={
              <>
                <Button
                  disabled={lessIngredients() || crafting || selected.disabled}
                  className="text-xxs sm:text-sm mt-1 whitespace-nowrap"
                  onClick={() => cook()}
                >
                  {t("cook")}
                </Button>
                {crafting && (
                  <p className="sm:text-xs text-center my-1">
                    {t("sceneDialogues.chefIsBusy")}
                  </p>
                )}
              </>
            }
          />
        </>
      }
      content={
        <>
          {craftingService && (
            <InProgressInfo
              craftingService={craftingService}
              onClose={onClose}
              isOilBoosted={!!isOilBoosted}
            />
          )}
          {crafting && (
            <div className="w-full">
              <Label
                className="mr-3 ml-2 mb-1"
                icon={pumpkinSoup}
                type="default"
              >
                {t("recipes")}
              </Label>
            </div>
          )}
          <div className="flex flex-wrap h-fit">
            {validRecipes.map((item) => (
              <Box
                isSelected={selected.name === item.name}
                key={item.name}
                onClick={() => setSelected(item)}
                image={ITEM_DETAILS[item.name].image}
                count={inventory[item.name]}
              />
            ))}
          </div>
          {buildingId ? (
            <BuildingOilTank
              buildingName={buildingName}
              buildingId={buildingId}
              currentlyCooking={currentlyCooking}
            />
          ) : null}
        </>
      }
    />
  );
};
