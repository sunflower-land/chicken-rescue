import { InventoryItemName } from "features/game/types/game";
import { ITEM_DETAILS } from "features/game/types/images";
import React from "react";
import { RequirementLabel } from "../RequirementsLabel";
import { SquareIcon } from "../SquareIcon";
import Decimal from "decimal.js-light";
import { translateTerms } from "lib/i18n/translate";
import { SUNNYSIDE } from "assets/sunnyside";
import { formatDateRange } from "lib/utils/time";
import { Label } from "../Label";

/**
 * The props for the details for items.
 * @param item The item.
 */
interface ItemDetailsProps {
  item: InventoryItemName;
  from?: Date;
  to?: Date;
}

/**
 * The props for selling the item.
 * @param coins The coins gained for selling the item.
 */
interface PropertiesProps {
  coins?: number;
  sfl?: Decimal;
}

/**
 * The props for the component.
 * @param details The item details.
 * @param requirements The item properties.
 * @param actionView The view for displaying the crafting action.
 */
interface Props {
  details: ItemDetailsProps;
  properties?: PropertiesProps;
  actionView?: JSX.Element;
}

/**
 * The view for displaying item name, details, properties and action.
 * @props The component props.
 */
export const ShopSellDetails: React.FC<Props> = ({
  details,
  properties,
  actionView,
}: Props) => {
  const getItemDetail = () => {
    const item = ITEM_DETAILS[details.item];
    const icon = item.image;
    const title = details.item;
    const description = translateTerms(item.description);

    return (
      <>
        <div className="flex space-x-2 justify-start items-center sm:flex-col-reverse md:space-x-0">
          {icon && (
            <div className="sm:mt-2">
              <SquareIcon icon={icon} width={14} />
            </div>
          )}
          <span className="sm:text-center">{title}</span>
        </div>
        <span className="text-xs mb-2 sm:mt-1 whitespace-pre-line sm:text-center">
          {description}
        </span>
      </>
    );
  };

  const getProperties = () => {
    if (!properties) return <></>;

    return (
      <div className="border-t border-white w-full mb-2 pt-2 flex justify-between gap-x-3 gap-y-2 flex-wrap sm:flex-col sm:items-center sm:flex-nowrap">
        {/* Price display */}
        {properties.coins !== undefined && (
          <RequirementLabel
            type="sellForCoins"
            requirement={properties.coins}
          />
        )}
        {!!properties.sfl && (
          <RequirementLabel type="sellForSfl" requirement={properties.sfl} />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col h-full px-1 py-0">
        {details.from && (
          <Label
            icon={SUNNYSIDE.icons.stopwatch}
            type="warning"
            className="my-1 mx-auto whitespace-nowrap"
          >
            {formatDateRange(details.from, details.to as Date)}
          </Label>
        )}
        {getItemDetail()}
        {getProperties()}
      </div>
      {actionView}
    </div>
  );
};
