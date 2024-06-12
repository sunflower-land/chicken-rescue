import { OFFLINE_FARM } from "features/game/lib/landData";
import { GameState } from "features/game/types/game";
import { assign, createMachine, Interpreter, State } from "xstate";
import { getUrl, loadPortal } from "../actions/loadPortal";
import { CONFIG } from "lib/config";
import { decodeToken } from "features/auth/actions/login";
import { purchaseMinigameItem } from "features/game/events/minigames/purchaseMinigameItem";
import { playMinigame } from "features/game/events/minigames/playMinigame";
import { played } from "./portalUtil";

const getJWT = () => {
  const code = new URLSearchParams(window.location.search).get("jwt");
  return code;
};

export interface Context {
  id: number;
  jwt: string;
  state: GameState;
  score: number;
  endAt: number;
  attemptsLeft: number;
}

export const GAME_SECONDS = 60;

type ChickenRescuedEvent = {
  type: "CHICKEN_RESCUED";
  points: number;
};

export type PortalEvent =
  | { type: "START" }
  | { type: "CLAIM" }
  | { type: "PURCHASED" }
  | { type: "RETRY" }
  | { type: "CONTINUE" }
  | { type: "GAME_OVER" }
  | ChickenRescuedEvent;

export type PortalState = {
  value:
    | "initialising"
    | "error"
    | "idle"
    | "ready"
    | "unauthorised"
    | "loading"
    | "introduction"
    | "playing"
    | "gameOver"
    | "winner"
    | "loser"
    | "complete"
    | "starting"
    | "noAttempts";
  context: Context;
};

export type MachineInterpreter = Interpreter<
  Context,
  any,
  PortalEvent,
  PortalState
>;

export type PortalMachineState = State<Context, PortalEvent, PortalState>;

export const portalMachine = createMachine({
  id: "portalMachine",
  initial: "initialising",
  context: {
    id: 0,
    jwt: getJWT(),
    state: CONFIG.API_URL ? undefined : OFFLINE_FARM,

    score: 0,
    completeAcknowledged: false,
    attemptsLeft: 3,
  },
  states: {
    initialising: {
      always: [
        {
          target: "unauthorised",
          // TODO: Also validate token
          cond: (context) => !!CONFIG.API_URL && !context.jwt,
        },
        {
          target: "loading",
        },
      ],
    },

    loading: {
      id: "loading",
      invoke: {
        src: async (context) => {
          if (!getUrl()) {
            return { game: OFFLINE_FARM, attemptsLeft: 3 };
          }

          const { farmId } = decodeToken(context.jwt as string);

          // Load the game data
          const { game } = await loadPortal({
            portalId: CONFIG.PORTAL_APP,
            token: context.jwt as string,
          });

          const dateKey = new Date().toISOString().slice(0, 10);

          const minigame = game.minigames.games["chicken-rescue"];
          const history = minigame?.history ?? {};

          const dailyAttempt = history[dateKey] ?? {
            attempts: 0,
            highscore: 0,
          };

          const attemptsLeft = 3 - dailyAttempt.attempts;

          return { game, farmId, attemptsLeft };
        },
        onDone: [
          {
            target: "introduction",
            actions: assign({
              state: (_: any, event) => event.data.game,
              id: (_: any, event) => event.data.farmId,
              attemptsLeft: (_: any, event) => event.data.attemptsLeft,
            }),
          },
        ],
        onError: {
          target: "error",
        },
      },
    },

    noAttempts: {
      on: {
        PURCHASED: {
          target: "introduction",
          actions: assign<Context>({
            state: (context: Context) =>
              purchaseMinigameItem({
                state: context.state,
                action: {
                  id: "chicken-rescue",
                  sfl: 10,
                  type: "minigame.itemPurchased",
                },
              }),
          }) as any,
        },
      },
    },

    starting: {
      always: [
        {
          target: "noAttempts",
          cond: (context) => {
            const minigame = context.state?.minigames.games["chicken-rescue"];
            const purchases = minigame?.purchases ?? [];

            // There is only one type of purchase with chicken rescue - if they have activated in last 7 days
            const hasUnlimitedAttempts = purchases.some(
              (purchase) =>
                purchase.purchasedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
            );

            if (hasUnlimitedAttempts) {
              return false;
            }

            return context.attemptsLeft <= 0;
          },
        },
        {
          target: "ready",
        },
      ],
    },

    introduction: {
      on: {
        CONTINUE: {
          target: "starting",
        },
      },
    },

    ready: {
      on: {
        START: {
          target: "playing",
          actions: assign<Context>({
            endAt: () => Date.now() + GAME_SECONDS * 1000,
            attemptsLeft: (context: Context) => context.attemptsLeft - 1,
          }) as any,
        },
      },
    },
    playing: {
      on: {
        CHICKEN_RESCUED: {
          actions: assign({
            score: (context: any, event) => {
              return context.score + (event as ChickenRescuedEvent).points;
            },
          }) as any,
        },
        GAME_OVER: {
          target: "gameOver",
          actions: assign({
            state: (context: any) => {
              played({ score: context.score });
              return playMinigame({
                state: context.state,
                action: {
                  type: "minigame.played",
                  score: context.score,
                  id: "chicken-rescue",
                },
              });
            },
          }) as any,
        },
      },
    },
    gameOver: {
      always: [
        {
          // They have already completed the mission before
          target: "complete",
          cond: (context) => {
            const dateKey = new Date().toISOString().slice(0, 10);

            const minigame = context.state?.minigames.games["chicken-rescue"];
            const history = minigame?.history ?? {};

            return !!history[dateKey]?.prizeClaimedAt;
          },
        },

        {
          target: "winner",
          cond: (context) => {
            const prize = context.state?.minigames.prizes["chicken-rescue"];

            if (!prize) {
              return false;
            }

            return context.score >= prize.score;
          },
        },
        {
          target: "loser",
        },
      ],
    },
    winner: {
      on: {
        RETRY: {
          target: "starting",
          actions: assign({
            score: () => 0,
            endAt: () => Date.now() + GAME_SECONDS * 1000,
          }) as any,
        },
      },
    },
    loser: {
      on: {
        RETRY: {
          target: "starting",
          actions: assign({
            score: () => 0,
            endAt: () => Date.now() + GAME_SECONDS * 1000,
          }) as any,
        },
      },
    },
    complete: {
      on: {
        RETRY: {
          target: "starting",
          actions: assign({
            score: () => 0,
            endAt: () => Date.now() + GAME_SECONDS * 1000,
          }) as any,
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "initialising",
        },
      },
    },
    unauthorised: {},
  },
});
