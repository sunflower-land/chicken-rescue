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
    | "gameOver";
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
              x: SPAWNS.crop_boom.default.x,
              y: SPAWNS.crop_boom.default.y,
              sceneId: "crop_boom",
              experience: game.bumpkin?.experience ?? 0,
            });
          }

          return { game, mmoServer, farmId };
        },
        onDone: [
          {
            target: "introduction",
            // target: "ready",
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

    introduction: {
      on: {
        CONTINUE: {
          target: "ready",
        },
      },
    },

    ready: {
      on: {
        START: {
          target: "playing",
          actions: assign({
            endAt: (_: any) => Date.now() + GAME_SECONDS * 1000,
          }),
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
          target: "ready",
          actions: assign({
            score: 0,
            endAt: (_: any) => Date.now() + GAME_SECONDS * 1000,
          }),
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
