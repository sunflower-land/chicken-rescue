import React from "react";

import { Ocean } from "features/world/ui/Ocean";

import { WalletProvider } from "features/wallet/WalletProvider";

import { ChickenRescue } from "./examples/chickenRescue/ChickenRescue";
import { PortalProvider } from "./examples/chickenRescue/lib/PortalProvider";

export const PortalApp: React.FC = () => {
  return (
    // WalletProvider - if you need to connect to a players wallet
    <WalletProvider>
      {/* PortalProvider - gives you access to a xstate machine which handles state management */}
      <PortalProvider>
        <Ocean>
          <ChickenRescue />
        </Ocean>
      </PortalProvider>
    </WalletProvider>
  );
};
