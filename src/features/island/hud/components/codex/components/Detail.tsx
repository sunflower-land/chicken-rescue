import React, { useLayoutEffect } from "react";
import { SUNNYSIDE } from "assets/sunnyside";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { InventoryItemName } from "features/game/types/game";

import { getOpenSeaLink } from "../lib/utils";
import { KNOWN_IDS } from "features/game/types";
import { ITEM_DETAILS } from "features/game/types/images";
import { Label } from "components/ui/Label";
import classNames from "classnames";
import { COLLECTIBLE_BUFF_LABELS } from "features/game/types/collectibleItemBuffs";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { InnerPanel, OuterPanel } from "components/ui/Panel";
import { translateTerms } from "lib/i18n/translate";

/**
 * Base Layout for Collectible Item Details Page in Codex
 * It can be extended by passing in addition children components
 */
type Props = {
  name: InventoryItemName;
  caught: boolean;
  /**
   * These labels will be rendered on the right side of the page along with any associated boost labels
   */
  additionalLabels?: React.ReactNode;
  children?: React.ReactNode;
  onBack: () => void;
};

export const Detail: React.FC<Props> = ({
  name,
  caught,
  onBack,
  additionalLabels,
  children,
}) => {
  const { t } = useAppTranslation();
  const {
    image,
    description,
    howToGetItem = [],
    itemType,
  } = ITEM_DETAILS[name];
  const [imageWidth, setImageWidth] = React.useState<number>(0);

  useLayoutEffect(() => {
    const image = new Image();

    image.onload = function () {
      const trueWidth = image.width;
      const scaledWidth = trueWidth * PIXEL_SCALE;

      setImageWidth(scaledWidth);
    };

    image.src = ITEM_DETAILS[name].image;
  }, []);

  const buff = COLLECTIBLE_BUFF_LABELS[name];

  return (
    <>
      <InnerPanel className="p-2 relative mb-1">
        <div className="flex mb-2">
          <div
            className="flex items-start"
            style={{
              width: `${PIXEL_SCALE * 11}px`,
              height: `${PIXEL_SCALE * 11}px`,
            }}
          >
            <img
              src={SUNNYSIDE.icons.arrow_left}
              className="cursor-pointer flex-none"
              onClick={onBack}
              style={{
                width: `${PIXEL_SCALE * 11}px`,
              }}
            />
          </div>
          <div className="flex-1 flex justify-center">
            <h2 className="text-center">{name}</h2>
          </div>
          <div
            className="flex-none"
            style={{
              width: `${PIXEL_SCALE * 11}px`,
            }}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex gap-1">
            <OuterPanel className="rounded-md overflow-hidden shadow-md mr-2 flex justify-center items-center h-fit">
              <img
                src={image}
                alt={name}
                className={classNames({ "brightness-0": !caught })}
                style={{
                  width: `${imageWidth}px`,
                }}
              />
            </OuterPanel>
            <div className="flex flex-1 content-start flex-col sm:flex-row sm:flex-wrap gap-2 p-1">
              {additionalLabels}
              {/* Boost labels to go below */}
              {!!buff && (
                <Label
                  type={buff.labelType}
                  icon={buff.boostTypeIcon}
                  secondaryIcon={buff.boostedItemIcon}
                >
                  {buff.shortDescription}
                </Label>
              )}
              {!!itemType && (
                <Label type="default" className="capitalize">
                  {itemType}
                </Label>
              )}
            </div>
          </div>
        </div>
      </InnerPanel>
      <InnerPanel>
        <div className="p-1">
          <p className="text-xs">{translateTerms(description)}</p>
          <div className="border-b-[1px] border-brown-600 mt-3" />
          {howToGetItem.length > 0 && (
            <div className="flex flex-col mt-2">
              <h3 className="text-sm mb-2">{t("detail.how.item")}</h3>
              <ul className="text-xxs space-y-1">
                {howToGetItem.map((text, index) => (
                  <li className="flex" key={`how-to-obtain-${index}`}>
                    <div className="mr-1">{"-"}</div>
                    <span>{translateTerms(text)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Information */}
          {children}
          <div className="flex items-center text-xxs mt-1">
            <span>
              {t("detail.view.item")}{" "}
              <a
                href={getOpenSeaLink(KNOWN_IDS[name], "collectible")}
                className="underline text-xxs pb-1 pt-0.5 hover:text-blue-500 !text-[18px]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("opensea")}
              </a>
            </span>
          </div>
        </div>
      </InnerPanel>
    </>
  );
};
