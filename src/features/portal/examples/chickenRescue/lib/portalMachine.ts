import { OFFLINE_FARM } from "features/game/lib/landData";
import { GameState } from "features/game/types/game";
import { assign, createMachine, Interpreter, State } from "xstate";
import { loadPortal } from "../actions/loadPortal";
import { CONFIG } from "lib/config";
import { claimArcadeToken } from "../actions/claimArcadeToken";
import { PortalName } from "features/game/types/portals";
import { Client, Room } from "colyseus.js";
import { PlazaRoomState } from "features/world/types/Room";
import { SPAWNS } from "features/world/lib/spawn";
import { decodeToken } from "features/auth/actions/login";

const getJWT = () => {
  const code = new URLSearchParams(window.location.search).get("jwt");

  return code;
};

const getServer = () => {
  const code = new URLSearchParams(window.location.search).get("server");

  return code;
};

export interface Context {
  id: number;
  jwt: string;
  state: GameState;
  mmoServer?: Room<PlazaRoomState>;
  score: number;
  endAt: number;
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
    | "claiming"
    | "completed"
    | "introduction"
    | "playing"
    | "gameOver"
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
          if (!CONFIG.API_URL) {
            return { game: OFFLINE_FARM };
          }

          const { farmId } = decodeToken(context.jwt as string);

          // Load the game data
          const { game } = await loadPortal({
            portalId: CONFIG.PORTAL_APP,
            token: context.jwt as string,
          });

          // Join the MMO Server
          let mmoServer: Room<PlazaRoomState> | undefined;
          const serverName = getServer() ?? "sunflorea_bliss";
          const mmoUrl = CONFIG.ROOM_URL;

          if (serverName && mmoUrl) {
            const client = new Client(mmoUrl);

            mmoServer = await client?.joinOrCreate<PlazaRoomState>(serverName, {
              jwt: context.jwt,
              bumpkin: game?.bumpkin,
              farmId,
              x: SPAWNS.chicken_rescue.default.x,
              y: SPAWNS.chicken_rescue.default.y,
              sceneId: "crop_boom",
              experience: game.bumpkin?.experience ?? 0,
            });
          }

          return { game, mmoServer, farmId };
        },
        onDone: [
          {
            target: "introduction",
            actions: assign({
              state: (_: any, event) => event.data.game,
              mmoServer: (_: any, event) => event.data.mmoServer,
              id: (_: any, event) => event.data.farmId,
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
          target: "loading",
        },
      },
    },

    starting: {
      always: [
        {
          target: "noAttempts",
          cond: (context) => {
            const dateKey = new Date().toISOString().slice(0, 10);

            const minigame = context.state?.minigames.games["chicken-rescue"];
            const history = minigame?.history ?? {};
            const purchases = minigame?.purchases ?? [];

            const dailyAttempt = history[dateKey] ?? {
              attempts: 0,
              highscore: 0,
            };

            const attemptsLeft = 3 - dailyAttempt.attempts;

            // There is only one type of purchase with chicken rescue - if they have activated in last 7 days
            const hasUnlimitedAttempts = purchases.some(
              (purchase) =>
                purchase.purchasedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
            );

            if (hasUnlimitedAttempts) {
              return false;
            }

            return attemptsLeft <= 0;
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
          actions: assign({
            endAt: () => Date.now() + GAME_SECONDS * 1000,
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
          }),
        },
        GAME_OVER: {
          target: "gameOver",
        },
      },
    },
    gameOver: {
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
    claiming: {
      id: "claiming",
      invoke: {
        src: async (context) => {
          const { game } = await claimArcadeToken({
            token: context.jwt as string,
          });

          return { game };
        },
        onDone: [
          {
            target: "completed",
            actions: assign({
              state: (_: any, event) => event.data.game,
            }),
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },

    completed: {
      on: {},
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
