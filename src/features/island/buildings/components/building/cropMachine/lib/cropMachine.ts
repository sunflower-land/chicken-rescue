import { CropMachineQueueItem } from "features/game/types/game";
import { Interpreter, State as IState, createMachine, assign } from "xstate";

export interface Context {
  queue: CropMachineQueueItem[];
  unallocatedOilTime: number;
  growingCropPackIndex?: number;
  growingCropPackStage?: CropMachineGrowingStage;
  canHarvest: boolean;
}

export type CropMachineGrowingStage =
  | "planting"
  | "sprouting"
  | "maturing"
  | "harvesting";

type SupplyMachineEvent = {
  type: "SUPPLY_MACHINE";
  updatedQueue: CropMachineQueueItem[];
  updatedUnallocatedOilTime: number;
};

type HarvestCropsEvent = {
  type: "HARVEST_CROPS";
  updatedQueue: CropMachineQueueItem[];
  updatedUnallocatedOilTime: number;
};

type Event = SupplyMachineEvent | HarvestCropsEvent | { type: "TICK" };

type State = {
  value: "idle" | "running" | "paused";
  context: Context;
};

export type CropMachineState = IState<Context, Event, State>;

export type MachineInterpreter = Interpreter<Context, any, Event, State>;

type GrowingQueueItem = CropMachineQueueItem & { startTime: number };

function getGrowingCropPackStage(
  item: CropMachineQueueItem & { startTime: number },
): CropMachineGrowingStage {
  const now = Date.now();

  const stageDuration = item.totalGrowTime / 3;

  const stage1Threshold = item.startTime + stageDuration;
  const stage2Threshold = stage1Threshold + stageDuration;
  const harvestThreshold = item.startTime + item.totalGrowTime - 5000; // 5 seconds before the end

  if (now < stage1Threshold) return "planting";
  if (now < stage2Threshold) return "sprouting";
  if (now < harvestThreshold) return "maturing";

  return "harvesting"; // Last 5 seconds
}

function isCropInProgress(item: CropMachineQueueItem, now = Date.now()) {
  const hasStarted = item.startTime && item.startTime <= now;

  if (!hasStarted) {
    return false;
  }

  if (item.readyAt && item.readyAt >= now) {
    return true;
  }

  if (item.growsUntil && !item.readyAt) {
    return true;
  }

  return false;
}

export function findGrowingCropPackIndex(queue: CropMachineQueueItem[]) {
  const index = queue.findIndex((item) => {
    const now = Date.now();

    const inProgress = isCropInProgress(item, now);

    return inProgress;
  });

  return index >= 0 ? index : undefined;
}

export function hasReadyCrops(queue: CropMachineQueueItem[], now = Date.now()) {
  return queue.some((item) => item.readyAt && item.readyAt <= now);
}

export function isCropPackReady(item: CropMachineQueueItem, now = Date.now()) {
  if (!item.readyAt) return false;

  return item.readyAt <= now;
}

function updateQueueAndUnallocatedOil(
  updatedQueue: CropMachineQueueItem[],
  updatedOilRemaining: number,
) {
  const cropPackIndex = findGrowingCropPackIndex(updatedQueue);
  const cropPack =
    cropPackIndex !== undefined ? updatedQueue[cropPackIndex] : undefined;

  return {
    queue: updatedQueue,
    unallocatedOilTime: updatedOilRemaining,
    growingCropPackIndex: cropPackIndex,
    growingCropPackStage: cropPack
      ? getGrowingCropPackStage(cropPack as GrowingQueueItem)
      : undefined,
    canHarvest: hasReadyCrops(updatedQueue),
  };
}

export const cropStateMachine = createMachine<Context, Event, State>(
  {
    id: "cropMachine",
    preserveActionOrder: true,
    predictableActionArguments: true,
    initial: "idle",
    states: {
      idle: {
        always: [
          {
            target: "running",
            cond: "areCropsGrowing",
            actions: "updateMachine",
          },
        ],
        on: {
          SUPPLY_MACHINE: [
            {
              target: "running",
              actions: "supplyMachine",
            },
            {
              actions: "supplyMachine",
            },
          ],
        },
      },
      running: {
        id: "running",
        invoke: {
          src: "startCropMachine",
        },
        entry: "updateMachine",
        on: {
          TICK: [
            {
              target: "idle",
              cond: "noPacksGrowing",
              actions: "updateMachine",
            },
            {
              target: "paused",
              cond: "needsOilToFinishPack",
              actions: "updateMachine",
            },
            { actions: "updateMachine" },
          ],
          SUPPLY_MACHINE: {
            actions: "supplyMachine",
          },
        },
      },
      paused: {
        on: {
          SUPPLY_MACHINE: [
            {
              target: "running",
              cond: "areCropsGrowing",
              actions: "supplyMachine",
            },
            {
              target: "idle",
              actions: "supplyMachine",
            },
          ],
        },
      },
    },
    on: {
      HARVEST_CROPS: {
        actions: "harvestMachine",
      },
    },
  },
  {
    services: {
      startCropMachine: () => (cb) => {
        cb("TICK");
        const interval = setInterval(() => {
          cb("TICK");
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      },
    },
    actions: {
      updateMachine: assign((context) => {
        const cropPackIndex = findGrowingCropPackIndex(context.queue);
        const cropPack =
          cropPackIndex !== undefined
            ? context.queue[cropPackIndex]
            : undefined;

        return {
          ...context,
          growingCropPackIndex: cropPackIndex,
          growingCropPackStage: cropPack
            ? getGrowingCropPackStage(cropPack as GrowingQueueItem)
            : undefined,
          canHarvest: hasReadyCrops(context.queue),
        };
      }),
      supplyMachine: assign((_, event) => {
        const { updatedQueue, updatedUnallocatedOilTime: updatedOilRemaining } =
          event as SupplyMachineEvent;

        return updateQueueAndUnallocatedOil(updatedQueue, updatedOilRemaining);
      }),
      harvestMachine: assign((_, event) => {
        const { updatedQueue, updatedUnallocatedOilTime: updatedOilRemaining } =
          event as HarvestCropsEvent;

        return updateQueueAndUnallocatedOil(updatedQueue, updatedOilRemaining);
      }),
    },
    guards: {
      noPacksGrowing: (context) => {
        if (context.growingCropPackIndex === undefined) return true;

        const cropPackIndex = findGrowingCropPackIndex(context.queue);

        return cropPackIndex === undefined;
      },
      areCropsGrowing: (context) => {
        if (context.growingCropPackIndex === undefined) return false;

        const cropPackIndex = findGrowingCropPackIndex(context.queue);

        return cropPackIndex !== undefined;
      },
      needsOilToFinishPack: (context) => {
        const cropPackIndex = context.growingCropPackIndex;

        if (cropPackIndex === undefined) return false;

        const cropPack = context.queue[cropPackIndex];

        if (cropPack.readyAt) return false;

        return !!cropPack.growsUntil && cropPack.growsUntil <= Date.now();
      },
    },
  },
);
