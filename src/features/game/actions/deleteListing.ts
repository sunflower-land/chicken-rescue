import { CONFIG } from "lib/config";
import { ERRORS } from "lib/errors";
import { GameState } from "../types/game";
import { makeGame } from "../lib/transforms";

const API_URL = CONFIG.API_URL;

type Request = {
  sellerId: number;
  listingId: string;
  listingType: string;
  token: string;
  transactionId: string;
};
type Response = {
  farm: GameState;
  error?: "ALREADY_BOUGHT";
};

export async function deleteListingRequest(
  request: Request,
): Promise<Response> {
  const response = await window.fetch(`${API_URL}/listings`, {
    method: "DELETE",
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
      listingId: request.listingId,
      listingType: request.listingType,
      sellerId: request.sellerId,
      createdAt: new Date().toISOString(),
    }),
  });

  if (response.status === 429) {
    throw new Error(ERRORS.TOO_MANY_REQUESTS);
  }

  if (response.status !== 200 || !response.ok) {
    throw new Error(ERRORS.CANCEL_TRADE_SERVER_ERROR);
  }

  const data = await response.json();

  return { farm: makeGame(data.farm), error: data.error };
}
