import Decimal from "decimal.js-light";

import { GameState, InventoryItemName } from "../types/game";

/**
 * Converts API response into a game state
 */
export function makeGame(farm: any): GameState {
  return {
    inventory: Object.keys(farm.inventory).reduce(
      (items, item) => ({
        ...items,
        [item]: new Decimal(farm.inventory[item]),
      }),
      {} as Record<InventoryItemName, Decimal>
    ),
    previousInventory: Object.keys(farm.previousInventory).reduce(
      (items, item) => ({
        ...items,
        [item]: new Decimal(farm.previousInventory[item]),
      }),
      {} as Record<InventoryItemName, Decimal>
    ),
    wardrobe: farm.wardrobe,
    previousWardrobe: farm.previousWardrobe,
    stock: Object.keys(farm.stock).reduce(
      (items, item) => ({
        ...items,
        [item]: new Decimal(farm.stock[item]),
      }),
      {} as Record<InventoryItemName, Decimal>
    ),
    island: farm.island,
    home: farm.home,
    createdAt: farm.createdAt,
    chickens: farm.chickens || {},
    stockExpiry: farm.stockExpiry || {},
    coins: farm.coins,
    balance: new Decimal(farm.balance),
    previousBalance: new Decimal(farm.previousBalance),
    username: farm.username,
    trades: farm.trades,
    farmHands: farm.farmHands,
    minigames: farm.minigames,
    tradeOffer: farm.tradeOffer
      ? {
          ...farm.tradeOffer,
          ingredients: farm.tradeOffer.ingredients.map((ingredient: any) => ({
            ...ingredient,
            amount: new Decimal(ingredient.amount),
          })),
        }
      : undefined,

    bertObsession: farm.bertObsession,

    expansionConstruction: farm.expansionConstruction,
    expandedAt: farm.expandedAt,
    greenhouse: farm.greenhouse,

    bumpkin: farm.bumpkin,
    buildings: farm.buildings,
    fishing: farm.fishing ?? { wharf: {}, beach: {} },
    farmActivity: farm.farmActivity ?? {},
    milestones: farm.milestones ?? {},
    airdrops: farm.airdrops,
    collectibles: farm.collectibles,
    warCollectionOffer: farm.warCollectionOffer,
    mysteryPrizes: farm.mysteryPrizes,
    treasureIsland: farm.treasureIsland,
    pumpkinPlaza: farm.pumpkinPlaza,
    dailyRewards: farm.dailyRewards,
    auctioneer: farm.auctioneer ?? {},
    kingdomChores: farm.kingdomChores,
    chores: farm.chores,
    tradedAt: farm.tradedAt,
    trees: farm.trees ?? {},
    stones: farm.stones ?? {},
    iron: farm.iron ?? {},
    gold: farm.gold ?? {},
    crimstones: farm.crimstones ?? {},
    oilReserves: farm.oilReserves ?? {},
    sunstones: farm.sunstones ?? {},
    crops: farm.crops ?? {},
    fruitPatches: farm.fruitPatches ?? {},
    flowers: farm.flowers ?? {},
    beehives: farm.beehives ?? {},
    conversations: farm.conversations ?? [],
    mailbox: farm.mailbox ?? {
      read: [],
      unread: [],
    },
    mushrooms: farm.mushrooms,
    delivery: farm.delivery,
    potionHouse: farm.potionHouse,
    npcs: farm.npcs,
    buds: farm.buds,
    christmas: farm.christmas,
    flowerShop: farm.flowerShop,
    specialEvents: farm.specialEvents,
    experiments: farm.experiments,
    rewards: farm.rewards,
    megastore: {
      available: {
        from: 0,
        to: 0,
      },
      collectibles: [],
      wearables: [],
    },
    goblinMarket: farm.goblinMarket,
    faction: farm.faction,
    dailyFactionDonationRequest: farm.dailyFactionDonationRequest
      ? {
          resource: farm.dailyFactionDonationRequest.resource,
          amount: new Decimal(farm.dailyFactionDonationRequest.amount),
        }
      : undefined,
    desert: farm.desert,
  };
}
