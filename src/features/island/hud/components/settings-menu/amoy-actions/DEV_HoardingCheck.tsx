import { Button } from "components/ui/Button";
import { KNOWN_IDS } from "features/game/types";
import React, { ChangeEvent, useState } from "react";
import GameABI from "lib/blockchain/abis/SunflowerLandGame.json";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { BumpkinItem, ITEM_IDS } from "features/game/types/bumpkin";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { ContentComponentProps } from "../GameOptions";

interface Props {
  network: "mainnet" | "amoy";
}

export const DEV_HoarderCheck: React.FC<Props & ContentComponentProps> = ({
  network,
}) => {
  const { t } = useAppTranslation();
  const [loading, setLoading] = useState(false);
  const [farmId, setFarmId] = useState("");
  const [inventoryLimits, setInventoryLimits] = useState<string[]>([]);
  const [wardrobeLimits, setWardrobeLimits] = useState<string[]>([]);

  async function search() {
    setLoading(true);
    setInventoryLimits([]);
    setWardrobeLimits([]);

    const API_URL =
      network === "mainnet"
        ? "https://api.sunflower-land.com"
        : "https://api-dev.sunflower-land.com";

    try {
      const result = await window.fetch(`${API_URL}/community/getFarms`, {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          ids: [Number(farmId)],
        }),
      });

      const json = await result.json();

      // INVENTORY LIMITS
      const current = json.farms[farmId].inventory;
      const previous = json.farms[farmId].previousInventory;

      const maxIds = Object.keys(current)
        .filter(
          (k) => ((current as any)[k] ?? 0) - ((previous as any)[k] ?? 0) > 0,
        )
        .map(String)
        .map((key) => (KNOWN_IDS as any)[key]);

      const rpc =
        network === "mainnet"
          ? "https://polygon-rpc.com/"
          : "https://rpc.ankr.com/polygon_amoy";

      const gameContract =
        network === "mainnet"
          ? "0xfB84a7D985f9336987C89e1518E9A897b013080B"
          : "0x05BbC2c442A7468538e68B1F70a97C9140227b0e";
      const web3 = new Web3(rpc);
      const contract = new web3.eth.Contract(
        GameABI as AbiItem[],
        gameContract,
      );
      const maxAmount = await contract.methods.getMaxItemAmounts(maxIds).call();
      const inventoryLimits: string[] = [];

      Object.keys(current).forEach((key) => {
        const diff =
          Number((current as any)[key]) - Number((previous as any)[key] ?? 0);
        if (diff > 0) {
          let limit = maxAmount[maxIds.indexOf((KNOWN_IDS as any)[key])];

          if (limit > 100000) {
            limit = limit / 10 ** 18;
          }

          if (diff > limit) {
            inventoryLimits.push(`${key} (Diff ${diff} > Limit ${limit})`);
          }
        }
      });

      setInventoryLimits(inventoryLimits);

      // WARDROBE LIMITS

      const wardrobeLimits: string[] = [];

      const currentWardrobe = json.farms[farmId].wardrobe;
      const previousWardrobe = json.farms[farmId].previousWardrobe;

      const getOnChainMax = async (wearableName: string) => {
        const id = ITEM_IDS[wearableName as BumpkinItem];
        const storage = web3.utils.soliditySha3(
          { type: "uint256", value: String(id) },
          { type: "uint", value: "13" },
        ) as string;

        const hex = await web3.eth.getStorageAt(gameContract, storage);

        return parseInt(hex, 16);
      };

      for (const key of Object.keys(currentWardrobe)) {
        const diff =
          Number((currentWardrobe as any)[key]) -
          Number((previousWardrobe as any)[key] ?? 0);
        if (diff > 0) {
          const limit = await getOnChainMax(key);
          if (diff > limit) {
            wardrobeLimits.push(
              `${key} (Diff ${diff} > Limit ${await getOnChainMax(key)})`,
            );
          }
        }
      }

      setWardrobeLimits(wardrobeLimits);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>{t("loading")}</div>;
  }

  return (
    <>
      {network}
      <input
        style={{
          boxShadow: "#b96e50 0px 1px 1px 1px inset",
          border: "2px solid #ead4aa",
        }}
        type="text"
        min={1}
        value={farmId}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setFarmId(e.target.value);
        }}
        className={
          "text-shadow mr-2 rounded-sm shadow-inner shadow-black bg-brown-200 w-full p-2 h-10"
        }
      />
      {inventoryLimits.length === 0 && wardrobeLimits.length === 0 && (
        <div>{t("no.limits.exceeded")}</div>
      )}
      {inventoryLimits.map((limit) => (
        <div key={limit}>{limit}</div>
      ))}
      {wardrobeLimits.map((limit) => (
        <div key={limit}>{limit}</div>
      ))}

      <Button onClick={search} className="pt-2">
        {t("check")}
      </Button>
    </>
  );
};
