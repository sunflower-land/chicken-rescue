import { CONFIG } from "lib/config";
import { ERRORS } from "lib/errors";
import { GameState, InventoryItemName } from "../types/game";
import { makeGame } from "../lib/transforms";

const API_URL = CONFIG.API_URL;

export type Effect = {
  type: "marketplace.onChainCollectibleListed";
  item: InventoryItemName;
  signature: string;
  sfl: number;
};

type Request = {
  farmId: number;
  token: string;
  transactionId: string;
  effect: Effect;
};

export async function postEffect(request: Request): Promise<GameState> {
  const response = await window.fetch(`${API_URL}/effect/${request.farmId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "X-Transaction-ID": request.transactionId,
      Authorization: `Bearer ${request.token}`,
      accept: "application/json",
      ...((window as any)["x-amz-ttl"]
        ? { "X-Amz-TTL": (window as any)["x-amz-ttl"] }
        : {}),
    },
    body: JSON.stringify({
      effect: request.effect,
      createdAt: new Date().toISOString(),
    }),
  });

  if (response.status === 429) {
    throw new Error(ERRORS.TOO_MANY_REQUESTS);
  }

  if (response.status !== 200 || !response.ok) {
    throw new Error(ERRORS.EFFECT_SERVER_ERROR);
  }

  const data = await response.json();

  return makeGame(data);
}
