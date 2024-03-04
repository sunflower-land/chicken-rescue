/**
 * Entry Point to Portal App
 * Include any initialisation logic, stylesheets + more here.
 */
import React from "react";
import "src/styles.css";

import { initialise } from "lib/utils/init";

import { CropBoomApp } from "./examples/cropBoom/CropBoom";
import { MushroomForest } from "./examples/mushroomForest/MushroomForest";
import { CONFIG } from "lib/config";
import { GoblinSwarm } from "./examples/goblinSwarm/GoblinSwarm";
import { ChickenRescueApp } from "./examples/chickenRescue/ChickenRescue";

initialise();

export const PortalApp: React.FC = () => {
  return <span className="text-black">TEST</span>;
  if (CONFIG.PORTAL_APP === "chicken-rescue") {
    return <ChickenRescueApp />;
  }

  if (CONFIG.PORTAL_APP === "crop-boom") {
    return <CropBoomApp />;
  }

  if (CONFIG.PORTAL_APP === "mushroom-forest") {
    return <MushroomForest />;
  }

  if (CONFIG.PORTAL_APP === "goblin-swarm") {
    return <GoblinSwarm />;
  }

  // Return your app
  return null;
};
