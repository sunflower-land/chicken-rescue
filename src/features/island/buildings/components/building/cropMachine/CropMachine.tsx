import React, { useContext, useState } from "react";

import { CropMachineModal } from "./CropMachineModal";
import { BuildingImageWrapper } from "../BuildingImageWrapper";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { ITEM_DETAILS } from "features/game/types/images";
import { MachineState } from "features/game/lib/gameMachine";
import { Context } from "features/game/GameProvider";
import { useInterpret, useSelector } from "@xstate/react";
import {
  Context as CropMachineContext,
  MachineInterpreter,
  cropStateMachine,
  findGrowingCropPackIndex,
  hasReadyCrops,
  CropMachineState,
} from "./lib/cropMachine";
import { Planting } from "./components/Planting";
import { Sprouting } from "./components/Sprouting";
import { Maturing } from "./components/Maturing";
import { Harvesting } from "./components/Harvesting";
import { CropMachineBuilding } from "features/game/types/game";

import { AddSeedsInput } from "features/game/events/landExpansion/supplyCropMachine";
import { hasFeatureAccess } from "lib/flags";
import { SUNNYSIDE } from "assets/sunnyside";

const _cropMachine = (id: string) => (state: MachineState) => {
  const machines = state.context.state.buildings["Crop Machine"];

  if (!machines) return null;

  return machines.find((machine) => machine.id === id);
};

const _growingCropPackStage = (state: CropMachineState) =>
  state.context.growingCropPackStage;
const _canHarvest = (state: CropMachineState) => state.context.canHarvest;
export const _running = (state: CropMachineState) => state.value === "running";
export const _idle = (state: CropMachineState) => state.value === "idle";
export const _paused = (state: CropMachineState) => state.value === "paused";

interface Props {
  id: string;
}

export const CropMachine: React.FC<Props> = ({ id }) => {
  const { gameService } = useContext(Context);
  const [showModal, setShowModal] = useState(false);

  const cropMachine = useSelector(
    gameService,
    _cropMachine(id),
  ) as CropMachineBuilding;
  const queue = cropMachine?.queue ?? [];

  const cropMachineContext: CropMachineContext = {
    growingCropPackIndex: findGrowingCropPackIndex(queue),
    queue,
    unallocatedOilTime: cropMachine.unallocatedOilTime ?? 0,
    canHarvest: hasReadyCrops(queue),
  };

  const cropMachineService = useInterpret(cropStateMachine, {
    context: cropMachineContext,
  }) as unknown as MachineInterpreter;

  const growingCropPackStage = useSelector(
    cropMachineService,
    _growingCropPackStage,
  );
  const canHarvest = useSelector(cropMachineService, _canHarvest);
  const running = useSelector(cropMachineService, _running);
  const paused = useSelector(cropMachineService, _paused);

  const handleClick = () => {
    hasFeatureAccess(gameService.state.context.state, "CROP_MACHINE") &&
      setShowModal(true);
  };

  const handleAddSeeds = (seeds: AddSeedsInput) => {
    const updated = gameService.send({ type: "cropMachine.supplied", seeds });

    const machines = updated.context.state.buildings[
      "Crop Machine"
    ] as CropMachineBuilding[];

    const updatedMachine = machines.find(
      (machine) => machine.id === id,
    ) as CropMachineBuilding;

    cropMachineService.send({
      type: "SUPPLY_MACHINE",
      updatedQueue: updatedMachine.queue ?? [],
      updatedUnallocatedOilTime: cropMachine.unallocatedOilTime ?? 0,
    });
  };

  const handleHarvestPack = (packIndex: number) => {
    const updated = gameService.send({
      type: "cropMachine.harvested",
      packIndex,
    });

    const machines = updated.context.state.buildings[
      "Crop Machine"
    ] as CropMachineBuilding[];

    const updatedMachine = machines.find(
      (machine) => machine.id === id,
    ) as CropMachineBuilding;

    cropMachineService.send({
      type: "HARVEST_CROPS",
      updatedQueue: updatedMachine.queue ?? [],
      updatedUnallocatedOilTime: cropMachine.unallocatedOilTime ?? 0,
    });
  };

  const handleAddOil = (oil: number) => {
    const updated = gameService.send({
      type: "cropMachine.supplied",
      oil,
    });

    const machines = updated.context.state.buildings[
      "Crop Machine"
    ] as CropMachineBuilding[];

    const updatedMachine = machines.find(
      (machine) => machine.id === id,
    ) as CropMachineBuilding;

    cropMachineService.send({
      type: "SUPPLY_MACHINE",
      updatedQueue: updatedMachine.queue ?? [],
      updatedUnallocatedOilTime: cropMachine.unallocatedOilTime ?? 0,
    });
  };

  const readyCrops = queue
    .filter((pack) => pack.readyAt && pack.readyAt <= Date.now())
    .map((pack) => pack.crop);

  return (
    <>
      <BuildingImageWrapper name="Crop Machine" onClick={handleClick}>
        <div
          className="absolute bottom-0 pointer-events-none"
          style={{
            width: `${PIXEL_SCALE * 80}px`,
            height: `${PIXEL_SCALE * 64}px`,
          }}
        >
          {readyCrops.length > 0 && (
            <div
              className="absolute flex w-full items-center justify-center z-10"
              style={{
                top: `${PIXEL_SCALE * 16}px`,
              }}
            >
              {readyCrops.map((crop, index) => (
                <img
                  key={index}
                  src={ITEM_DETAILS[crop].image}
                  className="img-highlight-heavy w-8 ready"
                />
              ))}
            </div>
          )}
          <img
            src={SUNNYSIDE.building.idleMachine}
            className="w-full absolute"
            style={{
              width: `${PIXEL_SCALE * 80}px`,
              bottom: `${PIXEL_SCALE * 0}px`,
            }}
          />
          {(running || paused) && (
            <>
              <img
                src={SUNNYSIDE.building.shadowCropMachine}
                className="absolute bottom-0 right-1"
                style={{ width: `${PIXEL_SCALE * 80}px` }}
              />
              <div id="cropMachine" className="border-1 border-black">
                {growingCropPackStage === "planting" && (
                  <Planting paused={paused} />
                )}
                {growingCropPackStage === "sprouting" && (
                  <Sprouting paused={paused} />
                )}
                {growingCropPackStage === "maturing" && (
                  <Maturing paused={paused} />
                )}
                {growingCropPackStage === "harvesting" && (
                  <Harvesting paused={paused} />
                )}
              </div>
            </>
          )}

          {canHarvest && (
            <img
              src={SUNNYSIDE.building.harvestedCropsImage}
              className="absolute bottom-2"
              style={{
                height: `${PIXEL_SCALE * 59}px`,
                width: `${PIXEL_SCALE * 15}px`,
              }}
            />
          )}
        </div>
      </BuildingImageWrapper>

      <CropMachineModal
        service={cropMachineService}
        queue={queue}
        unallocatedOilTime={cropMachine.unallocatedOilTime ?? 0}
        show={showModal}
        onClose={() => setShowModal(false)}
        onAddSeeds={handleAddSeeds}
        onHarvestPack={handleHarvestPack}
        onAddOil={handleAddOil}
      />
    </>
  );
};
